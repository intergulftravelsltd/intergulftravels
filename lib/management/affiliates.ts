import { createAdminClient } from '@/lib/supabase/server';
import { getStaffScope } from '@/lib/management/scope';
import type { Affiliate } from '@/lib/management/types';

/**
 * Active care-of / affiliate records, scoped to the caller's branch. Wrapped so
 * a missing table (migration 0006 not yet applied) resolves to [] and the page
 * renders an empty state instead of crashing.
 */
export async function loadActiveAffiliates(): Promise<Affiliate[]> {
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('affiliates').select('*').eq('active', true);
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('name', { ascending: true });
    if (error) return [];
    return (data ?? []) as Affiliate[];
  } catch {
    return [];
  }
}

/** Lightweight option shape passed into the entry forms' Care-of selector. */
export type AffiliateOption = Pick<Affiliate, 'id' | 'code' | 'name' | 'phone' | 'address'>;

export function toAffiliateOptions(rows: Affiliate[]): AffiliateOption[] {
  return rows.map((a) => ({ id: a.id, code: a.code, name: a.name, phone: a.phone, address: a.address }));
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
