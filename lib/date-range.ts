/* ------------------------------------------------------------------ *
 *  Date-range presets shared by the (server) pages and the (client)
 *  DateRangeFilter. Kept in a plain module — NOT a 'use client' file —
 *  so server components can call presetRange() directly.
 * ------------------------------------------------------------------ */

export type RangeKey = 'last-30-days' | 'this-month' | 'last-month' | 'this-year' | 'last-year' | 'lifetime' | 'custom';

/** Local-calendar YYYY-MM-DD (avoids the UTC shift of toISOString). */
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** from/to for a preset (empty strings mean "no bound" → lifetime/custom). */
export function presetRange(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'last-30-days':
      return { from: iso(new Date(y, m, now.getDate() - 29)), to: iso(now) };
    case 'this-month':
      return { from: iso(new Date(y, m, 1)), to: iso(now) };
    case 'last-month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'this-year':
      return { from: iso(new Date(y, 0, 1)), to: iso(now) };
    case 'last-year':
      return { from: iso(new Date(y - 1, 0, 1)), to: iso(new Date(y - 1, 11, 31)) };
    default:
      return { from: '', to: '' };
  }
}
