import Link from 'next/link';
import { Wallet, Banknote, HandCoins, ArrowDownToLine, ArrowUpFromLine, NotebookPen, Receipt, Landmark, Printer } from 'lucide-react';
import { PageHeader, StatCard, Card, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { VoucherRowActions } from '@/components/manage/accounts/VoucherRowActions';
import { loadActiveHeads, loadTransactions, headMap, headName } from '@/lib/management/accounts-data';
import { naturalBalance } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accounts' };

const TYPE_TONE: Record<string, 'emerald' | 'gold' | 'red' | 'blue' | 'slate'> = {
  receipt: 'emerald',
  income: 'emerald',
  payment: 'red',
  expense: 'red',
  contra: 'blue',
  journal: 'slate',
};

const TYPE_LABEL_KEY: Record<string, keyof ReturnType<typeof getDict>['typeLabels']> = {
  receipt: 'receipt',
  income: 'income',
  payment: 'payment',
  expense: 'expense',
  contra: 'contra',
  journal: 'journal',
};

export default async function AccountsHomePage() {
  const locale = getLocale();
  const tt = getDict(locale);
  const today = new Date().toISOString().slice(0, 10);
  const heads = await loadActiveHeads();
  const [recent, todays] = await Promise.all([
    loadTransactions({ limit: 10 }),
    loadTransactions({ from: today, to: today }),
  ]);

  const map = headMap(heads);
  const headOptions = heads.map((h) => ({ id: h.id, name: h.name }));

  const cashHead = heads.find((h) => h.subtype === 'cash' && h.is_system) ?? heads.find((h) => h.subtype === 'cash');
  const cashBalance = cashHead ? naturalBalance(cashHead) : 0;

  const bankBalance = heads
    .filter((h) => h.subtype === 'bank')
    .reduce((sum, h) => sum + naturalBalance(h), 0);

  const totalDue = heads
    .filter((h) => h.subtype === 'customer')
    .reduce((sum, h) => sum + Math.max(0, naturalBalance(h)), 0);

  // Today's income / expense from the income & expense heads moved today.
  const incomeIds = new Set(heads.filter((h) => h.type === 'income').map((h) => h.id));
  const expenseIds = new Set(heads.filter((h) => h.type === 'expense').map((h) => h.id));
  const todaysIncome = todays
    .filter((t) => incomeIds.has(t.credit_account_id))
    .reduce((s, t) => s + Number(t.amount), 0);
  const todaysExpense = todays
    .filter((t) => expenseIds.has(t.debit_account_id))
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      <PageHeader
        title={tt.home.title}
        subtitle={tt.home.subtitle}
        actions={
          <>
            <Button href={localizedPath(locale, '/admin/accounts/entry')} variant="primary" size="sm">
              <NotebookPen className="h-4 w-4" /> {tt.home.dailyEntry}
            </Button>
            <Button href={localizedPath(locale, '/admin/accounts/vouchers')} variant="outline" size="sm">
              <Receipt className="h-4 w-4" /> {tt.home.vouchers}
            </Button>
            <Button href={localizedPath(locale, '/admin/accounts/heads')} variant="outline" size="sm">
              <Landmark className="h-4 w-4" /> {tt.home.heads}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={tt.home.cashInHand} value={<Money value={cashBalance} />} icon={Wallet} accent="emerald" />
        <StatCard label={tt.home.bankBalance} value={<Money value={bankBalance} />} icon={Banknote} accent="gold" />
        <StatCard label={tt.home.totalReceivable} value={<Money value={totalDue} />} icon={HandCoins} accent="red" hint={tt.home.acrossAllCustomers} />
        <StatCard label={tt.home.incomeToday} value={<Money value={todaysIncome} />} icon={ArrowDownToLine} accent="emerald" />
        <StatCard label={tt.home.expenseToday} value={<Money value={todaysExpense} />} icon={ArrowUpFromLine} accent="slate" />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{tt.home.recentVouchers}</h2>
          <Link href={localizedPath(locale, '/admin/accounts/vouchers')} className="text-sm font-semibold text-brand-700 hover:underline">
            {tt.home.viewAll}
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title={tt.home.noVouchersTitle}
            hint={tt.home.noVouchersHint}
            action={
              <Button href={localizedPath(locale, '/admin/accounts/entry')} size="sm">
                <NotebookPen className="h-4 w-4" /> {tt.home.postFirstEntry}
              </Button>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{tt.home.thVoucher}</th>
                <th className={thClass}>{tt.home.thDate}</th>
                <th className={thClass}>{tt.home.thType}</th>
                <th className={thClass}>{tt.home.thDebit}</th>
                <th className={thClass}>{tt.home.thCredit}</th>
                <th className={`${thClass} text-right`}>{tt.home.thAmount}</th>
                <th className={thClass}>{tt.home.thBranch}</th>
                <th className={`${thClass} text-right`}>{tt.home.thManage}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td className={`${tdClass} font-mono text-xs`}>{t.voucher_no ?? '—'}</td>
                  <td className={tdClass}>{t.date}</td>
                  <td className={tdClass}>
                    <Badge tone={TYPE_TONE[t.type] ?? 'slate'}>{tt.typeLabels[TYPE_LABEL_KEY[t.type]] ?? t.type}</Badge>
                  </td>
                  <td className={tdClass}>{headName(map, t.debit_account_id)}</td>
                  <td className={tdClass}>{headName(map, t.credit_account_id)}</td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(t.amount)}</td>
                  <td className={tdClass}>{branchShort(t.branch)}</td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <div className="inline-flex items-center gap-1.5">
                      <a
                        href={localizedPath(locale, `/admin/receipt/voucher/${t.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={locale === 'bn' ? 'রসিদ প্রিন্ট' : 'Print receipt'}
                        className="inline-flex items-center rounded-lg border border-border px-2 py-1 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </a>
                      <VoucherRowActions
                        voucher={{
                          id: t.id,
                          voucher_no: t.voucher_no,
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
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <QuickLink href={localizedPath(locale, '/admin/accounts/entry')} icon={NotebookPen} title={tt.home.quickDailyEntryTitle} hint={tt.home.quickDailyEntryHint} />
        <QuickLink href={localizedPath(locale, '/admin/accounts/vouchers')} icon={Receipt} title={tt.home.quickVouchersTitle} hint={tt.home.quickVouchersHint} />
        <QuickLink href={localizedPath(locale, '/admin/accounts/heads')} icon={Landmark} title={tt.home.quickHeadsTitle} hint={tt.home.quickHeadsHint} />
      </div>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: typeof Wallet;
  title: string;
  hint: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-brand-600/40 hover:shadow-md">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>
      </Card>
    </Link>
  );
}
