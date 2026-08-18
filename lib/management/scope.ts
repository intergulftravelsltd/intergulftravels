import { cache } from 'react';
import { getAuthUser, getProfileLite } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

/**
 * Branch-scoped staff. These emails can only ever see and touch their own
 * branch's data; everyone else (the super admin) sees everything.
 */
const BRANCH_BY_EMAIL: Record<string, string> = {
  'mokbuloverseas@gmail.com': 'mokbul-hajj-overseas',
  'intergulfairtravels2016@gmail.com': 'inter-gulf-air-travels',
  'intergulfg47@gmail.com': 'inter-gulf-travels',
};

export type StaffScope = { isAdmin: boolean; branch: string | null; email: string | null };

/**
 * Resolve the current user's access scope. `branch === null` means "see
 * everything" (administrators / head office). Wrapped in React `cache()` so the
 * many loaders that call it during one request share a single auth round-trip
 * instead of hitting Supabase auth once per loader.
 */
export const getStaffScope = cache(async function getStaffScope(): Promise<StaffScope> {
  try {
    const user = await getAuthUser();
    if (!user) return { isAdmin: false, branch: null, email: null };

    const email = (user.email ?? '').toLowerCase();

    // Branch lock resolves off the stable auth user_metadata first (so a branch
    // admin can safely change their sign-in email), then the built-in email map.
    // Branch admins keep the full toolset (Website, System, Vault, Staff…) while
    // their Hajj/Umrah/accounts stay isolated.
    const metaBranch = (user.user_metadata as { branch?: unknown } | null)?.branch;
    const branch =
      (typeof metaBranch === 'string' && metaBranch ? metaBranch : null) ?? BRANCH_BY_EMAIL[email] ?? null;

    let isAdmin = isAdminEmail(email);
    if (!isAdmin) {
      const profile = await getProfileLite(user.id);
      if (profile?.role === 'admin') isAdmin = true;
    }
    return { isAdmin, branch, email };
  } catch {
    return { isAdmin: false, branch: null, email: null };
  }
});

/** The branch a new record/voucher must be tagged with: forced for branch staff. */
export async function enforceBranch(requested?: string | null): Promise<string> {
  const scope = await getStaffScope();
  if (scope.branch) return scope.branch;
  return requested || 'general';
}
