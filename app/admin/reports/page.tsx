import { cache } from 'react';
import Link from 'next/link';
import {
  Scale,
  BookOpen,
  TrendingUp,
  Landmark,
  HandCoins,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminreports';
import type { AccountType } from '@/lib/management/types';
import type { AccountHead, Transaction } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { formatDate } from '@/lib/utils';
import { PageHeader, Card, EmptyState, TableWrap, thClass, tdClass, Money, Badge } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { ReportFilters } from '@/components/manage/reports/ReportFilters';
import {
  buildTrialBalance,
  buildDayBook,
  buildIncomeExpense,
  buildBalanceSheet,
  buildDueReport,
} from '@/lib/management/reports';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reports & Export' };

type ReportKey = 'trial-balance' | 'day-book' | 'income-expense' | 'balance-sheet' | 'due-aging';

type Dict = ReturnType<typeof getDict>;

const REPORTS: {
  key: ReportKey;
  titleKey: keyof Dict;
  descKey: keyof Dict;
  icon: typeof Scale;
  mode: 'date' | 'range' | 'asof' | 'none';
}[] = [
  {
    key: 'trial-balance',
    titleKey: 'trialBalanceTitle',
    descKey: 'trialBalanceDesc',
    icon: Scale,
    mode: 'none',
  },
  {
    key: 'day-book',
    titleKey: 'dayBookTitle',
    descKey: 'dayBookDesc',
    icon: BookOpen,
    mode: 'date',
  },
  {
    key: 'income-expense',
    titleKey: 'incomeExpenseTitle',
    descKey: 'incomeExpenseDesc',
    icon: TrendingUp,
    mode: 'range',
  },
  {
    key: 'balance-sheet',
    titleKey: 'balanceSheetTitle',
    descKey: 'balanceSheetDesc',
    icon: Landmark,
    mode: 'asof',
  },
  {
    key: 'due-aging',
    titleKey: 'dueAgingTitle',
    descKey: 'dueAgingDesc',
    icon: HandCoins,
    mode: 'none',
  },
];

/** Account type → translated label (replaces TYPE_LABEL for display). */
function typeLabel(t: Dict, type: AccountType): string {
  const map: Record<AccountType, keyof Dict> = {
    asset: 'typeAsset',
    liability: 'typeLiability',
    income: 'typeIncome',
    expense: 'typeExpense',
    equity: 'typeEquity',
  };
  return t[map[type]];
}

const today = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- data fetchers ----------------------------- */

// cache(): several report views on one page ask for the same head list —
// fetch it once per request instead of once per view.
const fetchHeads = cache(async function fetchHeads(branch: string): Promise<AccountHead[]> {
  try {
    const db = mgmtDb();
    let q = db.from('account_heads').select('*').eq('active', true);
    if (branch) q = q.eq('branch', branch);
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as AccountHead[];
  } catch {
    return [];
  }
});

async function fetchTransactions(opts: {
  branch: string;
  date?: string;
  from?: string;
  to?: string;
  asOf?: string;
}): Promise<Transaction[]> {
  try {
    const db = mgmtDb();
    let q = db.from('transactions').select('*').order('date', { ascending: true }).order('created_at', {
      ascending: true,
    });
    if (opts.branch) q = q.eq('branch', opts.branch);
    if (opts.date) q = q.eq('date', opts.date);
    if (opts.from) q = q.gte('date', opts.from);
    if (opts.to) q = q.lte('date', opts.to);
    if (opts.asOf) q = q.lte('date', opts.asOf);
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as Transaction[];
  } catch {
    return [];
  }
}

/* --------------------------------- page ---------------------------------- */

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { report?: string; date?: string; from?: string; to?: string; branch?: string };
}) {
  const locale = getLocale();
  const t = getDict(locale);
  const reportKey = searchParams.report as ReportKey | undefined;
  const active = REPORTS.find((r) => r.key === reportKey);

  // --- Hub view (no report selected) ---
  if (!active) {
    return (
      <>
        <PageHeader title={t.hubTitle} subtitle={t.hubSubtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.key}
                href={localizedPath(locale, `/admin/reports?report=${r.key}`)}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-600/40 hover:shadow-emerald"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-ink">{t[r.titleKey]}</p>
                <p className="mt-1 text-sm text-ink-muted">{t[r.descKey]}</p>
              </Link>
            );
          })}
        </div>
      </>
    );
  }

  // --- Report view ---
  const scope = await getStaffScope();
  const branch = scope.branch ?? (searchParams.branch ?? '');
  const date = searchParams.date || today();
  const from = searchParams.from || `${today().slice(0, 4)}-01-01`;
  const to = searchParams.to || today();

  const branchTag = branch ? branchLabel(branch) : t.allBranches;

  return (
    <>
      <div className="mb-4">
        <Link
          href={localizedPath(locale, '/admin/reports')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> {t.allReports}
        </Link>
      </div>
      <PageHeader title={t[active.titleKey]} subtitle={t[active.descKey]} />

      <Card className="mb-5">
        <ReportFilters
          report={active.key}
          mode={active.mode}
          date={date}
          from={from}
          to={to}
          branch={branch}
        />
      </Card>

      {active.key === 'trial-balance' && (
        <TrialBalanceView branch={branch} branchTag={branchTag} t={t} />
      )}
      {active.key === 'day-book' && (
        <DayBookView branch={branch} branchTag={branchTag} date={date} t={t} />
      )}
      {active.key === 'income-expense' && (
        <IncomeExpenseView branch={branch} branchTag={branchTag} from={from} to={to} t={t} />
      )}
      {active.key === 'balance-sheet' && (
        <BalanceSheetView branch={branch} branchTag={branchTag} asOf={date} t={t} />
      )}
      {active.key === 'due-aging' && <DueView branch={branch} branchTag={branchTag} t={t} />}
    </>
  );
}

