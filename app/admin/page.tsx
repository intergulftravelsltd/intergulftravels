import Link from 'next/link';
import {
  Wallet,
  Banknote,
  HandCoins,
  TrendingUp,
  TrendingDown,
  Users,
  Moon,
  Inbox,
  Calculator,
  NotebookPen,
  BarChart3,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ScrollText,
  ChevronRight,
} from 'lucide-react';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import type { AccountHead, Transaction } from '@/lib/management/types';
import { netDebit, naturalBalance } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { formatDate } from '@/lib/utils';
import { PageHeader, Card, StatCard, EmptyState, Badge } from '@/components/manage/ui';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { CountUp, DonutChart, TowersChart, FlowChips, type MonthPoint } from '@/components/manage/charts';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath, type Locale } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

/** Only the fields the dashboard actually renders for a recent voucher row. */
type DashTx = { id: string; voucher_no: string | null; date: string; amount: number; type?: string };

type DashData = {
  cash: number;
  bank: number;
  bankOverdraft: number;
  receivable: number;
  periodIncome: number;
  periodExpense: number;
  hajjThisYear: number;
  umrahThisYear: number;
  newContacts: number;
  newEstimates: number;
  recentTx: { tx: DashTx; debitName: string; creditName: string }[];
  recentPilgrims: any[];
  hasManagement: boolean;
};

