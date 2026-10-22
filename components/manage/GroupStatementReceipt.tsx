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
  rows: {
    name: string;
    ref: string;
    isHead: boolean;
    charged: string;
    paid: string;
    due: string;
    /** Package assigned but its charge never posted — flagged on the print. */
    chargeMissing?: boolean;
  }[];
  /** Charges first, then discounts & payments date-wise, running balance. */
  ledger: {
    date: string;
    member: string;
    particulars: string;
    voucher: string;
    manualRef?: string;
    kind: 'charge' | 'discount' | 'payment';
    charge: string;
    paid: string;
    balance: string;
  }[];
  totalCharged: string;
  totalPaid: string;
  totalDue: string;
  /** "৳1,60,000 × 3 persons" helper line when every member has the same package. */
  perHeadLine: string;
  /** The uniform per-person package price ("1,60,000"), null when packages differ. */
  perHead?: string | null;
};

const L = {
  en: {
    title: 'Group Statement',
    date: 'Date',
    branch: 'Branch',
    headOf: 'Group leader',
    forProgram: 'Program',
    membersLabel: 'Members',
    members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    persons: (n: number) => `${n} ${n === 1 ? 'person' : 'persons'}`,
    summary: 'Summary',
    packagePrice: 'Package price',
    totalPackage: 'Total package',
    times: (n: number, price: string) => `${n} × ৳ ${price}`,
    totalPaid: 'Total paid',
    totalDue: 'Total due',
    nil: 'Nil',
    membersHeading: 'Group leader & members',
    colMember: 'Member',
    colPackage: 'Package (৳)',
    head: 'Leader',
    chargeMissing: 'Package charge not posted',
    ledgerHeading: 'Payment statement — balance comes down with every payment',
    colDate: 'Date / Voucher No',
    colParticulars: 'Particulars',
    colPaid: 'Paid (৳)',
    colBalance: 'Balance (৳)',
    opening: (detail: string) => `Package — ${detail}`,
    discount: 'Discount',
    balanceDue: 'Balance due',
    thanks: 'Thank you for choosing us.',
  },
  bn: {
    title: 'গ্রুপ হিসাব বিবরণী',
    date: 'তারিখ',
    branch: 'শাখা',
    headOf: 'গ্রুপ লিডার',
    forProgram: 'প্রোগ্রাম',
    membersLabel: 'সদস্য',
    members: (n: number) => `${n} জন সদস্য`,
    persons: (n: number) => `${n} জন`,
    summary: 'সারসংক্ষেপ',
    packagePrice: 'প্যাকেজের দাম',
    totalPackage: 'মোট প্যাকেজ',
    times: (n: number, price: string) => `${n} × ৳ ${price}`,
    totalPaid: 'মোট পরিশোধ',
    totalDue: 'মোট বকেয়া',
    nil: 'শূন্য',
    membersHeading: 'গ্রুপ লিডার ও সদস্যরা',
    colMember: 'সদস্য',
    colPackage: 'প্যাকেজ (৳)',
    head: 'লিডার',
    chargeMissing: 'প্যাকেজ খরচ পোস্ট হয়নি',
    ledgerHeading: 'পেমেন্ট বিবরণী — প্রতিটি পেমেন্টে ব্যালেন্স কমে আসে',
    colDate: 'তারিখ / ভাউচার নং',
    colParticulars: 'বিবরণ',
    colPaid: 'পরিশোধ (৳)',
    colBalance: 'ব্যালেন্স (৳)',
    opening: (detail: string) => `প্যাকেজ — ${detail}`,
    discount: 'ছাড়',
    balanceDue: 'বাকি',
    thanks: 'আমাদের বেছে নেওয়ার জন্য ধন্যবাদ।',
  },
};

const isZero = (s: string) => /^0+(\.0+)?$/.test(s.replace(/[,\s৳]/g, '')) || s.trim() === '';

/**
 * Printable combined statement for a permanent family/group — the document
 * the leader is handed: package price × members = total package, what has
 * been paid, what is still due; the leader and members listed; then every
 * payment date-wise with the balance coming down from the total package.
 */
