import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarRange } from 'lucide-react';
import { PageHeader, StatCard, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { DateRangeFilter } from '@/components/manage/DateRangeFilter';
import { loadHead, loadActiveHeads, loadTransactions, headMap, headName } from '@/lib/management/accounts-data';
import { isDebitNormal } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { formatPeriodLine, resolvePeriod } from '@/lib/period';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';

const TYPE_LABEL_KEY: Record<string, keyof ReturnType<typeof getDict>['typeLabels']> = {
  receipt: 'receipt',
  income: 'income',
  payment: 'payment',
  expense: 'expense',
  contra: 'contra',
  journal: 'journal',
};

type SP = { from?: string; to?: string; range?: string };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const head = await loadHead(params.id);
  const t = getDict(getLocale());
  return { title: head ? `${head.name} · ${t.ledger.ledgerSuffix}` : t.ledger.accountLedger };
}

/**
 * Account-head ledger / statement. Every entry that touched the head, with the
 * counter-account ("Against"), the FULL narration, both voucher numbers (auto +
 * hand-written) and a running balance. A date window turns it into a proper
 * period statement: entries before the window roll into the brought-forward
 * opening, and the export prints "Statement for the period: … to …".
 */
export default async function AccountLedgerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SP;
}) {
  const locale = getLocale();
  const t = getDict(locale);

  // Resolve the window: explicit from/to wins; presets compute one; default = lifetime.
  const rangeKey = (searchParams.range ?? '') as RangeKey | '';
  let from = searchParams.from ?? '';
  let to = searchParams.to ?? '';
  if (rangeKey && rangeKey !== 'custom' && rangeKey !== 'lifetime') ({ from, to } = presetRange(rangeKey));
  else if (rangeKey === 'lifetime') ({ from, to } = { from: '', to: '' });

  const [head, allHeads, txns] = await Promise.all([
    loadHead(params.id),
    loadActiveHeads(),
    loadTransactions({ accountId: params.id, limit: 5000 }),
  ]);
  if (!head) notFound();
  const map = headMap(allHeads);

  // Oldest → newest for the running balance walk.
  const ordered = [...txns].sort((a, b) => {
    if (a.date === b.date) return a.created_at.localeCompare(b.created_at);
    return a.date.localeCompare(b.date);
  });

  const debitNormal = isDebitNormal(head.type);
  const openingSigned = Number(head.opening_balance) * (head.opening_is_debit ? 1 : -1);

  // Walk the ledger keeping a signed net-debit running figure; display it on the
  // account's natural side (positive = the side this account normally sits on).
  // Entries dated before `from` fold into the brought-forward opening.
  let running = openingSigned;
  let broughtForward = openingSigned;
  let totalDebit = 0;
  let totalCredit = 0;

  const rows: {
    id: string;
    date: string;
    voucher: string;
    manualRef: string;
    type: string;
    contra: string;
    narration: string;
    debit: number;
    credit: number;
    balance: number;
  }[] = [];

  for (const tx of ordered) {
    const isDebit = tx.debit_account_id === params.id;
    const amount = Number(tx.amount);
    if (from && tx.date < from) {
      running += isDebit ? amount : -amount;
      broughtForward = running;
      continue;
    }
    if (to && tx.date > to) continue;
    if (isDebit) {
      running += amount;
      totalDebit += amount;
    } else {
      running -= amount;
      totalCredit += amount;
    }
    const contraId = isDebit ? tx.credit_account_id : tx.debit_account_id;
    rows.push({
      id: tx.id,
      date: tx.date,
      voucher: tx.voucher_no ?? '—',
      manualRef: tx.manual_ref ?? '',
      type: tx.type,
      contra: headName(map, contraId),
      narration: tx.narration ?? '',
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      balance: debitNormal ? running : -running,
    });
  }

  const openingNatural = debitNormal ? broughtForward : -broughtForward;
  const closingNatural = debitNormal ? running : -running;
  const sideLabel = debitNormal ? 'Dr' : 'Cr';
  const openingLabel = from ? t.ledger.openingAsOf : t.ledger.openingBalance;

  const period = resolvePeriod({ from, to }, ordered.map((x) => x.date));
  const periodText = formatPeriodLine(period, locale);

  const typeLabel = (type: string) => t.typeLabels[TYPE_LABEL_KEY[type]] ?? type;

  const exportRows = [
    ['', '', '', '', openingLabel, '', '', '', money(Math.abs(openingNatural), false)],
    ...rows.map((r) => [
      r.date,
      r.voucher,
      r.manualRef,
      typeLabel(r.type),
      r.contra,
      r.narration,
      r.debit ? money(r.debit, false) : '',
      r.credit ? money(r.credit, false) : '',
      money(Math.abs(r.balance), false),
    ]),
    [
      '',
      '',
      '',
      '',
      t.ledger.totals,
      '',
      money(totalDebit, false),
      money(totalCredit, false),
      `${money(Math.abs(closingNatural), false)} ${sideLabel}`,
    ],
  ];

  return (
    <>
      <Link
        href={localizedPath(locale, '/admin/accounts/heads')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t.ledger.allAccountHeads}
      </Link>

      <PageHeader
        title={head.name}
        subtitle={`${head.code ? head.code + ' · ' : ''}${head.type} · ${head.subtype} · ${branchShort(head.branch)}`}
        actions={
          rows.length > 0 || from || to ? (
            <ExportBar
              filename={`ledger-${head.code ?? head.name}${from ? `-${from}` : ''}${to ? `-${to}` : ''}`}
              title={`${t.ledger.ledgerExportTitle} — ${head.name}`}
              subtitle={`${t.ledger.closingBalance}: ${money(Math.abs(closingNatural))} ${sideLabel}`}
              period={period}
              orientation="l"
              headers={[
                t.ledger.exHDate,
                t.ledger.exHVoucher,
                t.ledger.exHManualRef,
                t.ledger.exHType,
                t.ledger.exHAgainst,
                t.ledger.exHNarration,
                t.ledger.exHDebit,
                t.ledger.exHCredit,
                t.ledger.exHBalance,
              ]}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <DateRangeFilter from={searchParams.from ?? ''} to={searchParams.to ?? ''} range={searchParams.range ?? ''} />
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
          <CalendarRange className="h-4 w-4 text-brand-700" /> {periodText}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label={from ? t.ledger.openingAsOf : t.ledger.opening} value={<Money value={Math.abs(openingNatural)} />} accent="slate" />
        <StatCard label={t.ledger.totalDebit} value={<Money value={totalDebit} />} accent="emerald" />
        <StatCard label={t.ledger.totalCredit} value={<Money value={totalCredit} />} accent="gold" />
        <StatCard
          label={`${t.ledger.closing} (${sideLabel})`}
          value={<Money value={Math.abs(closingNatural)} />}
          accent={closingNatural < 0 ? 'red' : 'emerald'}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.ledger.noMovementsTitle}
          hint={t.ledger.noMovementsHint}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.ledger.thDate}</th>
              <th className={thClass}>{t.ledger.thVoucher}</th>
              <th className={thClass}>{t.ledger.thManualRef}</th>
              <th className={thClass}>{t.ledger.thType}</th>
              <th className={thClass}>{t.ledger.thAgainst}</th>
              <th className={thClass}>{t.ledger.thNarration}</th>
              <th className={`${thClass} text-right`}>{t.ledger.thDebit}</th>
              <th className={`${thClass} text-right`}>{t.ledger.thCredit}</th>
              <th className={`${thClass} text-right`}>{t.ledger.thBalance}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-muted/40">
              <td className={tdClass} colSpan={6}>
                <span className="font-semibold text-ink">{openingLabel}</span>
              </td>
              <td className={tdClass} />
              <td className={tdClass} />
              <td className={`${tdClass} text-right font-semibold tabular-nums`}>
                {money(Math.abs(openingNatural))}
              </td>
            </tr>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${tdClass} whitespace-nowrap`}>{r.date}</td>
                <td className={`${tdClass} whitespace-nowrap font-mono text-xs`}>{r.voucher}</td>
                <td className={`${tdClass} whitespace-nowrap font-mono text-xs`}>{r.manualRef || '—'}</td>
                <td className={tdClass}>
                  <Badge tone="slate">{typeLabel(r.type)}</Badge>
                </td>
                <td className={tdClass}>{r.contra}</td>
                <td className={`${tdClass} min-w-[14rem] max-w-[24rem] text-ink-muted`}>{r.narration || '—'}</td>
                <td className={`${tdClass} text-right tabular-nums`}>{r.debit ? money(r.debit) : '—'}</td>
                <td className={`${tdClass} text-right tabular-nums`}>{r.credit ? money(r.credit) : '—'}</td>
                <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(Math.abs(r.balance))}</td>
              </tr>
            ))}
            <tr className="bg-muted/60">
              <td className={`${tdClass} font-semibold`} colSpan={6}>
                {t.ledger.totals}
              </td>
              <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(totalDebit)}</td>
              <td className={`${tdClass} text-right font-semibold tabular-nums`}>{money(totalCredit)}</td>
              <td className={`${tdClass} text-right font-bold tabular-nums`}>
                {money(Math.abs(closingNatural))} {sideLabel}
              </td>
            </tr>
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
