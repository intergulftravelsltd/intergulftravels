import SmoothScroll from '@/components/providers/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgress } from '@/components/effects/ScrollProgress';
import { ScrollToTop } from '@/components/effects/ScrollToTop';
import { WhatsAppFloat } from '@/components/effects/WhatsAppFloat';
import { DictionaryProvider } from '@/components/providers/LocaleProvider';
import { getDictionary } from '@/lib/dictionaries';
import { getLocale } from '@/lib/i18n-server';
import { getHeaderMenu } from '@/lib/menu';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Admin-managed header menu, or null → Navbar falls back to the default nav.
  const menu = await getHeaderMenu();
  // Resolved on the server: client components under (site) read it from
  // context, so only the active language ships (in the RSC payload, not JS).
  const dict = getDictionary(getLocale());

  return (
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
      <main id="main" className="relative">{children}</main>
      <Footer />
      <ScrollToTop />
      <WhatsAppFloat />
    </SmoothScroll>
    </DictionaryProvider>
  );
}
