import type { Metadata } from 'next';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { contact } from '@/lib/site';
import { whatsappLink } from '@/lib/utils';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { getGalleryImages } from '@/lib/gallery';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/gallery';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: '/gallery' },
  };
}

export default async function GalleryPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const images = await getGalleryImages().catch(() => []);
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}
            <span className="text-gradient-gold">{t.hero.titleHighlight}</span>
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumb }]}
      />

      <Section className="bg-sand-soft">
        <Container>
          <GalleryGrid extra={images} />
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-0">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">
                {t.cta.heading}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {t.cta.body}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/estimate')} variant="gold" size="lg">
                  {t.cta.estimate} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  href={whatsappLink(contact.whatsapp, t.cta.whatsappMessage)}
                  external
                  variant="light"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4" /> {t.cta.whatsapp}
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
