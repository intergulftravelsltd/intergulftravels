import { Inter, Fraunces, Noto_Sans_Bengali } from 'next/font/google';

/* ------------------------------------------------------------------ *
 *  Site typefaces, loaded once and shared by every root layout (public
 *  site, admin, share page). next/font self-hosts them and exposes CSS
 *  variables; Tailwind's font stacks read those variables.
 * ------------------------------------------------------------------ */

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

// Bengali typeface — Noto Sans Bengali across the whole site: the Bangla
// version uses it for everything, and the English version falls back to it
// for any Bangla glyphs (names in Bangla, ৳) via the Tailwind font stacks.
export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
});

export const fontClassName = `${inter.variable} ${fraunces.variable} ${notoSansBengali.variable}`;
