import type { Metadata } from 'next';
import {
  ArrowRight,
  Plane,
  Building2,
  BedDouble,
  Bus,
  Landmark,
  Handshake,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { partners, affiliations, contact } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.associates.meta.title,
    description: t.associates.meta.description,
    alternates: { canonical: '/about/associates' },
  };
}

const affiliationIcons: Record<string, typeof Landmark> = {
  MoRA: Landmark,
  HAAB: Building2,
  ATAB: Handshake,
  IATA: Plane,
};

const saudiIcons = [BedDouble, BedDouble, Bus, Handshake];

export default function AssociatesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale).associates;
  const affiliationDetails = t.affiliations.details;
  const affiliationNames = t.affiliations.names;
  const saudiPartners = t.saudi.items.map((p, i) => ({ icon: saudiIcons[i], ...p }));
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

      {/* Affiliations / regulatory bodies */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <SectionHeading
          eyebrow={t.affiliations.eyebrow}
          title={
            <>
              {t.affiliations.titleA}<span className="text-gradient">{t.affiliations.titleHighlight}</span>
            </>
          }
          lead={t.affiliations.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {affiliations.map((a) => {
              const Icon = affiliationIcons[a.short] ?? Landmark;
              const localName = affiliationNames[a.short as keyof typeof affiliationNames] ?? a.name;
              const detail = affiliationDetails[a.short as keyof typeof affiliationDetails] ?? '';
              return (
                <Reveal key={a.short} className="h-full">
                  <article className="flex h-full items-start gap-5 rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:border-gold-400/40 hover:shadow-gold">
                    <span className="ring-gradient grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <Icon className="h-7 w-7" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
                          {a.short}
                        </h3>
                        <span className="text-sm text-ink-muted">{localName}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        {detail}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      {/* Airline partners */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.airlines.eyebrow}
          title={
            <>
              {t.airlines.titleA}<span className="text-gradient">{t.airlines.titleHighlight}</span>{t.airlines.titleB}
            </>
          }
          lead={t.airlines.lead}
        />
        <Container className="mt-12">
          <RevealGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {partners.map((name) => (
              <Reveal key={name}>
                <div className="group flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-gold-300">
                    <Plane className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink dark:text-white">{name}</span>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
          <p className="mt-6 text-center text-sm text-ink-muted">
            {t.airlines.more}
          </p>
        </Container>
      </Section>

      {/* Saudi hotel & ground partners */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <SectionHeading
          eyebrow={t.saudi.eyebrow}
          title={
            <>
              {t.saudi.titleA}<span className="text-gradient">{t.saudi.titleHighlight}</span>{t.saudi.titleB}
            </>
          }
          lead={t.saudi.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {saudiPartners.map((p) => (
              <Reveal key={p.title} className="h-full">
                <article className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:border-gold-400/40 hover:shadow-gold">
                  <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-sand-soft px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Become a partner CTA */}
      <section className="relative py-20 sm:py-24">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-gold-300">
                <Handshake className="h-7 w-7" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">
                {t.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {t.cta.lead}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/contact')} variant="gold" size="lg">
                  {t.cta.partner} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={`mailto:${contact.emails[0]}`} external variant="light" size="lg">
                  {t.cta.email}
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
