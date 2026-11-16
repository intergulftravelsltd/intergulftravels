import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  toOptimizedWebp,
  toImageFilename,
  ACCEPTED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from '@/lib/image';
import { requireAdmin } from '../_lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'media';

/**
 * The single image-upload choke-point for the whole admin.
 *
 * Every uploaded image — blog cover, gallery item, media library asset, theme
 * artwork — passes through here and is ALWAYS re-encoded to an optimized WebP
 * via toOptimizedWebp before it is written to storage. A JPG/PNG/GIF/etc. can
 * therefore never reach the bucket in its original format.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.status === 401 ? 'Not signed in.' : 'Admin access required.' },
      { status: guard.status },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload payload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'No file was provided.' }, { status: 400 });
  }

  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported file type. Accepted formats: ${ACCEPTED_UPLOAD_TYPES.map((t) =>
          t.replace('image/', '').toUpperCase(),
        ).join(', ')}.`,
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json(
      { ok: false, error: `Image is too large. Maximum size is ${mb}MB.` },
      { status: 413 },
    );
  }

  // ---- WebP enforcement ----------------------------------------------------
  let webp: Awaited<ReturnType<typeof toOptimizedWebp>>;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    webp = await toOptimizedWebp(inputBuffer);
  } catch (err) {
    console.error('[admin/upload] WebP conversion failed:', err);
    return NextResponse.json(
      { ok: false, error: 'We could not process that image. Please try a different file.' },
      { status: 422 },
    );
  }

  // Folder + timestamp prefix keep names unique and tidy in the bucket.
  const folder = sanitizeFolder(form.get('folder'));
  const filename = toImageFilename(file.name, webp.contentType);
  const objectPath = `${folder}/${Date.now()}-${filename}`;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, webp.buffer, {
      contentType: webp.contentType,
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      console.error('[admin/upload] storage upload failed:', error.message);
      return NextResponse.json(
        { ok: false, error: 'Upload failed. Please check the storage bucket and try again.' },
        { status: 502 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path: objectPath,
      width: webp.width,
      height: webp.height,
      bytes: webp.bytes,
    });
  } catch (err) {
    console.error('[admin/upload] unexpected error:', err);
    return NextResponse.json(
      { ok: false, error: 'Unexpected error while uploading. Please try again.' },
      { status: 500 },
    );
  }
}

/** Restrict the optional folder to a small, safe allowlist. */
function sanitizeFolder(value: FormDataEntryValue | null): string {
  const allowed = ['blog', 'gallery', 'media', 'settings'];
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return allowed.includes(raw) ? raw : 'media';
}
