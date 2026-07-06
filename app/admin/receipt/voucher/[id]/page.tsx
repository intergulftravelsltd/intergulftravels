import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { buildStatementReceipt } from '@/lib/management/statement';
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

type HeadInfo = {
  id: string;
  name: string;
  subtype: string;
  ref_table: string | null;
  ref_id: string | null;
  party_phone: string | null;
  branch: string;
};

export default async function VoucherReceiptPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: txRow } = await db.from('transactions').select('*').eq('id', params.id).maybeSingle();
  if (!txRow) notFound();
  const tx = txRow as Transaction;
  if (scope.branch && tx.branch !== scope.branch) notFound();

  const ids = [tx.debit_account_id, tx.credit_account_id].filter(Boolean) as string[];
  const { data: headsData } = await db
    .from('account_heads')
    .select('id, name, subtype, ref_table, ref_id, party_phone, branch')
    .in('id', ids);
  const byId = new Map(((headsData ?? []) as HeadInfo[]).map((h) => [h.id, h] as const));
  const dr = byId.get(tx.debit_account_id);
  const cr = byId.get(tx.credit_account_id);

  // If the voucher touches a passenger's ledger, show that passenger's full
  // in-depth statement (same design as the passenger print).
  const customer = dr?.subtype === 'customer' ? dr : cr?.subtype === 'customer' ? cr : null;
  if (customer) {
    const program =
      customer.ref_table === 'umrah_passengers'
        ? locale === 'bn'
          ? 'উমরাহ'
          : 'Umrah'
        : locale === 'bn'
        ? 'হজ'
        : 'Hajj';

    let name = customer.name;
    let phone = customer.party_phone;
    let address: string | null = null;
    let passportNo: string | null = null;
    let packageName = '';
    if (customer.ref_table && customer.ref_id) {
      const { data: pilgrimRow } = await db
        .from(customer.ref_table)
        .select('name, phone, address, passport_no, package_id')
        .eq('id', customer.ref_id)
        .maybeSingle();
      if (pilgrimRow) {
        const p = pilgrimRow as {
          name: string;
          phone: string | null;
          address: string | null;
          passport_no: string | null;
          package_id: string | null;
        };
        name = p.name;
        phone = p.phone;
        address = p.address;
        passportNo = p.passport_no;
        if (p.package_id) {
          const { data: pkg } = await db.from('mgmt_packages').select('name').eq('id', p.package_id).maybeSingle();
          packageName = (pkg as { name?: string } | null)?.name ?? '';
        }
      }
    }

    const data = await buildStatementReceipt({
      headId: customer.id,
      party: { name, phone, address, passportNo, branch: customer.branch },
      program,
      packageName,
    });
    return <Receipt data={data} locale={locale} />;
  }

  // Otherwise: a plain voucher (Dr/Cr) receipt.
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
    voucher: { debit: dr?.name ?? '—', credit: cr?.name ?? '—' },
  };

  return <Receipt data={data} locale={locale} />;
}
