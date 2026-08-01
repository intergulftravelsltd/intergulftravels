import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * - Locale routing: English is the default (no prefix); Bangla lives under
 *   /bn. We strip the /bn prefix internally and pass the active locale to
 *   Server Components via the `x-locale` request header (the URL stays /bn/*).
 * - Legacy /en/* URLs (from the old bn-default scheme) 308-redirect to /*.
 * - Refreshes the Supabase auth session cookie on every request.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // English used to live under /en — keep old bookmarks and indexed links alive.
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === '/en' ? '/' : pathname.replace(/^\/en/, '');
    return NextResponse.redirect(redirectUrl, 308);
  }

  const isBn = pathname === '/bn' || pathname.startsWith('/bn/');
  const locale = isBn ? 'bn' : 'en';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  const rewriteUrl = request.nextUrl.clone();
  if (isBn) rewriteUrl.pathname = pathname === '/bn' ? '/' : pathname.replace(/^\/bn/, '');

  const build = () =>
    isBn
      ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  let response = build();

  // Session refresh needs a network round-trip to Supabase auth — only pay for
  // it when the visitor actually has an auth cookie. Anonymous traffic (all of
  // the public site, and everything PageSpeed/Lighthouse measures) skips it.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && hasAuthCookie) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = build();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
};
