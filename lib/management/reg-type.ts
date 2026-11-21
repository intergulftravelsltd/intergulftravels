/* ------------------------------------------------------------------ *
 *  Hajj registration type — the pilgrim's state in the national Hajj
 *  system. One list feeds the form, the list filter, the API and every
 *  badge / export, so a new state only has to be added here (and to the
 *  database check constraint, migration 0015).
 * ------------------------------------------------------------------ */

export const REG_TYPES = ['pre-registration', 'registered', 'cancelled', 'archived'] as const;
export type RegType = (typeof REG_TYPES)[number];

export function isRegType(value: unknown): value is RegType {
  return typeof value === 'string' && (REG_TYPES as readonly string[]).includes(value);
}

const LABELS: Record<'en' | 'bn', Record<RegType, string>> = {
  en: {
    'pre-registration': 'Pre-Registered',
    registered: 'Registered',
    cancelled: 'Cancelled',
    archived: 'Archived',
  },
  bn: {
    'pre-registration': 'প্রাক-নিবন্ধিত',
    registered: 'নিবন্ধিত',
    cancelled: 'বাতিল',
    archived: 'আর্কাইভড',
  },
};

/** Compact wording for table badges (only pre-registration is shortened). */
const SHORT: Record<'en' | 'bn', Partial<Record<RegType, string>>> = {
  en: { 'pre-registration': 'Pre-reg' },
  bn: {},
};

/** Display label; an unknown / empty value reads as pre-registration (the column default). */
export function regTypeLabel(value: string | null | undefined, locale: 'en' | 'bn', short = false): string {
  const key: RegType = isRegType(value) ? value : 'pre-registration';
  return (short && SHORT[locale][key]) || LABELS[locale][key];
}

/** Badge colour: registered green, cancelled red, archived muted, pre-registration gold. */
export function regTypeTone(value: string | null | undefined): 'slate' | 'emerald' | 'gold' | 'red' {
  switch (value) {
    case 'registered':
      return 'emerald';
    case 'cancelled':
      return 'red';
    case 'archived':
      return 'slate';
    default:
      return 'gold';
  }
}
