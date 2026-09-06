import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { recordPayment, logActivity } from '@/lib/management/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than zero.'),
  method: z.enum(['cash', 'bank']).default('cash'),
  bank_account_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  type: z.enum(['advance', 'installment', 'token', 'full', 'refund']).default('installment'),
  date: z.preprocess(emptyToNull, z.string().trim().nullable().optional()),
  narration: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
  manual_ref: z.preprocess(emptyToNull, z.string().trim().max(60).nullable().optional()),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.status === 401 ? 'Not signed in.' : 'Staff access required.' },
      { status: guard.status },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = paymentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the payment details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.method === 'bank' && !d.bank_account_id) {
    return NextResponse.json(
      { ok: false, error: 'Select the bank account that received this payment.' },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();

    const { data: passenger, error: loadErr } = await supabase
      .from('umrah_passengers')
      .select('id, account_head_id, branch')
      .eq('id', params.id)
      .maybeSingle();

    if (loadErr || !passenger) {
      return NextResponse.json({ ok: false, error: 'Passenger not found.' }, { status: 404 });
    }
    if (!passenger.account_head_id) {
      return NextResponse.json(
        { ok: false, error: 'This passenger has no customer account yet.' },
        { status: 409 },
      );
    }

    const { payment } = await recordPayment({
      party_table: 'umrah_passengers',
      party_id: passenger.id,
      account_head_id: passenger.account_head_id,
      amount: d.amount,
      method: d.method,
      bank_account_id: d.method === 'bank' ? d.bank_account_id ?? null : null,
      type: d.type,
      date: d.date ?? undefined,
      narration: d.narration ?? 'Payment received',
      branch: passenger.branch,
      created_by: guard.user.id,
      manual_ref: d.manual_ref ?? null,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'umrah.payment.record',
      entity: 'umrah_passengers',
      entity_id: passenger.id,
      detail: { amount: d.amount, method: d.method, type: d.type },
      branch: passenger.branch,
    });

    return NextResponse.json({ ok: true, id: payment.id, voucher_no: payment.voucher_no });
  } catch (err) {
    console.error('[admin/umrah/:id/payment] unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
