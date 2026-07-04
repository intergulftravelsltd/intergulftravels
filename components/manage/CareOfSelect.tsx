'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Search, ChevronDown, Plus, X, Loader2, Check } from 'lucide-react';
import { inputClass } from '@/components/manage/ui';
import { cn } from '@/lib/utils';
import type { AffiliateOption } from '@/lib/management/affiliates';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/careof';

/**
 * Searchable Care-of selector used on the Hajj + Umrah entry forms. Searches the
 * server-loaded list by name / phone / code, lets you clear the selection, and
 * can create a brand-new care-of inline (POST /api/admin/affiliates) which is
 * then selected. Controlled: the parent owns the selected id.
 */
export function CareOfSelect({
  affiliates,
  value,
  onChange,
  branch,
}: {
  affiliates: AffiliateOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  branch?: string | null;
}) {
  const t = getDict(useLocale());
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [extra, setExtra] = useState<AffiliateOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  // Server list + any affiliate created inline this session.
  const all = useMemo(() => {
    const seen = new Set(affiliates.map((a) => a.id));
    return [...affiliates, ...extra.filter((a) => !seen.has(a.id))];
  }, [affiliates, extra]);

  const selected = all.find((a) => a.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) =>
      [a.name, a.phone, a.code].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [all, query]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(id: string | null) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  function openAdd() {
    setNewName(query.trim());
    setNewPhone('');
    setNewAddress('');
    setAdding(true);
  }

  // Enter inside the inline-add inputs must save the affiliate, never submit the
  // surrounding pilgrim form.
  function onAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveNew();
    }
  }

  async function saveNew() {
    if (!newName.trim()) {
      toast.error(t.errName);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim(),
          branch: branch ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.affiliate) {
        toast.error(data?.error ?? t.errCreate);
        return;
      }
      const a = data.affiliate as AffiliateOption;
      setExtra((prev) => [...prev, a]);
      toast.success(t.created);
      setAdding(false);
      pick(a.id);
    } catch {
      toast.error(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      {/* Control */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(inputClass, 'flex items-center justify-between gap-2 text-left')}
      >
        <span className={cn('truncate', !selected && 'text-ink-muted')}>
          {selected ? (
            <>
              {selected.name}
              {selected.code && <span className="ml-1 text-xs text-ink-muted">· {selected.code}</span>}
            </>
          ) : (
            t.selectPrompt
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {!adding ? (
            <>
              <div className="relative border-b border-border p-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input
                  autoFocus
                  className={`${inputClass} pl-9`}
                  placeholder={t.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filtered.length === 1) pick(filtered[0].id);
                    }
                  }}
                />
              </div>

              <ul className="max-h-56 overflow-y-auto py-1">
                <li>
                  <button
                    type="button"
                    onClick={() => pick(null)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-muted"
                  >
                    {t.noneSelected}
                    {value === null && <Check className="h-4 w-4 text-brand-600" />}
                  </button>
                </li>
                {filtered.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => pick(a.id)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.name}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          {[a.code, a.phone].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </span>
                      {value === a.id && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-sm text-ink-muted">{t.noMatches}</li>
                )}
              </ul>

              <div className="border-t border-border p-1.5">
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  <Plus className="h-4 w-4" /> {t.addNew}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{t.addNewTitle}</p>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-muted"
                  aria-label={t.cancel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                className={inputClass}
                placeholder={t.namePlaceholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={onAddKeyDown}
              />
              <input
                className={inputClass}
                placeholder={t.phonePlaceholder}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={onAddKeyDown}
                inputMode="tel"
              />
              <input
                className={inputClass}
                placeholder={t.addressPlaceholder}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                onKeyDown={onAddKeyDown}
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-muted"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={saveNew}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t.saveAndSelect}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