async function loadDashboard(range: { from: string; to: string }): Promise<DashData> {
  const d: DashData = {
    cash: 0,
    bank: 0,
    bankOverdraft: 0,
    receivable: 0,
    periodIncome: 0,
    periodExpense: 0,
    hajjThisYear: 0,
    umrahThisYear: 0,
    newContacts: 0,
    newEstimates: 0,
    recentTx: [],
    recentPilgrims: [],
    hasManagement: false,
  };

  const year = new Date().getFullYear();
  const scope = await getStaffScope();
  const db = mgmtDb();

  // Fast path: the whole dashboard comes back in ONE round-trip from the
  // dashboard_summary RPC (migration 0009) — balances, period sums, counts and
  // recent rows are all aggregated inside Postgres, so the numbers are exact
  // even past PostgREST's 1000-row page cap.
  try {
    const { data, error } = await db.rpc('dashboard_summary', {
      p_branch: scope.branch,
      p_from: range.from || null,
      p_to: range.to || null,
      p_year: year,
    });
    if (!error && data) {
      const s = data as Record<string, any>;
      d.cash = Number(s.cash) || 0;
      d.bank = Number(s.bank) || 0;
      d.bankOverdraft = Number(s.bank_overdraft) || 0;
      d.receivable = Number(s.receivable) || 0;
      d.periodIncome = Number(s.period_income) || 0;
      d.periodExpense = Number(s.period_expense) || 0;
      d.hajjThisYear = Number(s.hajj_this_year) || 0;
      d.umrahThisYear = Number(s.umrah_total) || 0;
      d.newContacts = Number(s.new_contacts) || 0;
      d.newEstimates = Number(s.new_estimates) || 0;
      d.recentTx = ((s.recent_tx ?? []) as any[]).map((r) => ({
        tx: { id: r.id, voucher_no: r.voucher_no, date: r.date, amount: Number(r.amount), type: r.type },
        debitName: r.debit_name ?? 'Unknown',
        creditName: r.credit_name ?? 'Unknown',
      }));
      d.recentPilgrims = (s.recent_pilgrims ?? []) as any[];
      d.hasManagement = true;
      return d;
    }
  } catch {
    // RPC not deployed yet — fall through to the legacy per-table path below.
  }

  // Legacy path (0009 not applied): the same numbers from per-table queries.
  // All eight queries are independent, so they run concurrently instead of the
  // old serial waterfall, and each selects only the columns it renders.
  try {
    const head = { count: 'exact' as const, head: true };
    const b = scope.branch;

    let hq = db.from('account_heads').select('*').eq('active', true);
    if (b) hq = hq.eq('branch', b);

    let tq = db.from('transactions').select('amount, debit_account_id, credit_account_id');
    if (range.from) tq = tq.gte('date', range.from);
    if (range.to) tq = tq.lte('date', range.to);
    if (b) tq = tq.eq('branch', b);

    let rq = db
      .from('transactions')
      .select('id, voucher_no, date, amount, type, debit_account_id, credit_account_id');
    if (b) rq = rq.eq('branch', b);

    let hajjQ = db.from('hajj_pilgrims').select('id', head).eq('year', year);
    let umrahQ = db.from('umrah_passengers').select('id', head);
    let recentQ = db
      .from('hajj_pilgrims')
      .select('id, tracking_no, name, reg_type, branch, created_at, year')
      .order('created_at', { ascending: false })
      .limit(6);
    if (b) {
      hajjQ = hajjQ.eq('branch', b);
      umrahQ = umrahQ.eq('branch', b);
      recentQ = recentQ.eq('branch', b);
    }

    const [headsRes, periodRes, recentTxRes, hajjCount, umrahCount, recentPil, contacts, estimates] =
      await Promise.all([
        hq,
        tq,
        rq.order('created_at', { ascending: false }).limit(6),
        hajjQ,
        umrahQ,
        recentQ,
        db.from('contact_requests').select('id', head).eq('handled', false),
        db.from('estimate_requests').select('id', head).eq('status', 'new'),
      ]);

    let heads: AccountHead[] = [];
    if (!headsRes.error && headsRes.data) {
      heads = headsRes.data as AccountHead[];
      d.hasManagement = true;
      for (const h of heads) {
        if (h.subtype === 'cash') d.cash += netDebit(h);
        else if (h.subtype === 'bank') {
          // A negative bank balance is an overdraft (a liability) — don't net it
          // against real cash in the banks, so deposits are clearly reflected.
          const bal = netDebit(h);
          if (bal >= 0) d.bank += bal;
          else d.bankOverdraft += -bal;
        } else if (h.subtype === 'customer') {
          const due = naturalBalance(h);
          if (due > 0) d.receivable += due;
        }
      }
    }

    const byId = new Map(heads.map((h) => [h.id, h]));
    for (const tx of (periodRes.data ?? []) as Pick<
      Transaction,
      'amount' | 'debit_account_id' | 'credit_account_id'
    >[]) {
      const credited = byId.get(tx.credit_account_id);
      const debited = byId.get(tx.debit_account_id);
      if (credited?.type === 'income') d.periodIncome += Number(tx.amount);
      if (debited?.type === 'expense') d.periodExpense += Number(tx.amount);
    }

    const recent = (recentTxRes.data ?? []) as (DashTx & {
      debit_account_id: string;
      credit_account_id: string;
    })[];
    if (recent.length) {
      const nameOf = new Map(heads.map((h) => [h.id, h.name]));
      const missing = Array.from(
        new Set(recent.flatMap((tx) => [tx.debit_account_id, tx.credit_account_id])),
      ).filter((id) => !nameOf.has(id));
      if (missing.length) {
        const { data: extra } = await db.from('account_heads').select('id, name').in('id', missing);
        for (const h of extra ?? []) nameOf.set(h.id, h.name);
      }
      d.recentTx = recent.map((tx) => ({
        tx,
        debitName: nameOf.get(tx.debit_account_id) ?? 'Unknown',
        creditName: nameOf.get(tx.credit_account_id) ?? 'Unknown',
      }));
    }

    d.hajjThisYear = hajjCount.count ?? 0;
    d.umrahThisYear = umrahCount.count ?? 0;
    d.recentPilgrims = recentPil.data ?? [];
    d.newContacts = contacts.count ?? 0;
    d.newEstimates = estimates.count ?? 0;
  } catch {
    // management tables not present yet
  }

  return d;
}

/** 12-month income/expense towers — one dashboard_trend RPC (0010), with a
 *  two-query fallback so the chart still renders before the migration runs. */
