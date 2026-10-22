import { notFound } from 'next/navigation';
import { setRequestLocale, toLocale } from '@/lib/i18n-server';

/* ------------------------------------------------------------------ *
 *  Any public URL that matches no page. With several root layouts Next
 *  has no global not-found page, so this catch-all renders the branded
 *  404 (app/(site)/[locale]/not-found.tsx) inside the site layout — with
 *  a real 404 status, which is why it is not cached as a static page.
 * ------------------------------------------------------------------ */

export const dynamic = 'force-dynamic';

export default function CatchAllPage({ params }: { params: { locale: string; rest: string[] } }) {
  setRequestLocale(toLocale(params.locale));
  notFound();
}
