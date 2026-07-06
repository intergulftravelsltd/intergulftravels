import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { enforceBranch } from '@/lib/management/scope';
import {
  getSystemHead,
  getCashHead,
  postTransaction,
  nextVoucherNo,
  logActivity,
} from '@/lib/management/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  party_name: z.string().trim().min(1, "The lender / borrower's name is required.").max(160),
  party_phone: z.string().trim().max(40).optional().nullable(),
  type: z.enum(['given', 'taken']),
  principal: z.coerce.number().positive('Enter a principal greater than zero.').max(99999999999),
  date: z.string().trim().min(1).max(10),
  due_date: z.string().trim().max(10).optional().nullable(),
  method: z.enum(['cash', 'bank']).optional().default('cash'),
  bank_account_id: z.string().uuid().optional().nullable(),
  branch: z.string().trim().max(60).optional().default('general'),
  narration: z.string().trim().max(400).optional().nullable(),
});

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

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the loan details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const branch = await enforceBranch(d.branch);
    // Resolve the cash / bank counter account.
    let cashBankId: string | null = null;
    if (d.method === 'bank') {
      cashBankId = d.bank_account_id ?? null;
      if (!cashBankId) return badReq('Select the bank account for this loan.');
    } else {
      const cash = await getCashHead(branch);
      cashBankId = cash?.id ?? null;
      if (!cashBankId) return badReq('The Cash in Hand account was not found. Run the database setup first.');
    }

    // Resolve the loan control head by its stable key.
    const loanKey = d.type === 'given' ? 'loan_receivable' : 'loan_payable';
    const loanHead = await getSystemHead(loanKey, branch);
    if (!loanHead) {
      return badReq('The loan control account was not found. Run the database setup first.');
    }

    // given  → Dr Loan Receivable, Cr Cash/Bank (money goes out)
    // taken  → Dr Cash/Bank, Cr Loan Payable     (money comes in)
    const debitId = d.type === 'given' ? loanHead.id : cashBankId;
    const creditId = d.type === 'given' ? cashBankId : loanHead.id;

    const voucher_no = await nextVoucherNo(d.type === 'given' ? 'LV' : 'LV');
    const tx = await postTransaction({
      date: d.date,
      type: 'payment',
      debit_account_id: debitId,
      credit_account_id: creditId,
      amount: d.principal,
      narration: d.narration || `Loan ${d.type} — ${d.party_name}`,
      branch,
      method: d.method,
      ref_table: 'loans',
      created_by: guard.user.id,
      voucher_no,
    });

    const db = createAdminClient();
    const { data: loan, error } = await db
      .from('loans')
      .insert({
        party_name: d.party_name,
        party_phone: d.party_phone || null,
        type: d.type,
        principal: d.principal,
        date: d.date,
        due_date: d.due_date || null,
        status: 'open',
        narration: d.narration || null,
        branch,
        account_head_id: loanHead.id,
        created_by: guard.user.id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[accounts/loans] insert failed:', error.message);
      // The voucher is already posted; surface a soft error rather than rolling back ledger.
      return NextResponse.json(
        { ok: false, error: 'The voucher was posted but the loan record could not be saved.' },
        { status: 500 },
      );
    }

    await db.from('transactions').update({ ref_id: loan.id }).eq('id', tx.id);

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'loan',
      entity_id: loan.id,
      detail: { party: d.party_name, type: d.type, principal: d.principal, voucher_no },
      branch: d.branch,
    });

    return NextResponse.json({ ok: true, id: loan.id, voucher_no });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[accounts/loans] failed:', message);
    return NextResponse.json({ ok: false, error: 'Could not record this loan.' }, { status: 500 });
  }
}

// Status change and/or metadata edits. The principal, type, date and posting
// method are tied to the original ledger voucher, so they are intentionally not
// editable here — only descriptive fields and the repayment status.
const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'partial', 'closed']).optional(),
  party_name: z.string().trim().min(1, "The lender / borrower's name is required.").max(160).optional(),
  party_phone: z.string().trim().max(40).optional().nullable(),
  due_date: z.string().trim().max(10).optional().nullable(),
  narration: z.string().trim().max(400).optional().nullable(),
});

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const update: Record<string, unknown> = {};
  if (d.status !== undefined) update.status = d.status;
  if (d.party_name !== undefined) update.party_name = d.party_name;
  if (d.party_phone !== undefined) update.party_phone = d.party_phone || null;
  if (d.due_date !== undefined) update.due_date = d.due_date || null;
  if (d.narration !== undefined) update.narration = d.narration || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { error } = await db.from('loans').update(update).eq('id', d.id);

    if (error) {
      console.error('[accounts/loans] update failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not update the loan.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: d.status && Object.keys(update).length === 1 ? 'update_status' : 'update',
      entity: 'loan',
      entity_id: d.id,
      detail: update,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accounts/loans] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

function badReq(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
