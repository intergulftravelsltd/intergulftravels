'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Columns3, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, printTable, type ExportPeriod } from '@/lib/export';
import {
  applyColumnSelection,
  defaultSelection,
  loadSelection,
  pickedCount,
  saveSelection,
  type ColumnSelection,
} from '@/lib/export-columns';
import { ColumnChooser, COLUMN_LABELS } from '@/components/manage/ColumnChooser';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useCompanyProfile } from '@/components/providers/CompanyProfile';
import { getDict } from '@/lib/dictionaries/areas/adminshell';
import { cn } from '@/lib/utils';

type Cell = string | number | null | undefined;

export const exportBtnClass =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700';

/** Excel / PDF / Print buttons for any list or ledger. Every export prints
 *  under the signed-in agency's letterhead (from CompanyProfileProvider) with
 *  the "Statement for the period" line when `period` is given. A "Columns"
 *  picker lets staff print only the columns they need (remembered per list).
 *  `label` names the format when a page offers more than one export. */
export function ExportBar({
  filename,
  title,
  subtitle,
  headers,
  rows,
  orientation = 'p',
  label,
  period,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
  orientation?: 'p' | 'l';
  label?: string;
  period?: ExportPeriod | null;
}) {
  const locale = useLocale();
  const t = getDict(locale).export;
  const tc = COLUMN_LABELS[locale];
  const company = useCompanyProfile();
  const meta = { company, period, locale };

  const [sel, setSel] = useState<ColumnSelection>(() => defaultSelection(headers.length));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const headerKey = headers.join('|');

  // Restore the remembered choice after mount (localStorage is browser-only).
  useEffect(() => {
    setSel(loadSelection(headers) ?? defaultSelection(headers.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerKey]);

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

  const change = (next: ColumnSelection) => {
    setSel(next);
    saveSelection(headers, next);
  };

  const picked = () => applyColumnSelection(headers, rows, sel, tc.serialHeader);
  const n = pickedCount(sel);
  const customised = n !== headers.length || sel.serial;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">{label}</span>
      )}
      {headers.length > 1 && (
        <div ref={wrapRef} className="relative inline-block">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className={cn(exportBtnClass, (open || customised) && 'border-brand-600/50 text-brand-700')}
            title={tc.hint}
          >
            <Columns3 className="h-4 w-4" /> {tc.columns}
            <span className="rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums">
              {n + (sel.serial ? 1 : 0)}
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[90vw] origin-top-right animate-fade-up rounded-2xl border border-border bg-card p-3 shadow-emerald [animation-duration:200ms]"
            >
              <ColumnChooser headers={headers} selection={sel} onChange={change} locale={locale} />
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => {
          const p = picked();
          void exportToExcel(filename, p.headers, p.rows, { ...meta, title, subtitle });
        }}
      >
        <FileSpreadsheet className="h-4 w-4" /> {t.excel}
      </button>
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => {
          const p = picked();
          void exportToPDF({ filename, title, subtitle, headers: p.headers, rows: p.rows, orientation, ...meta });
        }}
      >
        <FileText className="h-4 w-4" /> {t.pdf}
      </button>
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => {
          const p = picked();
          printTable({ title, subtitle, headers: p.headers, rows: p.rows, ...meta });
        }}
      >
        <Printer className="h-4 w-4" /> {t.print}
      </button>
    </div>
  );
}
