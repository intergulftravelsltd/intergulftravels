import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, postTransaction, logActivity, cleanManualRef } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';
import type { Transaction } from '@/lib/management/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TX_TYPES = ['receipt', 'payment', 'contra', 'journal', 'expense', 'income'] as const;

const patchSchema = z.object({
  id: z.string().uuid(),
  date: z.string().trim().min(1).max(10).optional(),
  narration: z.string().trim().max(400).optional().nullable(),
  manual_ref: z.string().trim().max(60).optional().nullable(),
  type: z.enum(TX_TYPES).optional(),
  debit_account_id: z.string().uuid().optional(),
  credit_account_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive('Enter an amount greater than zero.').max(99999999999).optional(),
});

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
function fail(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 500 });
}

const LINKED_MSG =
  'This voucher was posted automatically from a payment, loan or registration. Change its amount/accounts from that record — here you can only edit the date or narration.';

export async function PATCH(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return bad('Invalid request body.');
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Please check the details.');
  const d = parsed.data;

  try {
    const db = mgmtDb();
    const { data, error: loadErr } = await db.from('transactions').select('*').eq('id', d.id).maybeSingle();
    if (loadErr || !data) return NextResponse.json({ ok: false, error: 'Voucher not found.' }, { status: 404 });
    const tx = data as Transaction;

    const linked = !!tx.ref_table;
    const newDebit = d.debit_account_id ?? tx.debit_account_id;
    const newCredit = d.credit_account_id ?? tx.credit_account_id;
    const newAmount = d.amount ?? Number(tx.amount);
    const newType = (d.type ?? tx.type) as Transaction['type'];

    const ledgerChanged =
      newDebit !== tx.debit_account_id ||
      newCredit !== tx.credit_account_id ||
      newAmount !== Number(tx.amount) ||
      newType !== tx.type;

    if (ledgerChanged && linked) return bad(LINKED_MSG);

    if (ledgerChanged) {
      if (newDebit === newCredit) return bad('The debit and credit accounts must be different.');
      // Transactions are immutable (insert/delete triggers keep balances in sync),
      // so a ledger edit = reverse the old row + post a corrected one under the
      // same voucher number.
      const { error: delErr } = await db.from('transactions').delete().eq('id', tx.id);
      if (delErr) {
        console.error('[accounts/transactions] delete-for-edit failed:', delErr.message);
        return fail('Could not update the voucher.');
      }
      await postTransaction({
        voucher_no: tx.voucher_no ?? undefined,
        date: d.date ?? tx.date,
        type: newType,
        debit_account_id: newDebit,
        credit_account_id: newCredit,
        amount: newAmount,
        narration: d.narration !== undefined ? d.narration : tx.narration,
        branch: tx.branch,
        method: tx.method,
        created_by: tx.created_by,
        manual_ref: d.manual_ref !== undefined ? cleanManualRef(d.manual_ref) : tx.manual_ref ?? null,
      });
    } else {
      const update: Record<string, unknown> = {};
      if (d.date !== undefined) update.date = d.date;
      if (d.narration !== undefined) update.narration = d.narration || null;
      if (d.manual_ref !== undefined) update.manual_ref = cleanManualRef(d.manual_ref);
      if (Object.keys(update).length === 0) return bad('Nothing to update.');
      let { error: upErr } = await db.from('transactions').update(update).eq('id', tx.id);
      if (upErr && 'manual_ref' in update && /manual_ref/i.test(upErr.message)) {
        // 0011 not applied yet — save the rest and keep the console usable.
        console.warn('[accounts/transactions] manual_ref column missing — run supabase/migrations/0011_manual_ref.sql');
        delete update.manual_ref;
        if (Object.keys(update).length === 0) return bad('Run migration 0011 to store manual voucher numbers.');
        ({ error: upErr } = await db.from('transactions').update(update).eq('id', tx.id));
      }
      if (upErr) {
        console.error('[accounts/transactions] update failed:', upErr.message);
        return fail('Could not update the voucher.');
      }
      // Keep the linked payment's receipt number in step with the voucher.
      if (d.manual_ref !== undefined && tx.ref_table === 'payments' && tx.ref_id) {
        await db.from('payments').update({ manual_ref: cleanManualRef(d.manual_ref) }).eq('id', tx.ref_id);
      }
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'edit',
      entity: 'transaction',
      entity_id: d.id,
      detail: { voucher_no: tx.voucher_no, ledgerChanged },
      branch: tx.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accounts/transactions] PATCH error:', err);
    return fail('Unexpected error.');
  }
}

export async function DELETE(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return bad('Missing voucher id.');

  try {
    const db = mgmtDb();
    const { data: tx } = await db
      .from('transactions')
      .select('id, ref_table, ref_id, voucher_no, branch')
      .eq('id', id)
      .maybeSingle();
    if (!tx) return NextResponse.json({ ok: false, error: 'Voucher not found.' }, { status: 404 });

    // Linked vouchers: remove the source row too so the books stay consistent.
    // A payment receipt removes the payment; a loan voucher removes the loan; a
    // package-charge journal just gets reversed (the registration stays).
    if (tx.ref_table === 'payments' && tx.ref_id) {
      await db.from('payments').delete().eq('id', tx.ref_id);
    } else if (tx.ref_table === 'loans' && tx.ref_id) {
      await db.from('loans').delete().eq('id', tx.ref_id);
    }

    // The delete trigger reverses both account balances automatically.
    const { error } = await db.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('[accounts/transactions] delete failed:', error.message);
      return fail('Could not delete the voucher.');
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'delete',
      entity: 'transaction',
      entity_id: id,
      detail: { voucher_no: tx.voucher_no },
      branch: tx.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accounts/transactions] DELETE error:', err);
    return fail('Unexpected error.');
  }
}
