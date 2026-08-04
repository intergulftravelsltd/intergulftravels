import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { DocMatrixReport } from '@/components/manage/DocMatrixReport';
import { PrintPageButton } from '@/components/manage/PrintPageButton';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadHajjPackages } from '@/lib/management/hajj';
import type { HajjPilgrim } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'ডকুমেন্ট রিপোর্ট — হজ' : 'Document Report — Hajj' };
}

/** Package/year-filtered 14-step checklist summary for hajj pilgrims. */
export default async function HajjDocReportPage({
  searchParams,
}: {
  searchParams: { year?: string; package?: string };
}) {
  const locale = getLocale();
  const scope = await getStaffScope();

  let q = mgmtDb()
    .from('hajj_pilgrims')
    .select('id, name, tracking_no, phone, year, package_id, doc_status, status, branch');
  if (scope.branch) q = q.eq('branch', scope.branch);
  const { data } = await q.order('created_at', { ascending: false });
  let pilgrims = ((data ?? []) as HajjPilgrim[]).filter((p) => p.status !== 'cancelled');

  const year = searchParams.year ? Number(searchParams.year) : null;
  if (year) pilgrims = pilgrims.filter((p) => p.year === year);
  if (searchParams.package) pilgrims = pilgrims.filter((p) => p.package_id === searchParams.package);

  const packages = await loadHajjPackages();
  const pkgName = searchParams.package ? packages.find((p) => p.id === searchParams.package)?.name : null;

  const subtitleParts = [
    year ? `${locale === 'bn' ? 'সাল' : 'Year'}: ${year}` : null,
    pkgName ? `${locale === 'bn' ? 'প্যাকেজ' : 'Package'}: ${pkgName}` : null,
    `${pilgrims.length} ${locale === 'bn' ? 'জন হাজী' : 'pilgrims'}`,
  ].filter(Boolean);

  return (
    <>
      <div className="no-print">
        <Link
          href={localizedPath(locale, '/admin/hajj')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> {locale === 'bn' ? 'হাজী তালিকায় ফিরুন' : 'Back to pilgrims'}
        </Link>
        <PageHeader
          title={locale === 'bn' ? 'ডকুমেন্ট চেকলিস্ট রিপোর্ট — হজ' : 'Document Checklist Report — Hajj'}
          subtitle={subtitleParts.join(' · ')}
          actions={<PrintPageButton />}
        />
      </div>
      <DocMatrixReport
        program="hajj"
        locale={locale}
        people={pilgrims.map((p) => ({
          name: p.name,
          ref: [p.tracking_no, p.phone].filter(Boolean).join(' · '),
          doc_status: p.doc_status,
        }))}
      />
    </>
  );
}
