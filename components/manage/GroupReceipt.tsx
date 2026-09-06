'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import type { CompanyProfile } from '@/lib/company-profile';
import {
  RECEIPT_PRINT_CSS,
  ReceiptLetterhead,
  ReceiptSignatures,
  ReceiptWatermark,
} from '@/components/manage/ReceiptChrome';

export type GroupReceiptData = {
  company: CompanyProfile;
  program: string; // "Hajj" / "Umrah" (already localized)
  receiptNo: string;
  /** Hand-written money-receipt number from the physical paper. */
  manualRef?: string | null;
  date: string;
  branch: string;
  payerName: string;
  payerPhone: string;
  method: string;
  type: string;
  narration: string;
  rows: { name: string; voucher: string; manualRef?: string; amount: string }[];
  total: string;
  totalWords: string;
};

const L = {
  en: {
    title: 'Group Payment Receipt',
    no: 'Receipt No',
    manualNo: 'Manual No',
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
    thanks: 'Thank you for choosing us.',
    print: 'Print / Save PDF',
    back: 'Back',
    only: 'only',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
  },
  bn: {
    title: 'গ্রুপ পেমেন্ট রসিদ',
    no: 'রসিদ নং',
    manualNo: 'ম্যানুয়াল নং',
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
      <style>{RECEIPT_PRINT_CSS}</style>

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
        <ReceiptWatermark logo={data.company.logo} />
        <div className="relative">
          <ReceiptLetterhead company={data.company} locale={locale} />

          {/* Title */}
          <div className="my-5 text-center">
            <span className="inline-block rounded-full border border-emerald-700 px-5 py-1 text-lg font-bold uppercase tracking-wide text-emerald-800">
              {t.title}
            </span>
          </div>

          {/* Meta */}
          <div className="mb-4 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
            <span>
              <span className="text-gray-500">{t.no}:</span>{' '}
              <span className="font-semibold text-gray-900">{data.receiptNo}</span>
            </span>
            {data.manualRef && (
              <span>
                <span className="text-gray-500">{t.manualNo}:</span>{' '}
                <span className="font-semibold text-gray-900">{data.manualRef}</span>
              </span>
            )}
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
                    <td className="py-2 text-gray-600">
                      {r.voucher}
                      {r.manualRef && <span className="block text-xs font-semibold text-gray-800">{r.manualRef}</span>}
                    </td>
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

          <ReceiptSignatures locale={locale} note={t.thanks} />
        </div>
      </div>
    </div>
  );
}
