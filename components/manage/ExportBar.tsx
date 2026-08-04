'use client';

import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, printTable } from '@/lib/export';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

type Cell = string | number | null | undefined;

/** Excel / PDF / Print buttons for any list or ledger. `label` names the
 *  format when a page offers more than one export (e.g. Due vs Airlines). */
export function ExportBar({
  filename,
  title,
  subtitle,
  headers,
  rows,
  orientation = 'p',
  label,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
  orientation?: 'p' | 'l';
  label?: string;
}) {
  const t = getDict(useLocale()).export;
  const btn =
    'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">{label}</span>
      )}
      <button type="button" className={btn} onClick={() => exportToExcel(filename, headers, rows)}>
        <FileSpreadsheet className="h-4 w-4" /> {t.excel}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => exportToPDF({ filename, title, subtitle, headers, rows, orientation })}
      >
        <FileText className="h-4 w-4" /> {t.pdf}
      </button>
      <button type="button" className={btn} onClick={() => printTable({ title, subtitle, headers, rows })}>
        <Printer className="h-4 w-4" /> {t.print}
      </button>
    </div>
  );
}
