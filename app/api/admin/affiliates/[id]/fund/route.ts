import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { recordPayment, logActivity, ensureGroupFundHead } from '@/lib/management/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const schema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than zero.').max(99999999999),
  method: z.enum(['cash', 'bank']).default('cash'),
  bank_account_id: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  date: z.preprocess(emptyToNull, z.string().trim().max(10).nullable().optional()),
  narration: z.preprocess(emptyToNull, z.string().trim().max(400).nullable().optional()),
  manual_ref: z.preprocess(emptyToNull, z.string().trim().max(60).nullable().optional()),
});

/**
 * Money received from a Group Fund leader (bulk, not for a named pilgrim):
 * Dr Cash/Bank, Cr the leader's fund head. Shows up in Receipts with a
 * printable money receipt like any other payment.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;
  if (d.method === 'bank' && !d.bank_account_id) {
    return NextResponse.json({ ok: false, error: 'Select the bank account that received this money.' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const scope = await getStaffScope();
    const { data: aff } = await db.from('affiliates').select('*').eq('id', params.id).maybeSingle();
    if (!aff) return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    if (scope.branch && aff.branch !== scope.branch) {
      return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    }
    if (aff.fund_mode !== 'group_fund') {
      return NextResponse.json(
        { ok: false, error: 'This care-of is in Individual mode. Switch it to Group Fund first.' },
        { status: 409 },
      );
    }
    const headId = await ensureGroupFundHead({
      id: aff.id,
      name: aff.name,
      phone: aff.phone,
      branch: aff.branch,
      account_head_id: aff.account_head_id,
    });
    if (!headId) return NextResponse.json({ ok: false, error: 'The fund account could not be created.' }, { status: 500 });

    const { payment } = await recordPayment({
      party_table: 'affiliates',
      party_id: aff.id,
      account_head_id: headId,
      amount: d.amount,
      method: d.method,
      bank_account_id: d.method === 'bank' ? d.bank_account_id ?? null : null,
      type: 'advance',
      date: d.date ?? undefined,
      narration: d.narration ?? `Group fund received — ${aff.name}`,
      branch: aff.branch,
      created_by: guard.user.id,
      manual_ref: d.manual_ref ?? null,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'group_fund.receive',
      entity: 'affiliate',
      entity_id: aff.id,
      detail: { amount: d.amount, method: d.method, voucher_no: payment.voucher_no },
      branch: aff.branch,
    });

    return NextResponse.json({ ok: true, id: payment.id, voucher_no: payment.voucher_no });
  } catch (err) {
    console.error('[affiliates/:id/fund] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not record the fund receipt.' },
      { status: 500 },
    );
  }
}
