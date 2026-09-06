'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, printTable, type ExportPeriod } from '@/lib/export';
import {
  applyColumnSelection,
  defaultSelection,
  loadSelection,
  saveSelection,
  type ColumnSelection,
} from '@/lib/export-columns';
import { ColumnChooser, COLUMN_LABELS } from '@/components/manage/ColumnChooser';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useCompanyProfile } from '@/components/providers/CompanyProfile';
import { getDict } from '@/lib/dictionaries/areas/adminshell';
import { cn } from '@/lib/utils';

type Cell = string | number | null | undefined;

export type ExportSet = {
  key: string;
  /** Format name shown in the menu, e.g. "Due list" / "Airlines / Visa". */
  label: string;
  hint?: string;
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
  orientation?: 'p' | 'l';
  period?: ExportPeriod | null;
};

/**
 * One compact "Export" pill that opens a menu of export formats. Under each
 * format staff tick the columns they want (e.g. only Name, Phone, Tracking
 * No.), optionally add a serial column, then pick Excel / PDF / Print. The
 * column choice is remembered per format.
 */
export function ExportMenu({ sets, label }: { sets: ExportSet[]; label?: string }) {
  const locale = useLocale();
  const t = getDict(locale).export;
  const tc = COLUMN_LABELS[locale];
  const company = useCompanyProfile();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>(sets[0]?.key ?? '');
  const [sels, setSels] = useState<Record<string, ColumnSelection>>({});
  const wrapRef = useRef<HTMLDivElement>(null);

  // Restore remembered column choices after mount (localStorage is browser-only).
  const setsKey = sets.map((s) => s.key + ':' + s.headers.join('|')).join('||');
  useEffect(() => {
    const next: Record<string, ColumnSelection> = {};
    for (const s of sets) next[s.key] = loadSelection(s.headers) ?? defaultSelection(s.headers.length);
    setSels(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsKey]);

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

  const selFor = (s: ExportSet) => sels[s.key] ?? defaultSelection(s.headers.length);

  const run = (s: ExportSet, kind: 'excel' | 'pdf' | 'print') => {
    const meta = { company, period: s.period, locale };
    const p = applyColumnSelection(s.headers, s.rows, selFor(s), tc.serialHeader);
    if (kind === 'excel') {
      void exportToExcel(s.filename, p.headers, p.rows, { ...meta, title: s.title, subtitle: s.subtitle });
    } else if (kind === 'pdf') {
      void exportToPDF({
        filename: s.filename,
        title: s.title,
        subtitle: s.subtitle,
        headers: p.headers,
        rows: p.rows,
        orientation: s.orientation ?? 'l',
        ...meta,
      });
    } else {
      printTable({ title: s.title, subtitle: s.subtitle, headers: p.headers, rows: p.rows, ...meta });
    }
    setOpen(false);
  };

  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700';

  const current = sets.find((s) => s.key === active) ?? sets[0];

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700',
          open && 'border-brand-600/50 text-brand-700 ring-2 ring-brand-600/15',
        )}
      >
        <Download className="h-4 w-4" />
        {label ?? (locale === 'bn' ? 'এক্সপোর্ট' : 'Export')}
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && current && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[26rem] max-w-[92vw] origin-top-right animate-fade-up rounded-2xl border border-border bg-card p-3 shadow-emerald [animation-duration:200ms]"
        >
          {/* Format tabs */}
          {sets.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {sets.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    s.key === current.key
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm font-semibold text-ink">{current.label}</p>
          {current.hint && <p className="mt-0.5 text-xs text-ink-muted">{current.hint}</p>}

          <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-2.5">
            <ColumnChooser
              headers={current.headers}
              selection={selFor(current)}
              locale={locale}
              onChange={(next) => {
                setSels((prev) => ({ ...prev, [current.key]: next }));
                saveSelection(current.headers, next);
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" className={btn} onClick={() => run(current, 'excel')}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> {t.excel}
            </button>
            <button type="button" className={btn} onClick={() => run(current, 'pdf')}>
              <FileText className="h-3.5 w-3.5" /> {t.pdf}
            </button>
            <button type="button" className={btn} onClick={() => run(current, 'print')}>
              <Printer className="h-3.5 w-3.5" /> {t.print}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
