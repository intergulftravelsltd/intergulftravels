import type { Metadata } from 'next';
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Check,
  Plane,
  BadgeDollarSign,
  Zap,
  Users,
  Map,
} from 'lucide-react';
import { contact, partners } from '@/lib/site';
import { whatsappLink } from '@/lib/utils';
import { localizedPath, type Locale } from '@/lib/i18n';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/services';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Air Ticket',
  description:
    'Domestic, regional and international air tickets from Dhaka across 40+ airlines including Biman, Saudia, Emirates and Qatar Airways. Best-fare promise, instant e-ticket issuance and group fares from Inter Gulf Travels Ltd.',
  alternates: { canonical: '/services/air-ticket' },
};

// Icons paired by index with t.air.promises (copy lives in the dictionary).
const promiseIcons = [BadgeDollarSign, Zap, Users, Plane];

export default function AirTicketPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.air.hero.eyebrow}
        title={
          <>
            {t.air.hero.titleA} <span className="text-gradient-gold">{t.air.hero.titleB}</span>
          </>
        }
        lead={t.air.hero.lead}
        crumbs={[{ label: t.air.hero.crumbServices, href: localizedPath(locale, '/services') }, { label: t.air.hero.crumb }]}
      />

      {/* Best-fare promise */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.air.promiseHead.eyebrow}
          title={
            <>
              {t.air.promiseHead.titleA} <span className="text-gradient">{t.air.promiseHead.titleB}</span>
            </>
          }
          lead={t.air.promiseHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.air.promises.map((p, i) => {
              const PromiseIcon = promiseIcons[i];
              return (
              <Reveal
                key={p.title}
                delay={i * 0.05}
                className="group rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                  <PromiseIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.body}</p>
              </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Ticket types */}
      <Section>
        <Container>
          <div className="grid gap-5 md:grid-cols-3">
            {t.air.ticketTypes.map((tt, i) => (
              <Reveal
                key={tt.title}
                delay={i * 0.06}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <span className="font-display text-5xl font-semibold text-brand-600/15">{`0${i + 1}`}</span>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink dark:text-white">{tt.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{tt.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Popular routes */}
      <Section className="bg-sand-soft pt-0">
        <SectionHeading
          eyebrow={t.air.routesHead.eyebrow}
          title={
            <>
              {t.air.routesHead.titleA} <span className="text-gradient">{t.air.routesHead.titleB}</span>
            </>
          }
          lead={t.air.routesHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-5 lg:grid-cols-3">
            {t.air.routeGroups.map((g, gi) => (
              <Reveal
                key={g.label}
                delay={gi * 0.06}
                className="rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="flex items-center gap-2 text-gold-600">
                  <Map className="h-5 w-5" />
                  <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{g.label}</h3>
                </div>
                <ul className="mt-5 space-y-3">
                  {g.routes.map((r) => (
                    <li
                      key={r.code}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background/50 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink dark:text-white">
                        {r.from}
                        <Plane className="h-3.5 w-3.5 text-brand-600" />
                        {r.to}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{r.code}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Airline partners */}
      <Section>
        <SectionHeading
          eyebrow={t.air.partnersHead.eyebrow}
          title={
            <>
              {t.air.partnersHead.titleA} <span className="text-gradient">{t.air.partnersHead.titleB}</span>
            </>
          }
          lead={t.air.partnersHead.lead}
        />
        <Container className="mt-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {partners.map((p, i) => (
              <Reveal
                key={p}
                delay={i * 0.03}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-soft transition-colors hover:border-brand-600/30"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  <Plane className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-ink dark:text-white">{p}</span>
              </Reveal>
            ))}
            <Reveal
              delay={partners.length * 0.03}
              className="flex items-center justify-center rounded-2xl border border-dashed border-brand-600/40 bg-brand-50/50 px-4 py-3.5 text-sm font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-200"
            >
              {t.air.moreCarriers}
            </Reveal>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-ink-muted">
            <Check className="h-4 w-4 text-brand-600" /> {t.air.askAirline}
          </p>
        </Container>
      </Section>

      <ServiceCTA
        locale={locale}
        heading={t.air.ctaHeading}
        body={t.air.ctaBody}
        waMessage={t.air.ctaWa}
        cta={t.cta}
      />
    </>
  );
}

function ServiceCTA({
  locale,
  heading,
  body,
  waMessage,
  cta,
}: {
  locale: Locale;
  heading: string;
  body: string;
  waMessage: string;
  cta: { estimate: string; whatsapp: string; callPrefix: string };
}) {
  return (
    <Section className="bg-sand-soft pt-0">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">{heading}</h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">{body}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href={localizedPath(locale, '/estimate')} variant="gold" size="lg">
                {cta.estimate} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href={whatsappLink(contact.whatsapp, waMessage)} external variant="light" size="lg">
                <MessageCircle className="h-4 w-4" /> {cta.whatsapp}
              </Button>
            </div>
            <a
              href={`tel:${contact.phones[0].replace(/\s/g, '')}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white"
            >
              <Phone className="h-4 w-4" /> {cta.callPrefix} {contact.phones[0]}
            </a>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
