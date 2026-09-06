import { createAdminClient } from '@/lib/supabase/server';

/** Service-role client — bypasses RLS. Only ever call from server code. */
export function mgmtDb() {
  return createAdminClient();
}

/** Atomic incrementing counter (voucher numbers, customer codes, …). */
export async function nextCounter(key: string): Promise<number> {
  const db = mgmtDb();
  const { data, error } = await db.rpc('next_counter', { p_key: key });
  if (error) throw new Error(error.message);
  return Number(data);
}

export async function nextVoucherNo(prefix = 'V'): Promise<string> {
  const n = await nextCounter('voucher');
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

/** Auto ID for a new affiliate / care-of, e.g. CO-0001. Editable afterwards. */
export async function nextAffiliateCode(): Promise<string> {
  const n = await nextCounter('affiliate');
  return `CO-${String(n).padStart(4, '0')}`;
}

/**
 * Make sure a Group Fund care-of has its own ledger head. The head is a
 * customer-type asset head (like a pilgrim's): money the leader sends is a
 * credit (advance held for them), package charges for pilgrims under them are
 * debits. Natural balance > 0 = the leader still owes; < 0 = advance in hand.
 * Returns the head id, or null if it could not be created.
 */
export async function ensureGroupFundHead(affiliate: {
  id: string;
  name: string;
  phone?: string | null;
  branch: string;
  account_head_id?: string | null;
}): Promise<string | null> {
  const db = mgmtDb();
  if (affiliate.account_head_id) {
    const { data } = await db.from('account_heads').select('id, active').eq('id', affiliate.account_head_id).maybeSingle();
    if (data) {
      if (data.active === false) await db.from('account_heads').update({ active: true }).eq('id', data.id);
      return data.id as string;
    }
  }
  // Reuse a head previously created for this care-of (e.g. after a toggle off/on).
  const { data: existing } = await db
    .from('account_heads')
    .select('id')
    .eq('ref_table', 'affiliates')
    .eq('ref_id', affiliate.id)
    .maybeSingle();
  let headId: string | null = existing?.id ?? null;
  if (!headId) {
    const code = `GF-${String(await nextCounter('group_fund')).padStart(4, '0')}`;
    const { data: created, error } = await db
      .from('account_heads')
      .insert({
        code,
        name: `${affiliate.name} (Group Fund)`,
        type: 'asset',
        subtype: 'customer',
        branch: affiliate.branch,
        party_phone: affiliate.phone ?? null,
        ref_table: 'affiliates',
        ref_id: affiliate.id,
        active: true,
      })
      .select('id')
      .single();
    if (error || !created) {
      console.error('[group-fund] head create failed:', error?.message);
      return null;
    }
    headId = created.id as string;
  } else {
    await db.from('account_heads').update({ active: true }).eq('id', headId);
  }
  const { error: linkErr } = await db.from('affiliates').update({ account_head_id: headId }).eq('id', affiliate.id);
  if (linkErr) console.error('[group-fund] link failed (run migration 0012):', linkErr.message);
  return headId;
}

/** Canonical display name per built-in head key — used only as a fallback to
 *  locate a head before the system_key migration (0007) is applied. */
const SYSTEM_HEAD_NAME: Record<string, string> = {
  cash_in_hand: 'Cash in Hand',
  hajj_package_income: 'Hajj Package Income',
  umrah_package_income: 'Umrah Package Income',
  loan_receivable: 'Loan Receivable',
  loan_payable: 'Loan Payable',
};

/** Find a branch's copy of a built-in head. Prefers the immutable system_key
 *  (so admins can freely rename the head) and falls back to the canonical name
 *  so postings keep working before 0007 is applied. A head that was "removed"
 *  (deactivated) is self-healed back to active, since the engine needs it. */
async function findSystemHead(branch: string, key: string) {
  const db = mgmtDb();
  let { data } = await db
    .from('account_heads')
    .select('*')
    .eq('system_key', key)
    .eq('is_system', true)
    .eq('branch', branch)
    .maybeSingle();
  if (!data && SYSTEM_HEAD_NAME[key]) {
    ({ data } = await db
      .from('account_heads')
      .select('*')
      .eq('name', SYSTEM_HEAD_NAME[key])
      .eq('is_system', true)
      .eq('branch', branch)
      .maybeSingle());
  }
  if (data && data.active === false) {
    await db.from('account_heads').update({ active: true }).eq('id', data.id);
    return { ...data, active: true };
  }
  return data ?? null;
}

/**
 * Resolve a built-in system head for a branch by its stable key (e.g.
 * 'cash_in_hand', 'hajj_package_income'). Each branch keeps its OWN copy so
 * balances never mix; the first time a branch needs one it is copied from the
 * 'general' template on demand. Resolving by key (not name) means the head can
 * be renamed/re-coded freely without breaking postings.
 */
export async function getSystemHead(key: string, branch = 'general') {
  const found = await findSystemHead(branch, key);
  if (found) return found;

  if (branch !== 'general') {
    const tmpl = await findSystemHead('general', key);
    if (tmpl) {
      const db = mgmtDb();
      const base = {
        code: tmpl.code,
        name: tmpl.name,
        type: tmpl.type,
        subtype: tmpl.subtype,
        is_system: true,
        branch,
      };
      // Provision this branch's copy. Include system_key when the column exists;
      // if it doesn't yet (0007 not applied), retry without it so postings never
      // break — the name fallback still resolves it and 0007 backfills the key.
      let { data: created } = await db
        .from('account_heads')
        .insert({ ...base, system_key: tmpl.system_key ?? key })
        .select('*')
        .single();
      if (!created) {
        ({ data: created } = await db.from('account_heads').insert(base).select('*').single());
      }
      if (created) return created;
    }
  }
  return null;
}

export const getCashHead = (branch = 'general') => getSystemHead('cash_in_hand', branch);

export const INCOME_HEAD = {
  hajj: 'hajj_package_income',
  umrah: 'umrah_package_income',
} as const;

type PostTx = {
  date?: string;
  type?: 'receipt' | 'payment' | 'contra' | 'journal' | 'expense' | 'income';
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  narration?: string | null;
  branch?: string;
  method?: 'cash' | 'bank' | 'adjustment' | null;
  ref_table?: string | null;
  ref_id?: string | null;
  created_by?: string | null;
  voucher_no?: string;
  /** Hand-written voucher / receipt number from the physical paper. */
  manual_ref?: string | null;
};

/** Trim + cap a manual voucher/receipt number; empty → null. */
export function cleanManualRef(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, 60);
  return s || null;
}

