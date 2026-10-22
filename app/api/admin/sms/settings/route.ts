import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { logActivity } from '@/lib/management/server';
import { BRANCHES } from '@/lib/management/branches';
import { DEFAULT_SMS_API_URL, loadSmsConfigPublic, readStoredSmsConfig, smsConfigKey } from '@/lib/sms/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BRANCH_VALUES = BRANCHES.map((b) => b.value) as [string, ...string[]];

const schema = z.object({
  branch: z.enum(BRANCH_VALUES),
  senderId: z.string().trim().min(1, 'Enter the sender id (masking name).').max(20),
  /** Blank = keep the saved key. */
  apiKey: z.string().trim().max(200).optional().default(''),
  secretKey: z.string().trim().max(200).optional().default(''),
  apiUrl: z.string().trim().max(200).optional().default(''),
});

/** Branch staff may only edit their own agency; the head office any concern. */
async function resolveBranch(requested: string): Promise<string | null> {
  const scope = await getStaffScope();
  if (scope.branch) return scope.branch === requested ? requested : null;
  return requested;
}

/** Save (upsert) a branch's gateway settings. Keys are never echoed back. */
export async function PATCH(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the settings.' }, { status: 400 });
  }
  const branch = await resolveBranch(parsed.data.branch);
  if (!branch) return NextResponse.json({ ok: false, error: 'You can only edit your own agency.' }, { status: 403 });

  const apiUrl = parsed.data.apiUrl || DEFAULT_SMS_API_URL;
  if (!/^https?:\/\/[^\s]+$/i.test(apiUrl)) {
    return NextResponse.json({ ok: false, error: 'The gateway URL must start with http:// or https://.' }, { status: 400 });
  }

  try {
    const existing = await readStoredSmsConfig(branch);
    const value = {
      senderId: parsed.data.senderId,
      apiKey: parsed.data.apiKey || existing?.apiKey || '',
      secretKey: parsed.data.secretKey || existing?.secretKey || '',
      apiUrl: apiUrl.replace(/\/+$/, ''),
    };
    if (!value.apiKey || !value.secretKey) {
      return NextResponse.json({ ok: false, error: 'Enter both the API key and the secret key.' }, { status: 400 });
    }
    const db = createAdminClient();
    const { error } = await db.from('site_settings').upsert({ key: smsConfigKey(branch), value }, { onConflict: 'key' });
    if (error) {
      console.error('[admin/sms/settings] upsert failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not save the SMS settings.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'sms_settings.update',
      entity: 'site_settings',
      detail: { branch, senderId: value.senderId },
      branch,
    });
    return NextResponse.json({ ok: true, config: await loadSmsConfigPublic(branch) });
  } catch (err) {
    console.error('[admin/sms/settings] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

/** Remove a branch's saved keys (sending falls back to head office / env). */
export async function DELETE(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const requested = new URL(request.url).searchParams.get('branch') ?? '';
  if (!BRANCH_VALUES.includes(requested)) return NextResponse.json({ ok: false, error: 'Unknown branch.' }, { status: 400 });
  const branch = await resolveBranch(requested);
  if (!branch) return NextResponse.json({ ok: false, error: 'You can only edit your own agency.' }, { status: 403 });

  try {
    const db = createAdminClient();
    const { error } = await db.from('site_settings').delete().eq('key', smsConfigKey(branch));
    if (error) {
      console.error('[admin/sms/settings] delete failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not remove the SMS settings.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'sms_settings.reset',
      entity: 'site_settings',
      detail: { branch },
      branch,
    });
    return NextResponse.json({ ok: true, config: await loadSmsConfigPublic(branch) });
  } catch (err) {
    console.error('[admin/sms/settings] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
