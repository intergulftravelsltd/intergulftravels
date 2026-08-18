'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n';
import type { Dictionary } from '@/lib/dictionaries';

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);
// Filled by the (site) layout with the ACTIVE locale's dictionary only. Keeping
// the dictionary out of this module (type-only import above) keeps the ~50KB
// two-language bundle out of the client JS of every route.
const DictionaryContext = createContext<Dictionary | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Mounted by the (site) server layout, which resolves the dictionary on the
 *  server and passes just the active language down. */
export function DictionaryProvider({ dict, children }: { dict: Dictionary; children: React.ReactNode }) {
  return <DictionaryContext.Provider value={dict}>{children}</DictionaryContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Translations for the active locale, usable in any client component under the (site) tree. */
export function useDictionary(): Dictionary {
  const dict = useContext(DictionaryContext);
  if (!dict) throw new Error('useDictionary() needs <DictionaryProvider> — it is mounted by the (site) layout.');
  return dict;
}
