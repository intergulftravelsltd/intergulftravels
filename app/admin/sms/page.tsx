import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { SmsComposer } from '@/components/manage/sms/SmsComposer';
import { loadSmsDirectory } from '@/lib/sms/recipients';
import { loadSmsConfig } from '@/lib/sms/config';
import { getStaffScope } from '@/lib/management/scope';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminsms';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaSend };
}

/**
 * Send SMS — pick one passenger, everyone, chosen or all care-of / group
 * leaders, or type numbers; one message with {name}/{due}/… merge fields.
 * `?to=umrah:<id>,hajj:<id>` pre-ticks recipients (the row menu links here).
 */
export default async function SendSmsPage({ searchParams }: { searchParams: { to?: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const scope = await getStaffScope();
  const [directory, { config }] = await Promise.all([loadSmsDirectory(), loadSmsConfig(scope.branch)]);
  const initialSelected = (searchParams.to ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^(umrah|hajj|careof):[0-9a-f-]{36}$/i.test(s));

  return (
    <>
      <PageHeader title={t.sendTitle} subtitle={t.sendSubtitle} />

      {!config && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">{t.notConfiguredTitle}</p>
              <p className="text-sm">{t.notConfiguredBody}</p>
            </div>
          </div>
          <Button href={localizedPath(locale, '/admin/sms/settings')} size="sm" variant="outline">
            {t.openSettings}
          </Button>
        </div>
      )}

      <SmsComposer
        directory={directory}
        initialSelected={initialSelected}
        senderId={config?.senderId ?? ''}
        configured={!!config}
        historyHref={localizedPath(locale, '/admin/sms/history')}
      />
    </>
  );
}
