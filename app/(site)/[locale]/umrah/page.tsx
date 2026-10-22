import type { Metadata } from 'next';
import { ArrowRight, Plane, BedDouble, Utensils, MapPinned, Bus, BadgeCheck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { packages, whyUs } from '@/lib/site';
import { Icon } from '@/components/ui/Icon';
import { PackageCard, CtaBand, NavLinkCard } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/umrahpages';

export const metadata: Metadata = {
  title: 'Umrah Packages — Year-Round Umrah from Bangladesh',
  description:
    'Perform Umrah any time of year with Inter Gulf Travels Ltd (Hajj License No. 071). Economy, Family and Premium Umrah packages from Dhaka with air tickets, e-visa, hotels near the Haramain and guided Ziyarat.',
  alternates: { canonical: '/umrah' },
};

const umrahPackages = packages.filter((p) => p.type === 'umrah');

const inclusionIcons = [Plane, BedDouble, Bus, MapPinned, Utensils, BadgeCheck];

export default function UmrahPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const inclusions = t.index.inclusions.map((item, i) => ({ icon: inclusionIcons[i], ...item }));
  return (
    <>
      <PageHero
        eyebrow={t.index.hero.eyebrow}
        title={<>{t.index.hero.title}</>}
        lead={t.index.hero.lead}
        crumbs={[{ label: t.index.hero.crumb }]}
      />

      {/* What Umrah is */}
      <Section>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>{t.index.what.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.index.what.titleA} <span className="text-gradient">{t.index.what.titleB}</span>
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-muted">
              <p>
                {t.index.what.p1}
              </p>
              <p>
                {t.index.what.p2A}<em>{t.index.what.p2Quote}</em>{t.index.what.p2B}
              </p>
              <p>
                {t.index.what.p3}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={localizedPath(locale, '/umrah/packages')} variant="primary">
                {t.index.what.viewPackages} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href={localizedPath(locale, '/umrah/guide')} variant="outline">
                {t.index.what.readGuide}
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-brand-gradient p-8 text-white shadow-emerald sm:p-10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold-300/20 blur-3xl" />
              <p className="font-display text-lg italic leading-relaxed">
                {t.index.what.quote}
              </p>
              <p className="mt-3 text-sm text-white/75">{t.index.what.quoteRef}</p>
              <div className="mt-7 space-y-4 border-t border-white/15 pt-6 text-sm text-white/85">
                {t.index.what.points.map((point) => (
                  <p key={point} className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-300" /> {point}</p>
                ))}
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Why us */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.index.why.eyebrow}
          title={<>{t.index.why.titleA} <span className="text-gradient">{t.index.why.titleB}</span></>}
          lead={t.index.why.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.index.whyUs.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    <Icon name={whyUs[i].icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Packages */}
      <Section>
        <SectionHeading
          eyebrow={t.index.packagesSection.eyebrow}
          title={<>{t.index.packagesSection.titleA} <span className="text-gradient">{t.index.packagesSection.titleB}</span></>}
          lead={t.index.packagesSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 lg:grid-cols-3">
            {umrahPackages.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <PackageCard pkg={p} />
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted">
            {t.index.packagesSection.noteA}{' '}
            <a href={localizedPath(locale, '/umrah/packages')} className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
              {t.index.packagesSection.noteLink}
            </a>
          </p>
        </Container>
      </Section>

      {/* Inclusions */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.index.inclusionsSection.eyebrow}
          title={<>{t.index.inclusionsSection.titleA} <span className="text-gradient">{t.index.inclusionsSection.titleB}</span></>}
          lead={t.index.inclusionsSection.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {inclusions.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="flex h-full gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-emerald">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink dark:text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Process */}
      <Section>
        <SectionHeading
          eyebrow={t.index.process.eyebrow}
          title={<>{t.index.process.titleA} <span className="text-gradient">{t.index.process.titleB}</span></>}
          lead={t.index.process.lead}
        />
        <Container className="mt-14">
          <div className="relative">
            <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-brand-600/30 to-transparent lg:block" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.index.processSteps.map((step, i) => (
                <Reveal key={step.step} delay={i * 0.1} className="relative text-center lg:text-left">
                  <div
                    className="relative z-10 mx-auto grid place-items-center rounded-2xl bg-brand-gradient font-display text-2xl font-semibold text-white shadow-emerald lg:mx-0"
                    style={{ height: '4.5rem', width: '4.5rem' }}
                  >
                    {step.step}
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Explore */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.index.explore.eyebrow}
          title={<>{t.index.explore.titleA} <span className="text-gradient">{t.index.explore.titleB}</span></>}
          lead={t.index.explore.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.index.subPages.map((p, i) => (
              <Reveal key={p.href} delay={i * 0.05}>
                <NavLinkCard href={localizedPath(locale, p.href)} title={p.title} description={p.description} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        title={t.index.cta.title}
        lead={t.index.cta.lead}
        message={t.index.cta.message}
      />
    </>
  );
}
