import { cache } from 'react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Fetch with an abort timeout. Without this, a slow/unreachable Supabase
 * (e.g. during a build with restricted network) would hang every static page
 * render forever. On timeout the query rejects → our try/catch falls back.
 */
const FETCH_TIMEOUT_MS = 8000;
function timeoutFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input as any, { ...init, signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * SSR Supabase client (reads/writes auth cookies). Use inside Server
 * Components, Route Handlers and Server Actions.
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-placeholder';

  return createServerClient(url, key, {
    global: { fetch: timeoutFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // called from a Server Component — safe to ignore, middleware refreshes the session
        }
      },
    },
  });
}

/**
 * Request-deduped validated auth lookup. The admin layout, requireStaff() and
 * getStaffScope() all need the current user; without cache() each caller pays
 * its own network round-trip to Supabase auth on every render.
 */
export const getAuthUser = cache(async () => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});

export type ProfileLite = { full_name: string | null; avatar_url: string | null; role: string | null };

/** Request-deduped profile fetch — name, avatar and role come back in one query. */
export const getProfileLite = cache(async (userId: string): Promise<ProfileLite | null> => {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', userId)
      .maybeSingle();
    return (data as ProfileLite) ?? null;
  } catch {
    return null;
  }
});

/**
 * Service-role client for trusted server-side work (image upload, webhooks,
 * admin writes that bypass RLS). NEVER import this into a client component.
 *
 * Held as a module-level singleton: it carries no per-request state (no
 * cookies), and hot pages used to construct ~10 fresh clients per render.
 */
let adminClient: any = null;

export function createAdminClient() {
  if (adminClient) return adminClient;
  const { createClient: createSb } = require('@supabase/supabase-js');
  adminClient = createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-placeholder',
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: timeoutFetch },
    },
  );
  return adminClient;
}
