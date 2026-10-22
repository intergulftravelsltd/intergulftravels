import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Accordion } from '@/components/ui/Accordion';
import { CtaBand } from '@/components/hajj-umrah/shared';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema } from '@/lib/seo';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/hajjpages';

export const metadata: Metadata = {
  title: 'Hajj FAQ — Your Questions About Hajj 2026 Answered',
  description:
    'Frequently asked questions about Hajj from Bangladesh: pre-registration, package inclusions, hotel distance, documents, vaccinations, costs, refunds, women travelling without a mahram and more — answered by Inter Gulf Travels Ltd.',
  alternates: { canonical: '/hajj/faq' },
};

export default function HajjFaqPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const hajjFaqs = t.faq.hajjFaqs;
  const extraFaqs = t.faq.extraFaqs;
  return (
    <>
      <JsonLd data={faqSchema([...hajjFaqs, ...extraFaqs])} />
      <PageHero
        eyebrow={t.faq.hero.eyebrow}
        title={<>{t.faq.hero.title}</>}
        lead={t.faq.hero.lead}
        crumbs={[{ label: t.faq.hero.crumbHajj, href: localizedPath(locale, '/hajj') }, { label: t.faq.hero.crumb }]}
      />

      <Section>
        <Container size="narrow">
          <Reveal className="text-center">
            <Eyebrow className="mx-auto">{t.faq.intro.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.faq.intro.titleA} <span className="text-gradient">{t.faq.intro.titleB}</span>
            </h2>
          </Reveal>

          <Reveal className="mt-12">
            <h3 className="mb-4 font-display text-lg font-semibold text-ink dark:text-white">{t.faq.bookingHeading}</h3>
            <Accordion items={hajjFaqs} />
          </Reveal>

          <Reveal className="mt-10">
            <h3 className="mb-4 font-display text-lg font-semibold text-ink dark:text-white">{t.faq.moreHeading}</h3>
            <Accordion items={extraFaqs} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title={t.faq.cta.title}
        lead={t.faq.cta.lead}
        message={t.faq.cta.message}
      />
    </>
  );
}
