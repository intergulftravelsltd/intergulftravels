'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DOC_STATUS_KEYS, DOC_STATUS_TOTAL, docStatusLabel, type DocStatusKey } from '@/lib/management/doc-status';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/careof';

/** Multi-select toggle for the per-pilgrim document checkpoints. Controlled. */
export function DocStatusSelect({
  value,
  onChange,
}: {
  value: DocStatusKey[];
  onChange: (v: DocStatusKey[]) => void;
}) {
  const locale = useLocale();
  const t = getDict(locale);

  const toggle = (k: DocStatusKey) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DOC_STATUS_KEYS.map((k) => {
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
      <p className="mt-2 text-xs text-ink-muted">{t.docDone(value.length, DOC_STATUS_TOTAL)}</p>
    </div>
  );
}