async function loadTrend(locale: Locale): Promise<MonthPoint[]> {
  const MONTHS = 12;
  const now = new Date();
  const skeleton: string[] = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    skeleton.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  const label = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short' });
  };
  const empty = () => skeleton.map((ym) => ({ label: label(ym), income: 0, expense: 0 }));

  try {
    const scope = await getStaffScope();
    const db = mgmtDb();
    try {
      const { data, error } = await db.rpc('dashboard_trend', { p_branch: scope.branch, p_months: MONTHS });
      if (!error && Array.isArray(data)) {
        const byYm = new Map((data as any[]).map((r) => [r.ym, r]));
        return skeleton.map((ym) => ({
          label: label(ym),
          income: Number(byYm.get(ym)?.income) || 0,
          expense: Number(byYm.get(ym)?.expense) || 0,
        }));
      }
    } catch {
      // RPC not deployed yet — fall through to the two-query fallback.
    }

    let tq = db
      .from('transactions')
      .select('date, amount, debit_account_id, credit_account_id')
      .gte('date', `${skeleton[0]}-01`);
    if (scope.branch) tq = tq.eq('branch', scope.branch);
    const [txRes, headRes] = await Promise.all([tq, db.from('account_heads').select('id, type')]);
    const typeOf = new Map(
      ((headRes.data ?? []) as { id: string; type: string }[]).map((h) => [h.id, h.type]),
    );
    const buckets = new Map(skeleton.map((ym) => [ym, { income: 0, expense: 0 }]));
    for (const tx of (txRes.data ?? []) as {
      date: string;
      amount: number;
      debit_account_id: string;
      credit_account_id: string;
    }[]) {
      const b = buckets.get(String(tx.date).slice(0, 7));
      if (!b) continue;
      if (typeOf.get(tx.credit_account_id) === 'income') b.income += Number(tx.amount);
      if (typeOf.get(tx.debit_account_id) === 'expense') b.expense += Number(tx.amount);
    }
    return skeleton.map((ym) => ({ label: label(ym), ...buckets.get(ym)! }));
  } catch {
    return empty();
  }
}

/** Direction icon + tones for a recent-voucher row. */
function txVisual(type?: string) {
  switch (type) {
    case 'receipt':
    case 'income':
      return { Icon: ArrowUpRight, chip: 'bg-brand-50 text-brand-700', amount: 'text-brand-700', sign: '+' };
    case 'payment':
    case 'expense':
      return { Icon: ArrowDownRight, chip: 'bg-red-50 text-red-600', amount: 'text-red-600', sign: '−' };
    case 'contra':
      return { Icon: ArrowLeftRight, chip: 'bg-sky-50 text-sky-700', amount: 'text-ink', sign: '' };
    default:
      return { Icon: ScrollText, chip: 'bg-muted text-ink-muted', amount: 'text-ink', sign: '' };
  }
}

