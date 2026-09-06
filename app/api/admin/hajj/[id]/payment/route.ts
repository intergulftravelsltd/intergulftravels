import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, recordPayment, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than zero.'),
  method: z.enum(['cash', 'bank']).default('cash'),
  bank_account_id: z.string().uuid().optional().nullable(),
  type: z.enum(['advance', 'installment', 'token', 'full', 'refund']).default('installment'),
  date: z.string().trim().optional().nullable(),
  narration: z.string().trim().optional().nullable(),
  manual_ref: z.string().trim().max(60).optional().nullable(),
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

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.method === 'bank' && !d.bank_account_id) {
    return NextResponse.json({ ok: false, error: 'Select a bank account.' }, { status: 400 });
  }

  try {
    const db = mgmtDb();
    const { data: pilgrim, error: loadErr } = await db
      .from('hajj_pilgrims')
      .select('id, account_head_id, branch, name')
      .eq('id', params.id)
      .maybeSingle();

    if (loadErr || !pilgrim) {
      return NextResponse.json({ ok: false, error: 'Pilgrim not found.' }, { status: 404 });
    }
    if (!pilgrim.account_head_id) {
      return NextResponse.json({ ok: false, error: 'No account is linked to this pilgrim.' }, { status: 400 });
    }

    await recordPayment({
      party_table: 'hajj_pilgrims',
      party_id: pilgrim.id,
      account_head_id: pilgrim.account_head_id,
      amount: d.amount,
      method: d.method,
      bank_account_id: d.method === 'bank' ? d.bank_account_id ?? null : null,
      type: d.type,
      date: d.date ?? undefined,
      narration: d.narration ?? null,
      branch: pilgrim.branch,
      created_by: guard.user.id,
      manual_ref: d.manual_ref ?? null,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'payment',
      entity: 'hajj_pilgrim',
      entity_id: pilgrim.id,
      detail: { amount: d.amount, method: d.method, type: d.type },
      branch: pilgrim.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/hajj/:id/payment] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not record the payment.' },
      { status: 500 },
    );
  }
}
