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
 * Resolve a system head for a given branch. Each branch keeps its OWN copy of
 * the core heads (Cash in Hand, package income, expense heads, loan control…)
 * so their balances never mix. The first time a branch needs one, it is copied
 * from the 'general' template on demand.
 */
export async function getSystemHead(name: string, branch = 'general') {
  const db = mgmtDb();
  const { data } = await db
    .from('account_heads')
    .select('*')
    .eq('name', name)
    .eq('is_system', true)
    .eq('branch', branch)
    .maybeSingle();
  if (data) return data;

  if (branch !== 'general') {
    const { data: tmpl } = await db
      .from('account_heads')
      .select('code, name, type, subtype')
      .eq('name', name)
      .eq('is_system', true)
      .eq('branch', 'general')
      .maybeSingle();
    if (tmpl) {
      const { data: created } = await db
        .from('account_heads')
        .insert({
          code: tmpl.code,
          name: tmpl.name,
          type: tmpl.type,
          subtype: tmpl.subtype,
          is_system: true,
          branch,
        })
        .select('*')
        .single();
      if (created) return created;
    }
  }
  return data ?? null;
}

export const getCashHead = (branch = 'general') => getSystemHead('Cash in Hand', branch);

export const INCOME_HEAD = {
  hajj: 'Hajj Package Income',
  umrah: 'Umrah Package Income',
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
};

/** Post a balanced double-entry voucher. Account balances update via DB trigger. */
export async function postTransaction(tx: PostTx) {
  const db = mgmtDb();
  const voucher_no = tx.voucher_no ?? (await nextVoucherNo());
  const { data, error } = await db
    .from('transactions')
    .insert({
      voucher_no,
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
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Record a customer payment: Dr Cash/Bank, Cr Customer head (reduces their due). */
export async function recordPayment(p: {
  party_table: 'hajj_pilgrims' | 'umrah_passengers';
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
}) {
  const db = mgmtDb();

  let debitId = p.bank_account_id ?? null;
  if (p.method === 'cash') {
    const cash = await getCashHead(p.branch ?? 'general');
    debitId = cash?.id ?? null;
  }
  if (!debitId) throw new Error('No cash/bank account available for this payment.');

  const voucher_no = await nextVoucherNo('RV');
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
  });

  const { data, error } = await db
    .from('payments')
    .insert({
      voucher_no,
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
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  await db.from('transactions').update({ ref_id: data.id }).eq('id', tx.id);
  return { payment: data, transaction: tx };
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
