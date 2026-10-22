import type { Metadata } from 'next';
import { FileText, Syringe, Luggage, CheckCircle2, XCircle, CalendarRange, Wallet, Check } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CtaBand } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/hajjpages';

export const metadata: Metadata = {
  title: 'Hajj Guideline — Documents, Vaccination, Packing & Preparation',
  description:
    'A practical Hajj preparation guide: required documents, mandatory meningitis & Covid vaccinations, a complete packing checklist, do’s and don’ts of Ihram, important Dhul-Hijjah dates and money tips for pilgrims from Bangladesh.',
  alternates: { canonical: '/hajj/guideline' },
};

export default function HajjGuidelinePage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const documents = t.guideline.documents;
  const packing = t.guideline.packing;
  const dos = t.guideline.dos;
  const donts = t.guideline.donts;
  const dates = t.guideline.dates;
  const moneyTips = t.guideline.moneyTips;
  return (
    <>
      <PageHero
        eyebrow={t.guideline.hero.eyebrow}
        title={<>{t.guideline.hero.title}</>}
        lead={t.guideline.hero.lead}
        crumbs={[{ label: t.guideline.hero.crumbHajj, href: localizedPath(locale, '/hajj') }, { label: t.guideline.hero.crumb }]}
      />

      {/* Documents & vaccination */}
      <Section>
        <Container className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink dark:text-white">{t.guideline.docs.heading}</h2>
              <p className="mt-2 text-sm text-ink-muted">{t.guideline.docs.lead}</p>
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
              <p className="mt-2 text-sm text-ink-muted">{t.guideline.health.lead}</p>
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

      {/* Packing checklist */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.guideline.packingSection.eyebrow}
          title={<>{t.guideline.packingSection.titleA} <span className="text-gradient">{t.guideline.packingSection.titleB}</span></>}
          lead={t.guideline.packingSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(packing).map(([key, section], i) => (
              <Reveal key={key} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center gap-2">
                    <Luggage className="h-5 w-5 text-brand-600" />
                    <h3 className="font-display text-lg font-semibold text-ink dark:text-white">{section.group}</h3>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {section.items.map((it) => (
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

      {/* Do's & Don'ts */}
      <Section>
        <SectionHeading
          eyebrow={t.guideline.etiquette.eyebrow}
          title={<>{t.guideline.etiquette.titleA} <span className="text-gradient">{t.guideline.etiquette.titleB}</span></>}
          lead={t.guideline.etiquette.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink dark:text-white">
                  <CheckCircle2 className="h-6 w-6 text-brand-600" /> {t.guideline.etiquette.doHeading}
                </h3>
                <ul className="mt-6 space-y-3">
                  {dos.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink dark:text-white">
                  <XCircle className="h-6 w-6 text-gold-600" /> {t.guideline.etiquette.dontHeading}
                </h3>
                <ul className="mt-6 space-y-3">
                  {donts.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Important dates */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.guideline.datesSection.eyebrow}
          title={<>{t.guideline.datesSection.titleA} <span className="text-gradient">{t.guideline.datesSection.titleB}</span></>}
          lead={t.guideline.datesSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dates.map((d, i) => (
              <Reveal key={d.date} delay={i * 0.06}>
                <div className="h-full rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                    <CalendarRange className="h-6 w-6" />
                  </div>
                  <div className="mt-4 font-display text-base font-semibold text-gradient">{d.date}</div>
                  <div className="mt-1 font-display text-sm font-semibold text-ink dark:text-white">{d.label}</div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">{d.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-ink-muted">
            {t.guideline.datesSection.note}
          </p>
        </Container>
      </Section>

      {/* Money tips */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{t.guideline.money.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.guideline.money.titleA} <span className="text-gradient">{t.guideline.money.titleB}</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-muted">
              {t.guideline.money.p}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                <Wallet className="h-6 w-6" />
              </div>
              <ul className="mt-6 space-y-3">
                {moneyTips.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
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
