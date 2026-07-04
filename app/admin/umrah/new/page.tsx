import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { PassengerForm } from '@/components/manage/umrah/PassengerForm';
import { loadUmrahPackages } from '@/lib/management/umrah';
import { loadActiveAffiliates, toAffiliateOptions } from '@/lib/management/affiliates';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Umrah Passenger' };

export default async function NewUmrahPassengerPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const [packages, affiliates] = await Promise.all([loadUmrahPackages(), loadActiveAffiliates()]);
  const active = packages.filter((p) => p.active);

  return (
    <>
      <Link
        href={localizedPath(locale, '/admin/umrah')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-brand-700"
      >
        <ChevronLeft className="h-4 w-4" /> {t.backToPassengers}
      </Link>
      <PageHeader
        title={t.newTitle}
        subtitle={t.newSubtitle}
      />
      <PassengerForm
        packages={active.map((p) => ({ id: p.id, name: p.name, price: p.price, year: p.year }))}
        affiliates={toAffiliateOptions(affiliates)}
      />
    </>
  );
}
