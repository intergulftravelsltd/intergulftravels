'use client';

import type { CompanyProfile } from '@/lib/company-profile';

/* ------------------------------------------------------------------ *
 *  Shared chrome for every printed receipt / statement:
 *    · letterhead  — logo top-left + name, Head Office, Branch Office,
 *                    Mobile, Email of the signed-in agency
 *    · watermark   — the same logo, centred, ~16 % opacity, on every page
 *    · signatures  — "Prepared by: ____" and "Authorized Signature"
 *    · print CSS   — one stylesheet so all receipts print identically
 * ------------------------------------------------------------------ */

const L = {
  en: {
    head: 'Head Office',
    branch: 'Branch Office',
    mobile: 'Mobile',
    email: 'Email',
    preparedBy: 'Prepared by',
    authorized: 'Authorized Signature',
    period: 'Statement for the period',
  },
  bn: {
    head: 'প্রধান কার্যালয়',
    branch: 'শাখা কার্যালয়',
    mobile: 'মোবাইল',
    email: 'ইমেইল',
    preparedBy: 'প্রস্তুতকারী',
    authorized: 'অনুমোদিত স্বাক্ষর',
    period: 'বিবরণীর সময়কাল',
  },
};

export const RECEIPT_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #receipt, #receipt * { visibility: visible !important; }
    /* The screen wrapper is position:fixed — printed fixed elements repeat
       on EVERY page, which duplicated multi-page receipts. Flatten both
       wrappers to normal flow for print. */
    #print-root { position: static !important; inset: auto !important; overflow: visible !important; padding: 0 !important; background: #fff !important; }
    #receipt { position: static !important; width: 100%; max-width: none !important; box-shadow: none !important; border: 0 !important; overflow: visible !important; }
    .no-print { display: none !important; }
    /* Pin the watermark to the centre of the printed page so it repeats on
       every sheet and can never be clipped by the receipt box. */
    #receipt-watermark {
      position: fixed !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 58% !important;
      max-height: 60% !important;
      object-fit: contain;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .sig-block { page-break-inside: avoid; }
    @page { margin: 12mm; }
  }
`;

/** Centred brand watermark behind the receipt content (~16 % opacity). */
export function ReceiptWatermark({ logo }: { logo?: string | null }) {
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      id="receipt-watermark"
      src={logo}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 select-none"
      // Uniform grey stamp: without the grayscale+brightness filter the
      // light-coloured parts of the logos fade into the white paper and
      // the watermark looks "half printed".
      style={{ opacity: 0.16, filter: 'grayscale(1) brightness(0.45)' }}
    />
  );
}

/** Logo top-left + company name, offices, mobile and email. */
export function ReceiptLetterhead({ company, locale }: { company: CompanyProfile; locale: 'en' | 'bn' }) {
  const t = L[locale];
  return (
    <div className="flex items-start gap-4 border-b-2 border-emerald-700 pb-4">
      {company.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.logo} alt="" className="h-20 w-20 shrink-0 object-contain" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-emerald-800">{company.name}</h1>
        {company.license && <p className="mt-0.5 text-xs font-semibold text-gray-500">{company.license}</p>}
        <div className="mt-1.5 space-y-0.5 text-[0.8rem] leading-snug text-gray-600">
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
  );
}

/** "Statement for the period: … to …" line under a statement title. */
export function ReceiptPeriod({ text }: { text?: string | null }) {
  if (!text) return null;
  return <p className="-mt-3 mb-4 text-center text-sm font-semibold text-emerald-800">{text}</p>;
}

/** "Prepared by" + "Authorized Signature" footer. */
export function ReceiptSignatures({
  locale,
  preparedBy,
  note,
}: {
  locale: 'en' | 'bn';
  preparedBy?: string | null;
  note?: string;
}) {
  const t = L[locale];
  return (
    <div className="sig-block mt-12">
      <div className="flex items-end justify-between gap-6">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{t.preparedBy}:</span>{' '}
          {preparedBy ? (
            <span className="font-semibold text-gray-900">{preparedBy}</span>
          ) : (
            <span className="inline-block w-44 border-b border-gray-500 align-baseline">&nbsp;</span>
          )}
        </div>
        <div className="text-center">
          <div className="w-52 border-t border-gray-500 pt-1 text-sm font-semibold text-gray-700">{t.authorized}</div>
        </div>
      </div>
      {note && <p className="mt-4 text-center text-xs text-gray-400">{note}</p>}
    </div>
  );
}
