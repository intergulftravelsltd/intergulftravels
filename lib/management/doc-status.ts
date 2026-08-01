/**
 * The document checkpoints tracked per pilgrim, in Hajj-process order — from
 * pre-registration through visa, ticket and the final passport/visa/ticket
 * handover. Stored as a Postgres text[] `doc_status` column on both
 * hajj_pilgrims and umrah_passengers, so a pilgrim can have any subset of
 * them "done" — and the list pages can filter by how many are complete.
 *
 * One source of truth for the keys, order and bilingual labels (mirrors the
 * `branches.ts` pattern), used by the entry forms, the status control, the
 * eye-icon checklist viewer and the list badges/filters alike.
 */

export const DOC_STATUS_KEYS = [
  'pre_registration',
  'main_registration',
  'passport_original',
  'photo',
  'nid_copy',
  'biometric',
  'bank_payment',
  'medical_done',
  'vaccine_card',
  'visa_ok',
  'ticket_done',
  'training_done',
  'hotel_confirmed',
  'handover_done',
] as const;

export type DocStatusKey = (typeof DOC_STATUS_KEYS)[number];

export const DOC_STATUS_TOTAL = DOC_STATUS_KEYS.length;

const LABELS: Record<DocStatusKey, { en: string; bn: string }> = {
  pre_registration: { en: 'Pre-registration', bn: 'প্রাক-নিবন্ধন' },
  main_registration: { en: 'Main registration', bn: 'মূল নিবন্ধন' },
  passport_original: { en: 'Passport (original)', bn: 'পাসপোর্ট (মূল কপি)' },
  photo: { en: 'Photo', bn: 'ছবি' },
  nid_copy: { en: 'NID copy', bn: 'এনআইডি কপি' },
  biometric: { en: 'Biometric / Fingerprint', bn: 'বায়োমেট্রিক / ফিঙ্গারপ্রিন্ট' },
  bank_payment: { en: 'Bank payment', bn: 'ব্যাংকে টাকা জমা' },
  medical_done: { en: 'Medical done', bn: 'মেডিকেল সম্পন্ন' },
  vaccine_card: { en: 'Vaccine card', bn: 'টিকা / ভ্যাকসিন কার্ড' },
  visa_ok: { en: 'Visa OK', bn: 'ভিসা সম্পন্ন' },
  ticket_done: { en: 'Air ticket', bn: 'বিমান টিকিট' },
  training_done: { en: 'Hajj training', bn: 'হজ প্রশিক্ষণ' },
  hotel_confirmed: { en: 'Hotel / house confirmed', bn: 'হোটেল / বাসা কনফার্ম' },
  handover_done: { en: 'Passport-visa-ticket handover', bn: 'পাসপোর্ট-ভিসা-টিকিট হস্তান্তর' },
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
