import { createAdminClient } from '@/lib/supabase/server';
import { getStaffScope } from '@/lib/management/scope';
import type { Affiliate, AffiliateProgram } from '@/lib/management/types';

/** True when a PostgREST error is about a column the 0012 migration adds. */
function missing0012(message: string | undefined): boolean {
  return !!message && /program|fund_mode|account_head_id/i.test(message) && /column|schema cache/i.test(message);
}

/**
 * Active care-of / affiliate records, scoped to the caller's branch and — when
 * `program` is given — to that section (rows tagged 'both' appear in both).
 * Wrapped so a missing table / pre-0012 column resolves gracefully instead of
 * crashing the page: without the program column every record is returned.
 */
export async function loadActiveAffiliates(program?: 'hajj' | 'umrah'): Promise<Affiliate[]> {
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    const base = () => {
      let q = db.from('affiliates').select('*').eq('active', true);
      if (scope.branch) q = q.eq('branch', scope.branch);
      return q;
    };
    let q = base();
    if (program) q = q.in('program', [program, 'both']);
    let { data, error } = await q.order('name', { ascending: true });
    if (error && program && missing0012(error.message)) {
      ({ data, error } = await base().order('name', { ascending: true }));
    }
    if (error) return [];
    return (data ?? []) as Affiliate[];
  } catch {
    return [];
  }
}

/** One care-of by id (branch-checked). Null when missing or out of scope. */
export async function loadAffiliate(id: string | null | undefined): Promise<Affiliate | null> {
  if (!id) return null;
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    const { data } = await db.from('affiliates').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    if (scope.branch && data.branch !== scope.branch) return null;
    return data as Affiliate;
  } catch {
    return null;
  }
}

/** Lightweight option shape passed into the entry forms' Care-of selector. */
export type AffiliateOption = Pick<Affiliate, 'id' | 'code' | 'name' | 'phone' | 'address'> & {
  fund_mode?: Affiliate['fund_mode'];
  program?: AffiliateProgram | null;
};

export function toAffiliateOptions(rows: Affiliate[]): AffiliateOption[] {
  return rows.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    phone: a.phone,
    address: a.address,
    fund_mode: a.fund_mode ?? 'individual',
    program: a.program ?? 'both',
  }));
}

/**
 * Return `id` only if it names an active affiliate the caller is allowed to
 * reference (same branch for branch-scoped staff; any for head office); else
 * null. Stops a hand-crafted pilgrim write from linking to another branch's
 * care-of, and drops stale ids. Never throws — an unresolvable id becomes null.
 */
export async function resolveReferenceableAffiliate(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('affiliates').select('id').eq('id', id).eq('active', true);
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data } = await q.maybeSingle();
    return data ? id : null;
  } catch {
    return null;
  }
}

export type ChargeTarget = {
  /** The ledger head to debit for package charges / credit for money received. */
  headId: string | null;
  /** Set when the pilgrim sits under a Group Fund leader. */
  groupFund: { affiliateId: string; name: string; headId: string } | null;
};

/**
 * Where a pilgrim's money lives. Individual mode (the default) → their own
 * customer head. Under a Group Fund care-of → the leader's fund head, so the
 * package price is debited from the leader's balance and the pilgrim carries
 * no due of their own. Never throws; falls back to the pilgrim's head.
 */
export async function resolveChargeTarget(
  partyHeadId: string | null,
  affiliateId: string | null | undefined,
): Promise<ChargeTarget> {
  const own: ChargeTarget = { headId: partyHeadId, groupFund: null };
  if (!affiliateId) return own;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('affiliates')
      .select('id, name, fund_mode, account_head_id, active')
      .eq('id', affiliateId)
      .maybeSingle();
    if (error || !data) return own;
    if (data.fund_mode === 'group_fund' && data.account_head_id) {
      return {
        headId: data.account_head_id as string,
        groupFund: { affiliateId: data.id as string, name: data.name as string, headId: data.account_head_id as string },
      };
    }
    return own;
  } catch {
    return own;
  }
}
