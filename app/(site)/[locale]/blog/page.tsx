import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, Mail } from 'lucide-react';
import { getPosts, coverFor } from '@/lib/blog';
import { PageHero } from '@/components/layout/PageHero';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogSearchBox } from '@/components/blog/BlogSearchBox';
import { Pagination } from '@/components/blog/Pagination';
import { cn, formatDate } from '@/lib/utils';
import { siteConfig } from '@/lib/site';
import { getLocale, setRequestLocale, toLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/blog';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = getDict(toLocale(params.locale));
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: '/blog' },
    openGraph: {
      title: `${t.meta.ogTitle} · ${siteConfig.name}`,
      description: t.meta.ogDescription,
      url: '/blog',
      type: 'website',
    },
  };
}

const tabValues = [
  { key: 'all' as const, value: 'all' },
  { key: 'hajjUmrah' as const, value: 'hajj-umrah' },
  { key: 'others' as const, value: 'others' },
] as const;

const FIRST_PAGE_GRID = 6; // page 1: featured + 6 = 7
const PER_PAGE = 9; // page 2+: 9 (and 9 per page while searching)

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { category?: string; page?: string; search?: string };
}) {
  setRequestLocale(toLocale(params.locale));
  const locale = getLocale();
  const t = getDict(locale);
  const category = searchParams?.category ?? 'all';
  const activeCategory = tabValues.some((tab) => tab.value === category) ? category : 'all';
  const search = (searchParams?.search ?? '').trim();
  const searching = search.length > 0;
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? '1', 10) || 1);

  const all = await getPosts({ category: activeCategory });
  const q = search.toLowerCase();
  const matches = searching
    ? all.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : all;

  // Featured headlines page 1 of the unfiltered "All" view only.
  const featured =
    !searching && page === 1 && activeCategory === 'all' ? matches.find((p) => p.featured) : undefined;
  const grid = featured ? matches.filter((p) => p.slug !== featured.slug) : matches;

  let pagePosts: typeof grid;
  let totalPages: number;
  if (searching) {
    totalPages = Math.max(1, Math.ceil(grid.length / PER_PAGE));
    pagePosts = grid.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  } else {
    totalPages = grid.length <= FIRST_PAGE_GRID ? 1 : 1 + Math.ceil((grid.length - FIRST_PAGE_GRID) / PER_PAGE);
    pagePosts =
      page === 1
        ? grid.slice(0, FIRST_PAGE_GRID)
        : grid.slice(FIRST_PAGE_GRID + (page - 2) * PER_PAGE, FIRST_PAGE_GRID + (page - 1) * PER_PAGE);
  }

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (activeCategory !== 'all') sp.set('category', activeCategory);
    if (search) sp.set('search', search);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return localizedPath(locale, qs ? `/blog?${qs}` : '/blog');
  };

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
        crumbs={[{ label: t.hero.crumb }]}
      />

      {/* Featured article (page 1, unfiltered) */}
      {featured && (
        <section className="relative pt-16 sm:pt-20">
          <Container>
            <Reveal>
              <Link
                href={localizedPath(locale, `/blog/${featured.slug}`)}
                className="group grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft transition-all duration-300 hover:shadow-emerald lg:grid-cols-2"
              >
                <div className="relative min-h-[16rem] overflow-hidden bg-brand-950 lg:min-h-full">
                  <Image
                    src={coverFor(featured)}
                    alt={featured.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wide text-brand-900 shadow-gold">
                    {t.featured.badge}
                  </div>
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-brand-800">
                    {featured.categoryLabel}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-ink transition-colors group-hover:text-brand-700 sm:text-3xl dark:text-white">
                    {featured.title}
                  </h2>
                  <p className="mt-4 line-clamp-3 text-base leading-relaxed text-ink-muted">{featured.excerpt}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(featured.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {featured.readTime}
                    </span>
                    <span>{t.featured.by} {featured.author}</span>
                  </div>
                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    {t.featured.readFull}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Tabs + search + paginated grid */}
      <section className="relative py-16 sm:py-20">
        <Container>
          <Reveal className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
            {tabValues.map((tab) => {
              const isActive = activeCategory === tab.value;
              const href = localizedPath(
                locale,
                tab.value === 'all' ? '/blog' : `/blog?category=${tab.value}`,
              );
              return (
                <Link
                  key={tab.value}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'border-transparent bg-brand-600 text-white shadow-emerald'
                      : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
                  )}
                >
                  {t.tabs[tab.key]}
                </Link>
              );
            })}
          </Reveal>

          <BlogSearchBox />

          {pagePosts.length > 0 ? (
            <>
              {searching && (
                <p className="mb-8 text-center text-sm text-ink-muted">
                  {matches.length}{' '}
                  {matches.length === 1 ? t.list.resultsSingular : t.list.resultsPlural} “{search}”
                </p>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pagePosts.map((post, i) => (
                  <Reveal key={post.slug} delay={(i % 3) * 0.06}>
                    <BlogCard post={post} />
                  </Reveal>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} hrefFor={hrefFor} />
            </>
          ) : (
            <p className="py-16 text-center text-ink-muted">
              {searching ? t.list.emptySearch(search) : t.list.emptyCategory}
            </p>
          )}
        </Container>
      </section>

      {/* Newsletter / consultation CTA strip */}
      <section className="relative pb-24">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-7 py-12 shadow-emerald sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl" />
            </div>
            <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-200">
                  <Mail className="h-3.5 w-3.5" /> {t.cta.eyebrow}
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {t.cta.heading}
                </h2>
                <p className="mt-3 text-base text-white/80">
                  {t.cta.body}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href={localizedPath(locale, '/contact')} variant="gold" size="lg">
                  {t.cta.advisor} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={localizedPath(locale, '/estimate')} variant="light" size="lg">
                  {t.cta.estimate}
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
