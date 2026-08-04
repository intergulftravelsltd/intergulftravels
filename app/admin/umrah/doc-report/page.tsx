import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { DocMatrixReport } from '@/components/manage/DocMatrixReport';
import { PrintPageButton } from '@/components/manage/PrintPageButton';
import { loadPassengers, loadUmrahPackages } from '@/lib/management/umrah';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'ডকুমেন্ট রিপোর্ট — উমরাহ' : 'Document Report — Umrah' };
}

/** Package-filtered checklist summary for umrah passengers (12 steps —
 *  the two Hajj-only registration steps are excluded). */
export default async function UmrahDocReportPage({
  searchParams,
}: {
  searchParams: { package?: string };
}) {
  const locale = getLocale();
  const [all, packages] = await Promise.all([loadPassengers(), loadUmrahPackages()]);

  let passengers = all.filter((p) => p.status !== 'cancelled');
  if (searchParams.package) passengers = passengers.filter((p) => p.package_id === searchParams.package);

  const pkgName = searchParams.package ? packages.find((p) => p.id === searchParams.package)?.name : null;
  const subtitleParts = [
    pkgName ? `${locale === 'bn' ? 'প্যাকেজ' : 'Package'}: ${pkgName}` : null,
    `${passengers.length} ${locale === 'bn' ? 'জন যাত্রী' : 'passengers'}`,
  ].filter(Boolean);

  return (
    <>
      <div className="no-print">
        <Link
          href={localizedPath(locale, '/admin/umrah')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> {locale === 'bn' ? 'যাত্রী তালিকায় ফিরুন' : 'Back to passengers'}
        </Link>
        <PageHeader
          title={locale === 'bn' ? 'ডকুমেন্ট চেকলিস্ট রিপোর্ট — উমরাহ' : 'Document Checklist Report — Umrah'}
          subtitle={subtitleParts.join(' · ')}
          actions={<PrintPageButton />}
        />
      </div>
      <DocMatrixReport
        program="umrah"
        locale={locale}
        people={passengers.map((p) => ({
          name: p.name,
          ref: [p.passport_no, p.phone].filter(Boolean).join(' · '),
          doc_status: p.doc_status,
        }))}
      />
    </>
  );
}
