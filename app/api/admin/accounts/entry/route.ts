import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { enforceBranch } from '@/lib/management/scope';
import { postTransaction, getCashHead, logActivity } from '@/lib/management/server';
import type { Transaction } from '@/lib/management/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  mode: z.enum(['income', 'expense', 'transfer', 'journal']),
  amount: z.coerce.number().positive('Enter an amount greater than zero.').max(99999999999),
  date: z.string().trim().min(1).max(10),
  branch: z.string().trim().max(60).optional().default('general'),
  method: z.enum(['cash', 'bank']).optional().default('cash'),
  narration: z.string().trim().max(400).optional().nullable(),
  /** Hand-written voucher / receipt number from the physical paper. */
  manual_ref: z.string().trim().max(60).optional().nullable(),
  // mode-specific account selections (all optional at the schema level, validated below)
  income_account_id: z.string().uuid().optional(),
  expense_account_id: z.string().uuid().optional(),
  bank_account_id: z.string().uuid().optional(),
  from_account_id: z.string().uuid().optional(),
  to_account_id: z.string().uuid().optional(),
  debit_account_id: z.string().uuid().optional(),
  credit_account_id: z.string().uuid().optional(),
});

/** The voucher type recorded against each entry mode. */
const VOUCHER_TYPE: Record<string, Transaction['type']> = {
  income: 'income',
  expense: 'expense',
  transfer: 'contra',
  journal: 'journal',
};

export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the entry details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const branch = await enforceBranch(d.branch);
    // The counter (cash/bank) account used by income & expense modes.
    async function counterAccountId(): Promise<string | null> {
      if (d.method === 'bank') return d.bank_account_id ?? null;
      const cash = await getCashHead(branch);
      return cash?.id ?? null;
    }

    let debitId: string | null = null;
    let creditId: string | null = null;

    if (d.mode === 'income') {
      // Dr Cash/Bank, Cr Income head
      debitId = await counterAccountId();
      creditId = d.income_account_id ?? null;
      if (!creditId) return badReq('Select an income head.');
      if (!debitId) return badReq(cashBankMsg(d.method));
    } else if (d.mode === 'expense') {
      // Dr Expense head, Cr Cash/Bank
      debitId = d.expense_account_id ?? null;
      creditId = await counterAccountId();
      if (!debitId) return badReq('Select an expense head.');
      if (!creditId) return badReq(cashBankMsg(d.method));
    } else if (d.mode === 'transfer') {
      // Cash ⇄ Bank contra: Dr destination, Cr source
      debitId = d.to_account_id ?? null;
      creditId = d.from_account_id ?? null;
      if (!debitId || !creditId) return badReq('Choose both the source and destination accounts.');
      if (debitId === creditId) return badReq('The source and destination must be different.');
    } else {
      // journal: pick any debit + credit head
      debitId = d.debit_account_id ?? null;
      creditId = d.credit_account_id ?? null;
      if (!debitId || !creditId) return badReq('Choose both a debit and a credit account.');
      if (debitId === creditId) return badReq('The debit and credit accounts must be different.');
    }

    const method = d.mode === 'transfer' || d.mode === 'journal' ? null : d.method;

    const tx = await postTransaction({
      date: d.date,
      type: VOUCHER_TYPE[d.mode],
      debit_account_id: debitId,
      credit_account_id: creditId,
      amount: d.amount,
      narration: d.narration || null,
      branch,
      method,
      created_by: guard.user.id,
      manual_ref: d.manual_ref || null,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'post_voucher',
      entity: 'transaction',
      entity_id: tx.id,
      detail: { mode: d.mode, amount: d.amount, voucher_no: tx.voucher_no, manual_ref: d.manual_ref || null },
      branch: d.branch,
    });

    return NextResponse.json({ ok: true, voucher_no: tx.voucher_no });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[accounts/entry] failed:', message);
    return NextResponse.json(
      { ok: false, error: 'Could not post this voucher. Please try again.' },
      { status: 500 },
    );
  }
}

function badReq(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

function cashBankMsg(method: 'cash' | 'bank') {
  return method === 'bank'
    ? 'Select the bank account for this entry.'
    : 'The Cash in Hand account was not found. Run the database setup first.';
}
