import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mgmtDb, logActivity } from '@/lib/management/server';
import { requireStaff } from '@/lib/management/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLES = { hajj: 'hajj_pilgrims', umrah: 'umrah_passengers' } as const;

const schema = z.object({
  table: z.enum(['hajj', 'umrah']),
  member_id: z.string().uuid(),
  /** null → detach the member from their group. */
  head_id: z.string().uuid().nullable(),
});

/**
 * Permanent family/group linking (migration 0008): set or clear a member's
 * group head. The head's + every member's profile then shows the combined
 * group statement.
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
  const table = TABLES[d.table];

  if (d.head_id === d.member_id) {
    return NextResponse.json({ ok: false, error: 'A person cannot be their own group head.' }, { status: 400 });
  }

  try {
    const db = mgmtDb();

    const { data: member, error: memberErr } = await db
      .from(table)
      .select('id, name, branch')
      .eq('id', d.member_id)
      .maybeSingle();
    if (memberErr || !member) {
      return NextResponse.json({ ok: false, error: 'Member not found.' }, { status: 404 });
    }

    if (d.head_id) {
      const { data: head, error: headErr } = await db
        .from(table)
        .select('id, name, branch, group_head_id')
        .eq('id', d.head_id)
        .maybeSingle();
      if (headErr || !head) {
        return NextResponse.json({ ok: false, error: 'Selected group head not found.' }, { status: 404 });
      }
      if ((head as { group_head_id?: string | null }).group_head_id) {
        return NextResponse.json(
          { ok: false, error: 'The selected head is already a member of another group.' },
          { status: 400 },
        );
      }
      if (head.branch !== member.branch) {
        return NextResponse.json({ ok: false, error: 'Head and member must be in the same branch.' }, { status: 400 });
      }
      // A person who leads their own group must be detached member-by-member
      // first — silently re-parenting a whole group is too surprising.
      const { data: ownMembers } = await db.from(table).select('id').eq('group_head_id', member.id).limit(1);
      if ((ownMembers?.length ?? 0) > 0) {
        return NextResponse.json(
          { ok: false, error: 'This person already leads a group. Detach their members first.' },
          { status: 400 },
        );
      }
    }

    const { error: upErr } = await db.from(table).update({ group_head_id: d.head_id }).eq('id', member.id);
    if (upErr) {
      console.error('[admin/group-link] update failed:', upErr.message);
      const missingColumn = /group_head_id/i.test(upErr.message) && /column|schema/i.test(upErr.message);
      return NextResponse.json(
        {
          ok: false,
          error: missingColumn
            ? 'Database migration 0008_group_head.sql has not been applied yet — run it in the Supabase SQL editor.'
            : 'Could not save the group link.',
        },
        { status: 500 },
      );
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: d.head_id ? 'group-link' : 'group-unlink',
      entity: d.table === 'hajj' ? 'hajj_pilgrim' : 'umrah_passenger',
      entity_id: member.id,
      detail: { head_id: d.head_id },
      branch: member.branch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/group-link] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
