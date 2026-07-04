/** Shared types + balance maths for the accounting / management module. */

export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';
export type AccountSubtype =
  | 'cash' | 'bank' | 'customer' | 'supplier' | 'loan' | 'expense' | 'income' | 'general' | 'equity';

export type AccountHead = {
  id: string;
  code: string | null;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  branch: string;
  is_system: boolean;
  opening_balance: number;
  opening_is_debit: boolean;
  debit_total: number;
  credit_total: number;
  bank_name: string | null;
  account_no: string | null;
  party_phone: string | null;
  ref_table: string | null;
  ref_id: string | null;
  active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  voucher_no: string | null;
  date: string;
  type: 'receipt' | 'payment' | 'contra' | 'journal' | 'expense' | 'income';
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  narration: string | null;
  branch: string;
  method: 'cash' | 'bank' | 'adjustment' | null;
  ref_table: string | null;
  ref_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type MgmtPackage = {
  id: string;
  type: 'hajj' | 'umrah';
  name: string;
  year: number | null;
  price: number;
  seats: number | null;
  branch: string;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type HajjPilgrim = {
  id: string;
  tracking_no: string | null;
  name: string;
  name_bn: string | null;
  father_name: string | null;
  mother_name: string | null;
  nid: string | null;
  passport_no: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  year: number;
  reg_type: 'pre-registration' | 'registered';
  pre_reg_no: string | null;
  govt_serial: string | null;
  package_id: string | null;
  account_head_id: string | null;
  branch: string;
  status: 'active' | 'cancelled' | 'completed';
  token_money: number | null;
  photo_url: string | null;
  note: string | null;
  created_at: string;
};

export type UmrahPassenger = {
  id: string;
  name: string;
  name_bn: string | null;
  passport_no: string | null;
  passport_issue: string | null;
  passport_expiry: string | null;
  dob: string | null;
  phone: string | null;
  address: string | null;
  package_id: string | null;
  account_head_id: string | null;
  branch: string;
  status: 'active' | 'cancelled' | 'completed';
  token_money: number | null;
  photo_url: string | null;
  note: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  voucher_no: string | null;
  date: string;
  party_table: string | null;
  party_id: string | null;
  account_head_id: string | null;
  amount: number;
  method: 'cash' | 'bank';
  bank_account_id: string | null;
  type: 'advance' | 'installment' | 'token' | 'full' | 'refund';
  narration: string | null;
  branch: string;
  transaction_id: string | null;
  created_at: string;
};

export type Loan = {
  id: string;
  party_name: string;
  party_phone: string | null;
  type: 'given' | 'taken';
  principal: number;
  date: string;
  due_date: string | null;
  status: 'open' | 'partial' | 'closed';
  narration: string | null;
  branch: string;
  account_head_id: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  branch: string | null;
  created_at: string;
};

/** Structural control accounts kept fully locked. Cash in Hand and Loan
 *  Receivable are usable/editable by admins like any other head; the app posts
 *  to system heads by name, so the edit form keeps the *name* read-only (and
 *  getSystemHead lazily recreates a head if it is ever removed). */
export const CORE_HEAD_NAMES = [
  'Hajj Package Income',
  'Umrah Package Income',
  'Loan Payable',
] as const;

export function isCoreHead(h: { name: string; is_system: boolean }): boolean {
  return h.is_system && (CORE_HEAD_NAMES as readonly string[]).includes(h.name);
}

/* ---------------------------- balance maths ----------------------------- */

const DEBIT_NORMAL: AccountType[] = ['asset', 'expense'];

/** Net debit position: opening (signed) + debit_total − credit_total. */
export function netDebit(h: Pick<AccountHead, 'opening_balance' | 'opening_is_debit' | 'debit_total' | 'credit_total'>) {
  const opening = Number(h.opening_balance) * (h.opening_is_debit ? 1 : -1);
  return opening + Number(h.debit_total) - Number(h.credit_total);
}

/** Natural balance (positive = the account's normal side). For a customer
 *  (asset) a positive value is the amount they still owe (due). */
export function naturalBalance(h: AccountHead) {
  const nd = netDebit(h);
  return DEBIT_NORMAL.includes(h.type) ? nd : -nd;
}

export function isDebitNormal(type: AccountType) {
  return DEBIT_NORMAL.includes(type);
}
