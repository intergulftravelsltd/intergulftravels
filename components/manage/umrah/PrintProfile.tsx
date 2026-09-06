'use client';

import { Printer } from 'lucide-react';
import { printTable } from '@/lib/export';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useCompanyProfile } from '@/components/providers/CompanyProfile';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';

type PaymentLine = { date: string; voucher: string; type: string; method: string; amount: string };

export function PrintProfile({
  name,
  subtitle,
  info,
  payments,
}: {
  name: string;
  subtitle: string;
  info: [string, string][];
  payments: PaymentLine[];
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const company = useCompanyProfile();

  function print() {
    const infoRows = info.map(([k, v]) => [k, v]);
    const rows = [
      ...infoRows,
      ['', ''],
      [t.printPaymentHistory, payments.length ? '' : t.printNoPayments],
      ...payments.map((p) => [`${p.date} · ${p.voucher}`, `${p.type} / ${p.method} — ৳ ${p.amount}`]),
    ];
    printTable({
      title: `${t.printUmrahPassenger} — ${name}`,
      subtitle,
      headers: [t.printFieldHeader, t.printDetailHeader],
      rows,
      company,
      locale,
    });
  }

  return (
    <button
      type="button"
      onClick={print}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
    >
      <Printer className="h-4 w-4" /> {t.printProfile}
    </button>
  );
}
