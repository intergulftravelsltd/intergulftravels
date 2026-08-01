'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

export type ReceiptData = {
  company: { name: string; address: string; phone: string; email: string; license: string; logo?: string };
  program: string; // "Umrah" / "Hajj" (already localized)
  receiptNo: string;
  date: string;
  branch: string;
  partyName: string;
  partyPassport?: string;
  partyPhone: string;
  partyAddress: string;
  packageName: string;
  amount: string;
  amountWords: string;
  method: string;
  type: string;
  narration: string;
  paid: string;
  due: string;
  isRefund: boolean;
  /** When present, the receipt is an in-depth account statement: every ledger
   *  entry (package charges + all payments) with a running balance. */
  ledger?: { date: string; particulars: string; voucher: string; charge: string; paid: string; balance: string }[];
  totalCharge?: string;
  /** When present, the receipt is a voucher receipt showing the double entry. */
  voucher?: { debit: string; credit: string };
};

const L = {
  en: {
    receipt: 'Money Receipt',
    refund: 'Refund Voucher',
    no: 'Receipt No',
    date: 'Date',
    branch: 'Branch',
    receivedFrom: 'Received with thanks from',
    refundTo: 'Refunded to',
    phone: 'Phone',
    address: 'Address',
    forProgram: 'For',
    package: 'Package',
    amount: 'Amount',
    inWords: 'In words',
    method: 'Payment method',
    type: 'Payment type',
    note: 'Note',
    totalPaid: 'Total paid',
    balanceDue: 'Balance due',
    signature: 'Authorised signature',
    thanks: 'Thank you for choosing us.',
    print: 'Print / Save PDF',
    back: 'Back',
    only: 'only',
    passport: 'Passport No',
    colDate: 'Date',
    colType: 'Type',
    colMethod: 'Method',
    colAmount: 'Amount',
    paymentsHeading: 'Payments received',
    noPayments: 'No transactions recorded yet.',
    grandTotal: 'Total',
    debit: 'Debit (Dr)',
    credit: 'Credit (Cr)',
    statementHeading: 'Account statement',
    colParticulars: 'Particulars',
    colCharge: 'Charge',
    colPaidLedger: 'Paid',
    colBalance: 'Balance',
    totalPackage: 'Total package',
  },
  bn: {
    receipt: 'অর্থ রসিদ',
    refund: 'রিফান্ড ভাউচার',
    no: 'রসিদ নং',
    date: 'তারিখ',
    branch: 'শাখা',
    receivedFrom: 'ধন্যবাদসহ গ্রহণ করা হলো',
    refundTo: 'ফেরত দেওয়া হলো',
    phone: 'ফোন',
    address: 'ঠিকানা',
    forProgram: 'কীসের জন্য',
    package: 'প্যাকেজ',
    amount: 'পরিমাণ',
    inWords: 'কথায়',
    method: 'পেমেন্ট মাধ্যম',
    type: 'পেমেন্টের ধরন',
    note: 'নোট',
    totalPaid: 'মোট পরিশোধিত',
    balanceDue: 'বাকি',
    signature: 'অনুমোদিত স্বাক্ষর',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
    print: 'প্রিন্ট / PDF সেভ',
    back: 'ফিরুন',
    only: 'মাত্র',
    passport: 'পাসপোর্ট নং',
    colDate: 'তারিখ',
    colType: 'ধরন',
    colMethod: 'মাধ্যম',
    colAmount: 'পরিমাণ',
    paymentsHeading: 'গৃহীত পেমেন্ট',
    noPayments: 'এখনও কোনো লেনদেন নেই।',
    grandTotal: 'মোট',
    debit: 'ডেবিট (নামে)',
    credit: 'ক্রেডিট (জমা)',
    statementHeading: 'হিসাব বিবরণী',
    colParticulars: 'বিবরণ',
    colCharge: 'চার্জ',
    colPaidLedger: 'পরিশোধ',
    colBalance: 'ব্যালেন্স',
    totalPackage: 'মোট প্যাকেজ',
  },
};