export default async function ManagementDashboard({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string };
}) {
  const from = searchParams.from ?? '';
  const to = searchParams.to ?? '';
  // The money view defaults to the current month; a preset or custom range
  // (Lifetime clears both dates) overrides it. rangeKey drives the highlight.
  const rangeKey = (searchParams.range || (from || to ? 'custom' : 'this-month')) as RangeKey;
  const range = rangeKey === 'custom' ? { from, to } : presetRange(rangeKey);
  const locale = getLocale();
  const [d, trend] = await Promise.all([loadDashboard(range), loadTrend(locale)]);
  const t = getDict(locale);
  // Branch admins see their branch name as a welcome; the super admin keeps the
  // group-wide heading.
  const scope = await getStaffScope();
  const branchName = scope.branch ? branchLabel(scope.branch) : null;
  const periodHint = range.from && range.to ? `${formatDate(range.from)} — ${formatDate(range.to)}` : '';

  const net = d.periodIncome - d.periodExpense;
  const flowIncome = trend.reduce((s, m) => s + m.income, 0);
  const flowExpense = trend.reduce((s, m) => s + m.expense, 0);

  const quickActions = [
    { label: t.dash.qaDailyEntry, href: '/admin/accounts/entry', icon: NotebookPen },
    { label: t.dash.qaNewHajj, href: '/admin/hajj', icon: Users },
    { label: t.dash.qaNewUmrah, href: '/admin/umrah', icon: Moon },
    { label: t.dash.qaReports, href: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {branchName ?? t.dash.title}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold tracking-widest text-brand-700 ring-1 ring-brand-600/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
              </span>
              {t.dash.live}
            </span>
          </span>
        }
        subtitle={branchName ? t.dash.branchGlance : t.dash.subtitle}
        actions={
          <>
            <DateRangeFilter from={range.from} to={range.to} range={rangeKey} />
            <Link
              href={localizedPath(locale, '/admin/accounts/entry')}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-emerald transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              <NotebookPen className="h-4 w-4" /> {t.dash.newEntry}
            </Link>
          </>
        }
      />

      {!d.hasManagement && (
        <div className="mb-6 rounded-2xl border border-gold-500/30 bg-gold-50 px-5 py-4 text-sm text-gold-800">
          {t.dash.setupNotice}
        </div>
      )}

      {/* Money stats — the four figures the office asks for first */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href={localizedPath(locale, '/admin/accounts/cash-bank')} className="block">
          <StatCard
            label={t.dash.cashInHand}
            value={<CountUp value={d.cash} money />}
            icon={Wallet}
            accent="emerald"
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/cash-bank')} className="block">
          <StatCard
            label={t.dash.bankBalance}
            value={<CountUp value={d.bank} money />}
            icon={Banknote}
            accent="blue"
            hint={d.bankOverdraft > 0 ? `${locale === 'bn' ? 'ওভারড্রাফট' : 'Overdraft'} ${money(d.bankOverdraft)}` : undefined}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/due')} className="block">
          <StatCard
            label={t.dash.totalReceivable}
            value={<CountUp value={d.receivable} money />}
            icon={HandCoins}
            accent="gold"
            hint={t.dash.totalReceivableHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/reports')} className="block">
          <StatCard
            label={t.dash.netPeriod}
            value={<CountUp value={net} money />}
            icon={net >= 0 ? TrendingUp : TrendingDown}
            accent={net >= 0 ? 'emerald' : 'red'}
            hint={periodHint || t.dash.netHint}
          />
        </Link>
      </div>

      {/* Secondary metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Link href={localizedPath(locale, '/admin/reports')} className="block">
          <StatCard
            sm
            label={t.dash.periodIncome}
            value={<CountUp value={d.periodIncome} money />}
            icon={TrendingUp}
            accent="emerald"
            hint={periodHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/expenses')} className="block">
          <StatCard
            sm
            label={t.dash.periodExpense}
            value={<CountUp value={d.periodExpense} money />}
            icon={TrendingDown}
            accent="red"
            hint={periodHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/hajj')} className="block">
          <StatCard
            sm
            label={t.dash.hajjPilgrims}
            value={<CountUp value={d.hajjThisYear} />}
            icon={Users}
            accent="blue"
            hint={t.dash.registeredThisYear}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/umrah')} className="block">
          <StatCard
            sm
            label={t.dash.umrahPassengers}
            value={<CountUp value={d.umrahThisYear} />}
            icon={Moon}
            accent="purple"
            hint={t.dash.totalOnRecord}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/contacts')} className="block">
          <StatCard
            sm
            label={t.dash.unhandledContacts}
            value={<CountUp value={d.newContacts} />}
            icon={Inbox}
            accent="gold"
            hint={t.dash.awaitingReply}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/estimates')} className="block">
          <StatCard
            sm
            label={t.dash.newEstimates}
            value={<CountUp value={d.newEstimates} />}
            icon={Calculator}
            accent="gold"
            hint={t.dash.toBeQuoted}
          />
        </Link>
      </div>

      {/* Charts — cash-flow towers + money-mix donut */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Activity className="h-5 w-5 text-brand-700" /> {t.dash.cashFlow}
              </h2>
              <p className="mt-0.5 text-xs text-ink-muted">{t.dash.cashFlowHint}</p>
            </div>
            <FlowChips
              income={flowIncome}
              expense={flowExpense}
              inLabel={t.dash.inLabel}
              outLabel={t.dash.outLabel}
              netLabel={t.dash.netLabel}
            />
          </div>
          <TowersChart
            data={trend}
            inLabel={t.dash.inLabel}
            outLabel={t.dash.outLabel}
            emptyLabel={t.dash.noChart}
          />
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <PieChart className="h-5 w-5 text-brand-700" /> {t.dash.moneyMix}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">{t.dash.moneyMixHint}</p>
          </div>
          <DonutChart
            centerLabel={t.dash.totalLabel}
            emptyLabel={t.dash.noChart}
            segments={[
              { label: t.dash.cashInHand, value: d.cash, color: '#0e7c5a' },
              { label: t.dash.bankBalance, value: d.bank, color: '#c9a24b' },
              { label: t.dash.totalReceivable, value: d.receivable, color: '#38bdf8' },
            ]}
          />
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="mt-6">
        <p className="mb-3 text-sm font-semibold text-ink">{t.dash.quickActions}</p>
        <div className="flex flex-wrap gap-2.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={localizedPath(locale, a.href)}
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-600/40 hover:bg-brand-50 hover:text-brand-700 hover:shadow-soft"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {a.label}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Recent activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent transactions */}
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pb-1 pt-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <ScrollText className="h-5 w-5 text-brand-700" /> {t.dash.recentTransactions}
            </h2>
            <Link
              href={localizedPath(locale, '/admin/accounts/vouchers')}
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-700 transition hover:gap-1.5 hover:underline"
            >
              {t.dash.viewAll} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {d.recentTx.length === 0 ? (
            <div className="p-5">
              <EmptyState title={t.dash.noTransactions} hint={t.dash.noTransactionsHint} />
            </div>
          ) : (
            <ul className="divide-y divide-border/60 pb-2">
              {d.recentTx.map(({ tx, debitName, creditName }) => {
                const v = txVisual(tx.type);
                const Icon = v.Icon;
                return (
                  <li key={tx.id} className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-muted/40">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${v.chip} transition-transform duration-200 group-hover:scale-110`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {t.dash.dr} {debitName}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {t.dash.cr} {creditName}
                        {tx.voucher_no ? ` · ${tx.voucher_no}` : ''} ·{' '}
                        {formatDate(tx.date, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${v.amount}`}>
                      {v.sign}
                      {money(tx.amount, false)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent pilgrims */}
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pb-1 pt-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <Users className="h-5 w-5 text-brand-700" /> {t.dash.recentPilgrims}
            </h2>
            <Link
              href={localizedPath(locale, '/admin/hajj')}
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-700 transition hover:gap-1.5 hover:underline"
            >
              {t.dash.viewAll} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {d.recentPilgrims.length === 0 ? (
            <div className="p-5">
              <EmptyState title={t.dash.noPilgrims} hint={t.dash.noPilgrimsHint} />
            </div>
          ) : (
            <ul className="divide-y divide-border/60 pb-2">
              {d.recentPilgrims.map((p) => (
                <li key={p.id} className="group flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-muted/40">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 font-display text-sm font-bold text-white shadow-emerald transition-transform duration-200 group-hover:scale-110">
                    {(p.name ?? '?').trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {p.tracking_no ? `${p.tracking_no} · ` : ''}
                      {branchLabel(p.branch)}
                    </p>
                  </div>
                  <Badge tone={p.reg_type === 'registered' ? 'emerald' : 'gold'}>
                    {p.reg_type === 'registered' ? t.dash.registered : t.dash.preReg}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
