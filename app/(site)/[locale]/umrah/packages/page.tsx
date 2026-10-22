import type { Metadata } from 'next';
import { Check, X, CreditCard, CalendarClock, FileText, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Accordion } from '@/components/ui/Accordion';
import { getSitePackages } from '@/lib/site-packages';
import { PackageCard, CtaBand } from '@/components/hajj-umrah/shared';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/umrahpages';

export const metadata: Metadata = {
  title: 'Umrah Packages — Economy, Family & Premium from Dhaka',
  description:
    'Compare Inter Gulf Travels’ Umrah packages: Economy from ৳1,15,000, Family ৳1,55,000 and Premium ৳1,85,000 per person. Year-round departures, full inclusions, comparison table, booking notes and FAQs.',
  alternates: { canonical: '/umrah/packages' },
};

const bookingIcons = [CreditCard, CalendarClock, FileText, ShieldCheck];

export default async function UmrahPackagesPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const { umrah: umrahPackages } = await getSitePackages(locale);
  const compareRows = t.packages.compareRows;
  const included = t.packages.included;
  const notIncluded = t.packages.notIncluded;
  const bookingNotes = t.packages.bookingNotes.map((n, i) => ({ icon: bookingIcons[i], ...n }));
  return (
    <>
      <PageHero
        eyebrow={t.packages.hero.eyebrow}
        title={<>{t.packages.hero.title}</>}
        lead={t.packages.hero.lead}
        crumbs={[{ label: t.packages.hero.crumbUmrah, href: localizedPath(locale, '/umrah') }, { label: t.packages.hero.crumb }]}
      />

      {/* Cards */}
      <Section>
        <SectionHeading
          eyebrow={t.packages.cards.eyebrow}
          title={<>{t.packages.cards.titleA} <span className="text-gradient">{t.packages.cards.titleB}</span></>}
          lead={t.packages.cards.lead}
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
            {t.packages.cards.note}
          </p>
        </Container>
      </Section>

      {/* Comparison */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.packages.compare.eyebrow}
          title={<>{t.packages.compare.titleA} <span className="text-gradient">{t.packages.compare.titleB}</span></>}
          lead={t.packages.compare.lead}
        />
        <Container className="mt-14">
          <Reveal className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-brand-gradient text-white">
                    <th className="px-5 py-4 font-display text-base font-semibold">{t.packages.compare.feature}</th>
                    <th className="px-5 py-4 font-display text-base font-semibold">{t.packages.compare.economy}</th>
                    <th className="px-5 py-4 font-display text-base font-semibold">{t.packages.compare.family}</th>
                    <th className="px-5 py-4 font-display text-base font-semibold">
                      {t.packages.compare.premium} <span className="ml-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[0.65rem] font-bold uppercase text-brand-900">{t.packages.compare.bestValue}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 1 ? 'bg-brand-50/40 dark:bg-brand-900/15' : ''}>
                      <th className="px-5 py-4 font-semibold text-ink dark:text-white">{row.label}</th>
                      <td className="px-5 py-4 text-ink-muted">{row.economy}</td>
                      <td className="px-5 py-4 text-ink-muted">{row.family}</td>
                      <td className="px-5 py-4 text-ink-muted">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <p className="mt-4 text-center text-xs text-ink-muted">{t.packages.compare.scrollHint}</p>
        </Container>
      </Section>

      {/* Included / Not included */}
      <Section>
        <SectionHeading
          eyebrow={t.packages.incl.eyebrow}
          title={<>{t.packages.incl.titleA} <span className="text-gradient">{t.packages.incl.titleB}</span> {t.packages.incl.titleC}</>}
          lead={t.packages.incl.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink dark:text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-white">
                    <Check className="h-4 w-4" />
                  </span>
                  {t.packages.incl.includedHeading}
                </h3>
                <ul className="mt-6 space-y-3">
                  {included.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-ink dark:text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-gradient text-brand-900">
                    <X className="h-4 w-4" />
                  </span>
                  {t.packages.incl.notIncludedHeading}
                </h3>
                <ul className="mt-6 space-y-3">
                  {notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Booking notes */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.packages.booking.eyebrow}
          title={<>{t.packages.booking.titleA} <span className="text-gradient">{t.packages.booking.titleB}</span></>}
          lead={t.packages.booking.lead}
        />
        <Container className="mt-14">
          <div className="grid gap-6 sm:grid-cols-2">
            {bookingNotes.map((n, i) => (
              <Reveal key={n.title} delay={(i % 2) * 0.08}>
                <div className="flex h-full gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                    <n.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink dark:text-white">{n.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{n.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <div className="text-center">
            <Eyebrow className="mx-auto">{t.packages.faq.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink dark:text-white sm:text-4xl balance">
              {t.packages.faq.titleA} <span className="text-gradient">{t.packages.faq.titleB}</span>
            </h2>
          </div>
          <Reveal className="mt-10">
            <Accordion items={t.packages.umrahFaqs} />
          </Reveal>
          <p className="mt-6 text-center text-sm text-ink-muted">
            {t.packages.faq.differentA}{' '}
            <a href={localizedPath(locale, '/umrah/faq')} className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
              {t.packages.faq.differentLink}
            </a>
          </p>
        </Container>
      </Section>

      <CtaBand
        title={t.packages.cta.title}
        lead={t.packages.cta.lead}
        message={t.packages.cta.message}
      />
    </>
  );
}
