'use client';

import { useEffect } from 'react';
import type { CompanyProfile } from '@/lib/company-profile';
import {
  ReceiptAmount,
  ReceiptFrame,
  ReceiptLetterhead,
  ReceiptPanel,
  ReceiptRow,
  ReceiptSectionTitle,
  ReceiptSignatures,
  RT,
  type ReceiptMeta,
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
    forProgram: 'Program',
    membersLabel: 'Members',
    membersHeading: 'Members covered by this payment',
    colMember: 'Member',
    colVoucher: 'Voucher No',
    colAmount: 'Amount (৳)',
    grandTotal: 'Total received',
    inWords: 'In words',
    method: 'Payment method',
    type: 'Payment type',
    note: 'Note',
    thanks: 'Thank you for choosing us.',
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
    forProgram: 'প্রোগ্রাম',
    membersLabel: 'সদস্য',
    membersHeading: 'এই পেমেন্টের অন্তর্ভুক্ত সদস্যরা',
    colMember: 'সদস্য',
    colVoucher: 'ভাউচার নং',
    colAmount: 'পরিমাণ (৳)',
    grandTotal: 'মোট গৃহীত',
    inWords: 'কথায়',
    method: 'পেমেন্ট মাধ্যম',
    type: 'পেমেন্টের ধরন',
    note: 'নোট',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
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

  const meta: ReceiptMeta[] = [
    { label: t.no, value: data.receiptNo },
    ...(data.manualRef ? [{ label: t.manualNo, value: data.manualRef }] : []),
    { label: t.date, value: data.date },
    { label: t.branch, value: data.branch },
  ];

  return (
    <ReceiptFrame logo={data.company.logo} locale={locale}>
      <ReceiptLetterhead company={data.company} locale={locale} title={t.title} meta={meta} />

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ReceiptPanel heading={t.receivedFrom}>
          <p className="text-[1.02rem] font-bold leading-tight text-gray-900">{data.payerName}</p>
          <div className="mt-1.5">
            {data.payerPhone && <ReceiptRow label={t.phone} value={data.payerPhone} />}
            <ReceiptRow label={t.forProgram} value={data.program} />
            <ReceiptRow label={t.membersLabel} value={t.members(data.rows.length)} />
          </div>
        </ReceiptPanel>
        <ReceiptAmount
          label={t.grandTotal}
          amount={data.total}
          words={data.totalWords ? `${t.inWords}: ${data.totalWords} ${t.only}` : undefined}
        />
      </div>

      {/* Members table */}
      <div className="mt-5">
        <ReceiptSectionTitle>{t.membersHeading}</ReceiptSectionTitle>
        <table className={RT.table}>
          <thead>
            <tr>
              <th className={`${RT.th} w-8`}>#</th>
              <th className={RT.th}>{t.colMember}</th>
              <th className={RT.th}>{t.colVoucher}</th>
              <th className={RT.thRight}>{t.colAmount}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td className={RT.tdMuted}>{i + 1}</td>
                <td className={`${RT.td} font-medium text-gray-900`}>{r.name}</td>
                <td className={RT.tdMuted}>
                  {r.voucher || '—'}
                  {r.manualRef && <span className="block font-semibold text-gray-800">{r.manualRef}</span>}
                </td>
                <td className={RT.tdRight}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={RT.total} colSpan={3}>
                {t.grandTotal}
              </td>
              <td className={`${RT.totalRight} text-emerald-800`}>{data.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ReceiptPanel className="mt-3">
        <div className="grid gap-x-6 sm:grid-cols-2">
          <ReceiptRow label={t.method} value={data.method} />
          <ReceiptRow label={t.type} value={data.type} />
        </div>
        {data.narration && <ReceiptRow label={t.note} value={data.narration} />}
      </ReceiptPanel>

      <ReceiptSignatures locale={locale} note={t.thanks} printedOn={data.date} />
    </ReceiptFrame>
  );
}
