import { mgmtDb } from '@/lib/management/server';
import { naturalBalance, type AccountHead } from '@/lib/management/types';

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

export type GroupLedger = {
  headId: string;
  headName: string;
  branch: string;
  members: GroupMemberLedger[]; // head first
  totalCharged: number;
  totalPaid: number;
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

    return {
      headId,
      headName: head.name,
      branch: head.branch,
      members,
      totalCharged: members.reduce((s, m) => s + m.charged, 0),
      totalPaid: members.reduce((s, m) => s + m.paid, 0),
      totalDue: members.reduce((s, m) => s + m.due, 0),
    };
  } catch {
    return null;
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