export function GroupStatementReceipt({ data, locale }: { data: GroupStatementData; locale: 'en' | 'bn' }) {
  const t = L[locale];

  useEffect(() => {
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, []);

  const n = data.rows.length;
  const dueZero = isZero(data.totalDue);
  // All package charges are folded into one opening line (they are posted
  // first in the ledger, so the running balance after them = total package);
  // discounts and payments then bring the balance down date-wise.
  const charges = data.ledger.filter((l) => l.kind === 'charge');
  const movements = data.ledger.filter((l) => l.kind !== 'charge');
  const openingDate = charges[0]?.date ?? data.ledger[0]?.date ?? '';
  const openingDetail = data.perHeadLine || t.persons(n);

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

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ReceiptPanel heading={t.headOf}>
          <p className="text-[1.05rem] font-bold leading-tight text-gray-900">{data.headName}</p>
          <div className="mt-1.5">
            <ReceiptRow label={t.forProgram} value={data.program} />
            <ReceiptRow label={t.membersLabel} value={t.members(n)} />
          </div>
        </ReceiptPanel>
        <ReceiptSummary
          heading={t.summary}
          lines={[
            ...(data.perHead ? [{ label: t.packagePrice, value: `৳ ${data.perHead}` }] : []),
            { label: data.perHead ? t.times(n, data.perHead) : t.totalPackage, value: `৳ ${data.totalCharged}` },
            { label: t.totalPaid, value: `৳ ${data.totalPaid}` },
            { label: t.totalDue, value: dueZero ? t.nil : `৳ ${data.totalDue}`, total: true, tone: dueZero ? 'ok' : 'warn' },
          ]}
        />
      </div>

      {/* Leader first (bold), then the members serially */}
      <div className="mt-5">
        <ReceiptSectionTitle>{t.membersHeading}</ReceiptSectionTitle>
        <table className={RT.table}>
          <thead>
            <tr>
              <th className={`${RT.th} w-8`}>#</th>
              <th className={RT.th}>{t.colMember}</th>
              <th className={RT.thRight}>{t.colPackage}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i}>
                <td className={RT.tdMuted}>{i + 1}</td>
                <td className={RT.td}>
                  <span className={r.isHead ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}>
                    {r.name}
                    {r.isHead && (
                      <span className="ml-1.5 rounded border border-amber-400 px-1 py-px text-[0.6rem] font-bold uppercase tracking-wide text-amber-600">
                        {t.head}
                      </span>
                    )}
                  </span>
                  {r.ref && <span className="block text-[0.7rem] text-gray-400">{r.ref}</span>}
                  {r.chargeMissing && <span className="block text-[0.66rem] font-semibold text-red-600">{t.chargeMissing}</span>}
                </td>
                <td className={RT.tdRight}>{r.charged}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={RT.total} colSpan={2}>
                {t.totalPackage}
                <span className="block text-[0.7rem] font-medium text-gray-500">{data.perHeadLine || t.persons(n)}</span>
              </td>
              <td className={RT.totalRight}>{data.totalCharged}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Running balance: total package first, then each payment brings it down */}
      {data.ledger.length > 0 && (
        <div className="mt-5">
          <ReceiptSectionTitle>{t.ledgerHeading}</ReceiptSectionTitle>
          <table className={RT.table}>
            <thead>
              <tr>
                <th className={RT.th}>{t.colDate}</th>
                <th className={RT.th}>{t.colParticulars}</th>
                <th className={RT.thRight}>{t.colPaid}</th>
                <th className={RT.thRight}>{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {charges.length > 0 && (
                <tr>
                  <td className={`${RT.td} whitespace-nowrap`}>{openingDate}</td>
                  <td className={`${RT.td} font-semibold text-gray-900`}>{t.opening(openingDetail)}</td>
                  <td className={RT.tdRight}></td>
                  <td className={`${RT.tdRight} font-semibold text-gray-900`}>{data.totalCharged}</td>
                </tr>
              )}
              {movements.map((line, i) => (
                <tr key={i}>
                  {/* Voucher (and the hand-written number) sit under the date. */}
                  <td className={`${RT.td} whitespace-nowrap`}>
                    {line.date}
                    <span className="block text-[0.68rem] text-gray-500">
                      {line.voucher || '—'}
                      {line.manualRef && (
                        <>
                          {' · '}
                          <span className="font-semibold text-gray-800">{line.manualRef}</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className={RT.td}>
                    <span className="font-medium text-gray-900">
                      {line.kind === 'discount' ? `${t.discount} — ${line.member}` : line.member}
                    </span>
                    {line.particulars && <span className="block text-[0.7rem] text-gray-500">{line.particulars}</span>}
                  </td>
                  <td className={RT.tdRight}>{line.paid}</td>
                  <td className={`${RT.tdRight} font-medium text-gray-900`}>{line.balance}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className={RT.total} colSpan={2}>
                  {t.totalPaid} / {t.balanceDue}
                </td>
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
