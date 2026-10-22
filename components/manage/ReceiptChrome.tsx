'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import type { CompanyProfile } from '@/lib/company-profile';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  Shared chrome for every printed receipt / statement — one A4 layout
 *  so a money receipt, an account statement, a group statement and a
 *  group payment receipt all read as the same family of documents:
 *
 *    [logo] Company name                          ACCOUNT STATEMENT
 *           Govt. Approved Travel Agency          No: V-01594 · Manual No: 3763
 *           Head Office / Branch Office / Mobile  Date: 22 Oct 2026 · Branch
 *    ─────────────────────────────────────────────────────────────────
 *    Statement for the period: …
 *    ┌ Account holder ──────────┐  ┌ Summary ──────────────────┐
 *    │ name, passport, phone …  │  │ package / paid / balance  │
 *    └──────────────────────────┘  └───────────────────────────┘
 *    Date | Voucher | Particulars | Charge | Paid | Balance
 *    …                                    Total ══════════════
 *    Prepared by ______               Authorized Signature
 *
 *  Panels are bordered, never filled, so the centred logo watermark is
 *  never covered; the admin shell (sidebar, top bar, page padding) is
 *  removed from print so the document starts at the top of the page.
 * ------------------------------------------------------------------ */

const L = {
  en: {
    head: 'Head Office',
    branch: 'Branch Office',
    mobile: 'Mobile',
    email: 'Email',
    preparedBy: 'Prepared by',
    authorized: 'Authorized Signature',
    generated: 'Computer-generated document',
    print: 'Print / Save PDF',
    back: 'Back',
  },
  bn: {
    head: 'প্রধান কার্যালয়',
    branch: 'শাখা কার্যালয়',
    mobile: 'মোবাইল',
    email: 'ইমেইল',
    preparedBy: 'প্রস্তুতকারী',
    authorized: 'অনুমোদিত স্বাক্ষর',
    generated: 'কম্পিউটারে তৈরি নথি',
    print: 'প্রিন্ট / PDF সেভ',
    back: 'ফিরুন',
  },
};

export const RECEIPT_PRINT_CSS = `
  @media print {
    @page { size: A4; margin: 10mm 12mm 12mm; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; height: auto !important; }
    body * { visibility: hidden !important; }
    #receipt, #receipt * { visibility: visible !important; }
    /* The screen wrapper is position:fixed — printed fixed elements repeat
       on EVERY page, which duplicated multi-page receipts. Flatten both
       wrappers to normal flow for print and drop every screen-only inset. */
    #print-root { position: static !important; inset: auto !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; background: #fff !important; }
    #receipt { position: static !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: 0 !important; border-radius: 0 !important; overflow: visible !important; }
    .no-print { display: none !important; }
    /* Bordered panels only — a filled panel would hide the watermark. */
    .panel { background: transparent !important; }
    /* Pin the watermark to the centre of the printed page so it repeats on
       every sheet and can never be clipped by the receipt box. */
    #receipt-watermark {
      position: fixed !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 55% !important;
      max-height: 55% !important;
      object-fit: contain;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    thead { display: table-header-group; }
    /* A real footer row group repeats on every page in Chrome — print the
       totals once, after the last row. */
    tfoot { display: table-row-group; }
    tr, .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .sig-block { page-break-inside: avoid; break-inside: avoid; }
    a { color: inherit; text-decoration: none; }
  }
`;

/** Centred brand watermark behind the receipt content (~12 % opacity). */
export function ReceiptWatermark({ logo }: { logo?: string | null }) {
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      id="receipt-watermark"
      src={logo}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 w-[55%] -translate-x-1/2 -translate-y-1/2 select-none"
      // Uniform grey stamp: without the grayscale+brightness filter the
      // light-coloured parts of the logos fade into the white paper and
      // the watermark looks "half printed".
      style={{ opacity: 0.12, filter: 'grayscale(1) brightness(0.45)' }}
    />
  );
}

/**
 * Screen frame for a printable document: grey backdrop, Back / Print
 * toolbar (hidden in print) and the white A4-ish sheet with the watermark.
 */
