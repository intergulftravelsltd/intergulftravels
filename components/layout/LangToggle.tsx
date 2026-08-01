'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from '@/components/providers/LocaleProvider';
import { localizedPath, stripLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * EN / BN switch. Swaps to the same page in the other language version.
 *
 * Uses a plain full-page navigation (a real <a>, not next/link) on purpose:
 * /bn/* is served via a middleware rewrite onto the same underlying route as
 * the English version, so a soft client navigation would hit Next's router
 * cache and keep showing the old language. A hard navigation forces the server
 * to re-render in the chosen locale (fonts, <html lang> and all text included).
 */
export function LangToggle({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const locale = useLocale();
  const pathname = usePathname() || '/';
  const base = stripLocale(pathname); // path without the /bn prefix

  const items: { code: 'bn' | 'en'; label: string; href: string }[] = [
    { code: 'bn', label: 'BN', href: localizedPath('bn', base) },
    { code: 'en', label: 'EN', href: localizedPath('en', base) },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full p-0.5',
        tone === 'dark' ? 'border border-border bg-card' : 'border border-white/20 bg-white/10',
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {items.map((it) => {
        const active = locale === it.code;
        return (
          <a
            key={it.code}
            href={it.href}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition',
              active
                ? 'bg-brand-600 text-white shadow-emerald'
                : tone === 'dark'
                  ? 'text-ink-muted hover:text-brand-700'
                  : 'text-white/70 hover:text-white',
            )}
          >
            {it.label}
          </a>
        );
      })}
    </div>
  );
}
