/* ------------------------------------------------------------------ *
 *  Bangladeshi mobile numbers for the SMS gateway. Staff type numbers in
 *  every shape — 01712345678, +880 1712-345678, 8801712345678 — and the
 *  gateway wants exactly 8801XXXXXXXXX. Plain module (client + server).
 * ------------------------------------------------------------------ */

const BD_MOBILE = /^8801[3-9]\d{8}$/;

/** "01712-345678" / "+880 1712 345678" / "8801712345678" → "8801712345678", else null. */
export function normalizeBdPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00880')) d = d.slice(2);
  if (d.length === 13 && d.startsWith('880')) {
    // already international
  } else if (d.length === 11 && d.startsWith('0')) {
    d = `88${d}`;
  } else if (d.length === 10 && d.startsWith('1')) {
    d = `880${d}`;
  } else {
    return null;
  }
  return BD_MOBILE.test(d) ? d : null;
}

/** "8801712345678" → "01712345678" for display. */
export function formatBdPhone(n: string | null | undefined): string {
  if (!n) return '';
  return n.startsWith('880') && n.length === 13 ? `0${n.slice(3)}` : n;
}

/** Split a pasted list (commas, semicolons, newlines, spaces) into numbers. */
export function parsePhoneList(text: string): { raw: string; to: string | null }[] {
  const seen = new Set<string>();
  const out: { raw: string; to: string | null }[] = [];
  for (const part of text.split(/[\n,;]+|\s{2,}/)) {
    const raw = part.trim();
    if (!raw) continue;
    const to = normalizeBdPhone(raw);
    const key = to ?? raw;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ raw, to });
  }
  return out;
}
