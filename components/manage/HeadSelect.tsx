'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { inputClass } from '@/components/manage/ui';
import { useLocale } from '@/components/providers/LocaleProvider';
import { cn } from '@/lib/utils';

export type HeadSelectOption = {
  id: string;
  name: string;
  /** Second line: code · phone … */
  sub?: string | null;
  /** Small pill on the right, e.g. the head subtype. */
  tag?: string | null;
};

/** Build searchable options from account-head rows (name · code · phone · subtype). */
export function toHeadOptions(
  heads: { id: string; name: string; code?: string | null; party_phone?: string | null; subtype?: string | null }[],
): HeadSelectOption[] {
  return heads.map((h) => ({
    id: h.id,
    name: h.name,
    sub: [h.code, h.party_phone].filter(Boolean).join(' · ') || null,
    tag: h.subtype ?? null,
  }));
}

const L = {
  en: { search: 'Type a name, mobile or code…', noMatch: 'No match found.', clear: 'Clear', none: '— None —' },
  bn: { search: 'নাম, মোবাইল বা কোড লিখুন…', noMatch: 'কোনো মিল পাওয়া যায়নি।', clear: 'মুছুন', none: '— কিছু না —' },
};

/**
 * Searchable account-head picker used on every entry form. Click opens the
 * full list (scrollable); typing filters by name, mobile number or code; arrow
 * keys + Enter pick. Renders a hidden input when `name` is given so plain
 * <form> submissions (FormData) keep working.
 */
export function HeadSelect({
  options,
  value,
  onChange,
  placeholder,
  name,
  disabled,
  allowClear = false,
  className,
}: {
  options: HeadSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = L[locale];
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const digits = q.replace(/\D/g, '');
    return options.filter((o) => {
      const hay = `${o.name} ${o.sub ?? ''} ${o.tag ?? ''}`.toLowerCase();
      if (hay.includes(q)) return true;
      if (digits.length >= 3) {
        const subDigits = (o.sub ?? '').replace(/\D/g, '');
        if (subDigits.includes(digits)) return true;
      }
      return false;
    });
  }, [options, query]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Keep the highlighted row in view while arrowing.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  function toggle() {
    if (disabled) return;
    setOpen((o) => {
      const next = !o;
      if (next) {
        setQuery('');
        setActive(Math.max(0, options.findIndex((x) => x.id === value)));
      }
      return next;
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = filtered[active];
      if (o) pick(o.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className={cn('relative', className)} ref={boxRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          inputClass,
          'flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-muted/60',
          open && 'border-brand-600 ring-2 ring-brand-600/20',
        )}
      >
        <span className={cn('min-w-0 truncate', !selected && 'text-ink-muted')}>
          {selected ? (
            <>
              {selected.name}
              {selected.sub && <span className="ml-1.5 text-xs text-ink-muted">· {selected.sub}</span>}
            </>
          ) : (
            placeholder ?? t.search
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {allowClear && selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="grid h-5 w-5 place-items-center rounded-full text-ink-muted hover:bg-muted"
              aria-label={t.clear}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-ink-muted transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              className={`${inputClass} pl-9`}
              placeholder={t.search}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {allowClear && (
              <li>
                <button
                  type="button"
                  onClick={() => pick('')}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-muted"
                >
                  {t.none}
                  {!value && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              </li>
            )}
            {filtered.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition',
                    i === active ? 'bg-brand-50' : 'hover:bg-muted',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.name}</span>
                    {o.sub && <span className="block truncate text-xs text-ink-muted">{o.sub}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {o.tag && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                        {o.tag}
                      </span>
                    )}
                    {o.id === value && <Check className="h-4 w-4 text-brand-600" />}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-ink-muted">{t.noMatch}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
