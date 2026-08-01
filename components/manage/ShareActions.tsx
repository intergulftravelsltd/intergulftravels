'use client';

import { useState } from 'react';
import { Printer, Link2, Check } from 'lucide-react';
import { useLocale } from '@/components/providers/LocaleProvider';

const L = {
  en: { print: 'Download / Print PDF', copy: 'Copy link', copied: 'Link copied' },
  bn: { print: 'ডাউনলোড / প্রিন্ট PDF', copy: 'লিংক কপি করুন', copied: 'লিংক কপি হয়েছে' },
};

/** Print + copy-link bar for the public shareable pilgrim form. */
export function ShareActions() {
  const t = L[useLocale()];
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (http / old browser) — select-all fallback.
      window.prompt(t.copy, window.location.href);
    }
  }

  return (
    <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
        {copied ? t.copied : t.copy}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        <Printer className="h-4 w-4" /> {t.print}
      </button>
    </div>
  );
}
