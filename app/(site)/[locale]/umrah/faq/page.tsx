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
import { getDict } from '@/lib/dictionaries/areas/umrahpages';

export const metadata: Metadata = {
  title: 'Umrah FAQ — Your Questions About Umrah Answered',
  description:
    'Frequently asked questions about Umrah from Bangladesh: visa timing, cost, best time to travel, how long Umrah takes, travelling with children or elders, women without a mahram, Madinah visits and more — answered by Inter Gulf Travels Ltd.',
  alternates: { canonical: '/umrah/faq' },
};

export default function UmrahFaqPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const umrahFaqs = t.faq.umrahFaqs;
  const extraFaqs = t.faq.extraFaqs;
  return (
    <>
      <JsonLd data={faqSchema([...umrahFaqs, ...extraFaqs])} />
      <PageHero
        eyebrow={t.faq.hero.eyebrow}
        title={<>{t.faq.hero.title}</>}
        lead={t.faq.hero.lead}
        crumbs={[{ label: t.faq.hero.crumbUmrah, href: localizedPath(locale, '/umrah') }, { label: t.faq.hero.crumb }]}
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
            <Accordion items={umrahFaqs} />
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
