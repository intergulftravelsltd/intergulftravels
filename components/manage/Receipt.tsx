'use client';

import { useEffect } from 'react';
import type { CompanyProfile } from '@/lib/company-profile';
import {
  ReceiptAmount,
  ReceiptFrame,
  ReceiptLetterhead,
  ReceiptPanel,
  ReceiptPeriod,
  ReceiptRow,
  ReceiptSignatures,
  ReceiptSummary,
  RT,
  type ReceiptMeta,
} from '@/components/manage/ReceiptChrome';

export type ReceiptData = {
  /** The agency's letterhead (multi-tenant: resolved from the record's branch). */
  company: CompanyProfile;
  program: string; // "Umrah" / "Hajj" (already localized)
  receiptNo: string;
  /** Hand-written money-receipt / voucher number from the physical paper. */
  manualRef?: string | null;
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
  ledger?: {
    date: string;
    particulars: string;
    /** Counter account (the other side of the entry). */
    against?: string;
    voucher: string;
    manualRef?: string;
    charge: string;
    /** Discount granted on this line (DV vouchers / adjustments). */
    discount?: string;
    paid: string;
    balance: string;
  }[];
  totalCharge?: string;
  /** Discounts granted ('' when none). */
  totalDiscount?: string;
  /** Total package minus discounts. */
  payable?: string;
  /** "Statement for the period: … to …" (statements only). */
  period?: string | null;
  /** When present, the receipt is a voucher receipt showing the double entry. */
  voucher?: { debit: string; credit: string };
};

const L = {
  en: {
    receipt: 'Money Receipt',
    refund: 'Refund Voucher',
    voucherTitle: 'Voucher',
    no: 'Receipt No',
    manualNo: 'Manual No',
    date: 'Date',
    branch: 'Branch',
    receivedFrom: 'Received with thanks from',
    refundTo: 'Refunded to',
    accountHolder: 'Account holder',
    phone: 'Phone',
    address: 'Address',
    forProgram: 'Program',
    package: 'Package',
    amount: 'Amount',
    inWords: 'In words',
    method: 'Payment method',
    type: 'Payment type',
    note: 'Note',
    totalPaid: 'Total paid',
    balanceDue: 'Balance due',
    thanks: 'Thank you for choosing us.',
    only: 'only',
    passport: 'Passport No',
    colDate: 'Date / Voucher No',
    noPayments: 'No transactions recorded yet.',
    grandTotal: 'Total',
    debit: 'Debit (Dr)',
    credit: 'Credit (Cr)',
    voucherEntry: 'Entry',
    statementHeading: 'Account Statement',
    summary: 'Summary',
    colParticulars: 'Particulars / Narration',
    colCharge: 'Charge (৳)',
    colDiscount: 'Discount (৳)',
    colPaidLedger: 'Paid (৳)',
    colBalance: 'Balance (৳)',
    totalPackage: 'Total package',
    discountLabel: 'Discount',
    payable: 'Payable after discount',
    against: 'Against',
    nil: 'Nil',
  },
  bn: {
    receipt: 'অর্থ রসিদ',
    refund: 'রিফান্ড ভাউচার',
    voucherTitle: 'ভাউচার',
    no: 'রসিদ নং',
    manualNo: 'ম্যানুয়াল নং',
    date: 'তারিখ',
    branch: 'শাখা',
    receivedFrom: 'ধন্যবাদসহ গ্রহণ করা হলো',
    refundTo: 'ফেরত দেওয়া হলো',
    accountHolder: 'হিসাবধারী',
    phone: 'ফোন',
    address: 'ঠিকানা',
    forProgram: 'প্রোগ্রাম',
    package: 'প্যাকেজ',
    amount: 'পরিমাণ',
    inWords: 'কথায়',
    method: 'পেমেন্ট মাধ্যম',
    type: 'পেমেন্টের ধরন',
    note: 'নোট',
    totalPaid: 'মোট পরিশোধিত',
    balanceDue: 'বাকি',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
    only: 'মাত্র',
    passport: 'পাসপোর্ট নং',
    colDate: 'তারিখ / ভাউচার নং',
    noPayments: 'এখনও কোনো লেনদেন নেই।',
    grandTotal: 'মোট',
    debit: 'ডেবিট (নামে)',
    credit: 'ক্রেডিট (জমা)',
    voucherEntry: 'এন্ট্রি',
    statementHeading: 'হিসাব বিবরণী',
    summary: 'সারসংক্ষেপ',
    colParticulars: 'বিবরণ',
    colCharge: 'চার্জ (৳)',
    colDiscount: 'ছাড় (৳)',
    colPaidLedger: 'পরিশোধ (৳)',
    colBalance: 'ব্যালেন্স (৳)',
    totalPackage: 'মোট প্যাকেজ',
    discountLabel: 'ছাড়',
    payable: 'ছাড়ের পর দেয়',
    against: 'বিপরীতে',
    nil: 'শূন্য',
  },
};

const isZero = (s: string) => /^0+(\.0+)?$/.test(s.replace(/[,\s৳]/g, '')) || s.trim() === '';

