import { Check, X } from 'lucide-react';
import { docStatusKeysFor, docStatusLabel, normalizeDocStatus, type DocProgram } from '@/lib/management/doc-status';
import { PrintLetterhead, PrintSignatures } from '@/components/manage/PrintLetterhead';
import type { CompanyProfile } from '@/lib/company-profile';
import type { Locale } from '@/lib/i18n';

export type DocReportPerson = { name: string; ref: string; doc_status: unknown };

const L = {
  en: {
    summary: 'Step-by-step summary',
    matrix: 'Passenger-wise checklist',
    name: 'Name',
    done: 'Done',
    legend: 'Column legend',
    of: (a: number, b: number) => `${a}/${b} done`,
  },
  bn: {
    summary: 'ধাপ-ভিত্তিক সারসংক্ষেপ',
    matrix: 'যাত্রী-ওয়ারি চেকলিস্ট',
    name: 'নাম',
    done: 'সম্পন্ন',
    legend: 'কলাম পরিচিতি',
    of: (a: number, b: number) => `${a}/${b} সম্পন্ন`,
  },
};

/**
 * The package-filtered document checklist report: per-step totals up top
 * (e.g. "Biometric: 6/11 done") and a passenger × step ✓/✗ matrix below.
 * Program-aware — umrah reports skip the two Hajj-only registration steps.
 * Printable via the visibility trick (`#doc-report`), landscape.
 */
export function DocMatrixReport({
  program,
  people,
  locale,
  company,
  title,
  subtitle,
}: {
  program: DocProgram;
  people: DocReportPerson[];
  locale: Locale;
  /** Agency letterhead printed at the top of the paper report (+ watermark). */
  company?: CompanyProfile;
  title?: string;
  subtitle?: string;
}) {
  const t = L[locale];
  const keys = docStatusKeysFor(program);
  const total = people.length;

  const doneSets = people.map((p) => new Set(normalizeDocStatus(p.doc_status)));
  const perStep = keys.map((k) => doneSets.reduce((n, s) => n + (s.has(k) ? 1 : 0), 0));

  return (
    <div id="doc-report">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #doc-report, #doc-report * { visibility: visible !important; }
          #doc-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
      {company && <PrintLetterhead company={company} locale={locale} title={title} subtitle={subtitle} />}

      {/* Per-step summary */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">{t.summary}</h2>
        <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((k, i) => {
            const n = perStep[i];
            const complete = total > 0 && n === total;
            return (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 text-sm">
                <span className="text-ink">
                  <span className="mr-1.5 text-xs text-ink-muted">{i + 1}.</span>
                  {docStatusLabel(k, locale)}
                </span>
                <span className={`text-xs font-bold ${complete ? 'text-emerald-700' : n === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {t.of(n, total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base font-semibold text-ink">{t.matrix}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border text-left text-xs text-ink-muted">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-3">{t.name}</th>
                {keys.map((_, i) => (
                  <th key={i} className="px-1.5 py-2 text-center">
                    {i + 1}
                  </th>
                ))}
                <th className="py-2 pl-2 text-right">{t.done}</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p, idx) => {
                const set = doneSets[idx];
                const done = keys.filter((k) => set.has(k)).length;
                return (
                  <tr key={idx} className="border-b border-border/60">
                    <td className="py-1.5 pr-2 text-xs text-ink-muted">{idx + 1}</td>
                    <td className="py-1.5 pr-3">
                      <span className="font-medium text-ink">{p.name}</span>
                      {p.ref && <span className="block text-xs text-ink-muted">{p.ref}</span>}
                    </td>
                    {keys.map((k) => (
                      <td key={k} className="px-1.5 py-1.5 text-center">
                        {set.has(k) ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-red-500/70" />
                        )}
                      </td>
                    ))}
                    <td className={`py-1.5 pl-2 text-right text-xs font-bold ${done === keys.length ? 'text-emerald-700' : 'text-ink'}`}>
                      {done}/{keys.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <p className="mt-4 text-xs text-ink-muted">
          <span className="font-semibold">{t.legend}:</span>{' '}
          {keys.map((k, i) => `${i + 1} = ${docStatusLabel(k, locale)}`).join(' · ')}
        </p>
      </div>
      {company && <PrintSignatures locale={locale} />}
    </div>
  );
}
