import type { Metadata } from 'next';
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Check,
  FileText,
  Plane,
  ClipboardCheck,
  Stamp,
  CalendarClock,
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
import { Accordion } from '@/components/ui/Accordion';

export const metadata: Metadata = {
  title: 'Visa Service',
  description:
    'End-to-end visa processing from Dhaka — Saudi Hajj, Umrah, work & business visas, plus UAE, Malaysia, Thailand and Schengen tourist visas. Document guidance and fast, accurate filing by Inter Gulf Travels Ltd.',
  alternates: { canonical: '/services/visa' },
};

// Icons paired by index with t.visa.processSteps (copy lives in the dictionary).
const processIcons = [ClipboardCheck, FileText, Stamp, Plane];

export default function VisaServicePage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.visa.hero.eyebrow}
        title={
          <>
            {t.visa.hero.titleA} <span className="text-gradient-gold">{t.visa.hero.titleB}</span>
          </>
        }
        lead={t.visa.hero.lead}
        crumbs={[{ label: t.visa.hero.crumbServices, href: localizedPath(locale, '/services') }, { label: t.visa.hero.crumb }]}
      />

      {/* Countries */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.visa.countries.eyebrow}
          title={
            <>
              {t.visa.countries.titleA} <span className="text-gradient">{t.visa.countries.titleB}</span>
            </>
          }
          lead={t.visa.countries.lead}
        />

        <Container className="mt-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.visa.visaCountries.map((c, i) => (
              <Reveal
                key={c.country}
                delay={i * 0.05}
                as="article"
                className="flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-600/30 hover:shadow-emerald"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-900/40" aria-hidden>
                    {c.flag}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{c.country}</h3>
                </div>
                <ul className="mt-5 space-y-2">
                  {c.types.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-ink/80 dark:text-white/80">
                      <Check className="h-4 w-4 shrink-0 text-brand-600" /> {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-ink-muted">{c.note}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Documents + Process */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.visa.docsBadge}
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl">
                {t.visa.docsTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {t.visa.docsLead}
              </p>
              <ul className="mt-7 space-y-3">
                {t.visa.documents.map((d) => (
                  <li key={d} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-ink/85 shadow-soft dark:text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {d}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/15 bg-brand-50 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:border-brand-400/20 dark:bg-brand-900/30 dark:text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {t.visa.processBadge}
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl">
                {t.visa.processTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {t.visa.processLead}
              </p>
              <ol className="mt-7 space-y-4">
                {t.visa.processSteps.map((s, i) => {
                  const StepIcon = processIcons[i];
                  return (
                  <li key={s.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                      <StepIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">{t.visa.stepLabel} {i + 1}</p>
                      <h3 className="mt-0.5 font-display text-lg font-semibold text-ink dark:text-white">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
                    </div>
                  </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Disclaimer banner */}
      <Section className="pt-0">
        <Container>
          <Reveal className="flex items-start gap-4 rounded-3xl border border-gold-500/30 bg-gold-50 p-6 dark:bg-gold-900/10 sm:p-8">
            <CalendarClock className="mt-1 h-6 w-6 shrink-0 text-gold-600" />
            <p className="text-sm leading-relaxed text-ink/80 dark:text-white/80">
              <strong className="text-ink dark:text-white">{t.visa.disclaimerLabel}</strong>{t.visa.disclaimerBody}
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-sand-soft pt-0">
        <SectionHeading
          eyebrow={t.visa.faqEyebrow}
          title={
            <>
              {t.visa.faqTitleA} <span className="text-gradient">{t.visa.faqTitleB}</span>
            </>
          }
          lead={t.visa.faqLead}
        />
        <Container size="narrow" className="mt-12">
          <Accordion items={t.visa.faqs} />
        </Container>
      </Section>

      <ServiceCTA
        locale={locale}
        heading={t.visa.ctaHeading}
        body={t.visa.ctaBody}
        waMessage={t.visa.ctaWa}
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
