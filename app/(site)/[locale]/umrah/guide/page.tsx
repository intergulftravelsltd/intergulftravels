import type { Metadata } from 'next';
import { Shirt, RefreshCw, Footprints, Scissors, MapPin, CheckCircle2 } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CtaBand } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/umrahpages';

export const metadata: Metadata = {
  title: 'Umrah Guide — How to Perform Umrah Step by Step',
  description:
    'A clear, step-by-step guide to performing Umrah correctly: entering Ihram at the Miqat, the Talbiyah, Tawaf around the Kaaba, Sa‘i between Safa and Marwah, and Halq or Taqsir — exactly as the Prophet ﷺ taught.',
  alternates: { canonical: '/umrah/guide' },
};

const riteIcons = [Shirt, MapPin, RefreshCw, Footprints, Scissors];

export default function UmrahGuidePage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const rites = t.guide.rites.map((r, i) => ({ icon: riteIcons[i], ...r }));
  return (
    <>
      <PageHero
        eyebrow={t.guide.hero.eyebrow}
        title={<>{t.guide.hero.title}</>}
        lead={t.guide.hero.lead}
        crumbs={[{ label: t.guide.hero.crumbUmrah, href: localizedPath(locale, '/umrah') }, { label: t.guide.hero.crumb }]}
      />

      {/* Intro */}
      <Section>
        <Container size="narrow">
          <Reveal className="text-center">
            <Eyebrow className="mx-auto">{t.guide.intro.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.guide.intro.titleA} <span className="text-gradient">{t.guide.intro.titleB}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
              {t.guide.intro.p}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Steps */}
      <Section className="bg-sand-soft pt-0">
        <SectionHeading
          eyebrow={t.guide.steps.eyebrow}
          title={<>{t.guide.steps.titleA} <span className="text-gradient">{t.guide.steps.titleB}</span></>}
          lead={t.guide.steps.lead}
        />
        <Container size="narrow" className="mt-14">
          <ol className="relative space-y-8 border-l-2 border-brand-600/20 pl-6 sm:pl-8">
            {rites.map((r, i) => (
              <Reveal as="li" key={r.title} delay={(i % 3) * 0.05} className="relative">
                <span className="absolute -left-[2.35rem] grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald sm:-left-[3.1rem]">
                  <r.icon className="h-5 w-5" />
                </span>
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                  <span className="font-display text-sm font-semibold text-gold-600">{t.guide.steps.stepLabel} {String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-ink dark:text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">{r.body}</p>
                  <p className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-50/70 p-3 text-xs leading-relaxed text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {r.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* After Umrah note */}
      <Section className="pt-0">
        <Container size="narrow">
          <Reveal className="rounded-3xl border border-gold-400/40 bg-card p-7 shadow-soft sm:p-8">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{t.guide.after.heading}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t.guide.after.body}
            </p>
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title={t.guide.cta.title}
        lead={t.guide.cta.lead}
        message={t.guide.cta.message}
      />
    </>
  );
}
