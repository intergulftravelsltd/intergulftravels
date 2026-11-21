'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ListFilter } from 'lucide-react';

export type HeadSectionOption = { value: string; label: string; count: number };

/**
 * Section picker for the Account Heads page: Customer / Passenger Ledger,
 * Assets, Liabilities, Income, Expenses, Equity or All. The choice lives in
 * ?section= so the server renders only that section; "all" clears it.
 */
export function HeadSectionFilter({
  options,
  value,
  label,
}: {
  options: HeadSectionOption[];
  value: string;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function choose(next: string) {
    const sp = new URLSearchParams(params.toString());
    if (next === 'all') sp.delete('section');
    else sp.set('section', next);
    sp.delete('page');
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <label className="inline-flex items-center gap-2">
      <ListFilter className="h-4 w-4 text-ink-muted" aria-hidden />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => choose(e.target.value)}
        aria-label={label}
        className="h-10 min-w-[15rem] rounded-xl border border-border bg-card px-3 text-sm font-medium text-ink shadow-soft outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
    </label>
  );
}
