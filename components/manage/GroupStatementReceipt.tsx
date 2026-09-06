'use client';

import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import type { CompanyProfile } from '@/lib/company-profile';
import {
  RECEIPT_PRINT_CSS,
  ReceiptLetterhead,
  ReceiptPeriod,
  ReceiptSignatures,
  ReceiptWatermark,
} from '@/components/manage/ReceiptChrome';

export type GroupStatementData = {
  company: CompanyProfile;
  program: string; // "Hajj" / "Umrah" (already localized)
  date: string;
  branch: string;
  headName: string;
  /** "Statement for the period: … to …" */
  period?: string | null;
  rows: { name: string; ref: string; isHead: boolean; charged: string; paid: string; due: string }[];
  /** Charges first, then discounts & payments date-wise, running balance. */
  ledger: {
    date: string;
    member: string;
    particulars: string;
    voucher: string;
    manualRef?: string;
    charge: string;
    paid: string;
    balance: string;
  }[];
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
    ledgerHeading: 'Statement — charges first, then payments date-wise',
    colDate: 'Date',
    colVoucher: 'Voucher No',
    colParticulars: 'Particulars / Narration',
    colBalance: 'Balance',
    totalPaid: 'Total paid',
    totalDue: 'Total due',
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
    ledgerHeading: 'হিসাব বিবরণী — আগে খরচ, তারপর তারিখ অনুযায়ী পেমেন্ট',
    colDate: 'তারিখ',
    colVoucher: 'ভাউচার নং',
    colParticulars: 'বিবরণ',
    colBalance: 'ব্যালেন্স',
    totalPaid: 'মোট পরিশোধিত',
    totalDue: 'মোট বকেয়া',
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
            <span className="inline-block rounded-full border border-emerald-700 px-5 py-1 text-lg font-bold tracking-wide text-emerald-800">
              {t.title}
            </span>
          </div>
          <ReceiptPeriod text={data.period} />

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
                  <td className="whitespace-nowrap py-2 text-right">৳ {data.totalCharged}</td>
                  <td className="whitespace-nowrap py-2 text-right">৳ {data.totalPaid}</td>
                  <td className="whitespace-nowrap py-2 text-right">৳ {data.totalDue}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Date-wise combined statement: charges first, then payments */}
          {data.ledger.length > 0 && (
            <div className="my-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.ledgerHeading}</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-left text-gray-500">
                    <th className="py-2">{t.colDate}</th>
                    <th className="py-2">{t.colVoucher}</th>
                    <th className="py-2">{t.colParticulars}</th>
                    <th className="py-2 text-right">{t.colCharged}</th>
                    <th className="py-2 text-right">{t.colPaid}</th>
                    <th className="py-2 text-right">{t.colBalance}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((line, i) => (
                    <tr key={i} className="border-b border-gray-200 align-top">
                      <td className="whitespace-nowrap py-2 text-gray-800">{line.date}</td>
                      <td className="whitespace-nowrap py-2 text-xs text-gray-600">
                        {line.voucher || '—'}
                        {line.manualRef && <span className="block font-semibold text-gray-800">{line.manualRef}</span>}
                      </td>
                      <td className="py-2">
                        <span className="font-medium text-gray-900">{line.member}</span>
                        <span className="block text-xs text-gray-500">{line.particulars}</span>
                      </td>
                      <td className="whitespace-nowrap py-2 text-right text-gray-800">{line.charge ? `৳ ${line.charge}` : ''}</td>
                      <td className="whitespace-nowrap py-2 text-right text-gray-800">{line.paid ? `৳ ${line.paid}` : ''}</td>
                      <td className="whitespace-nowrap py-2 text-right font-medium text-gray-900">৳ {line.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex flex-wrap justify-end gap-6 text-sm">
            <span className="text-gray-600">
              {t.totalPaid}: <span className="font-semibold text-gray-900">৳ {data.totalPaid}</span>
            </span>
            <span className="text-gray-600">
              {t.totalDue}: <span className="font-semibold text-gray-900">৳ {data.totalDue}</span>
            </span>
          </div>

          <ReceiptSignatures locale={locale} note={t.thanks} />
        </div>
      </div>
    </div>
  );
}