export function ReceiptFrame({
  logo,
  locale,
  children,
}: {
  logo?: string | null;
  locale: 'en' | 'bn';
  children: React.ReactNode;
}) {
  const t = L[locale];
  return (
    <div id="print-root" className="fixed inset-0 z-[100] overflow-auto bg-neutral-200/80 p-4 text-black sm:p-8">
      <style>{RECEIPT_PRINT_CSS}</style>

      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            // Opened in its own tab (from the list print buttons) → close it;
            // otherwise behave like a normal back button.
            if (window.history.length > 1) window.history.back();
            else window.close();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Printer className="h-4 w-4" /> {t.print}
        </button>
      </div>

      <div id="receipt" className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white px-9 py-8 shadow-sm">
        <ReceiptWatermark logo={logo} />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export type ReceiptMeta = { label: string; value: string };

/**
 * Letterhead: logo + company lines on the left; the document title and its
 * numbers (receipt no, date, branch …) top-right on the same band, so the
 * body starts right under the rule.
 */
export function ReceiptLetterhead({
  company,
  locale,
  title,
  meta,
}: {
  company: CompanyProfile;
  locale: 'en' | 'bn';
  title?: string;
  meta?: ReceiptMeta[];
}) {
  const t = L[locale];
  return (
    <div className="flex items-start justify-between gap-6 border-b-2 border-emerald-700 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        {company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt="" className="h-16 w-16 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-emerald-800">{company.name}</h1>
          {company.license && <p className="mt-0.5 text-[0.72rem] font-semibold text-gray-500">{company.license}</p>}
          <div className="mt-1 space-y-0.5 text-[0.72rem] leading-snug text-gray-600">
            {company.headOffice && (
              <p>
                <span className="font-semibold text-gray-700">{t.head}:</span> {company.headOffice}
              </p>
            )}
            {company.branchOffice && (
              <p>
                <span className="font-semibold text-gray-700">{t.branch}:</span> {company.branchOffice}
              </p>
            )}
            {(company.phone || company.email) && (
              <p>
                {company.phone && (
                  <>
                    <span className="font-semibold text-gray-700">{t.mobile}:</span> {company.phone}
                  </>
                )}
                {company.phone && company.email && ' · '}
                {company.email && (
                  <>
                    <span className="font-semibold text-gray-700">{t.email}:</span> {company.email}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {(title || meta?.length) && (
        <div className="shrink-0 pl-2 text-right">
          {title && (
            <p className="text-[1.05rem] font-extrabold uppercase leading-tight tracking-[0.12em] text-emerald-800">{title}</p>
          )}
          {meta && meta.length > 0 && (
            <dl className="mt-1.5 space-y-0.5 text-[0.76rem] leading-snug text-gray-600">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt className="inline">{m.label}:</dt> <dd className="inline font-semibold text-gray-900">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

/** "Statement for the period: … to …" line under the letterhead rule. */
export function ReceiptPeriod({ text }: { text?: string | null }) {
  if (!text) return null;
  return <p className="mt-2 text-[0.78rem] font-semibold text-emerald-800">{text}</p>;
}

/** Bordered (never filled) panel with an optional small heading. */
export function ReceiptPanel({
  heading,
  children,
  className,
}: {
  heading?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('panel avoid-break rounded-lg border border-gray-200 px-3.5 py-3', className)}>
      {heading && <p className="mb-1 text-[0.66rem] font-semibold uppercase tracking-wider text-gray-400">{heading}</p>}
      {children}
    </div>
  );
}

/** "Label : value" line inside a panel. */
export function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-0.5 text-[0.84rem] leading-snug">
      <span className="w-28 shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 font-medium text-gray-900">: {value}</span>
    </div>
  );
}

export type SummaryLine = {
  label: string;
  value: string;
  /** The emphasised last line (balance due / total received). */
  total?: boolean;
  /** Colour of the emphasised line: ok = green, warn = red. */
  tone?: 'ok' | 'warn';
};

/** Right-hand figures panel: a few label/value lines, the last one emphasised. */
export function ReceiptSummary({ heading, lines, className }: { heading?: string; lines: SummaryLine[]; className?: string }) {
  return (
    <ReceiptPanel heading={heading} className={cn('flex flex-col justify-center', className)}>
      <dl className="text-[0.84rem]">
        {lines.map((l) => (
          <div
            key={l.label}
            className={cn(
              'flex items-baseline justify-between gap-3 py-1',
              l.total ? 'mt-1 border-t-2 border-emerald-700 pt-1.5' : 'border-b border-dashed border-gray-200',
            )}
          >
            <dt className={cn(l.total ? 'font-bold text-gray-900' : 'text-gray-500')}>{l.label}</dt>
            <dd
              className={cn(
                'whitespace-nowrap tabular-nums',
                l.total
                  ? cn('text-[1.1rem] font-extrabold', l.tone === 'warn' ? 'text-red-600' : 'text-emerald-800')
                  : 'font-semibold text-gray-900',
              )}
            >
              {l.value}
            </dd>
          </div>
        ))}
      </dl>
    </ReceiptPanel>
  );
}

/** The big single figure of a money receipt / voucher. */
export function ReceiptAmount({ label, amount, words, className }: { label: string; amount: string; words?: string; className?: string }) {
  return (
    <div className={cn('panel avoid-break flex flex-col justify-center rounded-lg border-2 border-emerald-700 px-4 py-3 text-right', className)}>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-emerald-700">{label}</p>
      <p className="text-[1.75rem] font-extrabold leading-tight tabular-nums text-emerald-800">৳ {amount}</p>
      {words && <p className="mt-0.5 text-[0.72rem] leading-snug text-gray-600">{words}</p>}
    </div>
  );
}

/** Table class names shared by every receipt table (ruled, no fills). */
export const RT = {
  table: 'w-full border-collapse text-[0.82rem]',
  th: 'whitespace-nowrap border-b-2 border-emerald-700 py-1.5 pr-2 text-left text-[0.66rem] font-semibold uppercase tracking-wider text-gray-500',
  thRight: 'whitespace-nowrap border-b-2 border-emerald-700 py-1.5 pl-2 text-right text-[0.66rem] font-semibold uppercase tracking-wider text-gray-500',
  td: 'border-b border-gray-200 py-1.5 pr-2 align-top text-gray-800',
  tdRight: 'whitespace-nowrap border-b border-gray-200 py-1.5 pl-2 text-right align-top tabular-nums text-gray-800',
  tdMuted: 'border-b border-gray-200 py-1.5 pr-2 align-top text-[0.72rem] text-gray-500',
  total: 'border-t-[3px] border-double border-gray-900 py-2 pr-2 font-bold text-gray-900',
  totalRight: 'whitespace-nowrap border-t-[3px] border-double border-gray-900 py-2 pl-2 text-right font-bold tabular-nums text-gray-900',
};

/** Small heading above a table. */
export function ReceiptSectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-gray-500">{children}</p>;
}

/** One signature block: image (if uploaded) above the line, name + label under it. */
export function SignatureBlock({ image, name, label }: { image?: string | null; name?: string | null; label: string }) {
  return (
    <div className="w-56 max-w-[45%] text-center">
      <div className="flex h-16 items-end justify-center">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="max-h-16 max-w-full object-contain" />
        )}
      </div>
      <div className="border-t border-gray-600 pt-1">
        {name && <p className="text-[0.82rem] font-semibold leading-tight text-gray-900">{name}</p>}
        <p className="text-[0.72rem] text-gray-600">{label}</p>
      </div>
    </div>
  );
}

/**
 * Footer: two identical signature blocks — "Prepared by" on the left and
 * "Authorized Signature" on the right — each with the uploaded signature
 * above the line and the name under it (from Company Profile), plus a
 * thank-you line.
 */
export function ReceiptSignatures({
  locale,
  company,
  preparedBy,
  note,
  printedOn,
}: {
  locale: 'en' | 'bn';
  /** Signature images + names come from the agency's Company Profile. */
  company?: Pick<CompanyProfile, 'preparedByName' | 'preparedBySignature' | 'authorizedName' | 'authorizedSignature'> | null;
  /** Overrides the preparer's name (e.g. the signed-in staff member). */
  preparedBy?: string | null;
  note?: string;
  /** Printed date for the "computer-generated" footer line. */
  printedOn?: string;
}) {
  const t = L[locale];
  return (
    <div className="sig-block mt-10">
      <div className="flex items-end justify-between gap-8">
        <SignatureBlock image={company?.preparedBySignature} name={preparedBy || company?.preparedByName} label={t.preparedBy} />
        <SignatureBlock image={company?.authorizedSignature} name={company?.authorizedName} label={t.authorized} />
      </div>
      {note && <p className="mt-5 text-center text-[0.7rem] text-gray-400">{note}</p>}
      {printedOn && (
        <p className="mt-0.5 text-center text-[0.62rem] text-gray-400">
          {t.generated} · {printedOn}
        </p>
      )}
    </div>
  );
}
