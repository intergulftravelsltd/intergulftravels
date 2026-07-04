/**
 * The document checkpoints tracked per pilgrim (biometric, passport, visa,
 * medical, vaccine card). Stored as a Postgres text[] `doc_status` column on
 * both hajj_pilgrims and umrah_passengers, so a pilgrim can have any subset of
 * them "done" — and the list pages can filter by how many are complete.
 *
 * One source of truth for the keys, order and bilingual labels (mirrors the
 * `branches.ts` pattern), used by the entry forms, the status control and the
 * list badges/filters alike.
 */

export const DOC_STATUS_KEYS = [
  'biometric',
  'passport_original',
  'visa_ok',
  'medical_done',
  'vaccine_card',
] as const;

export type DocStatusKey = (typeof DOC_STATUS_KEYS)[number];

export const DOC_STATUS_TOTAL = DOC_STATUS_KEYS.length;

const LABELS: Record<DocStatusKey, { en: string; bn: string }> = {
  biometric: { en: 'Biometric / Fingerprint', bn: 'বায়োমেট্রিক / ফিঙ্গারপ্রিন্ট' },
  passport_original: { en: 'Passport (original)', bn: 'পাসপোর্ট (মূল কপি)' },
  visa_ok: { en: 'Visa OK', bn: 'ভিসা সম্পন্ন' },
  medical_done: { en: 'Medical done', bn: 'মেডিকেল সম্পন্ন' },
  vaccine_card: { en: 'Vaccine card', bn: 'ভ্যাকসিন কার্ড' },
};

export function docStatusLabel(key: DocStatusKey, locale: 'en' | 'bn'): string {
  return LABELS[key]?.[locale] ?? key;
}

/** Coerce an unknown DB value (text[] / json / null) into valid, ordered keys. */
export function normalizeDocStatus(value: unknown): DocStatusKey[] {
  if (!Array.isArray(value)) return [];
  return DOC_STATUS_KEYS.filter((k) => value.includes(k));
}

/** How many checkpoints are done (0..DOC_STATUS_TOTAL). */
export function docStatusDone(value: unknown): number {
  return normalizeDocStatus(value).length;
}