/** True when a PostgREST error means the 0011 `manual_ref` column is missing. */
function missingManualRefColumn(message: string | undefined): boolean {
  return !!message && /manual_ref/i.test(message) && /column|schema cache/i.test(message);
}

/**
 * Insert into a table with the optional `manual_ref` column. If the 0011
 * migration has not been applied yet the insert is retried without it so a
 * posting never fails — the number is simply not stored until the column exists.
 */
export async function insertWithManualRef<T extends Record<string, unknown>>(
  table: 'transactions' | 'payments',
  row: T & { manual_ref?: string | null },
) {
  const db = mgmtDb();
  let { data, error } = await db.from(table).insert(row).select('*').single();
  if (error && row.manual_ref !== undefined && missingManualRefColumn(error.message)) {
    console.warn(`[${table}] manual_ref column missing — run supabase/migrations/0011_manual_ref.sql`);
    const { manual_ref: _omit, ...rest } = row;
    ({ data, error } = await db.from(table).insert(rest).select('*').single());
  }
  return { data, error };
}

/** Post a balanced double-entry voucher. Account balances update via DB trigger. */
export async function postTransaction(tx: PostTx) {
  const voucher_no = tx.voucher_no ?? (await nextVoucherNo());
  const { data, error } = await insertWithManualRef('transactions', {
    voucher_no,
    manual_ref: cleanManualRef(tx.manual_ref),
    date: tx.date ?? new Date().toISOString().slice(0, 10),
    type: tx.type ?? 'journal',
    debit_account_id: tx.debit_account_id,
    credit_account_id: tx.credit_account_id,
    amount: tx.amount,
    narration: tx.narration ?? null,
    branch: tx.branch ?? 'general',
    method: tx.method ?? null,
    ref_table: tx.ref_table ?? null,
    ref_id: tx.ref_id ?? null,
    created_by: tx.created_by ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

/** Record a customer payment: Dr Cash/Bank, Cr Customer head (reduces their due). */
export async function recordPayment(p: {
  /** 'affiliates' = bulk money from a Group Fund leader (credited to their fund head). */
  party_table: 'hajj_pilgrims' | 'umrah_passengers' | 'affiliates';
  party_id: string;
  account_head_id: string;
  amount: number;
  method: 'cash' | 'bank';
  bank_account_id?: string | null;
  type?: 'advance' | 'installment' | 'token' | 'full' | 'refund';
  date?: string;
  narration?: string | null;
  branch?: string;
  created_by?: string | null;
  /** Hand-written money-receipt number from the physical paper. */
  manual_ref?: string | null;
}) {
  const db = mgmtDb();

  let debitId = p.bank_account_id ?? null;
  if (p.method === 'cash') {
    const cash = await getCashHead(p.branch ?? 'general');
    debitId = cash?.id ?? null;
  }
  if (!debitId) throw new Error('No cash/bank account available for this payment.');

  const voucher_no = await nextVoucherNo('RV');
  const manual_ref = cleanManualRef(p.manual_ref);
  const tx = await postTransaction({
    date: p.date,
    type: 'receipt',
    debit_account_id: debitId,
    credit_account_id: p.account_head_id,
    amount: p.amount,
    narration: p.narration ?? 'Payment received',
    branch: p.branch,
    method: p.method,
    ref_table: 'payments',
    created_by: p.created_by,
    voucher_no,
    manual_ref,
  });

  const { data, error } = await insertWithManualRef('payments', {
    voucher_no,
    manual_ref,
    date: p.date ?? new Date().toISOString().slice(0, 10),
    party_table: p.party_table,
    party_id: p.party_id,
    account_head_id: p.account_head_id,
    amount: p.amount,
    method: p.method,
    bank_account_id: p.method === 'bank' ? p.bank_account_id ?? null : null,
    type: p.type ?? 'installment',
    narration: p.narration ?? null,
    branch: p.branch ?? 'general',
    transaction_id: tx.id,
    created_by: p.created_by ?? null,
  });
  if (error) throw new Error(error.message);

  await db.from('transactions').update({ ref_id: data.id }).eq('id', tx.id);
  return { payment: data, transaction: tx };
}

/**
 * Give a party a custom discount: Dr Package Income, Cr Customer head — the
 * pilgrim's due drops by exactly the entered amount and the discount shows as
 * its own line in the ledger/statement. Pure double-entry, no schema change.
 */
export async function recordDiscount(p: {
  packageType: 'hajj' | 'umrah';
  account_head_id: string;
  amount: number;
  date?: string;
  narration?: string | null;
  branch?: string;
  ref_table?: string | null;
  ref_id?: string | null;
  created_by?: string | null;
}) {
  const income = await getSystemHead(INCOME_HEAD[p.packageType], p.branch ?? 'general');
  if (!income) throw new Error('Package income head not found. Run the seed migration.');
  const voucher_no = await nextVoucherNo('DV');
  return postTransaction({
    date: p.date,
    type: 'journal',
    debit_account_id: income.id,
    credit_account_id: p.account_head_id,
    amount: p.amount,
    narration: p.narration ?? 'Discount',
    branch: p.branch,
    method: 'adjustment',
    ref_table: p.ref_table ?? null,
    ref_id: p.ref_id ?? null,
    created_by: p.created_by,
    voucher_no,
  });
}

/** Charge a package price to a party: Dr Customer, Cr Package Income (creates the due). */
export async function chargeParty(opts: {
  customer_head_id: string;
  packageType: 'hajj' | 'umrah';
  amount: number;
  branch?: string;
  date?: string;
  narration?: string | null;
  ref_table?: string;
  ref_id?: string;
  created_by?: string | null;
}) {
  const income = await getSystemHead(INCOME_HEAD[opts.packageType], opts.branch ?? 'general');
  if (!income) throw new Error('Package income head not found. Run the seed migration.');
  const voucher_no = await nextVoucherNo('JV');
  return postTransaction({
    date: opts.date,
    type: 'journal',
    debit_account_id: opts.customer_head_id,
    credit_account_id: income.id,
    amount: opts.amount,
    narration: opts.narration ?? 'Package charge',
    branch: opts.branch,
    ref_table: opts.ref_table,
    ref_id: opts.ref_id,
    created_by: opts.created_by,
    voucher_no,
  });
}

export async function logActivity(a: {
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  entity?: string;
  entity_id?: string;
  detail?: Record<string, unknown>;
  branch?: string;
}) {
  try {
    await mgmtDb().from('activity_log').insert({
      user_id: a.user_id ?? null,
      user_email: a.user_email ?? null,
      action: a.action,
      entity: a.entity ?? null,
      entity_id: a.entity_id ?? null,
      detail: a.detail ?? null,
      branch: a.branch ?? null,
    });
  } catch {
    // logging must never break the request
  }
}
