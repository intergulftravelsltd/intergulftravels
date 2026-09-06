import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { logActivity, nextAffiliateCode, ensureGroupFundHead } from '@/lib/management/server';
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
  type: z.enum(['agent', 'family']).optional().default('agent'),
  /** Section the care-of belongs to. */
  program: z.enum(['hajj', 'umrah', 'both']).optional().default('both'),
  /** individual = pilgrims pay their own ledger; group_fund = leader pays in bulk. */
  fund_mode: z.enum(['individual', 'group_fund']).optional().default('individual'),
  branch: z.string().trim().max(60).optional().default('general'),
});

/** Columns added by 0012 are written separately so a pre-migration DB still works. */
async function writeExtras(
  id: string,
  extras: { program?: string; fund_mode?: string; type?: string },
): Promise<void> {
  const db = createAdminClient();
  for (const [key, value] of Object.entries(extras)) {
    if (value === undefined) continue;
    const { error } = await db.from('affiliates').update({ [key]: value }).eq('id', id);
    if (error) console.error(`[affiliates] ${key} skipped (migration pending?):`, error.message);
  }
}

export async function GET(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const program = new URL(request.url).searchParams.get('program');
  try {
    const scope = await getStaffScope();
    const db = createAdminClient();
    let q = db.from('affiliates').select('*').eq('active', true);
    if (scope.branch) q = q.eq('branch', scope.branch);
    if (program === 'hajj' || program === 'umrah') q = q.in('program', [program, 'both']);
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

    // type / program / fund_mode are written best-effort so care-of creation
    // still works before the 0007 / 0012 migrations are applied.
    await writeExtras(data.id, {
      type: d.type !== 'agent' ? d.type : undefined,
      program: d.program !== 'both' ? d.program : undefined,
      fund_mode: d.fund_mode !== 'individual' ? d.fund_mode : undefined,
    });

    let account_head_id: string | null = null;
    if (d.fund_mode === 'group_fund') {
      account_head_id = await ensureGroupFundHead({ id: data.id, name: data.name, phone: data.phone, branch });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'affiliate',
      entity_id: data.id,
      detail: { name: data.name, code: data.code, program: d.program, fund_mode: d.fund_mode },
      branch,
    });

    return NextResponse.json({
      ok: true,
      affiliate: { ...data, program: d.program, fund_mode: d.fund_mode, account_head_id },
    });
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
    const { data: existing } = await db.from('affiliates').select('*').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    if (scope.branch && existing.branch !== scope.branch) {
      return NextResponse.json({ ok: false, error: 'Care-of not found.' }, { status: 404 });
    }

    // A submitted branch is forced through enforceBranch so branch staff can
    // never move a record out of (or into) another branch.
    if (rest.branch !== undefined) patch.branch = await enforceBranch(rest.branch);

    const hasExtras = rest.type !== undefined || rest.program !== undefined || rest.fund_mode !== undefined;
    if (Object.keys(patch).length === 0 && !hasExtras) {
      return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from('affiliates').update(patch).eq('id', id);
      if (error) {
        console.error('[affiliates] update failed:', error.message);
        return NextResponse.json({ ok: false, error: 'Could not update the care-of.' }, { status: 500 });
      }
    }

    await writeExtras(id, { type: rest.type, program: rest.program, fund_mode: rest.fund_mode });

    // Switching a leader to Group Fund provisions their ledger head (idempotent).
    // Keep the head's name / phone in step with the care-of.
    let account_head_id: string | null = (existing.account_head_id as string | null) ?? null;
    if (rest.fund_mode === 'group_fund') {
      account_head_id = await ensureGroupFundHead({
        id,
        name: (patch.name as string) ?? existing.name,
        phone: (patch.phone as string | null | undefined) ?? existing.phone,
        branch: (patch.branch as string) ?? existing.branch,
        account_head_id,
      });
      if (!account_head_id) {
        return NextResponse.json(
          { ok: false, error: 'Group Fund needs migration 0012 — the fund account could not be created.' },
          { status: 500 },
        );
      }
    }
    if (account_head_id && (patch.name !== undefined || patch.phone !== undefined)) {
      const headPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) headPatch.name = `${patch.name} (Group Fund)`;
      if (patch.phone !== undefined) headPatch.party_phone = patch.phone;
      await db.from('account_heads').update(headPatch).eq('id', account_head_id).eq('ref_table', 'affiliates');
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'update',
      entity: 'affiliate',
      entity_id: id,
      detail: { ...patch, program: rest.program, fund_mode: rest.fund_mode },
    });
    return NextResponse.json({ ok: true, account_head_id });
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
