/* ------------------------------------------------------------------ *
 *  "Statement for the period" helpers — a plain module (no 'use client')
 *  so server pages, client export buttons and receipts all format the
 *  period line identically.
 * ------------------------------------------------------------------ */

export type StatementPeriod = { from?: string | null; to?: string | null };

const PERIOD_LABELS = {
  en: { period: 'Statement for the period', to: 'to', until: '', beginning: 'Beginning', printedOn: 'Printed on' },
  bn: { period: 'বিবরণীর সময়কাল', to: 'থেকে', until: 'পর্যন্ত', beginning: 'শুরু', printedOn: 'প্রিন্টের তারিখ' },
} as const;

export function fmtStatementDate(d?: string | null): string {
  if (!d) return '';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Local-calendar YYYY-MM-DD for "today". */
export function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

/**
 * "Statement for the period: 01 Jan 2026 to 31 Jan 2026". With no bounds at
 * all the line becomes "Printed on: <today>" (plain lists).
 */
export function formatPeriodLine(period: StatementPeriod | null | undefined, locale: 'en' | 'bn' = 'en'): string {
  const L = PERIOD_LABELS[locale];
  if (!period || (!period.from && !period.to)) return `${L.printedOn}: ${fmtStatementDate(todayIso())}`;
  const from = period.from ? fmtStatementDate(period.from) : L.beginning;
  const to = period.to ? fmtStatementDate(period.to) : fmtStatementDate(todayIso());
  return `${L.period}: ${from} ${L.to} ${to}${L.until ? ` ${L.until}` : ''}`;
}

/**
 * Resolve the period a statement covers: the explicit filter when set,
 * otherwise the first → last date actually present in the rows (so an
 * unfiltered "lifetime" ledger still prints a concrete start and end).
 */
export function resolvePeriod(
  filter: StatementPeriod | null | undefined,
  dates: (string | null | undefined)[],
): StatementPeriod {
  const from = filter?.from || null;
  const to = filter?.to || null;
  if (from && to) return { from, to };
  const sorted = dates.filter((d): d is string => !!d).sort();
  return {
    from: from ?? sorted[0] ?? null,
    to: to ?? (sorted.length ? todayIso() : null),
  };
}
