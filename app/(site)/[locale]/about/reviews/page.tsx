import type { Metadata } from 'next';
import { ArrowRight, Star, Quote, ThumbsUp, Repeat, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Section, SectionHeading } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealGroup } from '@/components/ui/Reveal';
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop';
import { testimonials } from '@/lib/site';
import { cn } from '@/lib/utils';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/about';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.reviews.meta.title,
    description: t.reviews.meta.description,
    alternates: { canonical: '/about/reviews' },
  };
}

type Review = { name: string; role: string; quote: string; rating: number };

const ratingBreakdown = [
  { stars: 5, pct: 94 },
  { stars: 4, pct: 5 },
  { stars: 3, pct: 1 },
  { stars: 2, pct: 0 },
  { stars: 1, pct: 0 },
];

const highlightIcons = [Repeat, ThumbsUp, ShieldCheck];

function Stars({ rating, ariaLabel, className }: { rating: number; ariaLabel: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5 text-gold-500', className)} aria-label={ariaLabel}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-4 w-4', i < rating ? 'fill-current' : 'fill-none text-gold-500/30')} />
      ))}
    </div>
  );
}

const avatarGradients = [
  'from-brand-600 to-brand-900',
  'from-gold-500 to-gold-700',
  'from-brand-500 to-brand-800',
  'from-brand-700 to-gold-600',
];

export default function ReviewsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale).reviews;
  // Translate the curated lib/site testimonials via the dict, keyed by name.
  const siteReviews: Review[] = testimonials.map((tt) => {
    const tr = t.siteTestimonials[tt.name as keyof typeof t.siteTestimonials];
    return tr ? { ...tt, role: tr.role, quote: tr.quote } : tt;
  });
  const allReviews: Review[] = [...siteReviews, ...t.extraReviews];
  const highlights = t.highlights.map((h, i) => ({ icon: highlightIcons[i], ...h }));
  return (
    <>
      <PageHero
        eyebrow={t.hero.eyebrow}
        title={
          <>
            {t.hero.titleA}<span className="text-gradient-gold">{t.hero.titleHighlight}</span>
          </>
        }
        lead={t.hero.lead}
        crumbs={[{ label: t.hero.crumbAbout, href: localizedPath(locale, '/about') }, { label: t.hero.crumb }]}
      />

      {/* Rating summary */}
      <Section className="relative overflow-hidden">
        <AuroraBackdrop />
        <Container>
          <Reveal className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
            <div className="grid gap-0 md:grid-cols-[0.8fr_1.2fr]">
              {/* score */}
              <div className="flex flex-col items-center justify-center gap-3 bg-brand-gradient p-10 text-center text-white">
                <div className="font-display text-6xl font-semibold text-gold-300">{t.summary.score}</div>
                <Stars rating={5} ariaLabel={`5 ${t.starsAria}`} className="text-gold-300" />
                <p className="text-sm text-white/80">
                  {t.summary.averageA}<span className="font-semibold text-white">{t.summary.averageCount}</span>{t.summary.averageB}
                </p>
              </div>
              {/* breakdown */}
              <div className="p-8 sm:p-10">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-white">{t.summary.breakdownTitle}</h2>
                <div className="mt-5 space-y-3">
                  {ratingBreakdown.map((r) => (
                    <div key={r.stars} className="flex items-center gap-3">
                      <span className="flex w-12 items-center gap-1 text-sm font-medium text-ink-muted">
                        {r.stars} <Star className="h-3.5 w-3.5 fill-current text-gold-500" />
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-50 dark:bg-brand-900/40">
                        <div
                          className="h-full rounded-full bg-gold-gradient"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-ink-muted">{r.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* highlights */}
          <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-3">
            {highlights.map((h) => (
              <Reveal key={h.label}>
                <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <span className="ring-gradient grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-gold-300">
                    <h.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-display text-2xl font-semibold text-ink dark:text-white">{h.value}</div>
                    <p className="text-sm text-ink-muted">{h.label}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Reviews grid */}
      <Section className="bg-sand-soft">
        <SectionHeading
          eyebrow={t.grid.eyebrow}
          title={
            <>
              {t.grid.titleA}<span className="text-gradient">{t.grid.titleHighlight}</span>
            </>
          }
          lead={t.grid.lead}
        />
        <Container className="mt-12">
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allReviews.map((r, i) => (
              <Reveal key={r.name + i} className="h-full">
                <article className="relative flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-gold">
                  <Quote className="h-8 w-8 text-gold-400/40" />
                  <Stars rating={r.rating} ariaLabel={`${r.rating} ${t.starsAria}`} className="mt-3" />
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink dark:text-white/90">“{r.quote}”</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                    <span
                      className={cn(
                        'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br font-display text-base font-semibold text-white',
                        avatarGradients[i % avatarGradients.length],
                      )}
                      aria-hidden
                    >
                      {r.name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink dark:text-white">{r.name}</div>
                      <div className="text-xs text-ink-muted">{r.role}</div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* CTA — leave a review */}
      <section className="relative py-20 sm:py-24">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-14 text-center shadow-emerald sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto flex w-fit items-center gap-1 text-gold-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-current" />
                ))}
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl balance">
                {t.cta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                {t.cta.lead}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/contact')} variant="gold" size="lg">
                  {t.cta.leave} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={localizedPath(locale, '/hajj/packages')} variant="light" size="lg">
                  {t.cta.explore}
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
