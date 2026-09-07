'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';

type PackageOpt = { id: string; name: string };
type CareOfOpt = { id: string; name: string; code: string | null };

const ctrl =
  'h-10 rounded-xl border border-border bg-card px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20';

export const HAJJ_SORTS = ['newest', 'name', 'tracking', 'due', 'paid'] as const;
export type HajjSort = (typeof HAJJ_SORTS)[number];

const SORT_LABELS: Record<'en' | 'bn', Record<HajjSort, string>> = {
  en: { newest: 'Newest first', name: 'Name A–Z', tracking: 'Tracking no.', due: 'Due (high → low)', paid: 'Paid (high → low)' },
  bn: { newest: 'নতুন আগে', name: 'নাম (A–Z)', tracking: 'ট্র্যাকিং নং', due: 'বকেয়া (বেশি → কম)', paid: 'পরিশোধ (বেশি → কম)' },
};

/**
 * One-row filter bar for the Hajj pilgrim list: year, search, type, package,
 * gender, status, care-of, documents and sort. Every control applies on
 * change, lives in the URL and resets pagination to page 1.
 */
export function PilgrimFilters({
  year,
  years,
  packages,
  careOfs,
}: {
  year: number;
  years: number[];
  packages: PackageOpt[];
  careOfs: CareOfOpt[];
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!next.get('year')) next.set('year', String(year));
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  }

  const KEYS = ['q', 'reg_type', 'package', 'status', 'care_of', 'docs', 'gender', 'sort'];
  const hasFilters = KEYS.some((k) => params.get(k));
  const sel = (key: string) => params.get(key) ?? '';
  const yearLabel = locale === 'bn' ? 'সাল' : 'Year';

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
      <select
        className={`${ctrl} w-28 font-semibold text-brand-700`}
        value={String(year)}
        onChange={(e) => update('year', e.target.value)}
        aria-label={yearLabel}
        title={yearLabel}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <div className="relative w-52">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          className={`${ctrl} w-full pl-9`}
          placeholder={t.searchPlaceholder}
          defaultValue={sel('q')}
          onChange={(e) => {
            const v = e.target.value;
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => update('q', v.trim()), 350);
          }}
        />
      </div>
      <select className={`${ctrl} w-32`} value={sel('reg_type')} onChange={(e) => update('reg_type', e.target.value)}>
        <option value="">{t.allTypes}</option>
        <option value="pre-registration">{t.optPreRegistration}</option>
        <option value="registered">{t.optRegistered}</option>
      </select>
      <select className={`${ctrl} w-36`} value={sel('package')} onChange={(e) => update('package', e.target.value)}>
        <option value="">{t.allPackages}</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select className={`${ctrl} w-32`} value={sel('gender')} onChange={(e) => update('gender', e.target.value)}>
        <option value="">{ct.filterAllGenders}</option>
        <option value="male">{ct.male}</option>
        <option value="female">{ct.female}</option>
      </select>
      <select className={`${ctrl} w-32`} value={sel('status')} onChange={(e) => update('status', e.target.value)}>
        <option value="">{t.allStatuses}</option>
        <option value="active">{t.optActive}</option>
        <option value="completed">{t.optCompleted}</option>
        <option value="cancelled">{t.optCancelled}</option>
      </select>
      <select className={`${ctrl} w-36`} value={sel('care_of')} onChange={(e) => update('care_of', e.target.value)}>
        <option value="">{ct.filterAllCare}</option>
        <option value="none">{ct.filterNoCare}</option>
        {careOfs.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {a.code ? ` · ${a.code}` : ''}
          </option>
        ))}
      </select>
      <select className={`${ctrl} w-36`} value={sel('docs')} onChange={(e) => update('docs', e.target.value)}>
        <option value="">{ct.filterAllDocs}</option>
        <option value="complete">{ct.filterDocsComplete}</option>
        <option value="incomplete">{ct.filterDocsIncomplete}</option>
      </select>
      <label className="inline-flex items-center gap-1">
        <ArrowUpDown className="h-4 w-4 text-ink-muted" />
        <select className={`${ctrl} w-40`} value={sel('sort') || 'newest'} onChange={(e) => update('sort', e.target.value === 'newest' ? '' : e.target.value)}>
          {HAJJ_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[locale][s]}
            </option>
          ))}
        </select>
      </label>
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace(`${pathname}?year=${year}`)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-ink-muted transition hover:bg-muted"
          aria-label={t.reset}
          title={t.reset}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