/* =============================== Trial Balance ============================ */

async function TrialBalanceView({
  branch,
  branchTag,
  t,
}: {
  branch: string;
  branchTag: string;
  t: Dict;
}) {
  const heads = await fetchHeads(branch);
  const report = buildTrialBalance(heads);

  if (report.rows.length === 0) {
    return <EmptyState title={t.tbEmptyTitle} hint={t.tbEmptyHint} />;
  }

  const headers = [t.thCode, t.thAccountHead, t.thType, `${t.thDebit} (৳)`, `${t.thCredit} (৳)`];
  const rows = report.rows.map((r) => [
    r.code ?? '',
    r.name,
    typeLabel(t, r.type),
    r.debit ? money(r.debit, false) : '',
    r.credit ? money(r.credit, false) : '',
  ]);
  rows.push(['', t.total, '', money(report.totalDebit, false), money(report.totalCredit, false)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={report.balanced ? 'emerald' : 'red'}>
          {report.balanced ? t.balanced : t.outOfBalance}
        </Badge>
        <ExportBar
          filename={`trial-balance-${today()}`}
          title={t.tbExportTitle}
          subtitle={`${branchTag} · ${t.asOf} ${formatDate(today())}`}
          headers={headers}
          rows={rows}
        />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <th className={thClass}>{t.thCode}</th>
            <th className={thClass}>{t.thAccountHead}</th>
            <th className={thClass}>{t.thType}</th>
            <th className={`${thClass} text-right`}>{t.thDebit}</th>
            <th className={`${thClass} text-right`}>{t.thCredit}</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.id}>
              <td className={`${tdClass} font-mono text-xs text-ink-muted`}>{r.code ?? '—'}</td>
              <td className={`${tdClass} font-medium`}>{r.name}</td>
              <td className={tdClass}>
                <Badge>{typeLabel(t, r.type)}</Badge>
              </td>
              <td className={`${tdClass} text-right tabular-nums`}>
                {r.debit ? money(r.debit, false) : '—'}
              </td>
              <td className={`${tdClass} text-right tabular-nums`}>
                {r.credit ? money(r.credit, false) : '—'}
              </td>
            </tr>
          ))}
          <tr className="bg-muted/50 font-semibold">
            <td className={tdClass} colSpan={3}>
              {t.total}
            </td>
            <td className={`${tdClass} text-right tabular-nums`}>{money(report.totalDebit, false)}</td>
            <td className={`${tdClass} text-right tabular-nums`}>{money(report.totalCredit, false)}</td>
          </tr>
        </tbody>
      </TableWrap>
    </div>
  );
}