export function Receipt({ data, locale }: { data: ReceiptData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  // Open the print dialog automatically once the receipt has painted.
  useEffect(() => {
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, []);

  const kind = data.ledger ? 'statement' : data.voucher ? 'voucher' : data.isRefund ? 'refund' : 'receipt';
  const title =
    kind === 'statement' ? t.statementHeading : kind === 'voucher' ? t.voucherTitle : kind === 'refund' ? t.refund : t.receipt;
  const meta: ReceiptMeta[] = [
    { label: t.no, value: data.receiptNo },
    ...(data.manualRef ? [{ label: t.manualNo, value: data.manualRef }] : []),
    { label: t.date, value: data.date },
    { label: t.branch, value: data.branch },
  ];
  const dueZero = isZero(data.due);
  // Discounts get their own column + summary lines only when there are any.
  const hasDiscount = !!data.totalDiscount || !!data.ledger?.some((r) => r.discount);

  return (
    <ReceiptFrame logo={data.company.logo} locale={locale}>
      <ReceiptLetterhead company={data.company} locale={locale} title={title} meta={meta} />
      <ReceiptPeriod text={data.period} />

      {kind === 'voucher' && data.voucher ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ReceiptPanel heading={t.voucherEntry}>
            <ReceiptRow label={t.debit} value={data.voucher.debit} />
            <ReceiptRow label={t.credit} value={data.voucher.credit} />
            {data.narration && <ReceiptRow label={t.note} value={data.narration} />}
          </ReceiptPanel>
          <ReceiptAmount label={t.amount} amount={data.amount} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ReceiptPanel heading={kind === 'statement' ? t.accountHolder : kind === 'refund' ? t.refundTo : t.receivedFrom}>
            <p className="text-[1.02rem] font-bold leading-tight text-gray-900">{data.partyName}</p>
            <div className="mt-1.5">
              {data.partyPassport && <ReceiptRow label={t.passport} value={data.partyPassport} />}
              <ReceiptRow label={t.phone} value={data.partyPhone} />
              {data.partyAddress && <ReceiptRow label={t.address} value={data.partyAddress} />}
              <ReceiptRow label={t.forProgram} value={data.program} />
              {data.packageName && <ReceiptRow label={t.package} value={data.packageName} />}
            </div>
          </ReceiptPanel>

          {kind === 'statement' ? (
            <ReceiptSummary
              heading={t.summary}
              lines={[
                { label: t.totalPackage, value: `৳ ${data.totalCharge ?? '0'}` },
                ...(hasDiscount && data.totalDiscount
                  ? [
                      { label: t.discountLabel, value: `− ৳ ${data.totalDiscount}` },
                      { label: t.payable, value: `৳ ${data.payable ?? data.totalCharge ?? '0'}` },
                    ]
                  : []),
                { label: t.totalPaid, value: `৳ ${data.paid}` },
                { label: t.balanceDue, value: dueZero ? t.nil : `৳ ${data.due}`, total: true, tone: dueZero ? 'ok' : 'warn' },
              ]}
            />
          ) : (
            <ReceiptAmount
              label={t.amount}
              amount={data.amount}
              words={data.amountWords ? `${t.inWords}: ${data.amountWords} ${t.only}` : undefined}
            />
          )}
        </div>
      )}

      {kind === 'statement' && data.ledger && (
        <div className="mt-5">
          {data.ledger.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">{t.noPayments}</p>
          ) : (
            <table className={RT.table}>
              <thead>
                <tr>
                  <th className={RT.th}>{t.colDate}</th>
                  <th className={RT.th}>{t.colParticulars}</th>
                  <th className={RT.thRight}>{t.colCharge}</th>
                  {hasDiscount && <th className={RT.thRight}>{t.colDiscount}</th>}
                  <th className={RT.thRight}>{t.colPaidLedger}</th>
                  <th className={RT.thRight}>{t.colBalance}</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((r, i) => (
                  <tr key={i}>
                    {/* Voucher (and the hand-written number) sit under the date. */}
                    <td className={`${RT.td} whitespace-nowrap`}>
                      {r.date}
                      <span className="block text-[0.68rem] text-gray-500">
                        {r.voucher || '—'}
                        {r.manualRef && (
                          <>
                            {' · '}
                            <span className="font-semibold text-gray-800">{r.manualRef}</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className={RT.td}>
                      {r.particulars}
                      {r.against && r.against !== r.particulars && (
                        <span className="block text-[0.7rem] text-gray-400">
                          {t.against}: {r.against}
                        </span>
                      )}
                    </td>
                    <td className={RT.tdRight}>{r.charge}</td>
                    {hasDiscount && <td className={`${RT.tdRight} text-amber-700`}>{r.discount ?? ''}</td>}
                    <td className={RT.tdRight}>{r.paid}</td>
                    <td className={`${RT.tdRight} font-medium text-gray-900`}>{r.balance}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={RT.total} colSpan={2}>
                    {t.grandTotal}
                  </td>
                  <td className={RT.totalRight}>{data.totalCharge}</td>
                  {hasDiscount && <td className={`${RT.totalRight} text-amber-700`}>{data.totalDiscount || '0'}</td>}
                  <td className={RT.totalRight}>{data.paid}</td>
                  <td className={`${RT.totalRight} ${dueZero ? 'text-emerald-800' : 'text-red-600'}`}>{data.due}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {kind !== 'statement' && kind !== 'voucher' && (
        <ReceiptPanel className="mt-3">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <ReceiptRow label={t.method} value={data.method} />
            <ReceiptRow label={t.type} value={data.type} />
            <ReceiptRow label={t.totalPaid} value={`৳ ${data.paid}`} />
            <ReceiptRow label={t.balanceDue} value={dueZero ? t.nil : `৳ ${data.due}`} />
          </div>
          {data.narration && <ReceiptRow label={t.note} value={data.narration} />}
        </ReceiptPanel>
      )}

      <ReceiptSignatures locale={locale} company={data.company} note={t.thanks} printedOn={data.date} />
    </ReceiptFrame>
  );
}
