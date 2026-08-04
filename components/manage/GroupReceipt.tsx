'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

export type GroupReceiptData = {
  company: { name: string; address: string; phone: string; email: string; license: string; logo?: string };
  program: string; // "Hajj" / "Umrah" (already localized)
  receiptNo: string;
  date: string;
  branch: string;
  payerName: string;
  payerPhone: string;
  method: string;
  type: string;
  narration: string;
  rows: { name: string; voucher: string; amount: string }[];
  total: string;
  totalWords: string;
};

const L = {
  en: {
    title: 'Group Payment Receipt',
    no: 'Receipt No',
    date: 'Date',
    branch: 'Branch',
    receivedFrom: 'Received with thanks from',
    phone: 'Phone',
    forProgram: 'For',
    membersHeading: 'Members covered by this payment',
    colMember: 'Member',
    colVoucher: 'Voucher',
    colAmount: 'Amount',
    grandTotal: 'Total received',
    inWords: 'In words',
    method: 'Payment method',
    type: 'Payment type',
    note: 'Note',
    signature: 'Authorised signature',
    thanks: 'Thank you for choosing us.',
    print: 'Print / Save PDF',
    back: 'Back',
    only: 'only',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
  },
  bn: {
    title: 'গ্রুপ পেমেন্ট রসিদ',
    no: 'রসিদ নং',
    date: 'তারিখ',
    branch: 'শাখা',
    receivedFrom: 'ধন্যবাদসহ গ্রহণ করা হলো',
    phone: 'ফোন',
    forProgram: 'কীসের জন্য',
    membersHeading: 'এই পেমেন্টের অন্তর্ভুক্ত সদস্যরা',
    colMember: 'সদস্য',
    colVoucher: 'ভাউচার',
    colAmount: 'পরিমাণ',
    grandTotal: 'মোট গৃহীত',
    inWords: 'কথায়',
    method: 'পেমেন্ট মাধ্যম',
    type: 'পেমেন্টের ধরন',
    note: 'নোট',
    signature: 'অনুমোদিত স্বাক্ষর',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
    print: 'প্রিন্ট / PDF সেভ',
    back: 'ফিরুন',
    only: 'মাত্র',
    members: (n: number) => `${n} জন সদস্য`,
  },
};

/** Combined receipt for a family/group bulk payment made in one payer's name. */
export function GroupReceipt({ data, locale }: { data: GroupReceiptData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  useEffect(() => {
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, []);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex gap-2 py-1 text-[0.92rem]">
      <span className="w-40 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">: {value}</span>
    </div>
  );

  return (
    <div id="print-root" className="fixed inset-0 z-[100] overflow-auto bg-neutral-100 p-4 text-black sm:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          /* The screen wrapper is position:fixed — printed fixed elements repeat
             on EVERY page, which duplicated multi-page receipts. Flatten both
             wrappers to normal flow for print. */
          #print-root { position: static !important; inset: auto !important; overflow: visible !important; padding: 0 !important; background: #fff !important; }
          #receipt { position: static !important; width: 100%; max-width: none !important; box-shadow: none !important; border: 0 !important; overflow: visible !important; }
          .no-print { display: none !important; }
          /* Pin the watermark to the centre of the printed page so it can never
             be clipped by the receipt box or a fragment boundary. */
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
            // Uniform grey stamp: without the grayscale+brightness filter the
            // light-coloured parts of the logos fade into the white paper and
            // the watermark looks "half printed".
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
            <span className="inline-block rounded-full border border-emerald-700 px-5 py-1 text-lg font-bold uppercase tracking-wide text-emerald-800">
              {t.title}
            </span>
          </div>

          {/* Meta */}
          <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
            <span>
              <span className="text-gray-500">{t.no}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.receiptNo}</span>
            </span>
            <span>
              <span className="text-gray-500">{t.branch}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.branch}</span>
            </span>
            <span>
              <span className="text-gray-500">{t.date}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.date}</span>
            </span>
          </div>

          {/* Payer — translucent so the brand watermark stays visible behind it */}
          <div className="rounded-xl bg-gray-50/60 p-4">
            <p className="text-sm text-gray-500">{t.receivedFrom}</p>
            <p className="text-lg font-bold text-gray-900">{data.payerName}</p>
            {data.payerPhone && <Row label={t.phone} value={data.payerPhone} />}
            <Row label={t.forProgram} value={`${data.program} · ${t.members(data.rows.length)}`} />
          </div>

          {/* Members table */}
          <div className="my-5">
            <p className="mb-2 text-sm font-semibold text-gray-700">{t.membersHeading}</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left text-gray-500">
                  <th className="py-2">#</th>
                  <th className="py-2">{t.colMember}</th>
                  <th className="py-2">{t.colVoucher}</th>
                  <th className="py-2 text-right">{t.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-200 align-top">
                    <td className="py-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2 text-gray-600">{r.voucher}</td>
                    <td className="py-2 text-right text-gray-900">৳ {r.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-700 font-bold text-emerald-800">
                  <td className="py-2" colSpan={3}>
                    {t.grandTotal}
                  </td>
                  <td className="py-2 text-right">৳ {data.total}</td>
                </tr>
              </tfoot>
            </table>
            {data.totalWords && (
              <p className="mt-1.5 text-sm text-gray-600">
                {t.inWords}: {data.totalWords}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6">
            <Row label={t.method} value={data.method} />
            <Row label={t.type} value={data.type} />
          </div>
          {data.narration && <Row label={t.note} value={data.narration} />}

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
