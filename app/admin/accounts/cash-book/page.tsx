import { Wallet, ArrowDownToLine, ArrowUpFromLine, Landmark } from 'lucide-react';
import { PageHeader, StatCard, Money, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { PrintPageButton } from '@/components/manage/PrintPageButton';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import type { AccountHead, Transaction } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'ক্যাশ বই' : 'Cash Book' };
}

const L = {
  en: {
    title: 'Cash Book',
    subtitle: 'Every bank account + hand cash combined into one net liquid position — one row per transaction with a running balance.',
    opening: 'Opening balance',
    deposits: 'Total deposits',
    withdrawals: 'Total withdrawals',
    closing: 'Closing balance',
    thDate: 'Date',
    thAccount: 'Account',
    thParticulars: 'Particulars',
    thDeposit: 'Deposit',
    thWithdrawal: 'Withdrawal',
    thBalance: 'Balance',
    openingRow: 'Opening balance',
    closingRow: 'Closing balance',
    emptyTitle: 'No cash or bank transactions in this period',
    emptyHint: 'Change the date range, or record entries from Daily Entry.',
    noAccounts: 'No cash/bank accounts found',
    noAccountsHint: 'Create your cash and bank account heads first.',
    exportName: 'cash-book',
  },
  bn: {
    title: 'ক্যাশ বই',
    subtitle: 'সব ব্যাংক অ্যাকাউন্ট + হ্যান্ড ক্যাশ মিলিয়ে একটাই সম্মিলিত নগদ অবস্থান — প্রতিটা লেনদেন এক সারিতে, চলমান ব্যালেন্সসহ।',
    opening: 'প্রারম্ভিক ব্যালেন্স',
    deposits: 'মোট জমা',
    withdrawals: 'মোট খরচ',
    closing: 'সমাপনী ব্যালেন্স',
    thDate: 'তারিখ',
    thAccount: 'অ্যাকাউন্ট',
    thParticulars: 'বিবরণ',
    thDeposit: 'জমা',
    thWithdrawal: 'খরচ',
    thBalance: 'ব্যালেন্স',
    openingRow: 'প্রারম্ভিক ব্যালেন্স',
    closingRow: 'সমাপনী ব্যালেন্স',
    emptyTitle: 'এই সময়সীমায় কোনো নগদ/ব্যাংক লেনদেন নেই',
    emptyHint: 'তারিখের পরিসর বদলান, অথবা দৈনিক এন্ট্রি থেকে লেনদেন লিখুন।',
    noAccounts: 'কোনো নগদ/ব্যাংক অ্যাকাউন্ট পাওয়া যায়নি',
    noAccountsHint: 'আগে নগদ ও ব্যাংকের হিসাব খাত তৈরি করুন।',
    exportName: 'cash-book',
  },
};

const fmtDate = (d: string): string => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Signed book-opening of an asset head (debit-positive). */
const bookOpening = (h: AccountHead) => Number(h.opening_balance) * (h.opening_is_debit ? 1 : -1);

/**
 * Consolidated Cash Book: all bank accounts + hand cash treated as ONE pool.
 * Money entering the company (a liquid head debited) is a deposit; money
 * leaving (a liquid head credited) is a withdrawal. A cash↔bank contra shows
 * both sides on one row and leaves the running balance untouched.
 */
