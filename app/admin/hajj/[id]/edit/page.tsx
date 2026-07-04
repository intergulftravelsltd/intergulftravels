import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { PilgrimForm } from '@/components/manage/hajj/PilgrimForm';
import { mgmtDb } from '@/lib/management/server';
import { loadHajjPackages } from '@/lib/management/hajj';
import { loadActiveAffiliates, toAffiliateOptions } from '@/lib/management/affiliates';
import type { HajjPilgrim } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaEdit };
}

const CURRENT_YEAR = new Date().getFullYear();

export default async function EditPilgrimPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const db = mgmtDb();
  const { data: pilgrim } = await db
    .from('hajj_pilgrims')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!pilgrim) notFound();

  const [packages, affiliates] = await Promise.all([loadHajjPackages(), loadActiveAffiliates()]);
  const options = packages.map((p) => ({ id: p.id, name: p.name, price: p.price, year: p.year }));

  return (
    <>
      <Link
        href={localizedPath(locale, `/admin/hajj/${params.id}`)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t.backToProfile}
      </Link>
      <PageHeader title={t.editTitle} subtitle={(pilgrim as HajjPilgrim).name} />
      <PilgrimForm
        mode="edit"
        pilgrimId={params.id}
        initial={pilgrim as HajjPilgrim}
        packages={options}
        affiliates={toAffiliateOptions(affiliates)}
        defaultYear={CURRENT_YEAR + 1}
      />
    </>
  );
}
