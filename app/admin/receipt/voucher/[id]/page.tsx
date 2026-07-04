import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import type { Transaction } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { branchCompany } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { Receipt, type ReceiptData } from '@/components/manage/Receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Voucher Receipt', robots: { index: false, follow: false } };

function fmt(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function VoucherReceiptPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: txRow } = await db.from('transactions').select('*').eq('id', params.id).maybeSingle();
  if (!txRow) notFound();
  const tx = txRow as Transaction;
  if (scope.branch && tx.branch !== scope.branch) notFound();

  const ids = [tx.debit_account_id, tx.credit_account_id].filter(Boolean) as string[];
  const { data: headsData } = await db.from('account_heads').select('id, name').in('id', ids);
  const headRows = (headsData ?? []) as { id: string; name: string }[];
  const nameOf = new Map(headRows.map((h) => [h.id, h.name] as const));

  const data: ReceiptData = {
    company: branchCompany(tx.branch),
    program: locale === 'bn' ? 'ভাউচার' : 'Voucher',
    receiptNo: tx.voucher_no ?? tx.id.slice(0, 8).toUpperCase(),
    date: fmt(tx.date),
    branch: branchLabel(tx.branch),
    partyName: '',
    partyPhone: '',
    partyAddress: '',
    packageName: '',
    amount: money(tx.amount, false),
    amountWords: '',
    method: '',
    type: '',
    narration: tx.narration ?? '',
    paid: '',
    due: '',
    isRefund: tx.type === 'expense',
    voucher: {
      debit: nameOf.get(tx.debit_account_id) ?? '—',
      credit: nameOf.get(tx.credit_account_id) ?? '—',
    },
  };

  return <Receipt data={data} locale={locale} />;
}
