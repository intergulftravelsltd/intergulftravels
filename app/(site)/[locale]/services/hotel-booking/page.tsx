import type { Metadata } from 'next';
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Check,
  MapPin,
  Search,
  CalendarCheck,
  BedDouble,
  Star,
} from 'lucide-react';
import { contact } from '@/lib/site';
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
  title: 'Hotel Booking',
  description:
    'Hand-picked hotels in Makkah and Madinah within walking distance of the Haramain, plus verified stays in Dubai, Istanbul, Kuala Lumpur and worldwide. Best-rate hotel booking from Inter Gulf Travels Ltd, Dhaka.',
  alternates: { canonical: '/services/hotel-booking' },
};

// Gradient tones paired by index with t.hotel.haramHotels (copy lives in the dictionary).
const haramTones = ['from-brand-700 to-brand-900', 'from-gold-600 to-gold-800'];
// Icons paired by index with t.hotel.steps.
const stepIcons = [Search, BedDouble, CalendarCheck];

export default function HotelBookingPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.hotel.hero.eyebrow}
        title={
          <>
            {t.hotel.hero.titleA} <span className="text-gradient-gold">{t.hotel.hero.titleB}</span>
          </>
        }
        lead={t.hotel.hero.lead}
        crumbs={[{ label: t.hotel.hero.crumbServices, href: localizedPath(locale, '/services') }, { label: t.hotel.hero.crumb }]}
      />

      {/* Haramain hotels */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.hotel.haramHead.eyebrow}
          title={
            <>
              {t.hotel.haramHead.titleA} <span className="text-gradient">{t.hotel.haramHead.titleB}</span>
            </>
          }
          lead={t.hotel.haramHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-5 md:grid-cols-2">
            {t.hotel.haramHotels.map((h, i) => (
              <Reveal
                key={h.city}
                delay={i * 0.08}
                as="article"
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
              >
                <div className={`relative bg-gradient-to-br ${haramTones[i]} px-7 py-10 text-white`}>
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        'linear-gradient(30deg,#fff 1px,transparent 1px),linear-gradient(-30deg,#fff 1px,transparent 1px)',
                      backgroundSize: '34px 34px',
                    }}
                  />
                  <div className="relative flex items-center gap-2 text-gold-200">
                    <MapPin className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-wider">{h.city}, {t.hotel.cityCountry}</span>
                  </div>
                  <h3 className="relative mt-3 font-display text-2xl font-semibold sm:text-3xl">{h.headline}</h3>
                </div>
                <ul className="space-y-3 p-7">
                  {h.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-ink/85 dark:text-white/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <SectionHeading
          eyebrow={t.hotel.stepsHead.eyebrow}
          title={
            <>
              {t.hotel.stepsHead.titleA} <span className="text-gradient">{t.hotel.stepsHead.titleB}</span>
            </>
          }
          lead={t.hotel.stepsHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-5 md:grid-cols-3">
            {t.hotel.steps.map((s, i) => {
              const StepIcon = stepIcons[i];
              return (
              <Reveal
                key={s.title}
                delay={i * 0.06}
                className="relative rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                    <StepIcon className="h-6 w-6" />
                  </span>
                  <span className="font-display text-4xl font-semibold text-brand-600/15">{`0${i + 1}`}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Worldwide + assurances */}
      <Section className="bg-sand-soft pt-0">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.hotel.worldwideBadge}
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl">
                {t.hotel.worldwideTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {t.hotel.worldwideLead}
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2">
                {t.hotel.worldwideCities.map((c) => (
                  <div
                    key={c.city}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink dark:text-white">{c.city}</span>
                      <span className="block text-xs text-ink-muted">{c.country}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.hotel.assuranceBadge}
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl">
                {t.hotel.assuranceTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {t.hotel.assuranceLead}
              </p>
              <ul className="mt-7 space-y-3">
                {t.hotel.assurances.map((a) => (
                  <li
                    key={a}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink/85 shadow-soft dark:text-white/85"
                  >
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /> {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      <ServiceCTA
        locale={locale}
        heading={t.hotel.ctaHeading}
        body={t.hotel.ctaBody}
        waMessage={t.hotel.ctaWa}
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
    <Section className="pt-0">
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
