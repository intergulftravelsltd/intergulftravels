import Link from 'next/link';
import { PageHeader } from '@/components/manage/ui';
import { CompanyProfileForm } from '@/components/manage/CompanyProfileForm';
import { getStaffScope } from '@/lib/management/scope';
import { loadCompanyProfile } from '@/lib/management/company';
import { BRANCHES } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'কোম্পানি প্রোফাইল' : 'Company Profile' };
}

/**
 * Company Profile — the letterhead of the signed-in agency. Branch staff see
 * and edit only their own concern; the head office can switch between the
 * group's concerns with the tabs.
 */
export default async function CompanyProfilePage({ searchParams }: { searchParams: { branch?: string } }) {
  const locale = getLocale();
  const scope = await getStaffScope();

  const editable = scope.branch ? [scope.branch] : BRANCHES.map((b) => b.value as string);
  const requested = searchParams.branch && editable.includes(searchParams.branch) ? searchParams.branch : null;
  const selected = scope.branch ?? requested ?? 'general';
  const profile = await loadCompanyProfile(selected);

  const title = locale === 'bn' ? 'কোম্পানি প্রোফাইল' : 'Company Profile';
  const subtitle =
    locale === 'bn'
      ? 'লেজার, বিবরণী, রসিদ ও সব এক্সপোর্টে যে নাম, ঠিকানা, ফোন, ইমেইল ও লোগো প্রিন্ট হয়।'
      : 'The name, offices, phone, email and logo printed on every ledger, statement, receipt and export.';

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      {!scope.branch && (
        <div className="mb-5 flex flex-wrap gap-2">
          {BRANCHES.map((b) => (
            <Link
              key={b.value}
              href={localizedPath(locale, `/admin/company?branch=${b.value}`)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                selected === b.value
                  ? 'border-brand-600 bg-brand-600 text-white shadow-emerald'
                  : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
              )}
            >
              {b.value === 'general' ? (locale === 'bn' ? 'প্রধান কার্যালয় / গ্রুপ' : 'Head office / Group') : b.label}
            </Link>
          ))}
        </div>
      )}

      {/* key forces a fresh form when the head office switches concern */}
      <CompanyProfileForm key={selected} branch={selected} initial={profile} />
    </>
  );
}
