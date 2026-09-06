'use client';

import { Check, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pickedCount, toggleColumn, type ColumnSelection } from '@/lib/export-columns';

export const COLUMN_LABELS = {
  en: {
    columns: 'Columns',
    hint: 'Tick the columns to print — only those go into Excel, PDF and Print.',
    all: 'All',
    serial: 'Serial no.',
    serialHeader: 'SL',
  },
  bn: {
    columns: 'কলাম',
    hint: 'যে কলামগুলো প্রিন্ট হবে সেগুলো টিক দিন — শুধু সেগুলোই Excel, PDF ও Print-এ যাবে।',
    all: 'সব',
    serial: 'ক্রমিক নং',
    serialHeader: 'ক্রমিক',
  },
} as const;

/**
 * Chip toggles for choosing which columns an export includes, plus a
 * "Serial no." chip that prepends 1..N. Used inside ExportBar's Columns
 * dropdown and under each format in ExportMenu.
 */
export function ColumnChooser({
  headers,
  selection,
  onChange,
  locale,
}: {
  headers: string[];
  selection: ColumnSelection;
  onChange: (next: ColumnSelection) => void;
  locale: 'en' | 'bn';
}) {
  const t = COLUMN_LABELS[locale];
  const n = pickedCount(selection);
  const chip = (on: boolean, strike = true) =>
    cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
      on
        ? 'border-brand-600 bg-brand-50 text-brand-700'
        : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
      !on && strike && 'line-through decoration-ink-muted/60',
    );

  return (
    <div>
      <p className="mb-1.5 text-xs text-ink-muted">{t.hint}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...selection, picked: selection.picked.map(() => true) })}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700',
            n === headers.length && 'border-brand-600/60 text-brand-700',
          )}
        >
          {t.all} ({n}/{headers.length})
        </button>
        {headers.map((h, i) => {
          const on = selection.picked[i];
          return (
            <button
              key={`${i}-${h}`}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggleColumn(selection, i))}
              className={chip(on)}
            >
              {on && <Check className="h-3 w-3" />}
              {h}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={selection.serial}
          onClick={() => onChange({ ...selection, serial: !selection.serial })}
          className={chip(selection.serial, false)}
        >
          <Hash className="h-3 w-3" /> {t.serial}
        </button>
      </div>
    </div>
  );
}