export default async function CashBookPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string };
}) {
  const locale = getLocale();
  const t = L[locale];

  // Resolve the window: explicit from/to wins; presets compute one; default = this month.
  const rangeKey = (searchParams.range ?? '') as RangeKey | '';
  let from = searchParams.from ?? '';
  let to = searchParams.to ?? '';
  if (rangeKey && rangeKey !== 'custom' && rangeKey !== 'lifetime') ({ from, to } = presetRange(rangeKey));
  else if (rangeKey === 'lifetime') ({ from, to } = { from: '', to: '' });
  else if (!from && !to && !rangeKey) ({ from, to } = presetRange('this-month'));

  const scope = await getStaffScope();
  const db = mgmtDb();

  let hq = db.from('account_heads').select('*').in('subtype', ['cash', 'bank']);
  if (scope.branch) hq = hq.eq('branch', scope.branch);
  const { data: headData } = await hq;
  const liquidHeads = (headData ?? []) as AccountHead[];

  if (liquidHeads.length === 0) {
    return (
      <>
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <EmptyState title={t.noAccounts} hint={t.noAccountsHint} />
      </>
    );
  }

  const liquidIds = new Set(liquidHeads.map((h) => h.id));
  const liquidName = new Map(liquidHeads.map((h) => [h.id, h.name]));
  const ids = Array.from(liquidIds);

  const { data: txData } = await db
    .from('transactions')
    .select('*')
    .or(`debit_account_id.in.(${ids.join(',')}),credit_account_id.in.(${ids.join(',')})`)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  const allTxs = (txData ?? []) as Transaction[];

  // Net movement of the liquid pool for one transaction (contra = 0).
  const flow = (tx: Transaction) =>
    (liquidIds.has(tx.debit_account_id) ? Number(tx.amount) : 0) -
    (liquidIds.has(tx.credit_account_id) ? Number(tx.amount) : 0);

  const before = from ? allTxs.filter((tx) => tx.date < from) : [];
  const inRange = allTxs.filter((tx) => (!from || tx.date >= from) && (!to || tx.date <= to));

  const opening = liquidHeads.reduce((s, h) => s + bookOpening(h), 0) + before.reduce((s, tx) => s + flow(tx), 0);

  // Names for the non-liquid counterpart heads (fallback particulars).
  const counterpartIds = Array.from(
    new Set(
      inRange
        .flatMap((tx) => [tx.debit_account_id, tx.credit_account_id])
        .filter((id) => !liquidIds.has(id)),
    ),
  );
  const counterpartNames = new Map<string, string>();
  if (counterpartIds.length) {
    const { data: cps } = await db.from('account_heads').select('id, name').in('id', counterpartIds);
    ((cps ?? []) as { id: string; name: string }[]).forEach((h) => counterpartNames.set(h.id, h.name));
  }

  let running = opening;
  let totalDeposit = 0;
  let totalWithdrawal = 0;
  const lines = inRange.map((tx) => {
    const debitIn = liquidIds.has(tx.debit_account_id);
    const creditIn = liquidIds.has(tx.credit_account_id);
    const amount = Number(tx.amount);
    const deposit = debitIn ? amount : 0;
    const withdrawal = creditIn ? amount : 0;
    running += deposit - withdrawal;
    totalDeposit += deposit;
    totalWithdrawal += withdrawal;

    const account =
      debitIn && creditIn
        ? `${liquidName.get(tx.credit_account_id)} ➜ ${liquidName.get(tx.debit_account_id)}`
        : liquidName.get(debitIn ? tx.debit_account_id : tx.credit_account_id) ?? '—';
    const counterpart = counterpartNames.get(debitIn ? tx.credit_account_id : tx.debit_account_id);

    return {
      date: fmtDate(tx.date),
      account: scope.branch ? account : `${account} · ${branchShort(tx.branch)}`,
      particulars: tx.narration || counterpart || '—',
      voucher: tx.voucher_no ?? '',
      deposit,
      withdrawal,
      balance: running,
    };
  });
  const closing = running;

  const exportRows = [
    ['', '', t.openingRow, '', '', money(opening, false)],
    ...lines.map((l) => [
      l.date,
      l.account,
      `${l.particulars}${l.voucher ? ` (${l.voucher})` : ''}`,
      l.deposit ? money(l.deposit, false) : '',
      l.withdrawal ? money(l.withdrawal, false) : '',
      money(l.balance, false),
    ]),
    ['', '', t.closingRow, money(totalDeposit, false), money(totalWithdrawal, false), money(closing, false)],
  ];

  const rangeLabel = [from || '…', to || '…'].join(' → ');

  return (
    <div id="doc-report">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #doc-report, #doc-report * { visibility: visible !important; }
          #doc-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      <PageHeader
        title={t.title}
        subtitle={`${t.subtitle} (${rangeLabel})`}
        actions={
          <div className="no-print flex flex-wrap items-center gap-2">
            <ExportBar
              filename={`${t.exportName}-${from || 'start'}-${to || 'now'}`}
              title={`${t.title} — ${rangeLabel}`}
              subtitle={`${t.opening}: ${money(opening)} · ${t.closing}: ${money(closing)}`}
              headers={[t.thDate, t.thAccount, t.thParticulars, t.thDeposit, t.thWithdrawal, t.thBalance]}
              rows={exportRows}
              orientation="l"
            />
            <PrintPageButton />
          </div>
        }
      />

      <div className="no-print mb-5">
        <DateRangeFilter from={searchParams.from ?? ''} to={searchParams.to ?? ''} range={searchParams.range ?? ''} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.opening} value={<Money value={opening} />} icon={Landmark} accent="slate" />
        <StatCard label={t.deposits} value={<Money value={totalDeposit} />} icon={ArrowDownToLine} accent="emerald" />
        <StatCard label={t.withdrawals} value={<Money value={totalWithdrawal} />} icon={ArrowUpFromLine} accent="red" />
        <StatCard label={t.closing} value={<Money value={closing} />} icon={Wallet} accent="gold" />
      </div>

      {lines.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thDate}</th>
              <th className={thClass}>{t.thAccount}</th>
              <th className={thClass}>{t.thParticulars}</th>
              <th className={`${thClass} text-right`}>{t.thDeposit}</th>
              <th className={`${thClass} text-right`}>{t.thWithdrawal}</th>
              <th className={`${thClass} text-right`}>{t.thBalance}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-muted/50 font-semibold">
              <td className={tdClass} colSpan={5}>
                {t.openingRow}
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={opening} />
              </td>
            </tr>
            {lines.map((l, i) => (
              <tr key={i} className="transition hover:bg-muted/40">
                <td className={`${tdClass} whitespace-nowrap`}>{l.date}</td>
                <td className={tdClass}>{l.account}</td>
                <td className={tdClass}>
                  {l.particulars}
                  {l.voucher && <span className="block text-xs text-ink-muted">{l.voucher}</span>}
                </td>
                <td className={`${tdClass} text-right`}>
                  {l.deposit ? <Money value={l.deposit} className="text-emerald-700" /> : ''}
                </td>
                <td className={`${tdClass} text-right`}>
                  {l.withdrawal ? <Money value={l.withdrawal} className="text-red-600" /> : ''}
                </td>
                <td className={`${tdClass} text-right font-medium`}>
                  <Money value={l.balance} />
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-brand-600/40 bg-brand-50/40 font-bold">
              <td className={tdClass} colSpan={3}>
                {t.closingRow}
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={totalDeposit} className="text-emerald-700" />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={totalWithdrawal} className="text-red-600" />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={closing} />
              </td>
            </tr>
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
