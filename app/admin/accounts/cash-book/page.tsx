import { Wallet, ArrowDownToLine, ArrowUpFromLine, Landmark } from 'lucide-react';
import { PageHeader, StatCard, Money, Card, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportMenu } from '@/components/manage/ExportMenu';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { VoucherSearch } from '@/components/manage/accounts/VoucherSearch';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { resolvePeriod, formatPeriodLine } from '@/lib/period';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { loadScopedCompanyProfile } from '@/lib/management/company';
import { PrintLetterhead, PrintSignatures } from '@/components/manage/PrintLetterhead';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import { netDebit, type AccountHead, type Transaction } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'ক্যাশ বই' : 'Cash Book' };
}

const L = {
  en: {
    title: 'Cash Book',
    subtitle: 'Cash in hand and the bank accounts as one book — every receipt (debit) and payment (credit) with a running balance.',
    opening: 'Opening balance',
    debits: 'Total debit (money in)',
    credits: 'Total credit (money out)',
    closing: 'Closing balance',
    cash: 'Cash in hand',
    banks: 'Banks',
    overdraft: 'Bank overdraft',
    excluded: 'not included',
    cashBankNow: 'Cash & Bank page now',
    overdraftMoved: 'overdraft movement',
    allAccounts: 'All cash & bank accounts',
    accountFilter: 'Account',
    apply: 'Apply',
    reset: 'Reset',
    searchPlaceholder: 'Search particulars, voucher no, manual no, amount…',
    results: (n: number, m: number) => `Showing ${n} of ${m} entries`,
    noMatchTitle: 'No entries match your search',
    noMatchHint: 'Try a voucher number, a name from the particulars or an amount.',
    thDate: 'Date',
    thAccount: 'Account',
    thVoucher: 'Voucher / Manual No',
    thParticulars: 'Particulars',
    thDebit: 'Debit',
    thCredit: 'Credit',
    thBalance: 'Balance',
    openingRow: 'Opening balance',
    closingRow: 'Closing balance',
    exportLabel: 'Cash book',
    emptyTitle: 'No cash or bank transactions in this period',
    emptyHint: 'Change the date range, or record entries from Daily Entry.',
    noAccounts: 'No cash/bank accounts found',
    noAccountsHint: 'Create your cash and bank account heads first.',
    exportName: 'cash-book',
  },
  bn: {
    title: 'ক্যাশ বই',
    subtitle: 'হ্যান্ড ক্যাশ আর ব্যাংক অ্যাকাউন্টগুলো এক বইয়ে — প্রতিটি জমা (ডেবিট) ও খরচ (ক্রেডিট), চলমান ব্যালেন্সসহ।',
    opening: 'প্রারম্ভিক ব্যালেন্স',
    debits: 'মোট ডেবিট (জমা)',
    credits: 'মোট ক্রেডিট (খরচ)',
    closing: 'সমাপনী ব্যালেন্স',
    cash: 'হ্যান্ড ক্যাশ',
    banks: 'ব্যাংক',
    overdraft: 'ব্যাংক ওভারড্রাফট',
    excluded: 'ধরা হয়নি',
    cashBankNow: 'ক্যাশ ও ব্যাংক পেজে এখন',
    overdraftMoved: 'ওভারড্রাফটের নড়াচড়া',
    allAccounts: 'সব ক্যাশ ও ব্যাংক অ্যাকাউন্ট',
    accountFilter: 'অ্যাকাউন্ট',
    apply: 'দেখুন',
    reset: 'রিসেট',
    searchPlaceholder: 'বিবরণ, ভাউচার নং, ম্যানুয়াল নং, টাকার অঙ্ক… খুঁজুন',
    results: (n: number, m: number) => `${m}টির মধ্যে ${n}টি এন্ট্রি দেখানো হচ্ছে`,
    noMatchTitle: 'খোঁজার সাথে কোনো এন্ট্রি মেলেনি',
    noMatchHint: 'ভাউচার নম্বর, বিবরণের কোনো নাম বা টাকার অঙ্ক দিয়ে খুঁজে দেখুন।',
    thDate: 'তারিখ',
    thAccount: 'অ্যাকাউন্ট',
    thVoucher: 'ভাউচার / ম্যানুয়াল নং',
    thParticulars: 'বিবরণ',
    thDebit: 'ডেবিট',
    thCredit: 'ক্রেডিট',
    thBalance: 'ব্যালেন্স',
    openingRow: 'প্রারম্ভিক ব্যালেন্স',
    closingRow: 'সমাপনী ব্যালেন্স',
    exportLabel: 'ক্যাশ বই',
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

const RANGE_KEYS: RangeKey[] = ['last-30-days', 'this-month', 'last-month', 'this-year', 'last-year', 'lifetime', 'custom'];
const isRangeKey = (v: string | undefined): v is RangeKey => !!v && (RANGE_KEYS as string[]).includes(v);

/** Signed book-opening of an asset head (debit-positive). */
const bookOpening = (h: AccountHead) => Number(h.opening_balance) * (h.opening_is_debit ? 1 : -1);

const ctrl =
  'h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium text-ink shadow-soft focus:border-brand-600/50 focus:outline-none focus:ring-2 focus:ring-brand-600/15';

/**
 * Consolidated Cash Book: cash in hand + the active bank accounts as ONE
 * book. Money entering a liquid account (debited) is a debit; money leaving
 * (credited) is a credit. A cash↔bank contra shows both sides on one row and
 * leaves the running balance untouched.
 *
 * The opening balance follows the Cash & Bank page: cash in hand plus the
 * bank balances, with an overdrawn bank (negative balance) kept out — the
 * same figure that page calls "Liquid Total", as it stood at the start of
 * the period. Filtering to one account shows that account's own book with
 * its real (signed) balance.
 */
export default async function CashBookPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; range?: string; account?: string; q?: string; page?: string; per?: string };
}) {
  const locale = getLocale();
  const t = L[locale];

  // Resolve the window. Explicit from/to wins, a preset computes one, and
  // with nothing chosen the book opens on the last 30 days (not lifetime).
  const rangeKey = isRangeKey(searchParams.range) ? searchParams.range : '';
  let from = searchParams.from ?? '';
  let to = searchParams.to ?? '';
  let activeRange: RangeKey;
  if (rangeKey === 'custom') {
    activeRange = 'custom';
  } else if (rangeKey === 'lifetime') {
    from = '';
    to = '';
    activeRange = 'lifetime';
  } else if (rangeKey) {
    ({ from, to } = presetRange(rangeKey));
    activeRange = rangeKey;
  } else if (from || to) {
    activeRange = 'custom';
  } else {
    ({ from, to } = presetRange('last-30-days'));
    activeRange = 'last-30-days';
  }

  const [scope, company] = await Promise.all([getStaffScope(), loadScopedCompanyProfile()]);
  const db = mgmtDb();

  // Same head set as the Cash & Bank page: active cash/bank heads only (a
  // removed account keeps its old rows but is out of both views).
  let hq = db.from('account_heads').select('*').in('subtype', ['cash', 'bank']).eq('active', true);
  if (scope.branch) hq = hq.eq('branch', scope.branch);
  // Cash first, then the banks by name.
  const { data: headData } = await hq.order('subtype', { ascending: false }).order('name', { ascending: true });
  const allLiquid = (headData ?? []) as AccountHead[];

  if (allLiquid.length === 0) {
    return (
      <>
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <EmptyState title={t.noAccounts} hint={t.noAccountsHint} />
      </>
    );
  }

  // Optional single-account book.
  const selected = allLiquid.find((h) => h.id === searchParams.account) ?? null;
  const pool = selected ? [selected] : allLiquid;
  const poolIds = new Set(pool.map((h) => h.id));
  const nameOf = new Map(pool.map((h) => [h.id, h.name]));
  const ids = Array.from(poolIds);

  // Fetch from `from` onwards only (paged past the 1000-row cap): rows inside
  // the window render the book, and every row from `from` rolls the live
  // (trigger-maintained) head balance back to the period start — so the
  // opening is exact without reading years of history.
  const allTxs: Transaction[] = [];
  for (let off = 0; ; off += 1000) {
    let q = db
      .from('transactions')
      .select('*')
      .or(`debit_account_id.in.(${ids.join(',')}),credit_account_id.in.(${ids.join(',')})`);
    if (from) q = q.gte('date', from);
    const { data, error } = await q
      .order('date', { ascending: true })
      .order('created_at', { ascending: true })
      .range(off, off + 999);
    if (error || !data) break;
    allTxs.push(...(data as Transaction[]));
    if (data.length < 1000) break;
  }

  const inRange = allTxs.filter((tx) => (!from || tx.date >= from) && (!to || tx.date <= to));

  // Per-head balance at the start of the period.
  const flowOf = (headId: string, tx: Transaction) =>
    (tx.debit_account_id === headId ? Number(tx.amount) : 0) - (tx.credit_account_id === headId ? Number(tx.amount) : 0);
  const startBal = new Map<string, number>();
  for (const h of pool) {
    startBal.set(
      h.id,
      from ? netDebit(h) - allTxs.reduce((s, tx) => s + flowOf(h.id, tx), 0) : bookOpening(h),
    );
  }
  const endBal = new Map<string, number>();
  for (const h of pool) {
    endBal.set(h.id, (startBal.get(h.id) ?? 0) + inRange.reduce((s, tx) => s + flowOf(h.id, tx), 0));
  }

  // Cash & Bank page definition: cash + bank balances, overdrawn banks excluded.
  const liquidOf = (bal: Map<string, number>) =>
    pool.reduce((s, h) => {
      const b = bal.get(h.id) ?? 0;
      return s + (h.subtype === 'bank' ? Math.max(0, b) : b);
    }, 0);
  const overdraftOf = (bal: Map<string, number>) =>
    pool.reduce((s, h) => s + (h.subtype === 'bank' && (bal.get(h.id) ?? 0) < 0 ? -(bal.get(h.id) ?? 0) : 0), 0);
  const cashOf = (bal: Map<string, number>) =>
    pool.reduce((s, h) => s + (h.subtype === 'cash' ? bal.get(h.id) ?? 0 : 0), 0);

  const opening = selected ? startBal.get(selected.id) ?? 0 : liquidOf(startBal);
  const openingCash = cashOf(startBal);
  const openingBanks = opening - openingCash;
  const openingOverdraft = overdraftOf(startBal);

  // Names for the non-liquid counterpart heads (fallback particulars).
  const counterpartIds = Array.from(
    new Set(
      inRange.flatMap((tx) => [tx.debit_account_id, tx.credit_account_id]).filter((id) => !poolIds.has(id)),
    ),
  );
  const counterpartNames = new Map<string, string>();
  if (counterpartIds.length) {
    const { data: cps } = await db.from('account_heads').select('id, name').in('id', counterpartIds);
    ((cps ?? []) as { id: string; name: string }[]).forEach((h) => counterpartNames.set(h.id, h.name));
  }

  let running = opening;
  let totalDebit = 0;
  let totalCredit = 0;
  const lines = inRange.map((tx) => {
    const debitIn = poolIds.has(tx.debit_account_id);
    const creditIn = poolIds.has(tx.credit_account_id);
    const amount = Number(tx.amount);
    const debit = debitIn ? amount : 0;
    const credit = creditIn ? amount : 0;
    running += debit - credit;
    totalDebit += debit;
    totalCredit += credit;

    const account =
      debitIn && creditIn
        ? `${nameOf.get(tx.credit_account_id)} ➜ ${nameOf.get(tx.debit_account_id)}`
        : nameOf.get(debitIn ? tx.debit_account_id : tx.credit_account_id) ?? '—';
    const counterpart = counterpartNames.get(debitIn ? tx.credit_account_id : tx.debit_account_id) ?? '';

    return {
      date: fmtDate(tx.date),
      account: scope.branch ? account : `${account} · ${branchShort(tx.branch)}`,
      particulars: tx.narration || counterpart || '—',
      against: counterpart && counterpart !== tx.narration ? counterpart : '',
      voucher: tx.voucher_no ?? '',
      manualRef: tx.manual_ref ?? '',
      debit,
      credit,
      balance: running,
    };
  });
  const closing = running;

  // Where the Cash & Bank page stands at the end of the period. It differs
  // from the book's closing only when an overdrawn bank moved in the period
  // (that movement is a debit/credit here but never part of "cash + banks").
  const closingLiquid = selected ? closing : liquidOf(endBal);
  const overdraftMoved = Math.abs(closingLiquid - closing) >= 0.5 ? closingLiquid - closing : 0;

  const openingHint = selected
    ? undefined
    : `${t.cash} ${money(openingCash)} · ${t.banks} ${money(openingBanks)}` +
      (openingOverdraft > 0.5 ? ` · ${t.overdraft} ${money(openingOverdraft)} (${t.excluded})` : '');
  const closingHint = overdraftMoved
    ? `${t.cashBankNow} ${money(closingLiquid)} (${t.overdraftMoved} ${money(overdraftMoved)})`
    : undefined;

  // Search filters the rendered rows only — balances stay the true running
  // balance of the full book, and the stat cards still describe the period.
  const q = (searchParams.q ?? '').trim().toLowerCase();
  const qDigits = q.replace(/[^\d]/g, '');
  const matches = (l: (typeof lines)[number]) => {
    const hay = `${l.date} ${l.account} ${l.particulars} ${l.against} ${l.voucher} ${l.manualRef}`.toLowerCase();
    if (hay.includes(q)) return true;
    if (qDigits.length >= 2) {
      if ([l.debit, l.credit].some((a) => a && String(Math.round(a)).includes(qDigits))) return true;
      if (`${l.voucher} ${l.manualRef}`.replace(/[^\d]/g, '').includes(qDigits)) return true;
    }
    return false;
  };
  const shown = q ? lines.filter(matches) : lines;
  const shownDebit = shown.reduce((s, l) => s + l.debit, 0);
  const shownCredit = shown.reduce((s, l) => s + l.credit, 0);

  const period = resolvePeriod({ from, to }, inRange.map((tx) => tx.date));
  const periodLine = formatPeriodLine(period, locale);
  const paged = paginate(shown, parsePaging(searchParams, 50));

  const bodyRows = shown.map((l) => [
    l.date,
    l.account,
    [l.manualRef, l.voucher].filter(Boolean).join(' / '),
    l.particulars,
    l.debit ? money(l.debit, false) : '',
    l.credit ? money(l.credit, false) : '',
    money(l.balance, false),
  ]);
  const exportRows = q
    ? bodyRows
    : [
        ['', '', '', t.openingRow, '', '', money(opening, false)],
        ...bodyRows,
        ['', '', '', t.closingRow, money(totalDebit, false), money(totalCredit, false), money(closing, false)],
      ];
  const exportSubtitle = q
    ? `"${searchParams.q?.trim()}" · ${t.results(shown.length, lines.length)} · ${t.thDebit} ${money(shownDebit)} · ${t.thCredit} ${money(shownCredit)}`
    : `${t.opening}: ${money(opening)} · ${t.closing}: ${money(closing)}`;

  return (
    <div id="doc-report">
      <PrintLetterhead company={company} locale={locale} title={t.title} period={periodLine} />
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
        title={selected ? `${t.title} — ${selected.name}` : t.title}
        subtitle={`${t.subtitle} ${periodLine}`}
        actions={
          <div className="no-print">
            <ExportMenu
              sets={[
                {
                  key: 'cash-book',
                  label: t.exportLabel,
                  filename: `${t.exportName}-${from || 'start'}-${to || 'now'}`,
                  title: selected ? `${t.title} — ${selected.name}` : t.title,
                  subtitle: exportSubtitle,
                  period,
                  headers: [t.thDate, t.thAccount, t.thVoucher, t.thParticulars, t.thDebit, t.thCredit, t.thBalance],
                  rows: exportRows,
                  orientation: 'l',
                },
              ]}
            />
          </div>
        }
      />

      {/* One filter row: period pill · account · apply / reset. The pill writes
          from/to/range into the URL itself; the form carries them as hidden
          fields so changing the account keeps the chosen period. */}
      <Card className="no-print mb-5 !p-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <VoucherSearch initial={searchParams.q ?? ''} placeholder={t.searchPlaceholder} />
          <DateRangeFilter from={from} to={to} range={activeRange} />
          {from && <input type="hidden" name="from" value={from} />}
          {to && <input type="hidden" name="to" value={to} />}
          <input type="hidden" name="range" value={activeRange} />
          <select name="account" defaultValue={selected?.id ?? ''} className={ctrl} aria-label={t.accountFilter}>
            <option value="">{t.allAccounts}</option>
            {allLiquid.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t.apply}
          </button>
          <a
            href={localizedPath(locale, '/admin/accounts/cash-book')}
            className="grid h-10 place-items-center rounded-xl border border-border px-4 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40"
          >
            {t.reset}
          </a>
        </form>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.opening} value={<Money value={opening} />} icon={Landmark} accent="slate" hint={openingHint} />
        <StatCard label={t.debits} value={<Money value={totalDebit} />} icon={ArrowDownToLine} accent="emerald" />
        <StatCard label={t.credits} value={<Money value={totalCredit} />} icon={ArrowUpFromLine} accent="red" />
        <StatCard label={t.closing} value={<Money value={closing} />} icon={Wallet} accent="gold" hint={closingHint} />
      </div>

      {q && shown.length > 0 && (
        <p className="no-print mb-3 text-sm text-ink-muted">
          {t.results(shown.length, lines.length)} · {t.thDebit}{' '}
          <span className="font-semibold text-emerald-700">{money(shownDebit)}</span> · {t.thCredit}{' '}
          <span className="font-semibold text-red-600">{money(shownCredit)}</span>
        </p>
      )}

      {lines.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : shown.length === 0 ? (
        <EmptyState title={t.noMatchTitle} hint={t.noMatchHint} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thDate}</th>
              <th className={thClass}>{t.thAccount}</th>
              <th className={thClass}>{t.thParticulars}</th>
              <th className={`${thClass} text-right`}>{t.thDebit}</th>
              <th className={`${thClass} text-right`}>{t.thCredit}</th>
              <th className={`${thClass} text-right`}>{t.thBalance}</th>
            </tr>
          </thead>
          <tbody>
            {!q && paged.isFirst && (
              <tr className="bg-muted/50 font-semibold">
                <td className={tdClass} colSpan={5}>
                  {t.openingRow}
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={opening} />
                </td>
              </tr>
            )}
            {paged.items.map((l, i) => (
              <tr key={i} className="transition hover:bg-muted/40">
                <td className={`${tdClass} whitespace-nowrap`}>{l.date}</td>
                <td className={tdClass}>
                  <span className="font-medium text-ink">{l.account}</span>
                  {(l.manualRef || l.voucher) && (
                    <span className="block text-xs text-ink-muted">
                      {l.manualRef && <span className="font-semibold text-ink">{l.manualRef}</span>}
                      {l.manualRef && l.voucher && ' · '}
                      {l.voucher}
                    </span>
                  )}
                </td>
                <td className={tdClass}>
                  {l.particulars}
                  {l.against && <span className="block text-xs text-ink-muted">{l.against}</span>}
                </td>
                <td className={`${tdClass} text-right`}>
                  {l.debit ? <Money value={l.debit} className="text-emerald-700" /> : ''}
                </td>
                <td className={`${tdClass} text-right`}>
                  {l.credit ? <Money value={l.credit} className="text-red-600" /> : ''}
                </td>
                <td className={`${tdClass} text-right font-medium`}>
                  <Money value={l.balance} />
                </td>
              </tr>
            ))}
            {!q && paged.isLast && (
              <tr className="border-t-2 border-brand-600/40 bg-brand-50/40 font-bold">
                <td className={tdClass} colSpan={3}>
                  {t.closingRow}
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={totalDebit} className="text-emerald-700" />
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={totalCredit} className="text-red-600" />
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={closing} />
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      )}
      <div className="no-print">
        <Pagination paged={paged} />
      </div>
      <PrintSignatures locale={locale} company={company} />
    </div>
  );
}