/* ================================= Day Book ============================== */

async function DayBookView({
  branch,
  branchTag,
  date,
  t,
}: {
  branch: string;
  branchTag: string;
  date: string;
  t: Dict;
}) {
  const [heads, transactions] = await Promise.all([
    fetchHeads(branch),
    fetchTransactions({ branch, date }),
  ]);
  const report = buildDayBook(transactions, heads);

  if (report.rows.length === 0) {
    return (
      <EmptyState
        title={t.dbEmptyTitle}
        hint={t.dbEmptyHint
          .replace('{date}', formatDate(date))
          .replace('{branch}', branchTag.toLowerCase())}
      />
    );
  }

  const headers = [t.thVoucher, t.thDrAccount, t.thCrAccount, t.thNarration, `${t.thAmount} (৳)`];
  const rows = report.rows.map((r) => [
    r.voucher_no ?? '',
    r.debitName,
    r.creditName,
    r.narration ?? '',
    money(r.amount, false),
  ]);
  rows.push(['', '', '', t.total, money(report.total, false)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {report.rows.length}{' '}
          {report.rows.length === 1 ? t.voucherCountOne : t.voucherCountMany} · {formatDate(date)}
        </p>
        <ExportBar
          filename={`day-book-${date}`}
          title={t.dbExportTitle}
          subtitle={`${branchTag} · ${formatDate(date)}`}
          headers={headers}
          rows={rows}
          orientation="l"
        />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <th className={thClass}>{t.thVoucher}</th>
            <th className={thClass}>{t.thDrAccount}</th>
            <th className={thClass}>{t.thCrAccount}</th>
            <th className={thClass}>{t.thNarration}</th>
            <th className={`${thClass} text-right`}>{t.thAmount}</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.id}>
              <td className={`${tdClass} font-mono text-xs`}>{r.voucher_no ?? '—'}</td>
              <td className={`${tdClass} font-medium`}>{r.debitName}</td>
              <td className={tdClass}>{r.creditName}</td>
              <td className={`${tdClass} text-ink-muted`}>{r.narration ?? '—'}</td>
              <td className={`${tdClass} text-right tabular-nums`}>{money(r.amount, false)}</td>
            </tr>
          ))}
          <tr className="bg-muted/50 font-semibold">
            <td className={tdClass} colSpan={4}>
              {t.totalForDay}
            </td>
            <td className={`${tdClass} text-right tabular-nums`}>{money(report.total, false)}</td>
          </tr>
        </tbody>
      </TableWrap>
    </div>
  );
}

/* ============================ Income & Expense =========================== */

