import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { naturalBalance, type AccountHead, type Payment } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { loadCompanyProfile } from '@/lib/management/company';
import { getLocale } from '@/lib/i18n-server';
import { Receipt, type ReceiptData } from '@/components/manage/Receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Receipt', robots: { index: false, follow: false } };

function fmt(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: payRow } = await db.from('payments').select('*').eq('id', params.id).maybeSingle();
  if (!payRow) notFound();
  const payment = payRow as Payment;
  // Branch staff can only open their own branch's receipts.
  if (scope.branch && payment.branch !== scope.branch) notFound();

  const isHajj = payment.party_table === 'hajj_pilgrims';
  const isFund = payment.party_table === 'affiliates';
  const program = isHajj
    ? locale === 'bn'
      ? 'হজ'
      : 'Hajj'
    : isFund
      ? locale === 'bn'
        ? 'গ্রুপ ফান্ড'
        : 'Group Fund'
      : locale === 'bn'
        ? 'উমরাহ'
        : 'Umrah';

  let partyName = '—';
  let partyPhone = '';
  let partyAddress = '';
  let packageId: string | null = null;
  if (payment.party_table && payment.party_id) {
    const { data: party } = await db
      .from(payment.party_table)
      .select(isFund ? 'name, phone, address' : 'name, phone, address, package_id')
      .eq('id', payment.party_id)
      .maybeSingle();
    if (party) {
      partyName = (party as { name?: string }).name ?? '—';
      partyPhone = (party as { phone?: string }).phone ?? '';
      partyAddress = (party as { address?: string }).address ?? '';
      packageId = (party as { package_id?: string }).package_id ?? null;
    }
  }

  let packageName = '';
  if (packageId) {
    const { data: pkg } = await db.from('mgmt_packages').select('name').eq('id', packageId).maybeSingle();
    packageName = (pkg as { name?: string } | null)?.name ?? '';
  }

  // Total paid across all of this party's payments + remaining due from the head.
  let paid = 0;
  let due = 0;
  if (payment.party_table && payment.party_id) {
    const { data: allPays } = await db
      .from('payments')
      .select('amount, type')
      .eq('party_table', payment.party_table)
      .eq('party_id', payment.party_id);
    const rows = (allPays ?? []) as { amount: number; type: string }[];
    paid = rows.reduce((s, p) => s + (p.type === 'refund' ? -Number(p.amount) : Number(p.amount)), 0);
  }
  if (payment.account_head_id) {
    const { data: head } = await db.from('account_heads').select('*').eq('id', payment.account_head_id).maybeSingle();
    if (head) due = Math.max(0, naturalBalance(head as AccountHead));
  }

  const methodMap: Record<string, string> =
    locale === 'bn' ? { cash: 'নগদ', bank: 'ব্যাংক' } : { cash: 'Cash', bank: 'Bank' };
  const typeMap: Record<string, string> =
    locale === 'bn'
      ? { advance: 'অগ্রিম', installment: 'কিস্তি', token: 'টোকেন', full: 'সম্পূর্ণ', refund: 'রিফান্ড' }
      : { advance: 'Advance', installment: 'Installment', token: 'Token', full: 'Full', refund: 'Refund' };

  const data: ReceiptData = {
    company: await loadCompanyProfile(payment.branch),
    program,
    receiptNo: payment.voucher_no ?? payment.id.slice(0, 8).toUpperCase(),
    manualRef: payment.manual_ref ?? null,
    date: fmt(payment.date),
    branch: branchLabel(payment.branch),
    partyName,
    partyPhone: partyPhone || '—',
    partyAddress,
    packageName,
    amount: money(payment.amount, false),
    amountWords: '',
    method: methodMap[payment.method] ?? payment.method,
    type: typeMap[payment.type] ?? payment.type,
    narration: payment.narration ?? '',
    paid: money(paid, false),
    due: money(due, false),
    isRefund: payment.type === 'refund',
  };

  return <Receipt data={data} locale={locale} />;
}
