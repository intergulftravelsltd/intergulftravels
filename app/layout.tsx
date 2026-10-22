import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, Noto_Sans_Bengali } from 'next/font/google';
import { Toaster } from 'sonner';
import { siteConfig } from '@/lib/site';
import { getBaseUrl } from '@/lib/utils';
import { getLocale } from '@/lib/i18n-server';
import { LocaleProvider } from '@/components/providers/LocaleProvider';
import { TopProgress } from '@/components/layout/TopProgress';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

// Bengali typeface — Noto Sans Bengali across the whole site: the Bangla
// version uses it for everything, and the English version falls back to it
// for any Bangla glyphs (names in Bangla, ৳) via the Tailwind font stacks.
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
});

/** Origin of the Supabase project (for image preconnect), if configured. */
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : null;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${siteConfig.name} — Trusted Hajj & Umrah since 2002`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'Hajj packages Bangladesh',
    'Umrah packages Dhaka',
    'Inter Gulf Travels',
    'Hajj agency Bangladesh',
    'Umrah agency Dhaka',
    'Saudi visa Bangladesh',
    'air ticket Dhaka',
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.legalName,
  applicationName: siteConfig.name,
  category: 'travel',
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/feed.xml', title: `${siteConfig.name} — Blog` }] },
  },
  formatDetection: { telephone: true, email: true, address: true },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    url: getBaseUrl(),
    title: `${siteConfig.name} — Trusted Hajj & Umrah since 2002`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    locale: 'en_GB',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Inter Gulf Travels Ltd — Hajj & Umrah' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  themeColor: '#06402b',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  // On the Bangla version, point the sans + display font vars at the Bengali
  // typeface so every existing `font-sans`/`font-display` class renders Bangla
  // correctly — without touching individual components.
  const fontOverride =
    locale === 'bn'
      ? ({ ['--font-sans']: 'var(--font-bengali)', ['--font-display']: 'var(--font-bengali)' } as React.CSSProperties)
      : undefined;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} ${notoSansBengali.variable}`}
      style={fontOverride}
    >
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
