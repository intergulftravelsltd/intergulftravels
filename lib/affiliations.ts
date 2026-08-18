import { unstable_cache } from 'next/cache';

export type Affiliation = {
  id: string;
  category: 'flight' | 'hotel';
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  active: boolean;
};

/** Shown until the DB is configured — names only (admin uploads real logos later). */
export const FALLBACK_AFFILIATIONS: Affiliation[] = [
  ['flight', 'Biman Bangladesh Airlines'],
  ['flight', 'Saudia'],
  ['flight', 'Emirates'],
  ['flight', 'Qatar Airways'],
  ['flight', 'US-Bangla Airlines'],
  ['flight', 'SalamAir'],
  ['flight', 'Jazeera Airways'],
  ['flight', 'Kuwait Airways'],
  ['flight', 'Air Arabia'],
  ['hotel', 'Hilton Suites Makkah'],
  ['hotel', 'InterContinental Dar Al Tawhid Makkah'],
  ['hotel', 'Hyatt Regency Makkah'],
  ['hotel', 'Shaza Makkah'],
  ['hotel', 'Conrad Makkah'],
  ['hotel', 'Raffles Makkah Palace'],
].map(([category, name], i) => ({
  id: `fallback-${i}`,
  category: category as 'flight' | 'hotel',
  name,
  logo_url: null,
  website_url: null,
  sort_order: i,
  active: true,
}));

/** Home-page partner logos (cookieless + cached — was a live per-request query). */
const load = async (): Promise<Affiliation[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return FALLBACK_AFFILIATIONS;
  }
  try {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const db = createAdminClient();
    const { data } = await db
      .from('affiliations')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    return data && data.length ? (data as Affiliation[]) : FALLBACK_AFFILIATIONS;
  } catch {
    return FALLBACK_AFFILIATIONS;
  }
};

export const getAffiliations = unstable_cache(load, ['affiliations-v1'], {
  revalidate: 120,
  tags: ['affiliations'],
});
