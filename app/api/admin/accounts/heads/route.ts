import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { logActivity } from '@/lib/management/server';
import { enforceBranch } from '@/lib/management/scope';
import { isCoreHead } from '@/lib/management/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACCOUNT_TYPES = ['asset', 'liability', 'income', 'expense', 'equity'] as const;
const SUBTYPES = ['cash', 'bank', 'customer', 'supplier', 'loan', 'expense', 'income', 'general', 'equity'] as const;

const createSchema = z.object({
  name: z.string().trim().min(1, 'An account name is required.').max(160),
  type: z.enum(ACCOUNT_TYPES),
  subtype: z.enum(SUBTYPES).optional(),
  branch: z.string().trim().max(60).optional().default('general'),
  opening_balance: z.coerce.number().min(0).max(99999999999).optional().default(0),
  opening_is_debit: z.coerce.boolean().optional().default(true),
  bank_name: z.string().trim().max(160).optional().nullable(),
  account_no: z.string().trim().max(80).optional().nullable(),
  party_phone: z.string().trim().max(40).optional().nullable(),
  code: z.string().trim().max(40).optional().nullable(),
});

/** Sensible default subtype when the caller does not pass one. */
function defaultSubtype(type: (typeof ACCOUNT_TYPES)[number]) {
  switch (type) {
    case 'income':
      return 'income';
    case 'expense':
      return 'expense';
    case 'equity':
      return 'equity';
    default:
      return 'general';
  }
}

export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('account_heads')
      .select('*')
      .eq('active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[accounts/heads] list failed:', error.message);
      return NextResponse.json({ ok: true, heads: [] });
    }
    return NextResponse.json({ ok: true, heads: data ?? [] });
  } catch (err) {
    console.error('[accounts/heads] unexpected error:', err);
    return NextResponse.json({ ok: true, heads: [] });
  }
}

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
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const subtype = d.subtype ?? defaultSubtype(d.type);

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('account_heads')
      .insert({
        code: d.code || null,
        name: d.name,
        type: d.type,
        subtype,
        branch: await enforceBranch(d.branch),
        is_system: false,
        opening_balance: d.opening_balance ?? 0,
        opening_is_debit: d.opening_is_debit ?? true,
        bank_name: subtype === 'bank' ? d.bank_name || null : null,
        account_no: subtype === 'bank' ? d.account_no || null : null,
        party_phone: d.party_phone || null,
        active: true,
      })
      .select('id, name')
      .single();

    if (error) {
      console.error('[accounts/heads] insert failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not create the account head.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'account_head',
      entity_id: data.id,
      detail: { name: data.name, type: d.type, subtype },
      branch: d.branch,
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[accounts/heads] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

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

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }
  const { id, ...rest } = parsed.data;

  const patch: Record<string, unknown> = {};
  if (rest.name !== undefined) patch.name = rest.name;
  if (rest.type !== undefined) patch.type = rest.type;
  if (rest.subtype !== undefined) patch.subtype = rest.subtype;
  if (rest.branch !== undefined) patch.branch = rest.branch;
  if (rest.bank_name !== undefined) patch.bank_name = rest.bank_name || null;
  if (rest.account_no !== undefined) patch.account_no = rest.account_no || null;
  if (rest.party_phone !== undefined) patch.party_phone = rest.party_phone || null;
  if (rest.code !== undefined) patch.code = rest.code || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    // Core control accounts are locked; other system heads may be renamed but
    // keep their type / subtype.
    const { data: head } = await db
      .from('account_heads')
      .select('is_system, name')
      .eq('id', id)
      .maybeSingle();
    if (head && isCoreHead(head)) {
      return NextResponse.json(
        { ok: false, error: 'This is a core control account used by the system and cannot be edited.' },
        { status: 400 },
      );
    }
    if (head?.is_system) {
      // The app posts to system heads by name, so never let those change.
      delete patch.name;
      delete patch.type;
      delete patch.subtype;
    }

    const { error } = await db.from('account_heads').update(patch).eq('id', id);
    if (error) {
      console.error('[accounts/heads] update failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not update the account head.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'update',
      entity: 'account_head',
      entity_id: id,
      detail: patch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accounts/heads] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing account head id.' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { data: head } = await db
      .from('account_heads')
      .select('is_system, name')
      .eq('id', id)
      .maybeSingle();

    if (head && isCoreHead(head)) {
      return NextResponse.json(
        { ok: false, error: 'This is a core control account used by the system and cannot be removed.' },
        { status: 400 },
      );
    }

    // Heads are deactivated (never hard-deleted) to preserve ledger history.
    const { error } = await db.from('account_heads').update({ active: false }).eq('id', id);
    if (error) {
      console.error('[accounts/heads] deactivate failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not remove the account head.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'deactivate',
      entity: 'account_head',
      entity_id: id,
      detail: { name: head?.name },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accounts/heads] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
