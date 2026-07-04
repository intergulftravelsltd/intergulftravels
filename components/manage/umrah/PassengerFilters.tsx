'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { inputClass } from '@/components/manage/ui';
import { BRANCHES } from '@/lib/management/branches';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { useLockedBranch } from '@/components/providers/BranchScope';

type PackageOpt = { id: string; name: string };
type CareOfOpt = { id: string; name: string; code: string | null };

export function PassengerFilters({ packages, careOfs = [] }: { packages: PackageOpt[]; careOfs?: CareOfOpt[] }) {
  const locale = useLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const lockedBranch = useLockedBranch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const hasFilters = ['q', 'package', 'branch', 'status', 'expiring', 'docs', 'care_of'].some((k) => params.get(k));

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          className={`${inputClass} pl-9`}
          placeholder={t.searchPlaceholder}
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => update('q', e.target.value)}
        />
      </div>

      <select className={inputClass} value={params.get('package') ?? ''} onChange={(e) => update('package', e.target.value)}>
        <option value="">{t.allPackages}</option>
        <option value="unassigned">{t.filterUnassigned}</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {!lockedBranch && (
        <select className={inputClass} value={params.get('branch') ?? ''} onChange={(e) => update('branch', e.target.value)}>
          <option value="">{t.allBranches}</option>
          {BRANCHES.map((b) => (
            <option key={b.value} value={b.value}>{b.short}</option>
          ))}
        </select>
      )}

      <select className={inputClass} value={params.get('status') ?? ''} onChange={(e) => update('status', e.target.value)}>
        <option value="">{t.allStatuses}</option>
        <option value="active">{t.optActive}</option>
        <option value="completed">{t.optCompleted}</option>
        <option value="cancelled">{t.optCancelled}</option>
      </select>

      <select className={inputClass} value={params.get('care_of') ?? ''} onChange={(e) => update('care_of', e.target.value)}>
        <option value="">{ct.filterAllCare}</option>
        <option value="none">{ct.filterNoCare}</option>
        {careOfs.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {a.code ? ` · ${a.code}` : ''}
          </option>
        ))}
      </select>

      <select className={inputClass} value={params.get('docs') ?? ''} onChange={(e) => update('docs', e.target.value)}>
        <option value="">{ct.filterAllDocs}</option>
        <option value="complete">{ct.filterDocsComplete}</option>
        <option value="incomplete">{ct.filterDocsIncomplete}</option>
      </select>

      <div className="flex items-center gap-2">
        <select className={inputClass} value={params.get('expiring') ?? ''} onChange={(e) => update('expiring', e.target.value)}>
          <option value="">{t.anyPassport}</option>
          <option value="1">{t.expiringSixMonths}</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(pathname)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-ink-muted transition hover:bg-muted"
            aria-label={t.clearFilters}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
