import type { Metadata } from 'next';
import {
  ArrowRight,
  Award,
  ShieldCheck,
  BadgeCheck,
  Plane,
  Building2,
  Handshake,
  Trophy,
  Star,
  ScrollText,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { siteConfig } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.awards.meta.title,
    description: t.awards.meta.description,
    alternates: { canonical: '/about/awards' },
  };
}

const certIcons = [ShieldCheck, Building2, Handshake, Plane];
const recognitionIcons = [Trophy, Star, Award, BadgeCheck];

export default function AwardsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale).awards;
  const certifications = t.certifications.items.map((c, i) => ({ icon: certIcons[i], ...c }));
  const recognitions = t.recognitions.items.map((r, i) => ({ icon: recognitionIcons[i], ...r }));
  const trustBadges = t.trustBadges;
  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}<span className="text-gradient-gold">{t.hero.titleHighlight}</span>
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumbAbout, href: localizedPath(locale, '/about') }, { label: t.hero.crumb }]}
      />

      {/* Trust badges strip */}
      <Section className="relative overflow-hidden !py-14">
        <AuroraBackdrop />
        <Container>
          <RevealGroup className="flex flex-wrap items-center justify-center gap-3">
            {trustBadges.map((b) => (
              <Reveal key={b}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-soft dark:text-brand-200">
                  <BadgeCheck className="h-4 w-4 text-gold-500" /> {b}
                </span>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Certifications */}
      <Section className="bg-sand-soft !pt-6">
        <SectionHeading
          eyebrow={t.certifications.eyebrow}
          title={
            <>
              {t.certifications.titleA}<span className="text-gradient">{t.certifications.titleHighlight}</span>
            </>
          }
          lead={t.certifications.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {certifications.map((c) => (
              <Reveal key={c.title} className="h-full">
                <article className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <c.icon className="h-7 w-7" />
                    </span>
                    <span className="rounded-full bg-gold-gradient px-4 py-1.5 font-display text-sm font-bold text-brand-900">
                      {c.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-ink dark:text-white">{c.title}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                    {c.issuer}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{c.body}</p>
                  <div className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-sand-soft p-4 dark:bg-brand-900/20">
                    <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
                    <p className="text-sm font-medium text-ink dark:text-white/90">
                      <span className="text-ink-muted">{t.certifications.whatItMeans}</span>
                      {c.meaning}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Recognitions */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <SectionHeading
          eyebrow={t.recognitions.eyebrow}
          title={
            <>
              {t.recognitions.titleA}<span className="text-gradient">{t.recognitions.titleHighlight}</span>
            </>
          }
          lead={t.recognitions.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recognitions.map((r) => (
              <Reveal key={r.title} className="h-full">
                <article className="group h-full rounded-3xl border border-border bg-card/70 p-7 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-gradient text-brand-900 shadow-gold">
                    <r.icon className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                    {r.year}
                  </p>
                  <h3 className="mt-1 font-display text-base font-semibold text-ink dark:text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{r.body}</p>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
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
                {t.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {siteConfig.legalName} — {siteConfig.license}{t.cta.leadB}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/contact')} variant="gold" size="lg">
                  {t.cta.getInTouch} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={localizedPath(locale, '/about/associates')} variant="light" size="lg">
                  {t.cta.viewPartners}
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
