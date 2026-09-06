import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';
import { getStaffScope } from '@/lib/management/scope';
import {
  companyProfileKey,
  defaultCompanyProfile,
  mergeCompanyProfile,
  type CompanyProfile,
} from '@/lib/company-profile';

/**
 * The letterhead for a branch: static defaults overlaid with whatever the
 * branch admin saved under Company Profile. Request-cached so the layout, the
 * receipts and every export header share one lookup.
 */
export const loadCompanyProfile = cache(async function loadCompanyProfile(
  branch?: string | null,
): Promise<CompanyProfile> {
  const base = defaultCompanyProfile(branch);
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('site_settings')
      .select('value')
      .eq('key', companyProfileKey(base.slug))
      .maybeSingle();
    if (data?.value) return mergeCompanyProfile(base, data.value);
  } catch {
    // site_settings unavailable — the static letterhead still prints
  }
  return base;
});

/** The signed-in user's own company (branch staff) or the group head office. */
export async function loadScopedCompanyProfile(): Promise<CompanyProfile> {
  const scope = await getStaffScope();
  return loadCompanyProfile(scope.branch);
}
