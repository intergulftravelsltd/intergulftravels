import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { toOptimizedWebp, ACCEPTED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from '@/lib/image';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { BRANCHES } from '@/lib/management/branches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'media';

/**
 * Company-logo upload for the letterhead. Any staff member may upload their
 * OWN agency's logo (the general /api/admin/upload is admin-only). The image
 * is re-encoded to WebP and stored under media/company/<branch>-<ts>.webp.
 */
export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload payload.' }, { status: 400 });
  }

  const requested = String(form.get('branch') ?? '');
  if (!BRANCHES.some((b) => b.value === requested)) {
    return NextResponse.json({ ok: false, error: 'Unknown branch.' }, { status: 400 });
  }
  const scope = await getStaffScope();
  if (scope.branch && scope.branch !== requested) {
    return NextResponse.json({ ok: false, error: 'You can only change your own agency logo.' }, { status: 403 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'No file was provided.' }, { status: 400 });
  }
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Unsupported image type. Use PNG, JPG, WebP or SVG.' }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image is too large.' }, { status: 413 });
  }

  let webp: Awaited<ReturnType<typeof toOptimizedWebp>>;
  try {
    webp = await toOptimizedWebp(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error('[admin/company/logo] WebP conversion failed:', err);
    return NextResponse.json({ ok: false, error: 'We could not process that image.' }, { status: 422 });
  }

  const objectPath = `company/${requested}-${Date.now()}.webp`;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, webp.buffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.error('[admin/company/logo] storage upload failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Upload failed. Please try again.' }, { status: 502 });
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('[admin/company/logo] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error while uploading.' }, { status: 500 });
  }
}
