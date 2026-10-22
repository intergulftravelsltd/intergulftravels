import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Compass,
  Eye,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Star,
  BadgeCheck,
  HandHeart,
  Scale,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup, revealItem } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { StatsBand } from '@/components/about/StatsBand';
import { Timeline, type Milestone } from '@/components/about/Timeline';
import { siteConfig, contact } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.index.meta.title,
    description: t.index.meta.description,
    alternates: { canonical: '/about' },
  };
}

const valueIcons = [ShieldCheck, HandHeart, BadgeCheck, Scale, Sparkles, HeartHandshake];

export default function AboutPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const ti = getDict(locale).index;
  const values = ti.values.items.map((v, i) => ({ icon: valueIcons[i], ...v }));
  const milestones: Milestone[] = ti.timeline.items;
  const promises = ti.trust.promises;
  return (
    <>
      <PageHero
        eyebrow={ti.hero.eyebrow}
        title={
          <>
            {ti.hero.titleA}<span className="text-gradient-gold">{ti.hero.titleHighlight}</span>{ti.hero.titleB}
          </>
        }
        lead={ti.hero.lead}
        crumbs={[{ label: ti.hero.crumb }]}
      />

      {/* Our story */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Eyebrow>{ti.story.eyebrow}</Eyebrow>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.12] text-ink dark:text-white sm:text-4xl balance">
                {ti.story.heading}
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-muted">
                <p>{ti.story.p1}</p>
                <p>{ti.story.p2}</p>
                <p>{ti.story.p3}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={localizedPath(locale, '/hajj/packages')}>
                  {ti.story.viewPackages} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={localizedPath(locale, '/contact')} variant="outline">
                  {ti.story.talkAdvisor}
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative">
                <div className="relative overflow-hidden rounded-[2rem] border border-border bg-brand-gradient p-8 text-white shadow-emerald sm:p-10">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-300/20 blur-3xl" />
                  <Star className="h-9 w-9 text-gold-300" />
                  <p className="mt-5 font-display text-xl leading-relaxed sm:text-2xl balance">
                    {ti.story.quote}
                  </p>
                  <p className="mt-4 text-sm text-white/70">
                    {ti.story.quoteSub}
                  </p>
                  <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-6">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/55">{ti.story.established}</dt>
                      <dd className="mt-1 font-display text-2xl font-semibold text-gold-300">{ti.story.establishedValue}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-white/55">{ti.story.hajjLicence}</dt>
                      <dd className="mt-1 font-display text-2xl font-semibold text-gold-300">{ti.story.hajjLicenceValue}</dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-4 rounded-3xl border border-border bg-card p-5 text-sm text-ink-muted shadow-soft">
                  <span className="font-semibold text-ink dark:text-white">{ti.story.headOffice}</span>{' '}
                  {contact.address.full}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Mission & Vision */}
      <Section className="bg-sand-soft">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
              <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                <Compass className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white">{ti.mission.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-muted">
                {ti.mission.body}
              </p>
            </Reveal>

            <Reveal
              delay={0.1}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10"
            >
              <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-gold-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                <Eye className="h-7 w-7" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white">{ti.vision.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-muted">
                {ti.vision.body}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Core values */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <SectionHeading
          eyebrow={ti.values.eyebrow}
          title={
            <>
              {ti.values.titleA}<span className="text-gradient">{ti.values.titleHighlight}</span>
            </>
          }
          lead={ti.values.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Reveal key={v.title} className="h-full">
                <article className="group h-full rounded-3xl border border-border bg-card/70 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                  <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                    <v.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.body}</p>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Animated stats band */}
      <StatsBand />

      {/* Company timeline */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={ti.timeline.eyebrow}
          title={
            <>
              {ti.timeline.titleA}<span className="text-gradient">{ti.timeline.titleHighlight}</span>
            </>
          }
          lead={ti.timeline.lead}
        />
        <Container className="mt-14">
          <Timeline items={milestones} />
        </Container>
      </Section>

      {/* Why families trust us */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <Eyebrow>{ti.trust.eyebrow}</Eyebrow>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.12] text-ink dark:text-white sm:text-4xl balance">
                {ti.trust.heading}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-muted">
                {ti.trust.body}
              </p>
              <div className="mt-7">
                <Button href={localizedPath(locale, '/contact')}>
                  {ti.trust.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>

            <RevealGroup className="grid gap-3 sm:grid-cols-2">
              {promises.map((p) => (
                <Reveal key={p}>
                  <div className="flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-ink dark:text-white/90">{p}</p>
                  </div>
                </Reveal>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <section className="relative py-20 sm:py-24">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">
                {ti.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {ti.cta.leadA}{siteConfig.shortName}{ti.cta.leadB}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/contact')} variant="gold" size="lg">
                  {ti.cta.contact} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={localizedPath(locale, '/about/team')} variant="light" size="lg">
                  {ti.cta.meetTeam}
                </Button>
              </div>
              <Link
                href={`tel:${contact.phones[0].replace(/\s/g, '')}`}
                className="mt-6 inline-block text-sm font-semibold text-white/85 hover:text-white"
              >
                {ti.cta.callDirect} {contact.phones[0]}
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
