import type { Metadata } from 'next';
import { Plane, FileText, CalendarHeart, Luggage, Syringe, Check, Sparkles, Sun } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CtaBand } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/umrahpages';

export const metadata: Metadata = {
  title: 'Umrah Guideline — Visa, Documents, Best Time & Checklist',
  description:
    'A practical Umrah preparation guide: the Umrah e-visa process, required documents, the best time of year to travel (Ramadan, winter, off-peak), vaccinations and a complete packing checklist for pilgrims from Bangladesh.',
  alternates: { canonical: '/umrah/guideline' },
};

const bestTimeIcons = [Sparkles, Sun, CalendarHeart];

export default function UmrahGuidelinePage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const visaSteps = t.guideline.visaSteps;
  const documents = t.guideline.documents;
  const bestTimes = t.guideline.bestTimes.map((b, i) => ({ icon: bestTimeIcons[i], ...b }));
  const packing = t.guideline.packing;
  return (
    <>
      <PageHero
        eyebrow={t.guideline.hero.eyebrow}
        title={<>{t.guideline.hero.title}</>}
        lead={t.guideline.hero.lead}
        crumbs={[{ label: t.guideline.hero.crumbUmrah, href: localizedPath(locale, '/umrah') }, { label: t.guideline.hero.crumb }]}
      />

      {/* Visa process */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{t.guideline.visa.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.guideline.visa.titleA} <span className="text-gradient">{t.guideline.visa.titleB}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              {t.guideline.visa.p}
            </p>
            <ol className="mt-7 space-y-4">
              {visaSteps.map((s, i) => (
                <li key={s} className="flex items-start gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient font-display text-sm font-semibold text-white shadow-emerald">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-sm leading-relaxed text-ink-muted">{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-brand-gradient p-8 text-white shadow-emerald sm:p-10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold-300/20 blur-3xl" />
              <Plane className="h-9 w-9 text-gold-300" />
              <h3 className="mt-5 font-display text-xl font-semibold">{t.guideline.visa.sidebarHeading}</h3>
              <ul className="mt-5 space-y-3 text-sm text-white/85">
                {t.guideline.visa.sidebar.map((item) => (
                  <li key={item} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" /> {item}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Documents & vaccination */}
      <Section className="bg-sand-soft">
        <Container className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white">{t.guideline.docs.heading}</h2>
              <ul className="mt-6 space-y-3">
                {documents.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <Syringe className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white">{t.guideline.health.heading}</h2>
              <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-muted">
                {t.guideline.health.items.map((item) => (
                  <li key={item} className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {item}</li>
                ))}
              </ul>
              <p className="mt-5 rounded-2xl bg-brand-50/70 p-4 text-xs leading-relaxed text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
                {t.guideline.health.note}
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Best time */}
      <Section>
        <SectionHeading
          eyebrow={t.guideline.bestTimeSection.eyebrow}
          title={<>{t.guideline.bestTimeSection.titleA} <span className="text-gradient">{t.guideline.bestTimeSection.titleB}</span></>}
          lead={t.guideline.bestTimeSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-3">
            {bestTimes.map((tm, i) => (
              <Reveal key={tm.season} delay={i * 0.07}>
                <div className="h-full rounded-3xl border border-border bg-card p-7 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                    <tm.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{tm.season}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{tm.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Packing */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.guideline.packingSection.eyebrow}
          title={<>{t.guideline.packingSection.titleA} <span className="text-gradient">{t.guideline.packingSection.titleB}</span></>}
          lead={t.guideline.packingSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-3">
            {Object.entries(packing).map(([key, value], i) => (
              <Reveal key={key} delay={i * 0.07}>
                <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center gap-2">
                    <Luggage className="h-5 w-5 text-brand-600" />
                    <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{value.group}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {value.items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        title={t.guideline.cta.title}
        lead={t.guideline.cta.lead}
        message={t.guideline.cta.message}
      />
    </>
  );
}
