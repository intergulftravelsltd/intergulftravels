import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { signatureToPng, ACCEPTED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from '@/lib/image';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { BRANCHES } from '@/lib/management/branches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'media';
const KINDS = ['prepared', 'authorized'] as const;

/**
 * Signature upload for the receipt footers (Prepared by / Authorized
 * Signature). Staff sign on white paper, photograph or scan it and upload:
 * the paper background is removed, only the ink is kept, cropped and stored
 * as a transparent PNG under media/company/signature-<branch>-<kind>-<ts>.png.
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
  const kind = String(form.get('kind') ?? '');
  if (!(KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ ok: false, error: 'Unknown signature kind.' }, { status: 400 });
  }
  const scope = await getStaffScope();
  if (scope.branch && scope.branch !== requested) {
    return NextResponse.json({ ok: false, error: 'You can only change your own agency signatures.' }, { status: 403 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'No file was provided.' }, { status: 400 });
  }
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Unsupported image type. Use PNG, JPG or WebP.' }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image is too large.' }, { status: 413 });
  }

  let png: Awaited<ReturnType<typeof signatureToPng>>;
  try {
    png = await signatureToPng(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error('[admin/company/signature] processing failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not find a signature in that image. Sign clearly in dark ink on white paper and try again.' },
      { status: 422 },
    );
  }

  const objectPath = `company/signature-${requested}-${kind}-${Date.now()}.png`;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, png.buffer, {
      contentType: 'image/png',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.error('[admin/company/signature] storage upload failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Upload failed. Please try again.' }, { status: 502 });
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return NextResponse.json({ ok: true, url: publicUrl, width: png.width, height: png.height });
  } catch (err) {
    console.error('[admin/company/signature] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error while uploading.' }, { status: 500 });
  }
}
