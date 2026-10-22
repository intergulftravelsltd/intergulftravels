import { Toaster } from 'sonner';
import { TopProgress } from '@/components/layout/TopProgress';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { fontClassName } from '@/lib/fonts';
import type { Locale } from '@/lib/i18n';

/** Origin of the Supabase project (for image preconnect), if configured. */
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : null;
  } catch {
    return null;
  }
})();

/**
 * The <html>/<body> shell shared by every root layout (public site, admin,
 * share page): fonts, locale context, progress bar and toasts. On the Bangla
 * version the sans + display font variables point at the Bengali face so
 * every existing `font-sans` / `font-display` class renders Bangla correctly.
 */
export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const fontOverride =
    locale === 'bn'
      ? ({ ['--font-sans']: 'var(--font-bengali)', ['--font-display']: 'var(--font-bengali)' } as React.CSSProperties)
      : undefined;

  return (
    <html lang={locale} className={fontClassName} style={fontOverride}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <TopProgress />
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '0.9rem', border: '1px solid rgb(224 220 206)' },
          }}
        />
      </body>
    </html>
  );
}
