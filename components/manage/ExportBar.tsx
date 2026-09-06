'use client';

import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, printTable, type ExportPeriod } from '@/lib/export';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useCompanyProfile } from '@/components/providers/CompanyProfile';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

type Cell = string | number | null | undefined;

export const exportBtnClass =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700';

/** Excel / PDF / Print buttons for any list or ledger. Every export prints
 *  under the signed-in agency's letterhead (from CompanyProfileProvider) with
 *  the "Statement for the period" line when `period` is given. `label` names
 *  the format when a page offers more than one export. */
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
  const company = useCompanyProfile();
  const meta = { company, period, locale };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">{label}</span>
      )}
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => exportToExcel(filename, headers, rows, { ...meta, title, subtitle })}
      >
        <FileSpreadsheet className="h-4 w-4" /> {t.excel}
      </button>
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => exportToPDF({ filename, title, subtitle, headers, rows, orientation, ...meta })}
      >
        <FileText className="h-4 w-4" /> {t.pdf}
      </button>
      <button
        type="button"
        className={exportBtnClass}
        onClick={() => printTable({ title, subtitle, headers, rows, ...meta })}
      >
        <Printer className="h-4 w-4" /> {t.print}
      </button>
    </div>
  );
}
