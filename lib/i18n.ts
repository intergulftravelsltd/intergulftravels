/**
 * Client-safe i18n config. The site has TWO separate versions, both
 * server-rendered (no client text-swapping):
 *   • English → default, no URL prefix  (e.g. /hajj)
 *   • Bangla  → /bn prefix              (e.g. /bn/hajj)
 * `getLocale()` (server-only, reads the middleware header) lives in
 * `lib/i18n-server.ts` so this file stays importable from client components.
 */
export const LOCALES = ['bn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'bn' || value === 'en';
}

/** Prefix an internal path for the given locale. en → as-is, bn → /bn/... */
export function localizedPath(locale: Locale, path: string): string {
  // Leave external links, anchors, tel/mailto and already-prefixed paths alone.
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  if (locale === 'bn') {
    if (path === '/') return '/bn';
    return path.startsWith('/bn/') || path === '/bn' ? path : `/bn${path}`;
  }
  return path;
}

/** Strip the /bn prefix from a path (for building the "other locale" URL). */
export function stripLocale(path: string): string {
  if (path === '/bn') return '/';
  if (path.startsWith('/bn/')) return path.slice(3);
  return path;
}
