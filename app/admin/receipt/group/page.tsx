import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { money, amountInWords } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { branchCompany } from '@/lib/site';
import type { Payment } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { GroupReceipt } from '@/components/manage/GroupReceipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Group Receipt', robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtDate(d: string): string {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Combined receipt for a group/bulk payment — reloadable from its URL, so it
 * can be reprinted any time: /admin/receipt/group?ids=..&payer=..&table=..
 */
export default async function GroupReceiptPage({
  searchParams,
}: {
  searchParams: { ids?: string; payer?: string; phone?: string; table?: string };
}) {
  const locale = getLocale();
  const ids = (searchParams.ids ?? '').split(',').map((s) => s.trim()).filter((s) => UUID_RE.test(s));
  if (ids.length === 0) notFound();

  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: payData } = await db.from('payments').select('*').in('id', ids);
  const byId = new Map(((payData ?? []) as Payment[]).map((p) => [p.id, p]));
  const payments = ids.map((id) => byId.get(id)).filter(Boolean) as Payment[];
  if (payments.length === 0) notFound();
  if (scope.branch && payments.some((p) => p.branch !== scope.branch)) notFound();

  // Member names for each payment's party.
  const table = searchParams.table === 'umrah' ? 'umrah_passengers' : 'hajj_pilgrims';
  const partyIds = Array.from(new Set(payments.map((p) => p.party_id).filter(Boolean))) as string[];
  const names = new Map<string, string>();
  if (partyIds.length) {
    const { data } = await db.from(table).select('id, name').in('id', partyIds);
    ((data ?? []) as { id: string; name: string }[]).forEach((r) => names.set(r.id, r.name));
  }

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const first = payments[0];
  const program =
    searchParams.table === 'umrah' ? (locale === 'bn' ? 'উমরাহ' : 'Umrah') : locale === 'bn' ? 'হজ' : 'Hajj';

  const methodLabel =
    first.method === 'bank' ? (locale === 'bn' ? 'ব্যাংক' : 'Bank') : locale === 'bn' ? 'নগদ' : 'Cash';
  const typeLabels: Record<string, { en: string; bn: string }> = {
    installment: { en: 'Installment', bn: 'কিস্তি' },
    advance: { en: 'Advance', bn: 'অগ্রিম' },
    token: { en: 'Token money', bn: 'টোকেন মানি' },
    full: { en: 'Full payment', bn: 'সম্পূর্ণ পরিশোধ' },
    refund: { en: 'Refund', bn: 'রিফান্ড' },
  };

  // The shared narration is "Group payment — <payer> · <note>"; show only the note part.
  const note = (first.narration ?? '').split(' · ').slice(1).join(' · ');

  return (
    <GroupReceipt
      locale={locale}
      data={{
        company: branchCompany(first.branch),
        program,
        receiptNo: first.voucher_no ? `${first.voucher_no}${payments.length > 1 ? ` +${payments.length - 1}` : ''}` : '—',
        date: fmtDate(first.date),
        branch: branchLabel(first.branch),
        payerName: searchParams.payer || names.get(first.party_id ?? '') || '—',
        payerPhone: searchParams.phone ?? '',
        method: methodLabel,
        type: typeLabels[first.type]?.[locale] ?? first.type,
        narration: note,
        rows: payments.map((p) => ({
          name: names.get(p.party_id ?? '') ?? '—',
          voucher: p.voucher_no ?? '',
          amount: money(p.amount, false),
        })),
        total: money(total, false),
        totalWords: locale === 'en' ? amountInWords(total) : '',
      }}
    />
  );
}
