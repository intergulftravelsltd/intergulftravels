import { cache } from 'react';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

/* ------------------------------------------------------------------ *
 *  Server-side locale.
 *
 *  Public site: the locale is part of the route (app/(site)/[locale]) and
 *  the site layout stores it for the request with setRequestLocale(), so
 *  every server component below can call getLocale() WITHOUT touching
 *  headers() — which is what lets those pages be statically generated.
 *
 *  Admin / share pages: no [locale] segment; the middleware sets the
 *  x-locale header and getLocale() falls back to it (those pages are
 *  dynamic anyway).
 * ------------------------------------------------------------------ */

const requestLocale = cache(() => ({ locale: null as Locale | null }));

/** Called once by the site [locale] layout, before anything else renders. */
export function setRequestLocale(locale: Locale): void {
  requestLocale().locale = locale;
}

/** A route param → Locale (unknown values fall back to the default). */
export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Active locale for the current request. */
export function getLocale(): Locale {
  const stored = requestLocale().locale;
  if (stored) return stored;
  try {
    const value = headers().get('x-locale');
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}
