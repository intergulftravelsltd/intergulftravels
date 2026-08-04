import { mgmtDb } from '@/lib/management/server';
import { naturalBalance, type AccountHead, type Transaction } from '@/lib/management/types';

/**
 * Permanent family/group ledger (migration 0008): members carry the head's id
 * in `group_head_id`. The head's — and every member's — profile shows the same
 * combined statement: each person's package charge, paid and due, plus group
 * totals (e.g. ৳1,60,000 × 3 = ৳4,80,000).
 *
 * Every loader here is best-effort: before 0008 is applied the queries fail on
 * the missing column and the feature simply stays hidden.
 */

export type GroupTable = 'hajj_pilgrims' | 'umrah_passengers';

export type GroupMemberLedger = {
  id: string;
  name: string;
  /** tracking no (hajj) / passport no (umrah) — whichever exists. */
  ref: string;
  isHead: boolean;
  charged: number;
  paid: number;
  due: number;
};

/** One line of the combined, date-wise group statement. */
export type GroupLedgerLine = {
  date: string; // formatted dd MMM yyyy
  member: string;
  particulars: string;
  voucher: string;
  charge: number;
  paid: number;
  balance: number; // running group balance
};

export type GroupLedger = {
  headId: string;
  headName: string;
  branch: string;
  members: GroupMemberLedger[]; // head first
  /** Charges first, then discounts & payments in date order, running balance. */
  ledger: GroupLedgerLine[];
  totalCharged: number;
  totalPaid: number;
  /** Net group due: one member's advance offsets another's arrears. */
  totalDue: number;
};

type Row = {
  id: string;
  name: string;
  tracking_no?: string | null;
  passport_no?: string | null;
  account_head_id: string | null;
  group_head_id?: string | null;
  branch: string;
};

/**
 * Load the combined group ledger for a person (head or member).
 * Returns null when the person is not part of any group (or pre-0008).
 */
export async function loadGroupLedger(table: GroupTable, personId: string): Promise<GroupLedger | null> {
  try {
    const db = mgmtDb();
    const { data: person, error: personErr } = await db
      .from(table)
      .select('id, group_head_id')
      .eq('id', personId)
      .maybeSingle();
    if (personErr || !person) return null;

    const headId = (person as Row).group_head_id ?? person.id;

    // hajj_pilgrims has tracking_no; umrah_passengers doesn't — pick per table.
    const refCol = table === 'hajj_pilgrims' ? 'tracking_no' : 'passport_no';
    const { data, error } = await db
      .from(table)
      .select(`id, name, ${refCol}, account_head_id, group_head_id, branch`)
      .or(`id.eq.${headId},group_head_id.eq.${headId}`);
    if (error || !data) return null;

    const rows = data as Row[];
    if (rows.length < 2) return null; // head alone — no group yet

    const head = rows.find((r) => r.id === headId);
    if (!head) return null;

    const headIds = rows.map((r) => r.account_head_id).filter(Boolean) as string[];
    const heads = new Map<string, AccountHead>();
    if (headIds.length) {
      const { data: hData } = await db.from('account_heads').select('*').in('id', headIds);
      ((hData ?? []) as AccountHead[]).forEach((h) => heads.set(h.id, h));
    }

    const toLedger = (r: Row): GroupMemberLedger => {
      const acc = r.account_head_id ? heads.get(r.account_head_id) : undefined;
      return {
        id: r.id,
        name: r.name,
        ref: r.tracking_no ?? r.passport_no ?? '',
        isHead: r.id === headId,
        charged: acc ? Number(acc.debit_total) : 0,
        paid: acc ? Number(acc.credit_total) : 0,
        due: acc ? Math.max(0, naturalBalance(acc)) : 0,
      };
    };

    const members = [toLedger(head), ...rows.filter((r) => r.id !== headId).map(toLedger)];

    // Net group position: signed balances so one member's advance (e.g. the
    // head paying ৳2,00,000 against a ৳1,60,000 package) offsets another's due.
    const totalDue = Math.max(
      0,
      rows.reduce((s, r) => {
        const acc = r.account_head_id ? heads.get(r.account_head_id) : undefined;
        return s + (acc ? naturalBalance(acc) : 0);
      }, 0),
    );

    return {
      headId,
      headName: head.name,
      branch: head.branch,
      members,
      ledger: await loadCombinedLedger(rows),
      totalCharged: members.reduce((s, m) => s + m.charged, 0),
      totalPaid: members.reduce((s, m) => s + m.paid, 0),
      totalDue,
    };
  } catch {
    return null;
  }
}

const fmtDate = (d: string): string => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * The combined statement across every member's customer head: all package
 * charges first, then discounts & payments in date order, with a running group
 * balance — so the printout reads "what they owe → what they've paid → due".
 */
async function loadCombinedLedger(rows: Row[]): Promise<GroupLedgerLine[]> {
  try {
    const db = mgmtDb();
    const accountIds = rows.map((r) => r.account_head_id).filter(Boolean) as string[];
    if (!accountIds.length) return [];

    const memberByAccount = new Map(rows.filter((r) => r.account_head_id).map((r) => [r.account_head_id as string, r]));

    const ors = accountIds.map((id) => `debit_account_id.eq.${id},credit_account_id.eq.${id}`).join(',');
    const { data } = await db
      .from('transactions')
      .select('*')
      .or(ors)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    const txs = (data ?? []) as Transaction[];

    const isCharge = (t: Transaction) => memberByAccount.has(t.debit_account_id);
    // Charges (Dr customer) first, then credits (payments/discounts) — each in
    // the date order the query already gave us.
    const ordered = [...txs.filter(isCharge), ...txs.filter((t) => !isCharge(t))];

    let running = 0;
    return ordered.map((t) => {
      const charge = isCharge(t);
      const member = memberByAccount.get(charge ? t.debit_account_id : t.credit_account_id);
      const amount = Number(t.amount);
      running += charge ? amount : -amount;
      const raw = t.narration || (charge ? 'Package charge' : 'Payment received');
      // The package name lives in each member's own row — keep the line short.
      const particulars = /^(hajj|umrah) package charge/i.test(raw) ? raw.replace(/\s+—.*$/, '') : raw;
      return {
        date: fmtDate(t.date),
        member: member?.name ?? '—',
        particulars,
        voucher: t.voucher_no || '',
        charge: charge ? amount : 0,
        paid: charge ? 0 : amount,
        balance: running,
      };
    });
  } catch {
    return [];
  }
}

export type GroupHeadOption = { id: string; name: string; ref: string };

/**
 * Candidates who can be picked as this person's group head: everyone else in
 * the table who is not themselves a member of another group. Branch-scoped
 * callers already pass branch via the underlying table's scope; this loader
 * keeps it simple and filters client-side on the pilgrim's own branch.
 */
export async function loadGroupHeadOptions(
  table: GroupTable,
  personId: string,
  branch: string,
): Promise<GroupHeadOption[]> {
  try {
    const db = mgmtDb();
    const refCol = table === 'hajj_pilgrims' ? 'tracking_no' : 'passport_no';
    const { data, error } = await db
      .from(table)
      .select(`id, name, ${refCol}, group_head_id, status, branch`)
      .eq('branch', branch)
      .neq('id', personId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as (Row & { status: string })[])
      .filter((r) => !r.group_head_id) // a member of another group can't be a head
      .map((r) => ({ id: r.id, name: r.name, ref: r.tracking_no ?? r.passport_no ?? '' }));
  } catch {
    return [];
  }
}
