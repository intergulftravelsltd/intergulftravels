'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { inputClass } from '@/components/manage/ui';
import { useLocale } from '@/components/providers/LocaleProvider';
import { presetRange, type RangeKey } from '@/lib/date-range';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  Date-range filter shared by the dashboard and the ledger pages —
 *  a single dropdown pill (instead of the old row of preset buttons).
 *  Presets push from/to into the URL so the server component re-renders
 *  scoped to the chosen window; Custom reveals from/to pickers inside
 *  the menu. "Lifetime" clears the dates (show everything).
 * ------------------------------------------------------------------ */

const ORDER: RangeKey[] = ['this-month', 'last-month', 'this-year', 'last-year', 'lifetime', 'custom'];

const LABELS: Record<'en' | 'bn', Record<RangeKey | 'from' | 'to' | 'apply', string>> = {
  en: {
    'this-month': 'This month',
    'last-month': 'Last month',
    'this-year': 'This year',
    'last-year': 'Last year',
    lifetime: 'Lifetime',
    custom: 'Custom range',
    from: 'From',
    to: 'To',
    apply: 'Apply',
  },
  bn: {
    'this-month': 'এই মাস',
    'last-month': 'গত মাস',
    'this-year': 'এই বছর',
    'last-year': 'গত বছর',
    lifetime: 'সর্বকালীন',
    custom: 'কাস্টম রেঞ্জ',
    from: 'থেকে',
    to: 'পর্যন্ত',
    apply: 'দেখুন',
  },
};

const fmtShort = (d: string, locale: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });
};

export function DateRangeFilter({ from, to, range }: { from: string; to: string; range: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const locale = useLocale();
  const L = LABELS[locale];

  const active = (range || (from || to ? 'custom' : 'lifetime')) as RangeKey;

  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function apply(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function choose(key: RangeKey) {
    if (key === 'custom') return; // handled by the Apply button below
    const r = presetRange(key);
    apply({ range: key, from: r.from, to: r.to });
    setOpen(false);
  }

  const buttonLabel =
    active === 'custom' && (from || to)
      ? `${from ? fmtShort(from, locale) : '…'} — ${to ? fmtShort(to, locale) : '…'}`
      : L[active];

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          // Flip the menu to whichever side has room (the pill sits on the
          // right of the dashboard header but on the left of ledger toolbars).
          const rect = e.currentTarget.getBoundingClientRect();
          setAlignRight(rect.left + 264 > window.innerWidth);
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:border-brand-600/40 hover:text-brand-700',
          open && 'border-brand-600/50 text-brand-700 ring-2 ring-brand-600/15',
        )}
      >
        <CalendarDays className="h-4 w-4 text-brand-700" />
        {buttonLabel}
        <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 mt-2 w-64 animate-fade-up rounded-2xl border border-border bg-card p-1.5 shadow-emerald [animation-duration:200ms]',
            alignRight ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {ORDER.filter((k) => k !== 'custom').map((key) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={active === key}
              onClick={() => choose(key)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition',
                active === key ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-muted/70',
              )}
            >
              {L[key]}
              {active === key && <Check className="h-4 w-4" />}
            </button>
          ))}

          <div className="my-1.5 h-px bg-border/70" />

          <div className={cn('rounded-xl px-3.5 py-2.5', active === 'custom' && 'bg-brand-50/60')}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{L.custom}</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-ink-muted">
                {L.from}
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className={`${inputClass} mt-1 h-9 py-1`}
                />
              </label>
              <label className="block text-xs font-medium text-ink-muted">
                {L.to}
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className={`${inputClass} mt-1 h-9 py-1`}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  apply({ range: 'custom', from: draftFrom, to: draftTo });
                  setOpen(false);
                }}
                className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-emerald transition hover:bg-brand-700"
              >
                {L.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
