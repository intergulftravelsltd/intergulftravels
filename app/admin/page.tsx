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
} from 'lucide-react';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import type { AccountHead, Transaction } from '@/lib/management/types';
import { netDebit, naturalBalance } from '@/lib/management/types';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { formatDate } from '@/lib/utils';
import { PageHeader, Card, StatCard, EmptyState, TableWrap, thClass, tdClass, Money, Badge } from '@/components/manage/ui';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

/** Only the fields the dashboard actually renders for a recent voucher row. */
type DashTx = { id: string; voucher_no: string | null; date: string; amount: number };

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
        tx: { id: r.id, voucher_no: r.voucher_no, date: r.date, amount: Number(r.amount) },
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
      .select('id, voucher_no, date, amount, debit_account_id, credit_account_id');
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
  const d = await loadDashboard(range);
  const locale = getLocale();
  const t = getDict(locale);
  // Branch admins see their branch name as a welcome; the super admin keeps the
  // group-wide heading.
  const scope = await getStaffScope();
  const branchName = scope.branch ? branchLabel(scope.branch) : null;
  const periodHint = range.from && range.to ? `${formatDate(range.from)} — ${formatDate(range.to)}` : '';

  const quickActions = [
    { label: t.dash.qaDailyEntry, href: '/admin/accounts/entry', icon: NotebookPen },
    { label: t.dash.qaNewHajj, href: '/admin/hajj', icon: Users },
    { label: t.dash.qaNewUmrah, href: '/admin/umrah', icon: Moon },
    { label: t.dash.qaReports, href: '/admin/reports', icon: BarChart3 },
  ];

  return (
    <>
      <PageHeader
        title={branchName ?? t.dash.title}
        subtitle={branchName ? t.dash.branchGlance : t.dash.subtitle}
        actions={
          <Link
            href={localizedPath(locale, '/admin/accounts/entry')}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-emerald transition hover:bg-brand-700"
          >
            <NotebookPen className="h-4 w-4" /> {t.dash.newEntry}
          </Link>
        }
      />

      {!d.hasManagement && (
        <div className="mb-6 rounded-2xl border border-gold-500/30 bg-gold-50 px-5 py-4 text-sm text-gold-800">
          {t.dash.setupNotice}
        </div>
      )}

      <Card className="mb-4">
        <DateRangeFilter from={range.from} to={range.to} range={rangeKey} />
      </Card>

      {/* Money stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={localizedPath(locale, '/admin/accounts/cash-bank')} className="block">
          <StatCard label={t.dash.cashInHand} value={<Money value={d.cash} />} icon={Wallet} accent="emerald" />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/cash-bank')} className="block">
          <StatCard
            label={t.dash.bankBalance}
            value={<Money value={d.bank} />}
            icon={Banknote}
            accent="emerald"
            hint={d.bankOverdraft > 0 ? `${locale === 'bn' ? 'ওভারড্রাফট' : 'Overdraft'} ${money(d.bankOverdraft)}` : undefined}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/due')} className="block">
          <StatCard
            label={t.dash.totalReceivable}
            value={<Money value={d.receivable} />}
            icon={HandCoins}
            accent="gold"
            hint={t.dash.totalReceivableHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/reports')} className="block">
          <StatCard
            label={t.dash.periodIncome}
            value={<Money value={d.periodIncome} />}
            icon={TrendingUp}
            accent="emerald"
            hint={periodHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/accounts/expenses')} className="block">
          <StatCard
            label={t.dash.periodExpense}
            value={<Money value={d.periodExpense} />}
            icon={TrendingDown}
            accent="red"
            hint={periodHint}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/hajj')} className="block">
          <StatCard
            label={t.dash.hajjPilgrims}
            value={d.hajjThisYear}
            icon={Users}
            accent="emerald"
            hint={t.dash.registeredThisYear}
          />
        </Link>
      </div>

      {/* Operational stats */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={localizedPath(locale, '/admin/umrah')} className="block">
          <StatCard label={t.dash.umrahPassengers} value={d.umrahThisYear} icon={Moon} accent="emerald" hint={t.dash.totalOnRecord} />
        </Link>
        <Link href={localizedPath(locale, '/admin/contacts')} className="block">
          <StatCard
            label={t.dash.unhandledContacts}
            value={d.newContacts}
            icon={Inbox}
            accent="gold"
            hint={t.dash.awaitingReply}
          />
        </Link>
        <Link href={localizedPath(locale, '/admin/estimates')} className="block">
          <StatCard
            label={t.dash.newEstimates}
            value={d.newEstimates}
            icon={Calculator}
            accent="gold"
            hint={t.dash.toBeQuoted}
          />
        </Link>
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
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-600/40 hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon className="h-4 w-4" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Recent activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent transactions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">{t.dash.recentTransactions}</h2>
            <Link href={localizedPath(locale, '/admin/accounts/vouchers')} className="text-sm font-semibold text-brand-700 hover:underline">
              {t.dash.viewAll}
            </Link>
          </div>
          {d.recentTx.length === 0 ? (
            <EmptyState
              title={t.dash.noTransactions}
              hint={t.dash.noTransactionsHint}
            />
          ) : (
            <TableWrap className="min-w-0">
              <thead>
                <tr>
                  <th className={thClass}>{t.dash.voucher}</th>
                  <th className={thClass}>{t.dash.particulars}</th>
                  <th className={`${thClass} text-right`}>{t.dash.amount}</th>
                </tr>
              </thead>
              <tbody>
                {d.recentTx.map(({ tx, debitName, creditName }) => (
                  <tr key={tx.id}>
                    <td className={`${tdClass} align-top`}>
                      <p className="font-mono text-xs text-ink">{tx.voucher_no ?? '—'}</p>
                      <p className="text-xs text-ink-muted">{formatDate(tx.date, { day: 'numeric', month: 'short' })}</p>
                    </td>
                    <td className={`${tdClass} align-top`}>
                      <p className="text-ink">
                        <span className="font-medium">{t.dash.dr}</span> {debitName}
                      </p>
                      <p className="text-ink-muted">
                        <span className="font-medium">{t.dash.cr}</span> {creditName}
                      </p>
                    </td>
                    <td className={`${tdClass} text-right align-top tabular-nums`}>{money(tx.amount, false)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>

        {/* Recent pilgrims */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">{t.dash.recentPilgrims}</h2>
            <Link href={localizedPath(locale, '/admin/hajj')} className="text-sm font-semibold text-brand-700 hover:underline">
              {t.dash.viewAll}
            </Link>
          </div>
          {d.recentPilgrims.length === 0 ? (
            <EmptyState
              title={t.dash.noPilgrims}
              hint={t.dash.noPilgrimsHint}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <ul className="divide-y divide-border/70">
                {d.recentPilgrims.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{p.name}</p>
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
