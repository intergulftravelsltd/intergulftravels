import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { logActivity } from '@/lib/management/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ *
 *  /api/admin/affiliations — manage flight & hotel partners.
 *  Every method is guarded by requireStaff() and writes through the
 *  service-role client. Errors degrade gracefully (the affiliations
 *  table may not be migrated yet on a fresh environment).
 * ------------------------------------------------------------------ */

const urlOrEmpty = z
  .string()
  .trim()
  .max(600)
  .url('Enter a valid URL (including https://).')
  .optional()
  .nullable()
  .or(z.literal(''));

const createSchema = z.object({
  category: z.enum(['flight', 'hotel']),
  name: z.string().trim().min(1, 'A partner name is required.').max(160),
  logo_url: z.string().trim().max(600).url().optional().nullable().or(z.literal('')),
  website_url: urlOrEmpty,
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  active: z.boolean().optional().default(true),
});

const patchSchema = z.object({
  id: z.string().uuid('Invalid record id.'),
  category: z.enum(['flight', 'hotel']).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  logo_url: z.string().trim().max(600).url().optional().nullable().or(z.literal('')),
  website_url: urlOrEmpty,
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

function clean(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('affiliations')
      .insert({
        category: d.category,
        name: d.name,
        logo_url: clean(d.logo_url),
        website_url: clean(d.website_url),
        sort_order: d.sort_order ?? 0,
        active: d.active ?? true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[admin/affiliations] insert failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Could not add this partner.' },
        { status: 500 },
      );
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'create',
      entity: 'affiliation',
      entity_id: data.id,
      detail: { name: d.name, category: d.category },
    });

    revalidateTag('affiliations');
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[admin/affiliations] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

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

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }
  const { id, ...rest } = parsed.data;

  // Build a partial update from only the fields that were supplied.
  const update: Record<string, unknown> = {};
  if (rest.category !== undefined) update.category = rest.category;
  if (rest.name !== undefined) update.name = rest.name;
  if (rest.logo_url !== undefined) update.logo_url = clean(rest.logo_url);
  if (rest.website_url !== undefined) update.website_url = clean(rest.website_url);
  if (rest.sort_order !== undefined) update.sort_order = rest.sort_order;
  if (rest.active !== undefined) update.active = rest.active;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('affiliations').update(update).eq('id', id);

    if (error) {
      console.error('[admin/affiliations] update failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Could not update this partner.' },
        { status: 500 },
      );
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'update',
      entity: 'affiliation',
      entity_id: id,
      detail: update,
    });

    revalidateTag('affiliations');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/affiliations] unexpected error:', err);
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
    return NextResponse.json({ ok: false, error: 'Missing partner id.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('affiliations').delete().eq('id', id);

    if (error) {
      console.error('[admin/affiliations] delete failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Could not delete this partner.' },
        { status: 500 },
      );
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'delete',
      entity: 'affiliation',
      entity_id: id,
    });

    revalidateTag('affiliations');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/affiliations] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