export function Receipt({ data, locale }: { data: ReceiptData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  // Open the print dialog automatically once the receipt has painted.
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
    <div className="fixed inset-0 z-[100] overflow-auto bg-neutral-100 p-4 text-black sm:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; overflow: visible !important; }
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

      <div id="receipt" className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Brand watermark behind the content */}
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
            {data.isRefund ? t.refund : t.receipt}
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

        {data.voucher && (
          <>
            <div className="my-4 rounded-xl bg-gray-50/60 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.debit}</p>
                  <p className="text-base font-bold text-gray-900">{data.voucher.debit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.credit}</p>
                  <p className="text-base font-bold text-gray-900">{data.voucher.credit}</p>
                </div>
              </div>
              {data.narration && (
                <div className="mt-3 border-t border-gray-200 pt-2">
                  <Row label={t.note} value={data.narration} />
                </div>
              )}
            </div>
            <div className="my-5 flex items-center justify-between rounded-xl border-2 border-emerald-700 bg-emerald-50/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t.amount}</p>
              <p className="text-3xl font-extrabold text-emerald-800">৳ {data.amount}</p>
            </div>
          </>
        )}

        {!data.voucher && (
          <>
        {/* Party — translucent so the brand watermark stays visible behind it */}
        <div className="rounded-xl bg-gray-50/60 p-4">
          <p className="text-sm text-gray-500">{data.isRefund ? t.refundTo : t.receivedFrom}</p>
          <p className="text-lg font-bold text-gray-900">{data.partyName}</p>
          {data.partyPassport && <Row label={t.passport} value={data.partyPassport} />}
          <Row label={t.phone} value={data.partyPhone} />
          {data.partyAddress && <Row label={t.address} value={data.partyAddress} />}
          <Row label={t.forProgram} value={data.program} />
          {data.packageName && <Row label={t.package} value={data.packageName} />}
        </div>

        {data.ledger ? (
          /* In-depth statement — every ledger entry + running balance + totals. */
          <div className="my-5">
            <p className="mb-2 text-sm font-semibold text-gray-700">{t.statementHeading}</p>
            {data.ledger.length === 0 ? (
              <p className="rounded-xl bg-gray-50/60 px-4 py-6 text-center text-sm text-gray-500">{t.noPayments}</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-left text-gray-500">
                    <th className="py-2">{t.colDate}</th>
                    <th className="py-2">{t.colParticulars}</th>
                    <th className="py-2 text-right">{t.colCharge}</th>
                    <th className="py-2 text-right">{t.colPaidLedger}</th>
                    <th className="py-2 text-right">{t.colBalance}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((r, i) => (
                    <tr key={i} className="border-b border-gray-200 align-top">
                      <td className="whitespace-nowrap py-2 text-gray-800">{r.date}</td>
                      <td className="py-2 text-gray-800">
                        {r.particulars}
                        {r.voucher && <span className="block text-xs text-gray-400">{r.voucher}</span>}
                      </td>
                      <td className="py-2 text-right text-gray-800">{r.charge ? `৳ ${r.charge}` : ''}</td>
                      <td className="py-2 text-right text-gray-800">{r.paid ? `৳ ${r.paid}` : ''}</td>
                      <td className="py-2 text-right font-medium text-gray-900">৳ {r.balance}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-emerald-700 font-bold text-emerald-800">
                    <td className="py-2" colSpan={2}>
                      {t.grandTotal}
                    </td>
                    <td className="py-2 text-right">৳ {data.totalCharge}</td>
                    <td className="py-2 text-right">৳ {data.paid}</td>
                    <td className="py-2 text-right">৳ {data.due}</td>
                  </tr>
                </tfoot>
              </table>
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-6 text-sm">
              <span className="text-gray-600">
                {t.totalPackage}: <span className="font-semibold text-gray-900">৳ {data.totalCharge}</span>
              </span>
              <span className="text-gray-600">
                {t.totalPaid}: <span className="font-semibold text-gray-900">৳ {data.paid}</span>
              </span>
              <span className="text-gray-600">
                {t.balanceDue}: <span className="font-semibold text-gray-900">৳ {data.due}</span>
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Single-payment amount */}
            <div className="my-5 flex items-center justify-between rounded-xl border-2 border-emerald-700 bg-emerald-50/60 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{t.amount}</p>
                {data.amountWords && (
                  <p className="mt-0.5 text-sm text-gray-600">
                    {t.inWords}: {data.amountWords} {t.only}
                  </p>
                )}
              </div>
              <p className="text-3xl font-extrabold text-emerald-800">৳ {data.amount}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-6">
              <Row label={t.method} value={data.method} />
              <Row label={t.type} value={data.type} />
              <Row label={t.totalPaid} value={`৳ ${data.paid}`} />
              <Row label={t.balanceDue} value={`৳ ${data.due}`} />
            </div>
            {data.narration && <Row label={t.note} value={data.narration} />}
          </>
        )}

          </>
        )}

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
