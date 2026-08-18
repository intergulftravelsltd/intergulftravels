import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { youtubeId } from '@/lib/videos';
import { logActivity } from '@/lib/management/server';
import { requireAdmin } from '../_lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const baseSchema = z.object({
  title: z.string().trim().min(1, 'A title is required.').max(160),
  youtube_url: z.string().trim().min(1, 'A YouTube link is required.').max(600),
  description: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
  active: z.coerce.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = baseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
      { status: 400 },
    );
  }

  const id = youtubeId(parsed.data.youtube_url);
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'That does not look like a valid YouTube link.' },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: parsed.data.title,
        youtube_url: parsed.data.youtube_url,
        youtube_id: id,
        description: parsed.data.description?.trim() || null,
        sort_order: parsed.data.sort_order ?? 0,
        active: parsed.data.active ?? true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[admin/videos] insert failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not add the video.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'video.create',
      entity: 'videos',
      entity_id: data.id,
      detail: { title: parsed.data.title, youtube_id: id },
    });

    revalidateTag('videos');
    return NextResponse.json({ ok: true, id: data.id, youtube_id: id });
  } catch (err) {
    console.error('[admin/videos] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const id = typeof payload?.id === 'string' ? payload.id : '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing video id.' }, { status: 400 });
  }

  // A lightweight toggle (active only) is allowed without re-validating the rest.
  const isToggleOnly =
    Object.keys(payload).filter((k) => k !== 'id').length === 1 &&
    typeof payload.active === 'boolean';

  const update: Record<string, unknown> = {};

  if (isToggleOnly) {
    update.active = payload.active;
  } else {
    const parsed = baseSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the details.' },
        { status: 400 },
      );
    }

    const ytId = youtubeId(parsed.data.youtube_url);
    if (!ytId) {
      return NextResponse.json(
        { ok: false, error: 'That does not look like a valid YouTube link.' },
        { status: 400 },
      );
    }

    update.title = parsed.data.title;
    update.youtube_url = parsed.data.youtube_url;
    update.youtube_id = ytId;
    update.description = parsed.data.description?.trim() || null;
    update.sort_order = parsed.data.sort_order ?? 0;
    update.active = parsed.data.active ?? true;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('videos').update(update).eq('id', id);

    if (error) {
      console.error('[admin/videos] update failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not update the video.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'video.update',
      entity: 'videos',
      entity_id: id,
      detail: update,
    });

    revalidateTag('videos');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/videos] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing video id.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) {
      console.error('[admin/videos] delete failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not delete the video.' }, { status: 500 });
    }

    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'video.delete',
      entity: 'videos',
      entity_id: id,
    });

    revalidateTag('videos');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/videos] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
