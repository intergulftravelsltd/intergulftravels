import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { logActivity, nextAffiliateCode } from '@/lib/management/server';
import { enforceBranch, getStaffScope } from '@/lib/management/scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const createSchema = z.object({
  name: z.string().trim().min(1, 'A name is required.').max(160),
  phone: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().trim().max(400).nullable().optional()),
  code: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  note: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable().optional()),
  branch: z.string().trim().max(60).optional().default('general'),
});

export async function GET() {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('affiliates').select('*').eq('active', true);
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('name', { ascending: true });
    if (error) return NextResponse.json({ ok: true, affiliates: [] });
    return NextResponse.json({ ok: true, affiliates: data ?? [] });
  } catch {
    return NextResponse.json({ ok: true, affiliates: [] });
  }
}

export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

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

  try {
    const db = createAdminClient();
    // Auto-generate an editable code (CO-0001) when none is supplied.
    const code = d.code || (await nextAffiliateCode());
    const branch = await enforceBranch(d.branch);
    const { data, error } = await db
      .from('affiliates')
      .insert({
        code,
        name: d.name,
        phone: d.phone || null,
        address: d.address || null,
        note: d.note || null,
        branch,
        active: true,
        created_by: guard.user.id,
      })
      .select('id, code, name, phone, address, branch')
      .single();

    if (error || !data) {
      console.error('[affiliates] insert failed:', error?.message);
      return NextResponse.json(
        { ok: false, error: 'Could not create the care-of. The table may not be set up yet.' },
        { status: 500 },
      );
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'affiliate',
      entity_id: data.id,
      detail: { name: data.name, code: data.code },
      branch,
    });

    return NextResponse.json({ ok: true, affiliate: data });
  } catch (err) {
    console.error('[affiliates] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

export async function PATCH(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

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
  if (rest.phone !== undefined) patch.phone = rest.phone || null;
  if (rest.address !== undefined) patch.address = rest.address || null;
  if (rest.note !== undefined) patch.note = rest.note || null;
  if (rest.code !== undefined) patch.code = rest.code || null;

  try {
    const db = createAdminClient();
    const scope = await getStaffScope();

    // Branch-scoped staff may only touch their own branch's care-of.
    const { data: existing } = await db.from('affiliates').select('branch').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    if (scope.branch && existing.branch !== scope.branch) {
      return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    }

    // A submitted branch is forced through enforceBranch so branch staff can
    // never move a record out of (or into) another branch.
    if (rest.branch !== undefined) patch.branch = await enforceBranch(rest.branch);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
    }

    const { error } = await db.from('affiliates').update(patch).eq('id', id);
    if (error) {
      console.error('[affiliates] update failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not update the care-of.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'update',
      entity: 'affiliate',
      entity_id: id,
      detail: patch,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[affiliates] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'Missing care-of id.' }, { status: 400 });

  try {
    const db = createAdminClient();
    const scope = await getStaffScope();

    // Branch-scoped staff may only remove their own branch's care-of.
    const { data: existing } = await db.from('affiliates').select('branch').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    if (scope.branch && existing.branch !== scope.branch) {
      return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    }

    // Soft delete so pilgrims already tagged keep a valid reference.
    const { error } = await db.from('affiliates').update({ active: false }).eq('id', id);
    if (error) {
      console.error('[affiliates] deactivate failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not remove the care-of.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'deactivate',
      entity: 'affiliate',
      entity_id: id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[affiliates] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
