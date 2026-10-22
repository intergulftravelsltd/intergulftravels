import Link from 'next/link';
import { PageHeader } from '@/components/manage/ui';
import { SmsSettingsForm } from '@/components/manage/sms/SmsSettingsForm';
import { getStaffScope } from '@/lib/management/scope';
import { loadSmsConfigPublic } from '@/lib/sms/config';
import { loadCompanyProfile } from '@/lib/management/company';
import { BRANCHES } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminsms';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaSettings };
}

/**
 * SMS Settings — the agency's khudebarta.com keys and sender id. Branch
 * staff edit their own agency; the head office switches concerns with tabs
 * (mirrors Company Profile).
 */
export default async function SmsSettingsPage({ searchParams }: { searchParams: { branch?: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const scope = await getStaffScope();

  const editable = scope.branch ? [scope.branch] : BRANCHES.map((b) => b.value as string);
  const requested = searchParams.branch && editable.includes(searchParams.branch) ? searchParams.branch : null;
  const selected = scope.branch ?? requested ?? 'general';
  const [config, company] = await Promise.all([loadSmsConfigPublic(selected), loadCompanyProfile(selected)]);

  return (
    <>
      <PageHeader title={t.settingsTitle} subtitle={t.settingsSubtitle} />

      {!scope.branch && (
        <div className="mb-5 flex flex-wrap gap-2">
          {BRANCHES.map((b) => (
            <Link
              key={b.value}
              href={localizedPath(locale, `/admin/sms/settings?branch=${b.value}`)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                selected === b.value
                  ? 'border-brand-600 bg-brand-600 text-white shadow-emerald'
                  : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
              )}
            >
              {b.value === 'general' ? t.headOfficeTab : b.label}
            </Link>
          ))}
        </div>
      )}

      <SmsSettingsForm key={selected} initial={config} companyName={company.name} />
    </>
  );
}
