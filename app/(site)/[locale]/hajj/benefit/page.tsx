import type { Metadata } from 'next';
import { Sparkles, HeartHandshake, Users, ShieldCheck, Sunrise, Scale, BookOpen, Gem } from 'lucide-react';
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
  title: 'Benefits of Hajj — Why the Fifth Pillar Transforms a Life',
  description:
    'Discover the spiritual and personal benefits of Hajj: forgiveness of sins, the reward of Paradise, the unity of the ummah, renewed taqwa and a fresh beginning — with authentic Qur’an and hadith references.',
  alternates: { canonical: '/hajj/benefit' },
};

const benefitIcons = [Sparkles, Gem, Users, Sunrise, HeartHandshake, Scale, ShieldCheck, BookOpen];

export default function HajjBenefitPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const benefits = t.benefit.benefits.map((b, i) => ({ icon: benefitIcons[i], ...b }));
  const personal = t.benefit.personal;
  return (
    <>
      <PageHero
        eyebrow={t.benefit.hero.eyebrow}
        title={<>{t.benefit.hero.title}</>}
        lead={t.benefit.hero.lead}
        crumbs={[{ label: t.benefit.hero.crumbHajj, href: localizedPath(locale, '/hajj') }, { label: t.benefit.hero.crumb }]}
      />

      {/* Intro */}
      <Section>
        <Container size="narrow">
          <Reveal className="text-center">
            <Eyebrow className="mx-auto">{t.benefit.intro.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.benefit.intro.titleA} <span className="text-gradient">{t.benefit.intro.titleB}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted sm:text-lg">
              {t.benefit.intro.pA}
              <em>{t.benefit.intro.pQuote}</em>
              {t.benefit.intro.pB}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Spiritual benefits grid */}
      <Section className="bg-sand-soft pt-0">
        <SectionHeading
          eyebrow={t.benefit.grid.eyebrow}
          title={<>{t.benefit.grid.titleA} <span className="text-gradient">{t.benefit.grid.titleB}</span></>}
          lead={t.benefit.grid.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={(i % 2) * 0.08}>
                <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{b.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{b.body}</p>
                  <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    {b.ref}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Personal benefits */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{t.benefit.personalSection.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.benefit.personalSection.titleA} <span className="text-gradient">{t.benefit.personalSection.titleB}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              {t.benefit.personalSection.p}
            </p>
            <ul className="mt-7 space-y-3">
              {personal.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-gradient text-white">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-gold-400/40 bg-brand-gradient p-8 text-white shadow-emerald sm:p-10">
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-gold-300/20 blur-3xl" />
              <Gem className="h-9 w-9 text-gold-300" />
              <p className="mt-5 font-display text-xl italic leading-relaxed">
                {t.benefit.personalSection.quote}
              </p>
              <p className="mt-4 text-sm text-white/75">{t.benefit.personalSection.quoteRef}</p>
              <p className="mt-6 border-t border-white/15 pt-6 text-sm leading-relaxed text-white/80">
                {t.benefit.personalSection.quoteBody}
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title={t.benefit.cta.title}
        lead={t.benefit.cta.lead}
        message={t.benefit.cta.message}
      />
    </>
  );
}
