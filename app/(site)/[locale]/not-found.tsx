import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-900 px-6 text-center text-white">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(110%_110%_at_50%_0%,#0e7c5a_0%,#074a37_45%,#06402b_75%,#04261c_100%)]" />
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-brand-500/25 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-gold-500/15 blur-[120px]" />
      </div>

      <div className="max-w-lg">
        <LogoMark glow className="mx-auto h-16 w-16" />
        <p className="mt-8 font-display text-7xl font-semibold text-gradient-gold">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">This path lost its way</h1>
        <p className="mt-3 text-white/70">
          The page you are looking for may have moved or no longer exists. Let us guide you back.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gold-gradient px-7 font-semibold text-brand-900 shadow-gold transition hover:-translate-y-0.5"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-7 font-semibold text-white transition hover:bg-white/10"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
