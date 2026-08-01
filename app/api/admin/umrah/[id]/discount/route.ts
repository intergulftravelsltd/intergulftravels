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

/** Apply a custom (manual-amount) discount to an umrah passenger's account. */
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
    const { data: passenger } = await db
      .from('umrah_passengers')
      .select('id, account_head_id, branch, name')
      .eq('id', params.id)
      .maybeSingle();

    if (!passenger) return NextResponse.json({ ok: false, error: 'Passenger not found.' }, { status: 404 });
    if (!passenger.account_head_id) {
      return NextResponse.json({ ok: false, error: 'No account is linked to this passenger.' }, { status: 400 });
    }

    await recordDiscount({
      packageType: 'umrah',
      account_head_id: passenger.account_head_id,
      amount: d.amount,
      date: d.date ?? undefined,
      narration: d.narration ? `Discount — ${d.narration}` : 'Discount',
      branch: passenger.branch,
      ref_table: 'umrah_passengers',
      ref_id: passenger.id,
      created_by: guard.user.id,
    });

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'discount',
      entity: 'umrah_passenger',
      entity_id: passenger.id,
      detail: { amount: d.amount },
      branch: passenger.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/umrah/:id/discount] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not apply the discount.' },
      { status: 500 },
    );
  }
}
