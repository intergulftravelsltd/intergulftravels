import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, recordPayment, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLES = { hajj: 'hajj_pilgrims', umrah: 'umrah_passengers' } as const;

const schema = z.object({
  table: z.enum(['hajj', 'umrah']),
  payer_name: z.string().trim().min(1, 'Enter the payer name.'),
  payer_phone: z.string().trim().optional().nullable(),
  method: z.enum(['cash', 'bank']).default('cash'),
  bank_account_id: z.string().uuid().optional().nullable(),
  type: z.enum(['advance', 'installment', 'token', 'full']).default('installment'),
  date: z.string().trim().optional().nullable(),
  narration: z.string().trim().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        amount: z.coerce.number().positive('Every member needs an amount greater than zero.'),
      }),
    )
    .min(1, 'Select at least one member.'),
});

/**
 * Bulk / family group payment: one payer (e.g. the family head) pays for
 * several hajj pilgrims or umrah passengers at once. Each member gets a proper
 * ledger payment against their own account (so individual dues stay exact),
 * all stamped with the payer's name — and one combined receipt covers the lot.
 */
export async function POST(request: Request) {
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
    const table = TABLES[d.table];
    const ids = d.items.map((i) => i.id);
    const { data: partyRows, error: loadErr } = await db
      .from(table)
      .select('id, name, account_head_id, branch')
      .in('id', ids);
    if (loadErr) throw new Error(loadErr.message);

    const parties = new Map(
      ((partyRows ?? []) as { id: string; name: string; account_head_id: string | null; branch: string }[]).map(
        (p) => [p.id, p],
      ),
    );

    for (const item of d.items) {
      const party = parties.get(item.id);
      if (!party) return NextResponse.json({ ok: false, error: 'A selected member was not found.' }, { status: 404 });
      if (!party.account_head_id) {
        return NextResponse.json(
          { ok: false, error: `No account is linked to ${party.name}. Open their profile once, then retry.` },
          { status: 400 },
        );
      }
    }

    const baseNarration = `Group payment — ${d.payer_name}${d.narration ? ` · ${d.narration}` : ''}`;
    const paymentIds: string[] = [];

    // Sequential on purpose: voucher numbers stay consecutive for the family.
    for (const item of d.items) {
      const party = parties.get(item.id)!;
      const { payment } = await recordPayment({
        party_table: table as 'hajj_pilgrims' | 'umrah_passengers',
        party_id: party.id,
        account_head_id: party.account_head_id!,
        amount: item.amount,
        method: d.method,
        bank_account_id: d.method === 'bank' ? d.bank_account_id ?? null : null,
        type: d.type,
        date: d.date ?? undefined,
        narration: baseNarration,
        branch: party.branch,
        created_by: guard.user.id,
      });
      paymentIds.push(payment.id as string);
    }

    const total = d.items.reduce((s, i) => s + i.amount, 0);
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'group-payment',
      entity: d.table === 'hajj' ? 'hajj_pilgrim' : 'umrah_passenger',
      detail: { payer: d.payer_name, members: d.items.length, total },
    });

    const qs = new URLSearchParams({
      ids: paymentIds.join(','),
      payer: d.payer_name,
      table: d.table,
    });
    if (d.payer_phone) qs.set('phone', d.payer_phone);

    return NextResponse.json({ ok: true, ids: paymentIds, receiptUrl: `/admin/receipt/group?${qs.toString()}` });
  } catch (err) {
    console.error('[admin/group-payment] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not record the group payment.' },
      { status: 500 },
    );
  }
}
