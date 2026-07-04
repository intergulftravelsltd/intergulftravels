import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { PilgrimForm } from '@/components/manage/hajj/PilgrimForm';
import { loadHajjPackages } from '@/lib/management/hajj';
import { loadActiveAffiliates, toAffiliateOptions } from '@/lib/management/affiliates';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaNew };
}

const CURRENT_YEAR = new Date().getFullYear();

export default async function NewPilgrimPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const [packages, affiliates] = await Promise.all([loadHajjPackages(), loadActiveAffiliates()]);
  const options = packages
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, year: p.year }));

  return (
    <>
      <Link
        href={localizedPath(locale, '/admin/hajj')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t.backToPilgrims}
      </Link>
      <PageHeader
        title={t.newTitle}
        subtitle={t.newSubtitle}
      />
      <PilgrimForm packages={options} affiliates={toAffiliateOptions(affiliates)} defaultYear={CURRENT_YEAR + 1} />
    </>
  );
}
