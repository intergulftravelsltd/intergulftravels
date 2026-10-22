'use client';

import { useEffect } from 'react';
import type { CompanyProfile } from '@/lib/company-profile';
import {
  ReceiptFrame,
  ReceiptLetterhead,
  ReceiptPanel,
  ReceiptPeriod,
  ReceiptRow,
  ReceiptSectionTitle,
  ReceiptSignatures,
  ReceiptSummary,
  RT,
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
    title: 'Group Statement',
    date: 'Date',
    branch: 'Branch',
    headOf: 'Group head',
    forProgram: 'Program',
    membersLabel: 'Members',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    colMember: 'Member',
    colCharged: 'Package (৳)',
    colPaid: 'Paid (৳)',
    colDue: 'Due (৳)',
    head: 'Head',
    membersHeading: 'Members',
    grandTotal: 'Group total',
    ledgerHeading: 'Statement — charges first, then payments date-wise',
    colDate: 'Date',
    colVoucher: 'Voucher No',
    colParticulars: 'Particulars / Narration',
    colBalance: 'Balance (৳)',
    summary: 'Summary',
    totalPackage: 'Total package',
    totalPaid: 'Total paid',
    totalDue: 'Net group due',
    nil: 'Nil',
    thanks: 'Thank you for choosing us.',
  },
  bn: {
    title: 'গ্রুপ হিসাব বিবরণী',
    date: 'তারিখ',
    branch: 'শাখা',
    headOf: 'গ্রুপ প্রধান',
    forProgram: 'প্রোগ্রাম',
    membersLabel: 'সদস্য',
    members: (n: number) => `${n} জন সদস্য`,
    colMember: 'সদস্য',
    colCharged: 'প্যাকেজ (৳)',
    colPaid: 'পরিশোধিত (৳)',
    colDue: 'বকেয়া (৳)',
    head: 'প্রধান',
    membersHeading: 'সদস্যরা',
    grandTotal: 'গ্রুপ মোট',
    ledgerHeading: 'হিসাব বিবরণী — আগে খরচ, তারপর তারিখ অনুযায়ী পেমেন্ট',
    colDate: 'তারিখ',
    colVoucher: 'ভাউচার নং',
    colParticulars: 'বিবরণ',
    colBalance: 'ব্যালেন্স (৳)',
    summary: 'সারসংক্ষেপ',
    totalPackage: 'মোট প্যাকেজ',
    totalPaid: 'মোট পরিশোধিত',
    totalDue: 'গ্রুপের নিট বকেয়া',
    nil: 'শূন্য',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
  },
};

const isZero = (s: string) => /^0+(\.0+)?$/.test(s.replace(/[,\s৳]/g, '')) || s.trim() === '';

/** Printable combined statement for a permanent family/group. */
export function GroupStatementReceipt({ data, locale }: { data: GroupStatementData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  useEffect(() => {
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, []);

  const dueZero = isZero(data.totalDue);

  return (
    <ReceiptFrame logo={data.company.logo} locale={locale}>
      <ReceiptLetterhead
        company={data.company}
        locale={locale}
        title={t.title}
        meta={[
          { label: t.date, value: data.date },
          { label: t.branch, value: data.branch },
        ]}
      />
      <ReceiptPeriod text={data.period} />

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ReceiptPanel heading={t.headOf}>
          <p className="text-[1.02rem] font-bold leading-tight text-gray-900">{data.headName}</p>
          <div className="mt-1.5">
            <ReceiptRow label={t.forProgram} value={data.program} />
            <ReceiptRow label={t.membersLabel} value={t.members(data.rows.length)} />
          </div>
        </ReceiptPanel>
        <ReceiptSummary
          heading={t.summary}
          lines={[
            { label: t.totalPackage, value: `৳ ${data.totalCharged}` },
            { label: t.totalPaid, value: `৳ ${data.totalPaid}` },
            { label: t.totalDue, value: dueZero ? t.nil : `৳ ${data.totalDue}`, total: true, tone: dueZero ? 'ok' : 'warn' },
          ]}
        />
      </div>

      {/* Member table */}
      <div className="mt-5">
        <ReceiptSectionTitle>{t.membersHeading}</ReceiptSectionTitle>
        <table className={RT.table}>
          <thead>
            <tr>
              <th className={`${RT.th} w-8`}>#</th>
              <th className={RT.th}>{t.colMember}</th>
              <th className={RT.thRight}>{t.colCharged}</th>
              <th className={RT.thRight}>{t.colPaid}</th>
              <th className={RT.thRight}>{t.colDue}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td className={RT.tdMuted}>{i + 1}</td>
                <td className={RT.td}>
                  <span className="font-medium text-gray-900">
                    {r.name}
                    {r.isHead && (
                      <span className="ml-1.5 rounded border border-amber-400 px-1 py-px text-[0.6rem] font-bold uppercase tracking-wide text-amber-600">
                        {t.head}
                      </span>
                    )}
                  </span>
                  {r.ref && <span className="block text-[0.7rem] text-gray-400">{r.ref}</span>}
                </td>
                <td className={RT.tdRight}>{r.charged}</td>
                <td className={RT.tdRight}>{r.paid}</td>
                <td className={`${RT.tdRight} font-medium ${isZero(r.due) ? 'text-gray-900' : 'text-red-600'}`}>{r.due}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={RT.total} colSpan={2}>
                {t.grandTotal}
                {data.perHeadLine && <span className="block text-[0.7rem] font-medium text-gray-500">{data.perHeadLine}</span>}
              </td>
              <td className={RT.totalRight}>{data.totalCharged}</td>
              <td className={RT.totalRight}>{data.totalPaid}</td>
              <td className={`${RT.totalRight} ${dueZero ? 'text-emerald-800' : 'text-red-600'}`}>{data.totalDue}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Date-wise combined statement: charges first, then payments */}
      {data.ledger.length > 0 && (
        <div className="mt-5">
          <ReceiptSectionTitle>{t.ledgerHeading}</ReceiptSectionTitle>
          <table className={RT.table}>
            <thead>
              <tr>
                <th className={RT.th}>{t.colDate}</th>
                <th className={RT.th}>{t.colVoucher}</th>
                <th className={RT.th}>{t.colParticulars}</th>
                <th className={RT.thRight}>{t.colCharged}</th>
                <th className={RT.thRight}>{t.colPaid}</th>
                <th className={RT.thRight}>{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((line, i) => (
                <tr key={i}>
                  <td className={`${RT.td} whitespace-nowrap`}>{line.date}</td>
                  <td className={RT.tdMuted}>
                    {line.voucher || '—'}
                    {line.manualRef && <span className="block font-semibold text-gray-800">{line.manualRef}</span>}
                  </td>
                  <td className={RT.td}>
                    <span className="font-medium text-gray-900">{line.member}</span>
                    <span className="block text-[0.7rem] text-gray-500">{line.particulars}</span>
                  </td>
                  <td className={RT.tdRight}>{line.charge}</td>
                  <td className={RT.tdRight}>{line.paid}</td>
                  <td className={`${RT.tdRight} font-medium text-gray-900`}>{line.balance}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className={RT.total} colSpan={3}>
                  {t.totalDue}
                </td>
                <td className={RT.totalRight}>{data.totalCharged}</td>
                <td className={RT.totalRight}>{data.totalPaid}</td>
                <td className={`${RT.totalRight} ${dueZero ? 'text-emerald-800' : 'text-red-600'}`}>{data.totalDue}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <ReceiptSignatures locale={locale} note={t.thanks} printedOn={data.date} />
    </ReceiptFrame>
  );
}
