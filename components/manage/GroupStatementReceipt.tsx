'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

export type GroupStatementData = {
  company: { name: string; address: string; phone: string; email: string; license: string; logo?: string };
  program: string; // "Hajj" / "Umrah" (already localized)
  date: string;
  branch: string;
  headName: string;
  rows: { name: string; ref: string; isHead: boolean; charged: string; paid: string; due: string }[];
  totalCharged: string;
  totalPaid: string;
  totalDue: string;
  /** "৳1,60,000 × 3" helper line when every member has the same package. */
  perHeadLine: string;
};

const L = {
  en: {
    title: 'Group / Family Statement',
    date: 'Date',
    branch: 'Branch',
    headOf: 'Group head',
    forProgram: 'Program',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    colMember: 'Member',
    colCharged: 'Package',
    colPaid: 'Paid',
    colDue: 'Due',
    head: 'Head',
    grandTotal: 'Group total',
    totalPaid: 'Total paid',
    totalDue: 'Total due',
    signature: 'Authorised signature',
    thanks: 'Thank you for choosing us.',
    print: 'Print / Save PDF',
    back: 'Back',
  },
  bn: {
    title: 'গ্রুপ / পারিবারিক হিসাব বিবরণী',
    date: 'তারিখ',
    branch: 'শাখা',
    headOf: 'গ্রুপ প্রধান',
    forProgram: 'প্রোগ্রাম',
    members: (n: number) => `${n} জন সদস্য`,
    colMember: 'সদস্য',
    colCharged: 'প্যাকেজ',
    colPaid: 'পরিশোধিত',
    colDue: 'বকেয়া',
    head: 'প্রধান',
    grandTotal: 'গ্রুপ মোট',
    totalPaid: 'মোট পরিশোধিত',
    totalDue: 'মোট বকেয়া',
    signature: 'অনুমোদিত স্বাক্ষর',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
    print: 'প্রিন্ট / PDF সেভ',
    back: 'ফিরুন',
  },
};

/** Printable combined statement for a permanent family/group. */
export function GroupStatementReceipt({ data, locale }: { data: GroupStatementData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  useEffect(() => {
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-neutral-100 p-4 text-black sm:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; overflow: visible !important; }
          .no-print { display: none !important; }
          #receipt-watermark {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 62% !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-2xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
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

      <div id="receipt" className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {data.company.logo && (
          <img
            id="receipt-watermark"
            src={data.company.logo}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ opacity: 0.16, filter: 'grayscale(1) brightness(0.45)' }}
          />
        )}
        <div className="relative">
          {/* Company header */}
          <div className="border-b-2 border-emerald-700 pb-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-800">{data.company.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{data.company.address}</p>
            <p className="text-sm text-gray-600">
              {data.company.phone} · {data.company.email}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-gray-500">{data.company.license}</p>
          </div>

          {/* Title */}
          <div className="my-5 text-center">
            <span className="inline-block rounded-full border border-emerald-700 px-5 py-1 text-lg font-bold tracking-wide text-emerald-800">
              {t.title}
            </span>
          </div>

          {/* Meta */}
          <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
            <span>
              <span className="text-gray-500">{t.branch}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.branch}</span>
            </span>
            <span>
              <span className="text-gray-500">{t.date}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.date}</span>
            </span>
          </div>

          {/* Head — translucent so the watermark shows through */}
          <div className="rounded-xl bg-gray-50/60 p-4">
            <p className="text-sm text-gray-500">{t.headOf}</p>
            <p className="text-lg font-bold text-gray-900">{data.headName}</p>
            <p className="text-sm text-gray-600">
              {t.forProgram}: <span className="font-medium text-gray-900">{data.program}</span> ·{' '}
              {t.members(data.rows.length)}
            </p>
          </div>

          {/* Member table */}
          <div className="my-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left text-gray-500">
                  <th className="py-2">#</th>
                  <th className="py-2">{t.colMember}</th>
                  <th className="py-2 text-right">{t.colCharged}</th>
                  <th className="py-2 text-right">{t.colPaid}</th>
                  <th className="py-2 text-right">{t.colDue}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 align-top">
                    <td className="py-2 text-gray-500">{i + 1}</td>
                    <td className="py-2">
                      <span className="font-medium text-gray-900">
                        {r.name}
                        {r.isHead && (
                          <span className="ml-1.5 rounded-full border border-amber-400 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-600">
                            {t.head}
                          </span>
                        )}
                      </span>
                      {r.ref && <span className="block text-xs text-gray-400">{r.ref}</span>}
                    </td>
                    <td className="py-2 text-right text-gray-900">৳ {r.charged}</td>
                    <td className="py-2 text-right text-gray-900">৳ {r.paid}</td>
                    <td className="py-2 text-right font-medium text-gray-900">৳ {r.due}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-700 font-bold text-emerald-800">
                  <td className="py-2" colSpan={2}>
                    {t.grandTotal}
                    {data.perHeadLine && (
                      <span className="block text-xs font-medium text-gray-500">{data.perHeadLine}</span>
                    )}
                  </td>
                  <td className="py-2 text-right">৳ {data.totalCharged}</td>
                  <td className="py-2 text-right">৳ {data.totalPaid}</td>
                  <td className="py-2 text-right">৳ {data.totalDue}</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-3 flex flex-wrap justify-end gap-6 text-sm">
              <span className="text-gray-600">
                {t.totalPaid}: <span className="font-semibold text-gray-900">৳ {data.totalPaid}</span>
              </span>
              <span className="text-gray-600">
                {t.totalDue}: <span className="font-semibold text-gray-900">৳ {data.totalDue}</span>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex items-end justify-between">
            <p className="text-xs text-gray-400">{t.thanks}</p>
            <div className="text-center">
              <div className="w-48 border-t border-gray-400 pt-1 text-sm font-medium text-gray-700">{t.signature}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
