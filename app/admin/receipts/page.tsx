import Link from 'next/link';
import { Printer } from 'lucide-react';
import { PageHeader, Card, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import type { Payment } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Receipts' };

function fmt(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string };
}) {
  const locale = getLocale();
  const from = searchParams.from ?? '';
  const to = searchParams.to ?? '';
  const rangeKey = (searchParams.range || (from || to ? 'custom' : 'this-month')) as RangeKey;
  const range = rangeKey === 'custom' ? { from, to } : presetRange(rangeKey);

  const db = mgmtDb();
  const scope = await getStaffScope();
  let q = db.from('payments').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
  if (range.from) q = q.gte('date', range.from);
  if (range.to) q = q.lte('date', range.to);
  if (scope.branch) q = q.eq('branch', scope.branch);
  const { data } = await q;
  const payments = (data ?? []) as Payment[];

  // Resolve party names/phones in two batched queries.
  const idsBy = (table: string) =>
    payments.filter((p) => p.party_table === table && p.party_id).map((p) => p.party_id as string);
  const names = new Map<string, string>();
  const phones = new Map<string, string>();
  const fill = async (table: string) => {
    const ids = Array.from(new Set(idsBy(table)));
    if (!ids.length) return;
    const { data: rows } = await db.from(table).select('id, name, phone').in('id', ids);
    for (const r of (rows ?? []) as { id: string; name: string; phone: string | null }[]) {
      names.set(r.id, r.name);
      phones.set(r.id, r.phone ?? '');
    }
  };
  await Promise.all([fill('umrah_passengers'), fill('hajj_pilgrims')]);

  const nameOf = (p: Payment) => (p.party_id ? names.get(p.party_id) ?? '—' : '—');
  const progOf = (p: Payment) =>
    p.party_table === 'hajj_pilgrims' ? (locale === 'bn' ? 'হজ' : 'Hajj') : locale === 'bn' ? 'উমরাহ' : 'Umrah';

  const methodMap: Record<string, string> =
    locale === 'bn' ? { cash: 'নগদ', bank: 'ব্যাংক' } : { cash: 'Cash', bank: 'Bank' };
  const typeMap: Record<string, string> =
    locale === 'bn'
      ? { advance: 'অগ্রিম', installment: 'কিস্তি', token: 'টোকেন', full: 'সম্পূর্ণ', refund: 'রিফান্ড' }
      : { advance: 'Advance', installment: 'Installment', token: 'Token', full: 'Full', refund: 'Refund' };

  const total = payments.reduce((s, p) => s + (p.type === 'refund' ? -Number(p.amount) : Number(p.amount)), 0);

  const L =
    locale === 'bn'
      ? {
          title: 'রসিদ ও পেমেন্ট',
          sub: 'সব গৃহীত টাকার রসিদ — তারিখ অনুযায়ী ফিল্টার করে প্রিন্ট বা ডাউনলোড করুন।',
          date: 'তারিখ', no: 'রসিদ নং', name: 'নাম', program: 'প্রোগ্রাম', type: 'ধরন',
          method: 'মাধ্যম', amount: 'পরিমাণ', branch: 'শাখা', receipt: 'রসিদ', total: 'মোট',
          empty: 'এই সময়ে কোনো পেমেন্ট নেই', emptyHint: 'অন্য তারিখ পরিসর বেছে নিন।',
          showing: 'দেখানো হচ্ছে', payWord: 'পেমেন্ট',
        }
      : {
          title: 'Receipts & Payments',
          sub: 'Every money receipt — filter by date and print or download in bulk.',
          date: 'Date', no: 'Receipt No', name: 'Name', program: 'Program', type: 'Type',
          method: 'Method', amount: 'Amount', branch: 'Branch', receipt: 'Receipt', total: 'Total',
          empty: 'No payments in this period', emptyHint: 'Pick a different date range.',
          showing: 'Showing', payWord: 'payments',
        };

  const exportRows = payments.map((p) => [
    fmt(p.date),
    p.voucher_no ?? '',
    nameOf(p),
    progOf(p),
    typeMap[p.type] ?? p.type,
    methodMap[p.method] ?? p.method,
    money(p.amount, false),
    branchShort(p.branch),
  ]);

  return (
    <>
      <PageHeader
        title={L.title}
        subtitle={L.sub}
        actions={
          payments.length > 0 ? (
            <ExportBar
              filename="receipts"
              title={L.title}
              subtitle={`${range.from || '—'} — ${range.to || '—'} · ${L.total} ${money(total)}`}
              headers={[L.date, L.no, L.name, L.program, L.type, L.method, L.amount, L.branch]}
              rows={exportRows}
              orientation="l"
            />
          ) : undefined
        }
      />

      <Card className="mb-5">
        <DateRangeFilter from={range.from} to={range.to} range={rangeKey} />
      </Card>

      {payments.length === 0 ? (
        <EmptyState title={L.empty} hint={L.emptyHint} />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            {L.showing} <span className="font-semibold text-ink">{payments.length}</span> {L.payWord} · {L.total}{' '}
            <span className="font-semibold text-ink">{money(total)}</span>
          </p>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{L.date}</th>
                <th className={thClass}>{L.no}</th>
                <th className={thClass}>{L.name}</th>
                <th className={thClass}>{L.program}</th>
                <th className={thClass}>{L.type}</th>
                <th className={thClass}>{L.method}</th>
                <th className={`${thClass} text-right`}>{L.amount}</th>
                <th className={thClass}>{L.branch}</th>
                <th className={`${thClass} text-right`}></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="transition hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap`}>{fmt(p.date)}</td>
                  <td className={`${tdClass} tabular-nums`}>{p.voucher_no ?? '—'}</td>
                  <td className={tdClass}>
                    <span className="font-medium text-ink">{nameOf(p)}</span>
                    {p.party_id && phones.get(p.party_id) && (
                      <span className="block text-xs text-ink-muted">{phones.get(p.party_id)}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <Badge>{progOf(p)}</Badge>
                  </td>
                  <td className={tdClass}>{typeMap[p.type] ?? p.type}</td>
                  <td className={tdClass}>{methodMap[p.method] ?? p.method}</td>
                  <td className={`${tdClass} text-right`}>
                    <Money value={p.type === 'refund' ? -Number(p.amount) : Number(p.amount)} />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{branchShort(p.branch)}</td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <Link
                      href={localizedPath(locale, `/admin/receipt/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                    >
                      <Printer className="h-3.5 w-3.5" /> {L.receipt}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}
    </>
  );
}
