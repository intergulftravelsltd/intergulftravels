import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * - Locale routing: English is the default (no prefix); Bangla lives under
 *   /bn. The public site is built as app/(site)/[locale]/… and statically
 *   generated for both languages, so:
 *     /hajj      → rewritten to /en/hajj   (URL stays /hajj)
 *     /bn/hajj   → served as-is            ([locale] = bn)
 *   Admin and share pages have no [locale] segment: /bn/admin/… is
 *   rewritten to /admin/… and the active locale travels in the `x-locale`
 *   request header (those pages are dynamic anyway).
 * - Legacy /en/* URLs (from the old bn-default scheme) 308-redirect to /*.
 * - Refreshes the Supabase auth session cookie when an auth cookie exists.
 */

/** Paths that live outside the [locale] site tree. */
const NON_SITE = /^\/(admin|share|api|auth)(\/|$)/;
/** Metadata / asset routes that must never be rewritten. */
const PASSTHROUGH = /^\/(_next|feed\.xml|sitemap\.xml|robots\.txt|manifest\.webmanifest|favicon|icon|apple-icon|og\.png)/;

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
  const unprefixed = isBn ? (pathname === '/bn' ? '/' : pathname.replace(/^\/bn/, '')) : pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  const rewriteUrl = request.nextUrl.clone();
  let rewrite = false;
  if (PASSTHROUGH.test(unprefixed)) {
    // assets + metadata routes: untouched
  } else if (NON_SITE.test(unprefixed)) {
    // /bn/admin/x → /admin/x (locale via header); /admin/x unchanged
    if (isBn) {
      rewriteUrl.pathname = unprefixed;
      rewrite = true;
    }
  } else if (!isBn) {
    // public site, English: /x → /en/x so the [locale] segment resolves
    rewriteUrl.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
    rewrite = true;
  }

  const build = () =>
    rewrite
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
