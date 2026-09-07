'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { BRANCHES } from '@/lib/management/branches';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { useLockedBranch } from '@/components/providers/BranchScope';

type PackageOpt = { id: string; name: string };
type CareOfOpt = { id: string; name: string; code: string | null };

const ctrl =
  'h-10 rounded-xl border border-border bg-card px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20';

export const UMRAH_SORTS = ['newest', 'name', 'due', 'paid', 'expiry'] as const;
export type UmrahSort = (typeof UMRAH_SORTS)[number];

const SORT_LABELS: Record<'en' | 'bn', Record<UmrahSort, string>> = {
  en: { newest: 'Newest first', name: 'Name A–Z', due: 'Due (high → low)', paid: 'Paid (high → low)', expiry: 'Passport expiry (soonest)' },
  bn: { newest: 'নতুন আগে', name: 'নাম (A–Z)', due: 'বকেয়া (বেশি → কম)', paid: 'পরিশোধ (বেশি → কম)', expiry: 'পাসপোর্ট মেয়াদ (আগে শেষ)' },
};

/** One-row filter bar for the Umrah passenger list — every control applies on change and resets to page 1. */
export function PassengerFilters({ packages, careOfs = [] }: { packages: PackageOpt[]; careOfs?: CareOfOpt[] }) {
  const locale = useLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const lockedBranch = useLockedBranch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.replace(`${pathname}?${next.toString()}`);
  }

  const hasFilters = ['q', 'package', 'branch', 'status', 'expiring', 'docs', 'care_of', 'gender', 'sort'].some((k) => params.get(k));
  const sel = (key: string) => params.get(key) ?? '';

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
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

      <select className={`${ctrl} w-36`} value={sel('package')} onChange={(e) => update('package', e.target.value)}>
        <option value="">{t.allPackages}</option>
        <option value="unassigned">{t.filterUnassigned}</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select className={`${ctrl} w-32`} value={sel('gender')} onChange={(e) => update('gender', e.target.value)}>
        <option value="">{ct.filterAllGenders}</option>
        <option value="male">{ct.male}</option>
        <option value="female">{ct.female}</option>
      </select>

      {!lockedBranch && (
        <select className={`${ctrl} w-32`} value={sel('branch')} onChange={(e) => update('branch', e.target.value)}>
          <option value="">{t.allBranches}</option>
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>{b.short}</option>
          ))}
        </select>
      )}

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

      <select className={`${ctrl} w-36`} value={sel('expiring')} onChange={(e) => update('expiring', e.target.value)}>
        <option value="">{t.anyPassport}</option>
        <option value="1">{t.expiringSixMonths}</option>
      </select>

      <label className="inline-flex items-center gap-1">
        <ArrowUpDown className="h-4 w-4 text-ink-muted" />
        <select className={`${ctrl} w-44`} value={sel('sort') || 'newest'} onChange={(e) => update('sort', e.target.value === 'newest' ? '' : e.target.value)}>
          {UMRAH_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[locale][s]}
            </option>
          ))}
        </select>
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-ink-muted transition hover:bg-muted"
          aria-label={t.clearFilters}
          title={t.clearFilters}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
