import type { Metadata } from 'next';
import { Shirt, RefreshCw, Footprints, Tent, Mountain, MoonStar, Target, Beef, Scissors, Heart, CalendarDays } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CtaBand } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/hajjpages';

export const metadata: Metadata = {
  title: 'Hajj Guide — Step-by-Step Rites of Pilgrimage',
  description:
    'A clear, ordered guide to the rites of Hajj: entering Ihram, Tawaf, Sa‘i, Mina, the standing at Arafah, Muzdalifah, Rami al-Jamarat, Qurbani, Halq, Tawaf al-Ifadah and the farewell Tawaf — day by day.',
  alternates: { canonical: '/hajj/guide' },
};

const riteIcons = [Shirt, Tent, Mountain, MoonStar, Target, Beef, Scissors, RefreshCw, Footprints, Heart];

export default function HajjGuidePage({ params }: { params: { locale: string } }) {
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
        crumbs={[{ label: t.guide.hero.crumbHajj, href: localizedPath(locale, '/hajj') }, { label: t.guide.hero.crumb }]}
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
              {t.guide.intro.pA}<em>{t.guide.intro.pQuote}</em>{t.guide.intro.pB}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Timeline */}
      <Section className="bg-sand-soft pt-0">
        <SectionHeading
          eyebrow={t.guide.timeline.eyebrow}
          title={<>{t.guide.timeline.titleA} <span className="text-gradient">{t.guide.timeline.titleB}</span></>}
          lead={t.guide.timeline.lead}
        />
        <Container size="narrow" className="mt-14">
          <ol className="relative space-y-8 border-l-2 border-brand-600/20 pl-6 sm:pl-8">
            {rites.map((r, i) => (
              <Reveal as="li" key={r.title} delay={(i % 3) * 0.05} className="relative">
                <span className="absolute -left-[2.35rem] grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald sm:-left-[3.1rem]">
                  <r.icon className="h-5 w-5" />
                </span>
                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                      <CalendarDays className="h-3.5 w-3.5" /> {r.day}
                    </span>
                    <span className="font-display text-sm font-semibold text-gold-600">{t.guide.timeline.stepLabel} {String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-ink dark:text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[0.95rem]">{r.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Note */}
      <Section className="pt-0">
        <Container size="narrow">
          <Reveal className="rounded-3xl border border-gold-400/40 bg-card p-7 shadow-soft sm:p-8">
            <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{t.guide.note.heading}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t.guide.note.bodyA}<strong>{t.guide.note.tamattu}</strong>{t.guide.note.bodyB}<strong>{t.guide.note.qiran}</strong>{t.guide.note.bodyC}
              <strong>{t.guide.note.ifrad}</strong>{t.guide.note.bodyD}
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
