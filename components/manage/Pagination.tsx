'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZES, type Paged } from '@/lib/pagination';
import { useLocale } from '@/components/providers/LocaleProvider';
import { cn } from '@/lib/utils';

const L = {
  en: { showing: 'Showing', of: 'of', perPage: 'per page', prev: 'Previous', next: 'Next', page: 'Page' },
  bn: { showing: 'দেখানো হচ্ছে', of: 'এর মধ্যে', perPage: 'প্রতি পাতায়', prev: 'আগের', next: 'পরের', page: 'পাতা' },
};

/** Window of page numbers around the current page: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const lo = Math.max(2, page - 2);
  const hi = Math.min(pages - 1, page + 2);
  if (lo > 2) out.push('…');
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < pages - 1) out.push('…');
  out.push(pages);
  return out;
}

/**
 * Pagination bar for server-sliced lists: "Showing 1–25 of 164", a per-page
 * select (10 / 25 / 50 / 100) and Prev · 1 2 3 … · Next. Everything lives in
 * the URL (?page, ?per) so the server component re-renders the right slice and
 * the other filters on the page are preserved.
 */
export function Pagination({ paged, className }: { paged: Pick<Paged<unknown>, 'total' | 'page' | 'pages' | 'per' | 'start' | 'end'>; className?: string }) {
  const locale = useLocale();
  const t = L[locale];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(patch: { page?: number; per?: number }) {
    const next = new URLSearchParams(params.toString());
    if (patch.per !== undefined) {
      next.set('per', String(patch.per));
      next.delete('page');
    }
    if (patch.page !== undefined) {
      if (patch.page <= 1) next.delete('page');
      else next.set('page', String(patch.page));
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (paged.total === 0) return null;

  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className={cn('mt-4 flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
        <span>
          {t.showing} <span className="font-semibold text-ink">{paged.start}–{paged.end}</span> {t.of}{' '}
          <span className="font-semibold text-ink">{paged.total}</span>
        </span>
        <label className="inline-flex items-center gap-1.5">
          <select
            value={paged.per}
            onChange={(e) => go({ per: Number(e.target.value) })}
            className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-ink outline-none focus:border-brand-600"
            aria-label={t.perPage}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {t.perPage}
        </label>
      </div>

      {paged.pages > 1 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label={t.page}>
          <button type="button" className={btn} disabled={paged.page <= 1} onClick={() => go({ page: paged.page - 1 })}>
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{t.prev}</span>
          </button>
          {pageWindow(paged.page, paged.pages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-sm text-ink-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go({ page: p })}
                aria-current={p === paged.page ? 'page' : undefined}
                className={cn(btn, p === paged.page && 'border-brand-600 bg-brand-600 text-white hover:text-white')}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={btn} disabled={paged.page >= paged.pages} onClick={() => go({ page: paged.page + 1 })}>
            <span className="hidden sm:inline">{t.next}</span> <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
