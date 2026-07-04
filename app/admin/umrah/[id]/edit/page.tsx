import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { PassengerForm } from '@/components/manage/umrah/PassengerForm';
import { mgmtDb } from '@/lib/management/server';
import { loadUmrahPackages } from '@/lib/management/umrah';
import { loadActiveAffiliates, toAffiliateOptions } from '@/lib/management/affiliates';
import type { UmrahPassenger } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Passenger' };

export default async function EditPassengerPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const db = mgmtDb();
  const { data: passenger } = await db
    .from('umrah_passengers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!passenger) notFound();

  const [packages, affiliates] = await Promise.all([loadUmrahPackages(), loadActiveAffiliates()]);

  return (
    <>
      <Link
        href={localizedPath(locale, `/admin/umrah/${params.id}`)}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-brand-700"
      >
        <ChevronLeft className="h-4 w-4" /> {t.backToProfile}
      </Link>
      <PageHeader title={t.editTitle} subtitle={(passenger as UmrahPassenger).name} />
      <PassengerForm
        mode="edit"
        passengerId={params.id}
        initial={passenger as UmrahPassenger}
        packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price, year: p.year }))}
        affiliates={toAffiliateOptions(affiliates)}
      />
    </>
  );
}
