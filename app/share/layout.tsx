import '@/app/globals.css';
import type { Metadata } from 'next';
import { RootShell } from '@/components/layout/RootShell';
import { getLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Root layout for the public share links (pilgrim form) — no site chrome. */
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale={getLocale()}>{children}</RootShell>;
}
