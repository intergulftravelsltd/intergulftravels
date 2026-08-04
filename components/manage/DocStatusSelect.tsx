'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { docStatusKeysFor, docStatusTotalFor, docStatusLabel, type DocProgram, type DocStatusKey } from '@/lib/management/doc-status';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/careof';

/** Multi-select toggle for the per-pilgrim document checkpoints. Controlled.
 *  Program-aware: umrah hides the two Hajj-only registration steps. */
export function DocStatusSelect({
  value,
  onChange,
  program = 'hajj',
}: {
  value: DocStatusKey[];
  onChange: (v: DocStatusKey[]) => void;
  program?: DocProgram;
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const keys = docStatusKeysFor(program);
  const total = docStatusTotalFor(program);
  const done = value.filter((k) => keys.includes(k)).length;

  const toggle = (k: DocStatusKey) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => {
          const on = value.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggle(k)}
              aria-pressed={on}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                on
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border text-ink-muted hover:border-brand-600/40',
              )}
            >
              {on && <Check className="h-3.5 w-3.5" />}
              {docStatusLabel(k, locale)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t.docDone(done, total)}</p>
    </div>
  );
}
