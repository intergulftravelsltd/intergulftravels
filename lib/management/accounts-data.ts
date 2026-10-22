import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { getStaffScope } from '@/lib/management/scope';
import type { AccountHead, Transaction } from '@/lib/management/types';

/**
 * Server-side read helpers for the accounting pages. These run only inside the
 * staff-gated /admin layout, so they read through the service-role client (the
 * same client the write APIs use) — this keeps reads consistent with writes and
 * independent of per-row RLS. Every query is wrapped so that a missing table
 * (migration not yet run) resolves to []/null and the page renders a friendly
 * empty state instead of crashing the build.
 */

export const loadActiveHeads = cache(async function loadActiveHeads(): Promise<AccountHead[]> {
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('account_heads').select('*').eq('active', true);
    // Branch staff see only their own branch's heads (each branch keeps its own
    // Cash / income / expense system heads, so balances never mix).
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    if (error) return [];
    return (data ?? []) as AccountHead[];
  } catch {
    return [];
  }
});

export const loadHead = cache(async function loadHead(id: string): Promise<AccountHead | null> {
  try {
    const db = createAdminClient();
    const { data } = await db.from('account_heads').select('*').eq('id', id).maybeSingle();
    return (data as AccountHead) ?? null;
  } catch {
    return null;
  }
});

export type TxFilters = {
  from?: string;
  to?: string;
  branch?: string;
  type?: string;
  accountId?: string;
  limit?: number;
};

export async function loadTransactions(filters: TxFilters = {}): Promise<Transaction[]> {
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('transactions').select('*');

    if (filters.from) q = q.gte('date', filters.from);
    if (filters.to) q = q.lte('date', filters.to);
    // Branch staff are locked to their branch; admins may filter freely.
    if (scope.branch) q = q.eq('branch', scope.branch);
    else if (filters.branch && filters.branch !== 'all') q = q.eq('branch', filters.branch);
    if (filters.type && filters.type !== 'all') q = q.eq('type', filters.type);
    if (filters.accountId) {
      q = q.or(`debit_account_id.eq.${filters.accountId},credit_account_id.eq.${filters.accountId}`);
    }

    q = q.order('date', { ascending: false }).order('created_at', { ascending: false });

    // PostgREST answers at most 1000 rows per request; page through in
    // 1000-row windows up to `limit` (default 5000) so a busy branch's
    // voucher register / expenses never silently stop at row 1000.
    const PAGE = 1000;
    const limit = filters.limit ?? 5000;
    const out: Transaction[] = [];
    for (let from = 0; from < limit; from += PAGE) {
      const to = Math.min(from + PAGE, limit) - 1;
      const { data, error } = await q.range(from, to);
      if (error) return out;
      const rows = (data ?? []) as Transaction[];
      out.push(...rows);
      if (rows.length < to - from + 1) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Build an id → head lookup for joining transaction account ids to names. */
export function headMap(heads: AccountHead[]): Map<string, AccountHead> {
  return new Map(heads.map((h) => [h.id, h]));
}

export function headName(map: Map<string, AccountHead>, id: string | null): string {
  if (!id) return '—';
  return map.get(id)?.name ?? '—';
}
