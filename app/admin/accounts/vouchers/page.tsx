import { Printer, Search } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { VoucherRowActions } from '@/components/manage/accounts/VoucherRowActions';
import { loadActiveHeads, loadTransactions, headMap, headName } from '@/lib/management/accounts-data';
import { getStaffScope } from '@/lib/management/scope';
import { BRANCHES, branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { resolvePeriod } from '@/lib/period';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

const TYPE_LABEL_KEY: Record<string, keyof ReturnType<typeof getDict>['typeLabels']> = {
  receipt: 'receipt',
  income: 'income',
  payment: 'payment',
  expense: 'expense',
  contra: 'contra',
  journal: 'journal',
};

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vouchers' };

const TYPES = ['receipt', 'payment', 'contra', 'journal', 'expense', 'income'] as const;
const TYPE_TONE: Record<string, 'emerald' | 'gold' | 'red' | 'blue' | 'slate'> = {
  receipt: 'emerald',
  income: 'emerald',
  payment: 'red',
  expense: 'red',
  contra: 'blue',
  journal: 'slate',
};

type SP = {
  from?: string;
  to?: string;
  branch?: string;
  type?: string;
  range?: string;
  q?: string;
  page?: string;
  per?: string;
};

const ctrl =
  'h-10 rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20';

/** Digits only — so "01712-823676" finds a head stored as "01712823676". */
const digits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

export default async function VouchersPage({ searchParams }: { searchParams: SP }) {
  const locale = getLocale();
  const tt = getDict(locale);
  const filters = {
    from: searchParams.from || undefined,
    to: searchParams.to || undefined,
    branch: searchParams.branch || 'all',
    type: searchParams.type || 'all',
    limit: 1000,
  };

  const [heads, allTxns, scope] = await Promise.all([
    loadActiveHeads(),
    loadTransactions(filters),
    getStaffScope(),
  ]);
  const map = headMap(heads);

  // Search: voucher no, manual no, narration, either head's name, or a
  // party's mobile number (digits compared, so dashes/spaces don't matter).
  const q = (searchParams.q ?? '').trim();
  const qLower = q.toLowerCase();
  const qDigits = digits(q);
  const txns = q
    ? allTxns.filter((t) => {
        const dr = map.get(t.debit_account_id);
        const cr = map.get(t.credit_account_id);
        const text = [t.voucher_no, t.manual_ref, t.narration, dr?.name, cr?.name, dr?.code, cr?.code]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (text.includes(qLower)) return true;
        if (qDigits.length >= 4) {
          const phones = [dr?.party_phone, cr?.party_phone].map(digits).filter(Boolean);
          if (phones.some((p) => p.includes(qDigits))) return true;
        }
        return false;
      })
    : allTxns;
  const headOptions = heads.map((h) => ({
    id: h.id,
    name: h.name,
    code: h.code,
    party_phone: h.party_phone,
    subtype: h.subtype,
  }));

  const total = txns.reduce((s, t) => s + Number(t.amount), 0);

  const exportRows = txns.map((t) => [
    t.voucher_no ?? '',
    t.manual_ref ?? '',
    t.date,
    tt.typeLabels[TYPE_LABEL_KEY[t.type]] ?? t.type,
    headName(map, t.debit_account_id),
    headName(map, t.credit_account_id),
    money(t.amount, false),
    branchShort(t.branch),
    t.narration ?? '',
  ]);
  const period = resolvePeriod({ from: filters.from, to: filters.to }, txns.map((t) => t.date));
  const paged = paginate(txns, parsePaging(searchParams));

  return (
    <>
      <PageHeader
        title={tt.vouchers.title}
        subtitle={tt.vouchers.subtitle}
        actions={
          txns.length > 0 ? (
            <ExportBar
              filename="vouchers"
              title={tt.vouchers.exportTitle}
              subtitle={filterSubtitle(searchParams, tt)}
              period={period}
              orientation="l"
              headers={[
                tt.vouchers.exHVoucher,
                tt.vouchers.exHManualRef,
                tt.vouchers.exHDate,
                tt.vouchers.exHType,
                tt.vouchers.exHDebit,
                tt.vouchers.exHCredit,
                tt.vouchers.exHAmount,
                tt.vouchers.exHBranch,
                tt.vouchers.exHNarration,
              ]}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      {/* One filter row: date range · search · type · (branch) · apply / reset.
          The date pill writes from/to/range into the URL itself; the form
          carries them as hidden fields so a search or type change keeps the
          chosen period. */}
      <Card className="mb-5 !p-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <DateRangeFilter from={searchParams.from ?? ''} to={searchParams.to ?? ''} range={searchParams.range ?? ''} />
          {searchParams.from && <input type="hidden" name="from" value={searchParams.from} />}
          {searchParams.to && <input type="hidden" name="to" value={searchParams.to} />}
          {searchParams.range && <input type="hidden" name="range" value={searchParams.range} />}
          <label className="relative min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={tt.vouchers.searchPlaceholder}
              className={`${ctrl} w-full pl-9`}
            />
          </label>
          <select name="type" defaultValue={searchParams.type ?? 'all'} className={ctrl} aria-label={tt.vouchers.typeFilter}>
            <option value="all">{tt.vouchers.allTypes}</option>
            {TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {tt.typeLabels[TYPE_LABEL_KEY[t]] ?? t}
              </option>
            ))}
          </select>
          {!scope.branch && (
            <select name="branch" defaultValue={searchParams.branch ?? 'all'} className={ctrl} aria-label={tt.common.branch}>
              <option value="all">{tt.common.allBranches}</option>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {tt.vouchers.apply}
          </button>
          <a
            href={localizedPath(locale, '/admin/accounts/vouchers')}
            className="grid h-10 place-items-center rounded-xl border border-border px-4 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40"
          >
            {tt.vouchers.reset}
          </a>
        </form>
      </Card>

      {txns.length === 0 ? (
        <EmptyState
          title={tt.vouchers.noVouchersTitle}
          hint={tt.vouchers.noVouchersHint}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            {tt.vouchers.showing} <span className="font-semibold text-ink">{txns.length}</span> {tt.vouchers.voucherWord}
            {locale === 'en' ? (txns.length === 1 ? '' : 's') : ''} · {tt.vouchers.total}{' '}
            <span className="font-semibold text-ink">{money(total)}</span>
          </p>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{tt.vouchers.thVoucher}</th>
                <th className={thClass}>{tt.vouchers.thManualRef}</th>
                <th className={thClass}>{tt.vouchers.thDate}</th>
                <th className={thClass}>{tt.vouchers.thType}</th>
                <th className={thClass}>{tt.vouchers.thDebitHead}</th>
                <th className={thClass}>{tt.vouchers.thCreditHead}</th>
                <th className={`${thClass} text-right`}>{tt.vouchers.thAmount}</th>
                <th className={thClass}>{tt.vouchers.thBranch}</th>
                <th className={thClass}>{tt.vouchers.thNarration}</th>
                <th className={`${thClass} text-right`}>{tt.vouchers.thManage}</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((t) => (
                <tr key={t.id}>
                  <td className={`${tdClass} whitespace-nowrap font-mono text-xs`}>{t.voucher_no ?? '—'}</td>
                  <td className={`${tdClass} whitespace-nowrap font-mono text-xs`}>{t.manual_ref || '—'}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{t.date}</td>
                  <td className={tdClass}>
                    <Badge tone={TYPE_TONE[t.type] ?? 'slate'}>{tt.typeLabels[TYPE_LABEL_KEY[t.type]] ?? t.type}</Badge>
                  </td>
                  <td className={tdClass}>{headName(map, t.debit_account_id)}</td>
                  <td className={tdClass}>{headName(map, t.credit_account_id)}</td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(t.amount)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{branchShort(t.branch)}</td>
                  <td className={`${tdClass} max-w-[16rem] truncate text-ink-muted`} title={t.narration ?? ''}>
                    {t.narration || '—'}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={localizedPath(locale, `/admin/receipt/voucher/${t.id}`)}
                        target="_blank"
                        rel="noopener"
                        title={locale === 'bn' ? 'রসিদ প্রিন্ট' : 'Print receipt'}
                        className="inline-flex items-center rounded-lg border border-border px-2 py-1 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </a>
                      <VoucherRowActions
                        voucher={{
                          id: t.id,
                          voucher_no: t.voucher_no,
                          manual_ref: t.manual_ref ?? null,
                          date: t.date,
                          type: t.type,
                          debit_account_id: t.debit_account_id,
                          credit_account_id: t.credit_account_id,
                          amount: Number(t.amount),
                          narration: t.narration,
                          linked: !!t.ref_table,
                        }}
                        heads={headOptions}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination paged={paged} />
        </>
      )}
    </>
  );
}

function filterSubtitle(sp: SP, tt: ReturnType<typeof getDict>): string {
  const parts: string[] = [];
  if (sp.from) parts.push(`${tt.vouchers.subFrom} ${sp.from}`);
  if (sp.to) parts.push(`${tt.vouchers.subTo} ${sp.to}`);
  if (sp.branch && sp.branch !== 'all') parts.push(branchShort(sp.branch));
  if (sp.type && sp.type !== 'all') {
    const label = tt.typeLabels[TYPE_LABEL_KEY[sp.type]] ?? sp.type;
    parts.push(`${tt.vouchers.subType}: ${label}`);
  }
  if (sp.q?.trim()) parts.push(`${tt.vouchers.subSearch}: ${sp.q.trim()}`);
  return parts.length ? parts.join(' · ') : tt.vouchers.allVouchers;
}
