import type { Metadata } from 'next';
import {
  ArrowRight,
  MapPin,
  Clock,
  Mail,
  Phone,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { contact } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

const careersEmail = 'intergulfg47@gmail.com';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.career.meta.title,
    description: t.career.meta.description,
    alternates: { canonical: '/about/career' },
  };
}

const cultureIcons = [HeartHandshake, GraduationCap, TrendingUp, Users];

export default function CareerPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale).career;
  const culture = t.culture.items.map((c, i) => ({ icon: cultureIcons[i], ...c }));
  const positions = t.positions.items;
  const applySteps = t.apply.steps;
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

      {/* Culture / why work here */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <SectionHeading
          eyebrow={t.culture.eyebrow}
          title={
            <>
              {t.culture.titleA}<span className="text-gradient">{t.culture.titleHighlight}</span>{t.culture.titleB}
            </>
          }
          lead={t.culture.lead}
        />
        <Container className="mt-14">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((c) => (
              <Reveal key={c.title} className="h-full">
                <article className="group h-full rounded-3xl border border-border bg-card/70 p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                  <span className="ring-gradient grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                    <c.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-base font-semibold text-ink dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Open positions */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.positions.eyebrow}
          title={
            <>
              {t.positions.titleA}<span className="text-gradient">{t.positions.titleHighlight}</span>
            </>
          }
          lead={t.positions.lead}
        />
        <Container className="mt-12">
          <RevealGroup className="space-y-5">
            {positions.map((p) => (
              <Reveal key={p.title}>
                <article className="rounded-3xl border border-border bg-card p-7 shadow-soft transition-colors duration-300 hover:border-gold-400/40 sm:p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="lg:max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                          <Briefcase className="h-3.5 w-3.5" /> {p.department}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold text-ink dark:text-white">{p.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-brand-600" /> {p.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-brand-600" /> {p.type}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-ink-muted">{p.summary}</p>
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {p.responsibilities.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-ink dark:text-white/90">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="shrink-0">
                      <Button
                        href={`mailto:${careersEmail}?subject=${encodeURIComponent(`${t.apply.applicationPrefix}: ${p.title}`)}`}
                        external
                        variant="outline"
                      >
                        {t.positions.apply} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* How to apply */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <Reveal>
              <Eyebrow>{t.apply.eyebrow}</Eyebrow>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.12] text-ink dark:text-white sm:text-4xl balance">
                {t.apply.heading}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-muted">
                {t.apply.intro}
              </p>
              <ol className="mt-7 space-y-4">
                {applySteps.map((step, i) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient font-display text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-ink dark:text-white/90">{step}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient text-brand-900">
                  <Sparkles className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink dark:text-white">
                  {t.apply.cardTitle}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t.apply.cardBody}
                </p>
                <div className="mt-6 space-y-3">
                  <a
                    href={`mailto:${careersEmail}?subject=${encodeURIComponent(t.apply.applicationSubject)}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-sand-soft p-4 transition hover:border-brand-600 dark:bg-brand-900/20"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <Mail className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-ink-muted">{t.apply.careersEmailLabel}</span>
                      <span className="block text-sm font-semibold text-ink dark:text-white">{careersEmail}</span>
                    </span>
                  </a>
                  <a
                    href={`tel:${contact.phones[0].replace(/\s/g, '')}`}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-sand-soft p-4 transition hover:border-brand-600 dark:bg-brand-900/20"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <Phone className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-ink-muted">{t.apply.callUsLabel}</span>
                      <span className="block text-sm font-semibold text-ink dark:text-white">{contact.phones[0]}</span>
                    </span>
                  </a>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-sand-soft p-4 dark:bg-brand-900/20">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wide text-ink-muted">{t.apply.visitOfficeLabel}</span>
                      <span className="block text-sm font-semibold text-ink dark:text-white">
                        {contact.address.line1}, {contact.address.line2}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button href={localizedPath(locale, '/contact')} className="w-full">
                    {t.apply.contact} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
