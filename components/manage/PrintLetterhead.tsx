import type { CompanyProfile } from '@/lib/company-profile';

/* ------------------------------------------------------------------ *
 *  Print-only letterhead for report pages that print themselves with
 *  window.print() (cash book, document checklist reports …). Hidden on
 *  screen; on paper it adds the agency logo + details at the top, the
 *  "Statement for the period" line, the centred ~16 % logo watermark on
 *  every page and the Prepared-by / Authorized-signature footer.
 *  Server-safe (no hooks) — render it inside the page's print root.
 * ------------------------------------------------------------------ */

const L = {
  en: {
    head: 'Head Office',
    branch: 'Branch Office',
    mobile: 'Mobile',
    email: 'Email',
    preparedBy: 'Prepared by',
    authorized: 'Authorized Signature',
  },
  bn: {
    head: 'প্রধান কার্যালয়',
    branch: 'শাখা কার্যালয়',
    mobile: 'মোবাইল',
    email: 'ইমেইল',
    preparedBy: 'প্রস্তুতকারী',
    authorized: 'অনুমোদিত স্বাক্ষর',
  },
};

export function PrintLetterhead({
  company,
  locale,
  title,
  period,
  subtitle,
}: {
  company: CompanyProfile;
  locale: 'en' | 'bn';
  title?: string;
  /** Already formatted, e.g. from formatPeriodLine(). */
  period?: string | null;
  subtitle?: string | null;
}) {
  const t = L[locale];
  return (
    <>
      <style>{`
        .print-letterhead, .print-watermark, .print-signatures { display: none; }
        @media print {
          .print-letterhead { display: flex !important; visibility: visible !important; }
          .print-letterhead * { visibility: visible !important; }
          .print-signatures { display: flex !important; visibility: visible !important; page-break-inside: avoid; }
          .print-signatures * { visibility: visible !important; }
          .print-watermark {
            display: block !important;
            visibility: visible !important;
            position: fixed;
            left: 50%;
            top: 50%;
            width: 55%;
            max-height: 60%;
            object-fit: contain;
            transform: translate(-50%, -50%);
            opacity: 0.16;
            filter: grayscale(1) brightness(0.45);
            pointer-events: none;
            z-index: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {company.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="print-watermark" src={company.logo} alt="" aria-hidden />
      )}

      <div className="print-letterhead mb-5 items-start gap-4 border-b-2 border-emerald-700 pb-3 text-black">
        {company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt="" className="h-20 w-20 shrink-0 object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold leading-tight text-emerald-800">{company.name}</p>
          {company.license && <p className="text-xs font-semibold text-gray-500">{company.license}</p>}
          <div className="mt-1 space-y-0.5 text-[0.78rem] leading-snug text-gray-700">
            {company.headOffice && (
              <p>
                <b>{t.head}:</b> {company.headOffice}
              </p>
            )}
            {company.branchOffice && (
              <p>
                <b>{t.branch}:</b> {company.branchOffice}
              </p>
            )}
            {(company.phone || company.email) && (
              <p>
                {company.phone && (
                  <>
                    <b>{t.mobile}:</b> {company.phone}
                  </>
                )}
                {company.phone && company.email && ' · '}
                {company.email && (
                  <>
                    <b>{t.email}:</b> {company.email}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {/* Title / period / count sit top-right beside the letterhead so the
            table starts higher on the page. */}
        {(title || period || subtitle) && (
          <div className="ml-auto max-w-[40%] shrink-0 pl-3 text-right">
            {title && <p className="text-base font-bold leading-tight text-gray-900">{title}</p>}
            {period && <p className="text-sm font-semibold text-emerald-800">{period}</p>}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Prepared-by / Authorized-signature footer — print only. Place after the
 * table. Two identical blocks: uploaded signature above the line (from
 * Company Profile), name + label under it.
 */
export function PrintSignatures({
  locale,
  company,
}: {
  locale: 'en' | 'bn';
  company?: Pick<CompanyProfile, 'preparedByName' | 'preparedBySignature' | 'authorizedName' | 'authorizedSignature'> | null;
}) {
  const t = L[locale];
  const block = (image: string | undefined, name: string | undefined, label: string) => (
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
  return (
    <div className="print-signatures mt-12 items-end justify-between gap-8 text-sm text-black">
      {block(company?.preparedBySignature || undefined, company?.preparedByName || undefined, t.preparedBy)}
      {block(company?.authorizedSignature || undefined, company?.authorizedName || undefined, t.authorized)}
    </div>
  );
}