async function IncomeExpenseView({
  branch,
  branchTag,
  from,
  to,
  t,
}: {
  branch: string;
  branchTag: string;
  from: string;
  to: string;
  t: Dict;
}) {
  const [heads, transactions] = await Promise.all([
    fetchHeads(branch),
    fetchTransactions({ branch, from, to }),
  ]);
  const report = buildIncomeExpense(heads, transactions);

  if (report.income.length === 0 && report.expense.length === 0) {
    return (
      <EmptyState
        title={t.ieEmptyTitle}
        hint={t.ieEmptyHint
          .replace('{from}', formatDate(from))
          .replace('{to}', formatDate(to))
          .replace('{branch}', branchTag.toLowerCase())}
      />
    );
  }

  const headers = [t.thType, t.thAccountHead, `${t.thAmount} (৳)`];
  const rows: (string | number)[][] = [];
  report.income.forEach((l) => rows.push([t.income, l.name, money(l.amount, false)]));
  rows.push([t.income, `${t.total} ${t.income}`, money(report.totalIncome, false)]);
  report.expense.forEach((l) => rows.push([t.expense, l.name, money(l.amount, false)]));
  rows.push([t.expense, `${t.total} ${t.expense}`, money(report.totalExpense, false)]);
  rows.push(['', report.net >= 0 ? t.netProfit : t.netLoss, money(Math.abs(report.net), false)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {formatDate(from)} — {formatDate(to)} · {branchTag}
        </p>
        <ExportBar
          filename={`income-expense-${from}_${to}`}
          title={t.ieExportTitle}
          subtitle={`${branchTag} · ${formatDate(from)} — ${formatDate(to)}`}
          headers={headers}
          rows={rows}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PnlColumn
          title={t.income}
          emptyLabel={t.noIncomeRecorded}
          lines={report.income}
          total={report.totalIncome}
          tone="emerald"
        />
        <PnlColumn
          title={t.expense}
          emptyLabel={t.noExpenseRecorded}
          lines={report.expense}
          total={report.totalExpense}
          tone="red"
        />
      </div>

      <Card className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">
          {report.net >= 0 ? t.netProfit : t.netLoss}
        </span>
        <span
          className={`font-display text-2xl font-semibold tabular-nums ${
            report.net >= 0 ? 'text-brand-700' : 'text-red-600'
          }`}
        >
          {money(Math.abs(report.net))}
        </span>
      </Card>
    </div>
  );
}

function PnlColumn({
  title,
  emptyLabel,
  lines,
  total,
  tone,
}: {
  title: string;
  emptyLabel: string;
  lines: { id: string; name: string; amount: number }[];
  total: number;
  tone: 'emerald' | 'red';
}) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        <span className={`font-semibold tabular-nums ${tone === 'emerald' ? 'text-brand-700' : 'text-red-600'}`}>
          {money(total, false)}
        </span>
      </div>
      {lines.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border/70">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-ink">{l.name}</span>
              <span className="tabular-nums text-ink">{money(l.amount, false)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ============================== Balance Sheet =========================== */

async function BalanceSheetView({
  branch,
  branchTag,
  asOf,
  t,
}: {
  branch: string;
  branchTag: string;
  asOf: string;
  t: Dict;
}) {
  const heads = await fetchHeads(branch);
  const report = buildBalanceSheet(heads);

  const noData =
    report.assets.length === 0 && report.liabilities.length === 0 && report.equity.length === 0;
  if (noData && report.retainedEarnings === 0) {
    return <EmptyState title={t.bsEmptyTitle} hint={t.bsEmptyHint} />;
  }

  const headers = [t.thType, t.thAccountHead, `${t.thAmount} (৳)`];
  const rows: (string | number)[][] = [];
  report.assets.forEach((l) => rows.push([t.assets, l.name, money(l.amount, false)]));
  rows.push([t.assets, `${t.total} ${t.assets}`, money(report.totalAssets, false)]);
  report.liabilities.forEach((l) => rows.push([t.typeLiability, l.name, money(l.amount, false)]));
  report.equity.forEach((l) => rows.push([t.typeEquity, l.name, money(l.amount, false)]));
  rows.push([
    t.typeEquity,
    report.retainedEarnings >= 0 ? t.retainedProfit : t.retainedLoss,
    money(report.retainedEarnings, false),
  ]);
  rows.push(['', `${t.total} ${t.liabilitiesAndEquity}`, money(report.totalLiabEquity, false)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-ink-muted">
            {t.asOf} {formatDate(asOf)} · {branchTag}
          </p>
          <Badge tone={report.balanced ? 'emerald' : 'red'}>
            {report.balanced ? t.balanced : t.outOfBalance}
          </Badge>
        </div>
        <ExportBar
          filename={`balance-sheet-${asOf}`}
          title={t.bsExportTitle}
          subtitle={`${branchTag} · ${t.asOf} ${formatDate(asOf)}`}
          headers={headers}
          rows={rows}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="font-display text-base font-semibold text-ink">{t.assets}</h3>
            <span className="font-semibold tabular-nums text-ink">{money(report.totalAssets, false)}</span>
          </div>
          <BsList lines={report.assets} emptyLabel={t.noAssetsRecorded} />
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="font-display text-base font-semibold text-ink">{t.liabilitiesAndEquity}</h3>
            <span className="font-semibold tabular-nums text-ink">
              {money(report.totalLiabEquity, false)}
            </span>
          </div>
          <ul className="divide-y divide-border/70">
            {report.liabilities.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-ink">{l.name}</span>
                <span className="tabular-nums text-ink">{money(l.amount, false)}</span>
              </li>
            ))}
            {report.equity.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-ink">{l.name}</span>
                <span className="tabular-nums text-ink">{money(l.amount, false)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-ink">
                {report.retainedEarnings >= 0 ? t.retainedProfit : t.retainedLoss}
              </span>
              <span className="tabular-nums text-ink">{money(report.retainedEarnings, false)}</span>
            </li>
            {report.liabilities.length === 0 &&
              report.equity.length === 0 &&
              report.retainedEarnings === 0 && (
                <li className="px-5 py-6 text-center text-sm text-ink-muted">
                  {t.noLiabEquityRecorded}
                </li>
              )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function BsList({
  lines,
  emptyLabel,
}: {
  lines: { id: string; name: string; amount: number }[];
  emptyLabel: string;
}) {
  if (lines.length === 0) {
    return <p className="px-5 py-6 text-center text-sm text-ink-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-border/70">
      {lines.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <span className="text-ink">{l.name}</span>
          <span className="tabular-nums text-ink">{money(l.amount, false)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ================================ Due / Aging =========================== */

async function DueView({ branch, branchTag, t }: { branch: string; branchTag: string; t: Dict }) {
  const heads = await fetchHeads(branch);
  const report = buildDueReport(heads);

  if (report.rows.length === 0) {
    return <EmptyState title={t.dueEmptyTitle} hint={t.dueEmptyHint} />;
  }

  const headers = [t.thCode, t.thCustomer, t.thPhone, t.thBranch, `${t.thDue} (৳)`];
  const rows = report.rows.map((r) => [
    r.code ?? '',
    r.name,
    r.phone ?? '',
    branchLabel(r.branch),
    money(r.due, false),
  ]);
  rows.push(['', t.total, '', '', money(report.total, false)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {report.rows.length}{' '}
          {report.rows.length === 1 ? t.customerCountOne : t.customerCountMany} · {t.totalDue}{' '}
          <span className="font-semibold text-ink">{money(report.total)}</span>
        </p>
        <ExportBar
          filename={`customer-dues-${today()}`}
          title={t.dueExportTitle}
          subtitle={`${branchTag} · ${t.asOf} ${formatDate(today())}`}
          headers={headers}
          rows={rows}
        />
      </div>
      <TableWrap>
        <thead>
          <tr>
            <th className={thClass}>{t.thCode}</th>
            <th className={thClass}>{t.thCustomer}</th>
            <th className={thClass}>{t.thPhone}</th>
            <th className={thClass}>{t.thBranch}</th>
            <th className={`${thClass} text-right`}>{t.thDue}</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.id}>
              <td className={`${tdClass} font-mono text-xs text-ink-muted`}>{r.code ?? '—'}</td>
              <td className={`${tdClass} font-medium`}>{r.name}</td>
              <td className={`${tdClass} text-ink-muted`}>{r.phone ?? '—'}</td>
              <td className={`${tdClass} text-ink-muted`}>{branchLabel(r.branch)}</td>
              <td className={`${tdClass} text-right`}>
                <Money value={r.due} />
              </td>
            </tr>
          ))}
          <tr className="bg-muted/50 font-semibold">
            <td className={tdClass} colSpan={4}>
              {t.totalOutstanding}
            </td>
            <td className={`${tdClass} text-right tabular-nums`}>{money(report.total, false)}</td>
          </tr>
        </tbody>
      </TableWrap>
    </div>
  );
}
