import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, recordDiscount, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than zero.'),
  date: z.string().trim().optional().nullable(),
  narration: z.string().trim().optional().nullable(),
});

/** Apply a custom (manual-amount) discount to a hajj pilgrim's account. */
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

  try {
    const db = mgmtDb();
    const { data: pilgrim } = await db
      .from('hajj_pilgrims')
      .select('id, account_head_id, branch, name')
      .eq('id', params.id)
      .maybeSingle();

    if (!pilgrim) return NextResponse.json({ ok: false, error: 'Pilgrim not found.' }, { status: 404 });
    if (!pilgrim.account_head_id) {
      return NextResponse.json({ ok: false, error: 'No account is linked to this pilgrim.' }, { status: 400 });
    }

    await recordDiscount({
      packageType: 'hajj',
      account_head_id: pilgrim.account_head_id,
      amount: d.amount,
      date: d.date ?? undefined,
      narration: d.narration ? `Discount — ${d.narration}` : 'Discount',
      branch: pilgrim.branch,
      ref_table: 'hajj_pilgrims',
      ref_id: pilgrim.id,
      created_by: guard.user.id,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'discount',
      entity: 'hajj_pilgrim',
      entity_id: pilgrim.id,
      detail: { amount: d.amount },
      branch: pilgrim.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/hajj/:id/discount] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not apply the discount.' },
      { status: 500 },
    );
  }
}
