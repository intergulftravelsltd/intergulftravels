import { mgmtDb } from '@/lib/management/server';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { branchCompany } from '@/lib/site';
import type { Transaction } from '@/lib/management/types';
import type { ReceiptData } from '@/components/manage/Receipt';

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
  passportNo: string | null;
  branch: string;
};

/**
 * Build an in-depth "account statement" receipt for a customer/passenger head:
 * every ledger transaction that touched the head (package charges + all payments,
 * however they were recorded) in date order, with a running balance — so one
 * click shows the pilgrim's full history from start to finish.
 */
export async function buildStatementReceipt(opts: {
  headId: string;
  party: StatementParty;
  program: string;
  packageName: string;
}): Promise<ReceiptData> {
  const db = mgmtDb();
  const { headId } = opts;

  const { data: txData } = await db
    .from('transactions')
    .select('*')
    .or(`debit_account_id.eq.${headId},credit_account_id.eq.${headId}`)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
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
    return {
      date: fmtDate(t.date),
      particulars: t.narration || names.get(otherId) || '—',
      voucher: t.voucher_no || '',
      charge: charge ? money(charge, false) : '',
      paid: paid ? money(paid, false) : '',
      balance: money(running, false),
    };
  });

  return {
    company: branchCompany(opts.party.branch),
    program: opts.program,
    receiptNo: opts.party.passportNo || headId.slice(0, 8).toUpperCase(),
    date: fmtDate(new Date().toISOString()),
    branch: branchLabel(opts.party.branch),
    partyName: opts.party.name,
    partyPhone: opts.party.phone || '—',
    partyAddress: opts.party.address || '',
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
  };
}
