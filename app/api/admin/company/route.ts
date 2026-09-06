import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { logActivity } from '@/lib/management/server';
import { BRANCHES } from '@/lib/management/branches';
import { companyProfileKey, defaultCompanyProfile } from '@/lib/company-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BRANCH_VALUES = BRANCHES.map((b) => b.value) as [string, ...string[]];

const schema = z.object({
  branch: z.enum(BRANCH_VALUES),
  profile: z.object({
    name: z.string().trim().min(2, 'Enter the company name.').max(120),
    license: z.string().trim().max(160).optional().default(''),
    headOffice: z.string().trim().max(300).optional().default(''),
    branchOffice: z.string().trim().max(300).optional().default(''),
    phone: z.string().trim().max(160).optional().default(''),
    email: z.string().trim().max(160).optional().default(''),
    logo: z.string().trim().max(600).optional().default(''),
  }),
});

/**
 * Which branch this user may edit: branch staff are locked to their own
 * agency; the head office may edit any concern's letterhead.
 */
async function resolveBranch(requested: string): Promise<string | null> {
  const scope = await getStaffScope();
  if (scope.branch) return scope.branch === requested ? requested : null;
  return requested;
}

/** Save (upsert) a branch's letterhead. */
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
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the company details.' },
      { status: 400 },
    );
  }

  const branch = await resolveBranch(parsed.data.branch);
  if (!branch) return NextResponse.json({ ok: false, error: 'You can only edit your own agency.' }, { status: 403 });

  const profile = { ...parsed.data.profile, logo: parsed.data.profile.logo || defaultCompanyProfile(branch).logo };
  if (profile.logo && !/^(\/|https?:\/\/)/.test(profile.logo)) {
    return NextResponse.json({ ok: false, error: 'The logo must be a URL or a /public path.' }, { status: 400 });
  }

  try {
    const db = createAdminClient();
    const { error } = await db
      .from('site_settings')
      .upsert({ key: companyProfileKey(branch), value: profile }, { onConflict: 'key' });
    if (error) {
      console.error('[admin/company] upsert failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not save the company profile.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'company_profile.update',
      entity: 'site_settings',
      detail: { branch, name: profile.name },
      branch,
    });
    return NextResponse.json({ ok: true, profile: { slug: branch, ...profile } });
  } catch (err) {
    console.error('[admin/company] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}

/** Remove the override so the branch falls back to its built-in letterhead. */
export async function DELETE(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const requested = new URL(request.url).searchParams.get('branch') ?? '';
  if (!BRANCH_VALUES.includes(requested)) return NextResponse.json({ ok: false, error: 'Unknown branch.' }, { status: 400 });
  const branch = await resolveBranch(requested);
  if (!branch) return NextResponse.json({ ok: false, error: 'You can only edit your own agency.' }, { status: 403 });

  try {
    const db = createAdminClient();
    const { error } = await db.from('site_settings').delete().eq('key', companyProfileKey(branch));
    if (error) {
      console.error('[admin/company] delete failed:', error.message);
      return NextResponse.json({ ok: false, error: 'Could not reset the company profile.' }, { status: 500 });
    }
    await logActivity({
      user_id: guard.user.id,
      user_email: guard.user.email,
      action: 'company_profile.reset',
      entity: 'site_settings',
      detail: { branch },
      branch,
    });
    return NextResponse.json({ ok: true, profile: defaultCompanyProfile(branch) });
  } catch (err) {
    console.error('[admin/company] unexpected error:', err);
    return NextResponse.json({ ok: false, error: 'Unexpected error.' }, { status: 500 });
  }
}
