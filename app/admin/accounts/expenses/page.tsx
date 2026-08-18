import { ScrollText } from 'lucide-react';
import { PageHeader, StatCard, Card, Money, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { AddExpenseForm } from '@/components/manage/accounts/AddExpenseForm';
import type { HeadOption } from '@/components/manage/accounts/VoucherForm';
import { loadActiveHeads, loadTransactions, headMap, headName } from '@/lib/management/accounts-data';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Expenses' };

function toOption(h: { id: string; name: string; type: string; subtype: string; code: string | null }): HeadOption {
  return { id: h.id, name: h.name, type: h.type, subtype: h.subtype, code: h.code };
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string };
}) {
  const tt = getDict(getLocale());
  const [heads, txns] = await Promise.all([
    loadActiveHeads(),
    loadTransactions({
      from: searchParams.from || undefined,
      to: searchParams.to || undefined,
      limit: 1000,
    }),
  ]);
  const map = headMap(heads);

  const expenseHeads = heads.filter((h) => h.type === 'expense');
  const expenseIds = new Set(expenseHeads.map((h) => h.id));
  const bankHeads = heads.filter((h) => h.subtype === 'bank');
  // An expense voucher debits an expense head.
  const expenseTxns = txns.filter((t) => expenseIds.has(t.debit_account_id));

  const total = expenseTxns.reduce((s, t) => s + Number(t.amount), 0);

  // Summary by expense head.
  const byHead = new Map<string, number>();
  for (const t of expenseTxns) {
    byHead.set(t.debit_account_id, (byHead.get(t.debit_account_id) ?? 0) + Number(t.amount));
  }
  const summary = [...byHead.entries()]
    .map(([id, amount]) => ({ name: headName(map, id), amount }))
    .sort((a, b) => b.amount - a.amount);

  const exportRows = expenseTxns.map((t) => [
    t.date,
    t.voucher_no ?? '',
    headName(map, t.debit_account_id),
    headName(map, t.credit_account_id),
    money(t.amount, false),
    branchShort(t.branch),
    t.narration ?? '',
  ]);

  return (
    <>
      <PageHeader
        title={tt.expenses.title}
        subtitle={tt.expenses.subtitle}
        actions={
          expenseTxns.length > 0 ? (
            <ExportBar
              filename="expenses"
              title={tt.expenses.exportTitle}
              subtitle={`${tt.expenses.totalSpent}: ${money(total)}`}
              orientation="l"
              headers={[tt.expenses.exHDate, tt.expenses.exHVoucher, tt.expenses.exHExpenseHead, tt.expenses.exHPaidFrom, tt.expenses.exHAmount, tt.expenses.exHBranch, tt.expenses.exHNarration]}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      <Card className="mb-5">
        <DateRangeFilter from={searchParams.from ?? ''} to={searchParams.to ?? ''} range={searchParams.range ?? ''} />
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={tt.expenses.totalExpenses} value={<Money value={total} />} icon={ScrollText} accent="red" />
        <StatCard label={tt.expenses.expenseVouchers} value={expenseTxns.length} accent="slate" />
        <StatCard label={tt.expenses.expenseHeads} value={expenseHeads.length} accent="slate" />
      </div>

      <div className="mb-6">
        <AddExpenseForm expenseHeads={expenseHeads.map(toOption)} bankHeads={bankHeads.map(toOption)} />
      </div>

      {summary.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">{tt.expenses.byExpenseHead}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                <span className="text-ink">{s.name}</span>
                <span className="font-semibold tabular-nums text-ink">{money(s.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {expenseTxns.length === 0 ? (
        <EmptyState
          title={tt.expenses.noExpensesTitle}
          hint={tt.expenses.noExpensesHint}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{tt.expenses.thDate}</th>
              <th className={thClass}>{tt.expenses.thVoucher}</th>
              <th className={thClass}>{tt.expenses.thExpenseHead}</th>
              <th className={thClass}>{tt.expenses.thPaidFrom}</th>
              <th className={`${thClass} text-right`}>{tt.expenses.thAmount}</th>
              <th className={thClass}>{tt.expenses.thBranch}</th>
              <th className={thClass}>{tt.expenses.thNarration}</th>
            </tr>
          </thead>
          <tbody>
            {expenseTxns.map((t) => (
              <tr key={t.id}>
                <td className={`${tdClass} whitespace-nowrap`}>{t.date}</td>
                <td className={`${tdClass} whitespace-nowrap font-mono text-xs`}>{t.voucher_no ?? '—'}</td>
                <td className={tdClass}>{headName(map, t.debit_account_id)}</td>
                <td className={tdClass}>{headName(map, t.credit_account_id)}</td>
                <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(t.amount)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{branchShort(t.branch)}</td>
                <td className={`${tdClass} max-w-[16rem] truncate text-ink-muted`} title={t.narration ?? ''}>
                  {t.narration || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
