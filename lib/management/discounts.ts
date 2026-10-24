import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountHead } from '@/lib/management/types';

/* ------------------------------------------------------------------ *
 *  Money received vs. discounts.
 *  A customer head's credit_total mixes two things: payments (money that
 *  actually came in) and discounts granted (DV vouchers / adjustments that
 *  credit the customer without any cash). "Paid" anywhere in the app means
 *  money received only, so the discount part is subtracted here — the same
 *  rule the statements use (lib/management/statement.ts, group.ts).
 * ------------------------------------------------------------------ */

/** A credit to a customer head that is not money received. */
export function isDiscountCredit(t: { method?: string | null; voucher_no?: string | null }): boolean {
  return t.method === 'adjustment' || (t.voucher_no ?? '').startsWith('DV');
}

type DiscountTx = { credit_account_id: string | null; amount: number | string; method: string | null; voucher_no: string | null };

/**
 * Total discount credited to each customer head. Discount vouchers are few,
 * so every one is read once (paged past the 1000-row cap) instead of
 * filtering by hundreds of head ids in the URL; `headIds` narrows the result
 * when given.
 */
export async function loadDiscountByHead(db: SupabaseClient, headIds?: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const want = headIds ? new Set(headIds.filter(Boolean)) : null;
  if (want && want.size === 0) return out;
  try {
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db
        .from('transactions')
        .select('credit_account_id, amount, method, voucher_no')
        .or('method.eq.adjustment,voucher_no.like.DV-*')
        .range(from, from + PAGE - 1);
      if (error || !data) break;
      for (const t of data as DiscountTx[]) {
        if (!t.credit_account_id || !isDiscountCredit(t)) continue;
        if (want && !want.has(t.credit_account_id)) continue;
        out.set(t.credit_account_id, (out.get(t.credit_account_id) ?? 0) + Number(t.amount));
      }
      if (data.length < PAGE) break;
    }
  } catch {
    // table absent — no discounts, paid = all credits
  }
  return out;
}

/** Money actually received against a customer head: credits minus discounts. */
export function moneyReceived(head: AccountHead | null | undefined, discount: number | undefined = 0): number {
  return head ? Math.max(0, Number(head.credit_total) - (discount ?? 0)) : 0;
}
