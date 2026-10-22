import type { Metadata } from 'next';
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Check,
  Clock,
  MapPin,
  Heart,
  Users,
  Sparkles,
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
  title: 'Tour Packages',
  description:
    'Curated holiday tours from Dhaka to Dubai, Turkey, Malaysia, Kashmir and the Maldives — real highlights, clear durations and all-inclusive options. Family and honeymoon tours by Inter Gulf Travels Ltd.',
  alternates: { canonical: '/services/tour' },
};

// Gradient tones paired by index with t.tour.destinations (copy lives in the dictionary).
const destinationTones = [
  'from-amber-500 via-gold-600 to-brand-800',
  'from-rose-600 via-brand-700 to-brand-900',
  'from-emerald-500 via-brand-600 to-brand-900',
  'from-sky-600 via-brand-600 to-brand-900',
  'from-cyan-500 via-brand-600 to-brand-900',
  'from-brand-700 via-brand-800 to-gold-700',
];
// Icons paired by index with t.tour.tourTypes.
const tourTypeIcons = [Users, Heart, Sparkles];

export default function TourPackagesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.tour.hero.eyebrow}
        title={
          <>
            {t.tour.hero.titleA} <span className="text-gradient-gold">{t.tour.hero.titleB}</span>
          </>
        }
        lead={t.tour.hero.lead}
        crumbs={[{ label: t.tour.hero.crumbServices, href: localizedPath(locale, '/services') }, { label: t.tour.hero.crumb }]}
      />

      {/* Destination cards */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.tour.destHead.eyebrow}
          title={
            <>
              {t.tour.destHead.titleA} <span className="text-gradient">{t.tour.destHead.titleB}</span>
            </>
          }
          lead={t.tour.destHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.tour.destinations.map((d, i) => (
              <Reveal
                key={d.name}
                delay={i * 0.05}
                as="article"
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-emerald"
              >
                {/* Vector gradient banner — no raster imagery */}
                <div className={`relative h-40 bg-gradient-to-br ${destinationTones[i]}`}>
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.5) 0, transparent 38%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.35) 0, transparent 42%)',
                    }}
                  />
                  <svg
                    aria-hidden
                    viewBox="0 0 400 160"
                    preserveAspectRatio="none"
                    className="absolute bottom-0 left-0 h-16 w-full text-card"
                  >
                    <path d="M0,120 C80,160 160,80 240,100 C320,120 360,90 400,110 L400,160 L0,160 Z" fill="currentColor" />
                  </svg>
                  <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5" /> {d.duration}
                  </div>
                  <div className="absolute bottom-5 left-5 text-white">
                    <h3 className="font-display text-2xl font-semibold drop-shadow-sm">{d.name}</h3>
                    <p className="flex items-center gap-1 text-xs font-medium text-white/85">
                      <MapPin className="h-3 w-3" /> {d.country}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm font-medium text-gold-600">{d.tagline}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {d.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-ink/80 dark:text-white/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {h}
                      </li>
                    ))}
                  </ul>
                  <Button
                    href={whatsappLink(
                      contact.whatsapp,
                      `${t.tour.enquireWaPrefix}${d.name}${t.tour.enquireWaSuffix}`,
                    )}
                    external
                    variant="outline"
                    size="sm"
                    className="mt-6 w-full"
                  >
                    {t.tour.enquireAbout} {d.name} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Tour types */}
      <Section>
        <SectionHeading
          eyebrow={t.tour.typesHead.eyebrow}
          title={
            <>
              {t.tour.typesHead.titleA} <span className="text-gradient">{t.tour.typesHead.titleB}</span>
            </>
          }
          lead={t.tour.typesHead.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-5 md:grid-cols-3">
            {t.tour.tourTypes.map((tt, i) => {
              const TypeIcon = tourTypeIcons[i];
              return (
              <Reveal
                key={tt.title}
                delay={i * 0.06}
                className="group rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-200">
                  <TypeIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{tt.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{tt.body}</p>
              </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <ServiceCTA
        locale={locale}
        heading={t.tour.ctaHeading}
        body={t.tour.ctaBody}
        waMessage={t.tour.ctaWa}
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
