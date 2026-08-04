'use client';

import { Printer } from 'lucide-react';
import { useLocale } from '@/components/providers/LocaleProvider';

/** Simple "print this page" button for report pages (window.print). */
export function PrintPageButton() {
  const locale = useLocale();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      <Printer className="h-4 w-4" /> {locale === 'bn' ? 'প্রিন্ট / PDF সেভ' : 'Print / Save PDF'}
    </button>
  );
}
