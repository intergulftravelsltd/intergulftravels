import { mgmtDb } from '@/lib/management/server';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { loadCompanyProfile } from '@/lib/management/company';
import { formatPeriodLine, resolvePeriod } from '@/lib/period';
import type { Transaction } from '@/lib/management/types';
import type { ReceiptData } from '@/components/manage/Receipt';
import type { Locale } from '@/lib/i18n';

function fmtDate(d: string): string {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export type StatementParty = {
  name: string;
  phone: string | null;
  address: string | null;
  /** Shown first in the address line (client wants the district leading). */
  district?: string | null;
  passportNo: string | null;
  branch: string;
};

/**
 * Build an in-depth "account statement" receipt for a customer/passenger head:
 * every ledger transaction that touched the head (package charges + all payments,
 * however they were recorded) in date order, with the counter account, the full
 * narration, both voucher numbers and a running balance — so one click shows
 * the pilgrim's full history from start to finish under the agency letterhead.
 */
export async function buildStatementReceipt(opts: {
  headId: string;
  party: StatementParty;
  program: string;
  packageName: string;
  locale?: Locale;
}): Promise<ReceiptData> {
  const db = mgmtDb();
  const { headId } = opts;
  const locale = opts.locale ?? 'en';

  const [{ data: txData }, company] = await Promise.all([
    db
      .from('transactions')
      .select('*')
      .or(`debit_account_id.eq.${headId},credit_account_id.eq.${headId}`)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true }),
    loadCompanyProfile(opts.party.branch),
  ]);
  const txs = (txData ?? []) as Transaction[];

  // Names of the counterpart heads (the other side of each entry) for particulars.
  const otherIds = Array.from(
    new Set(
      txs
        .map((t) => (t.debit_account_id === headId ? t.credit_account_id : t.debit_account_id))
        .filter(Boolean) as string[],
    ),
  );
  const names = new Map<string, string>();
  if (otherIds.length) {
    const { data } = await db.from('account_heads').select('id, name').in('id', otherIds);
    ((data ?? []) as { id: string; name: string }[]).forEach((h) => names.set(h.id, h.name));
  }

  let running = 0;
  let totalCharge = 0;
  let totalPaid = 0;
  const ledger = txs.map((t) => {
    const isCharge = t.debit_account_id === headId; // Dr the customer → a charge
    const amount = Number(t.amount);
    const charge = isCharge ? amount : 0;
    const paid = isCharge ? 0 : amount;
    running += charge - paid;
    totalCharge += charge;
    totalPaid += paid;
    const otherId = isCharge ? t.credit_account_id : t.debit_account_id;
    const against = names.get(otherId) || '';
    const raw = t.narration || against || '—';
    // The package name is already in the receipt header — trim it off the
    // standard charge narrations ("Hajj/Umrah package charge — <package>").
    const particulars = /^(hajj|umrah) package charge/i.test(raw) ? raw.replace(/\s+—.*$/, '') : raw;
    return {
      date: fmtDate(t.date),
      particulars,
      against,
      voucher: t.voucher_no || '',
      manualRef: t.manual_ref || '',
      charge: charge ? money(charge, false) : '',
      paid: paid ? money(paid, false) : '',
      balance: money(running, false),
    };
  });

  // Receipt No = the latest auto voucher number in the ledger (JV/RV/DV-xxxxx),
  // not the passport — the passport already has its own labelled row.
  const last = [...txs].reverse().find((t) => t.voucher_no);
  const period = txs.length ? formatPeriodLine(resolvePeriod(null, txs.map((t) => t.date)), locale) : null;

  return {
    company,
    program: opts.program,
    receiptNo: last?.voucher_no || headId.slice(0, 8).toUpperCase(),
    manualRef: last?.manual_ref || null,
    date: fmtDate(new Date().toISOString()),
    branch: branchLabel(opts.party.branch),
    partyName: opts.party.name,
    partyPassport: opts.party.passportNo || '',
    partyPhone: opts.party.phone || '—',
    // District leads the address line, per the printed-receipt format.
    partyAddress: [opts.party.district, opts.party.address].filter(Boolean).join(', '),
    packageName: opts.packageName,
    amount: money(totalPaid, false),
    amountWords: '',
    method: '',
    type: '',
    narration: '',
    paid: money(totalPaid, false),
    due: money(Math.max(0, running), false),
    isRefund: false,
    ledger,
    totalCharge: money(totalCharge, false),
    period,
  };
}
