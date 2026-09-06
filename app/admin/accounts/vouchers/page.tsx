import { Printer } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { VoucherRowActions } from '@/components/manage/accounts/VoucherRowActions';
import { loadActiveHeads, loadTransactions, headMap, headName } from '@/lib/management/accounts-data';
import { getStaffScope } from '@/lib/management/scope';
import { BRANCHES, branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { resolvePeriod } from '@/lib/period';
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

type SP = { from?: string; to?: string; branch?: string; type?: string; range?: string };

const labelStyle = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted';
const ctrl =
  'w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20';

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

  const [heads, txns, scope] = await Promise.all([
    loadActiveHeads(),
    loadTransactions(filters),
    getStaffScope(),
  ]);
  const map = headMap(heads);
  const headOptions = heads.map((h) => ({ id: h.id, name: h.name }));

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

      <Card className="mb-4">
        <DateRangeFilter from={searchParams.from ?? ''} to={searchParams.to ?? ''} range={searchParams.range ?? ''} />
      </Card>

      {/* Filters */}
      <Card className="mb-5">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label>
            <span className={labelStyle}>{tt.vouchers.from}</span>
            <input type="date" name="from" defaultValue={searchParams.from} className={ctrl} />
          </label>
          <label>
            <span className={labelStyle}>{tt.vouchers.to}</span>
            <input type="date" name="to" defaultValue={searchParams.to} className={ctrl} />
          </label>
          {!scope.branch && (
            <label>
              <span className={labelStyle}>{tt.common.branch}</span>
              <select name="branch" defaultValue={searchParams.branch ?? 'all'} className={ctrl}>
                <option value="all">{tt.common.allBranches}</option>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className={labelStyle}>{tt.vouchers.typeFilter}</span>
            <select name="type" defaultValue={searchParams.type ?? 'all'} className={ctrl}>
              <option value="all">{tt.vouchers.allTypes}</option>
              {TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {tt.typeLabels[TYPE_LABEL_KEY[t]] ?? t}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-[42px] flex-1 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {tt.vouchers.apply}
            </button>
            <a
              href={localizedPath(locale, '/admin/accounts/vouchers')}
              className="grid h-[42px] place-items-center rounded-xl border border-border px-4 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40"
            >
              {tt.vouchers.reset}
            </a>
          </div>
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
              {txns.map((t) => (
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
  return parts.length ? parts.join(' · ') : tt.vouchers.allVouchers;
}
