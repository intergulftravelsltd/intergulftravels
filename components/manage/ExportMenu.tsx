'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, printTable, type ExportPeriod } from '@/lib/export';
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
 * One compact "Export" pill that opens a menu of export formats, each with
 * Excel / PDF / Print. Replaces the two stacked ExportBars on the Hajj and
 * Umrah list pages so the header stays a single tidy row.
 */
export function ExportMenu({ sets, label }: { sets: ExportSet[]; label?: string }) {
  const locale = useLocale();
  const t = getDict(locale).export;
  const company = useCompanyProfile();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const iconBtn =
    'inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700';

  const run = (s: ExportSet, kind: 'excel' | 'pdf' | 'print') => {
    const meta = { company, period: s.period, locale };
    if (kind === 'excel') void exportToExcel(s.filename, s.headers, s.rows, { ...meta, title: s.title, subtitle: s.subtitle });
    else if (kind === 'pdf')
      void exportToPDF({
        filename: s.filename,
        title: s.title,
        subtitle: s.subtitle,
        headers: s.headers,
        rows: s.rows,
        orientation: s.orientation ?? 'l',
        ...meta,
      });
    else printTable({ title: s.title, subtitle: s.subtitle, headers: s.headers, rows: s.rows, ...meta });
    setOpen(false);
  };

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

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-80 origin-top-right animate-fade-up rounded-2xl border border-border bg-card p-2 shadow-emerald [animation-duration:200ms]"
        >
          {sets.map((s, i) => (
            <div key={s.key} className={cn('rounded-xl px-3 py-2.5', i > 0 && 'mt-1 border-t border-border/70')}>
              <p className="text-sm font-semibold text-ink">{s.label}</p>
              {s.hint && <p className="mt-0.5 text-xs text-ink-muted">{s.hint}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" className={iconBtn} onClick={() => run(s, 'excel')}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> {t.excel}
                </button>
                <button type="button" className={iconBtn} onClick={() => run(s, 'pdf')}>
                  <FileText className="h-3.5 w-3.5" /> {t.pdf}
                </button>
                <button type="button" className={iconBtn} onClick={() => run(s, 'print')}>
                  <Printer className="h-3.5 w-3.5" /> {t.print}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
