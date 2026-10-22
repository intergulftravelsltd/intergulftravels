import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check, MessageCircle, Phone } from 'lucide-react';
import { contact } from '@/lib/site';
import { whatsappLink } from '@/lib/utils';
import { localizedPath } from '@/lib/i18n';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/services';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Our Services',
  description:
    'Hajj & Umrah packages, visa processing, air tickets across 40+ airlines, hotel booking near the Haramain and curated tour packages — every travel need handled by Inter Gulf Travels Ltd, Dhaka.',
  alternates: { canonical: '/services' },
};

function serviceHref(slug: string) {
  return slug === 'hajj' || slug === 'umrah' ? `/${slug}` : `/services/${slug}`;
}

export default function ServicesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  return (
    <>
      <PageHero
        eyebrow={t.index.hero.eyebrow}
        title={
          <>
            {t.index.hero.titleA} <span className="text-gradient-gold">{t.index.hero.titleB}</span>
          </>
        }
        lead={t.index.hero.lead}
        crumbs={[{ label: t.index.hero.crumb }]}
      />

      {/* Services grid */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.index.grid.eyebrow}
          title={
            <>
              {t.index.grid.titleA} <span className="text-gradient">{t.index.grid.titleB}</span>
            </>
          }
          lead={t.index.grid.lead}
        />

        <Container className="mt-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.index.services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.05} as="article" className="h-full">
                <Link
                  href={localizedPath(locale, serviceHref(s.slug))}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-600/30 hover:shadow-emerald"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/0 blur-2xl transition-all duration-500 group-hover:bg-brand-500/15" />
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald transition-transform duration-300 group-hover:scale-105">
                      <Icon name={s.icon} className="h-7 w-7" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-ink-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-ink dark:text-white">{s.title}</h3>
                  <p className="mt-1 text-sm font-medium text-gold-600">{s.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{s.description}</p>
                  <ul className="mt-5 space-y-2 border-t border-border pt-5">
                    {s.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink/80 dark:text-white/80">
                        <Check className="h-4 w-4 shrink-0 text-brand-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                    {t.index.grid.explore} {s.title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Why choose us */}
      <Section>
        <SectionHeading
          eyebrow={t.index.why.eyebrow}
          title={
            <>
              {t.index.why.titleA} <span className="text-gradient">{t.index.why.titleB}</span>
            </>
          }
          lead={t.index.why.lead}
        />

        <Container className="mt-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.index.whyUs.map((w, i) => (
              <Reveal
                key={w.title}
                delay={i * 0.05}
                className="group rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-200">
                  <Icon name={w.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{w.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-0">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">
                {t.index.cta.heading}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {t.index.cta.body}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/estimate')} variant="gold" size="lg">
                  {t.cta.estimate} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  href={whatsappLink(contact.whatsapp, t.index.cta.wa)}
                  external
                  variant="light"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4" /> {t.cta.whatsapp}
                </Button>
              </div>
              <a
                href={`tel:${contact.phones[0].replace(/\s/g, '')}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white"
              >
                <Phone className="h-4 w-4" /> {t.cta.callPrefix} {contact.phones[0]}
              </a>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
