'use client';

import { useEffect, useState } from 'react';
import { Eye, X, Check } from 'lucide-react';
import { docStatusKeysFor, docStatusTotalFor, docStatusLabel, normalizeDocStatus, type DocProgram } from '@/lib/management/doc-status';
import { useLocale } from '@/components/providers/LocaleProvider';

const L = {
  en: { title: 'Document checklist', done: 'Done', pending: 'Pending', close: 'Close', view: 'View documents' },
  bn: { title: 'ডকুমেন্ট চেকলিস্ট', done: 'সম্পন্ন', pending: 'বাকি', close: 'বন্ধ করুন', view: 'ডকুমেন্ট দেখুন' },
};

/**
 * Eye-icon button that opens the full 14-point document checklist for one
 * pilgrim — ✓ (green) for every completed item, ✗ (red) for the pending ones.
 */
export function DocStatusViewer({
  name,
  subtitle,
  value,
  program = 'hajj',
}: {
  name: string;
  subtitle?: string;
  value: unknown;
  program?: DocProgram;
}) {
  const locale = useLocale();
  const t = L[locale];
  const [open, setOpen] = useState(false);
  const keys = docStatusKeysFor(program);
  const total = docStatusTotalFor(program);
  const done = normalizeDocStatus(value).filter((k) => keys.includes(k));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t.view}
        aria-label={`${t.view} — ${name}`}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.title}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold text-ink">{t.title}</p>
                <p className="text-sm text-ink-muted">
                  {name}
                  {subtitle ? ` · ${subtitle}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs font-semibold text-ink-muted">
              {done.length}/{total} {t.done}
            </p>

            <ul className="divide-y divide-border/70">
              {keys.map((k, i) => {
                const ok = done.includes(k);
                return (
                  <li key={k} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-ink">
                      <span className="mr-2 inline-block w-5 text-right text-xs text-ink-muted">{i + 1}.</span>
                      {docStatusLabel(k, locale)}
                    </span>
                    {ok ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> {t.done}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                        <X className="h-3.5 w-3.5" /> {t.pending}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
