import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import SmoothScroll from '@/components/providers/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgress } from '@/components/effects/ScrollProgress';
import { ScrollToTop } from '@/components/effects/ScrollToTop';
import { WhatsAppFloat } from '@/components/effects/WhatsAppFloat';
import { DictionaryProvider } from '@/components/providers/LocaleProvider';
import { RootShell } from '@/components/layout/RootShell';
import { getDictionary } from '@/lib/dictionaries';
import { LOCALES, isLocale } from '@/lib/i18n';
import { setRequestLocale } from '@/lib/i18n-server';
import { getHeaderMenu } from '@/lib/menu';
import { siteConfig } from '@/lib/site';
import { getBaseUrl } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  Root layout of the public site. The locale is a route segment
 *  (app/(site)/[locale]) so every page is generated statically for both
 *  languages at build time and served from the CDN; ISR refreshes a page
 *  5 minutes after an admin edit. URLs stay / (English) and /bn/… (Bangla)
 *  — the middleware maps them onto the [locale] segment.
 * ------------------------------------------------------------------ */

export const revalidate = 300;
// Unknown locale strings are rejected by the isLocale() check below (404), so
// dynamicParams stays at its default: posts published after the last build
// still render on first visit and are then cached.

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

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

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  // Every server component below (pages, Navbar, Footer, …) reads this via
  // getLocale() without touching request headers — keeps the site static.
  setRequestLocale(locale);

  // Admin-managed header menu, or null → Navbar falls back to the default nav.
  const menu = await getHeaderMenu();
  // Resolved on the server: client components under (site) read it from
  // context, so only the active language ships (in the RSC payload, not JS).
  const dict = getDictionary(locale);

  return (
    <RootShell locale={locale}>
      <DictionaryProvider dict={dict}>
        <SmoothScroll>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <ScrollProgress />
          <Navbar menu={menu ?? undefined} />
          <main id="main" className="relative">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <WhatsAppFloat />
        </SmoothScroll>
      </DictionaryProvider>
    </RootShell>
  );
}
