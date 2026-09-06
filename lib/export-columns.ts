/* ------------------------------------------------------------------ *
 *  Column selection for exports — staff pick which columns a list
 *  prints (e.g. only Name, Phone, Tracking No.) and can prepend a
 *  serial-number column. Plain module (no 'use client') so the client
 *  export buttons and any server helper share the same maths.
 * ------------------------------------------------------------------ */

type Cell = string | number | null | undefined;

export type ColumnSelection = {
  /** One flag per header, in header order. */
  picked: boolean[];
  /** Prepend a "#" serial column (1..N). */
  serial: boolean;
};

export function defaultSelection(count: number): ColumnSelection {
  return { picked: Array.from({ length: count }, () => true), serial: false };
}

export function allPicked(sel: ColumnSelection): boolean {
  return sel.picked.every(Boolean) && !sel.serial;
}

export function pickedCount(sel: ColumnSelection): number {
  return sel.picked.filter(Boolean).length;
}

/** Toggle one column, never letting the last picked column be removed. */
export function toggleColumn(sel: ColumnSelection, index: number): ColumnSelection {
  const picked = [...sel.picked];
  if (picked[index] && pickedCount(sel) <= 1) return sel;
  picked[index] = !picked[index];
  return { ...sel, picked };
}

/** Apply the selection to headers + rows (rows are arrays in header order). */
export function applyColumnSelection(
  headers: string[],
  rows: Cell[][],
  sel: ColumnSelection | null | undefined,
  serialLabel = '#',
): { headers: string[]; rows: Cell[][] } {
  if (!sel || sel.picked.length !== headers.length) return { headers, rows };
  const keep = sel.picked.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const outHeaders = keep.map((i) => headers[i]);
  const outRows = rows.map((r) => keep.map((i) => r[i]));
  if (!sel.serial) return { headers: outHeaders, rows: outRows };
  return {
    headers: [serialLabel, ...outHeaders],
    rows: outRows.map((r, n) => [n + 1, ...r]),
  };
}

/* ---- remember the choice per list (browser only) ---------------------- */

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function selectionStorageKey(headers: string[]): string {
  return `export-cols:${hash(headers.join('|'))}`;
}

export function loadSelection(headers: string[]): ColumnSelection | null {
  try {
    const raw = window.localStorage.getItem(selectionStorageKey(headers));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ColumnSelection>;
    if (!Array.isArray(parsed.picked) || parsed.picked.length !== headers.length) return null;
    const sel = { picked: parsed.picked.map(Boolean), serial: Boolean(parsed.serial) };
    return pickedCount(sel) > 0 ? sel : null;
  } catch {
    return null;
  }
}

export function saveSelection(headers: string[], sel: ColumnSelection): void {
  try {
    if (allPicked(sel)) window.localStorage.removeItem(selectionStorageKey(headers));
    else window.localStorage.setItem(selectionStorageKey(headers), JSON.stringify(sel));
  } catch {
    // storage unavailable — the choice just lives for this page view
  }
}
