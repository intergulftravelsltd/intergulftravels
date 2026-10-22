import type { Metadata } from 'next';
import { ArrowRight, Users2, Quote } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { TeamCard, type TeamMember } from '@/components/about/TeamCard';
import { siteConfig } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.team.meta.title,
    description: t.team.meta.description,
    alternates: { canonical: '/about/team' },
  };
}

const memberGradients = [
  'from-brand-600 to-brand-900',
  'from-gold-500 to-gold-700',
  'from-brand-500 to-brand-800',
  'from-brand-700 to-gold-600',
  'from-brand-600 to-brand-800',
  'from-gold-500 to-brand-700',
];
const memberEmails: (string | undefined)[] = [
  'intergulf71@gmail.com',
  'intergulfg47@gmail.com',
];

export default function TeamPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale).team;
  const team: TeamMember[] = t.members.map((m, i) => ({
    ...m,
    gradient: memberGradients[i],
    email: memberEmails[i],
  }));
  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}<span className="text-gradient-gold">{t.hero.titleHighlight}</span>{t.hero.titleB}
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumbAbout, href: localizedPath(locale, '/about') }, { label: t.hero.crumb }]}
      />

      {/* Intro */}
      <Section className="relative overflow-hidden !pb-10">
        <AuroraBackdrop />
        <Container>
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-base leading-relaxed text-ink-muted sm:text-lg balance">
              {t.intro}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Team grid */}
      <Section className="!pt-6">
        <Container>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Leadership ethos */}
      <Section className="bg-sand-soft">
        <Container size="narrow">
          <Reveal className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 text-center shadow-soft sm:p-12">
            <Quote className="mx-auto h-10 w-10 text-gold-400/50" />
            <p className="mt-5 font-display text-xl leading-relaxed text-ink dark:text-white sm:text-2xl balance">
              {t.ethosQuote}
            </p>
            <p className="mt-5 text-sm font-semibold text-brand-700 dark:text-brand-300">
              {t.ethosByA}{siteConfig.shortName}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* Join us */}
      <Section className="relative overflow-hidden !py-16">
        <AuroraBackdrop />
        <Container>
          <Reveal className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center shadow-soft sm:flex-row sm:justify-between sm:p-10 sm:text-left">
            <div className="flex items-start gap-5">
              <span className="hidden shrink-0 ring-gradient sm:grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                <Users2 className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">
                  {t.joinTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  {t.joinBody}
                </p>
              </div>
            </div>
            <Button href={localizedPath(locale, '/about/career')} className="shrink-0">
              {t.viewCareers} <ArrowRight className="h-4 w-4" />
            </Button>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
