/* ------------------------------------------------------------------ *
 *  Cell model shared by every Excel / PDF / Print export.
 *
 *  A cell is usually a plain string / number. A `RichCell` adds light
 *  styling the office reads at a glance — a bold, coloured name for a
 *  group member, a small note under a value ("Group head · 3 members") —
 *  and still exports cleanly as text where styling is impossible (Excel).
 *  Plain module (no 'use client') so server pages can build rich rows.
 * ------------------------------------------------------------------ */

export type CellTone = 'brand' | 'amber' | 'red' | 'muted';

export type RichCell = {
  v: string | number | null | undefined;
  bold?: boolean;
  tone?: CellTone;
  /** Secondary line printed under the value in HTML / PDF, in brackets in Excel. */
  note?: string;
};

export type Cell = string | number | null | undefined | RichCell;

export function isRichCell(c: Cell): c is RichCell {
  return typeof c === 'object' && c !== null;
}

export function cellValue(c: Cell): string | number | null | undefined {
  return isRichCell(c) ? c.v : c;
}

/** The cell's main text ('' for empty). */
export function cellText(c: Cell): string {
  const v = cellValue(c);
  return v == null ? '' : String(v);
}

/** Main text with the note folded in — for plain-text targets (Excel). */
export function cellFlatText(c: Cell): string {
  const text = cellText(c);
  if (!isRichCell(c) || !c.note) return text;
  return text ? `${text} (${c.note})` : c.note;
}

const NUM_RE = /^-?\d+(\.\d+)?$/;

/**
 * Numeric value of a cell: 1200, "1,60,000", "2,500 Dr" → number;
 * any other text ("Group with Abul Hossain", "—") → null. Digit strings with
 * a leading zero ("01712345678", "0011") are phone numbers / codes, not amounts.
 */
export function cellNumber(c: Cell): number | null {
  const v = cellValue(c);
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  const s = String(v)
    .trim()
    .replace(/\s?(Dr|Cr)$/i, '')
    .replace(/[,\s]/g, '');
  if (!s || !NUM_RE.test(s)) return null;
  if (/^-?0\d/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** True when the cell prints right-aligned (money / counts). */
export function cellIsNumeric(c: Cell): boolean {
  const text = cellText(c).trim();
  return !!text && cellNumber(c) !== null;
}

/**
 * The totals line printed under a list: one sum per header named in
 * `totalsFor` (matched by header text so a Columns-picker reorder or a
 * dropped column never breaks it), the label in the first other column.
 * Text cells ("Group with …") simply count as zero. Null when nothing to sum.
 */
export function buildTotalsRow(
  headers: string[],
  rows: Cell[][],
  totalsFor: string[] | null | undefined,
  label: string,
  format: (n: number) => string,
): Cell[] | null {
  if (!totalsFor?.length) return null;
  const sumIdx = headers.map((h, i) => (totalsFor.includes(h) ? i : -1)).filter((i) => i >= 0);
  if (!sumIdx.length) return null;
  const sums = new Map<number, number>();
  for (const i of sumIdx) sums.set(i, rows.reduce((s, r) => s + (cellNumber(r[i]) ?? 0), 0));
  const labelIdx = headers.findIndex((_, i) => !sums.has(i));
  return headers.map((_, i) => {
    if (sums.has(i)) return { v: format(sums.get(i) ?? 0), bold: true } satisfies RichCell;
    if (i === labelIdx) return { v: label, bold: true } satisfies RichCell;
    return '';
  });
}
