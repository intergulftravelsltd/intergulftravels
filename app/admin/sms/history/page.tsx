import Link from 'next/link';
import { CheckCircle2, XCircle, CalendarDays, MessageSquareText } from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState, TableWrap, thClass, tdClass, inputClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { formatBdPhone } from '@/lib/sms/phone';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminsms';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaHistory };
}

type SmsLogRow = {
  id: string;
  created_at: string;
  branch: string | null;
  sent_by: string | null;
  campaign_id: string | null;
  recipient_kind: string;
  recipient_id: string | null;
  recipient_name: string | null;
  phone: string;
  message: string;
  parts: number;
  status: 'sent' | 'failed';
  provider_message_id: string | null;
  provider_status: string | null;
  error: string | null;
};

async function loadLog(): Promise<{ rows: SmsLogRow[]; available: boolean }> {
  try {
    const scope = await getStaffScope();
    let q = mgmtDb().from('sms_log').select('*').order('created_at', { ascending: false }).limit(1000);
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q;
    if (error) return { rows: [], available: false };
    return { rows: (data ?? []) as SmsLogRow[], available: true };
  } catch {
    return { rows: [], available: false };
  }
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default async function SmsHistoryPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string; per?: string };
}) {
  const locale = getLocale();
  const t = getDict(locale);
  const { rows: all, available } = await loadLog();

  const q = (searchParams.q ?? '').trim().toLowerCase();
  const status = searchParams.status === 'sent' || searchParams.status === 'failed' ? searchParams.status : '';
  const rows = all.filter((r) => {
    if (status && r.status !== status) return false;
    if (q) {
      const hay = `${r.recipient_name ?? ''} ${r.phone} ${formatBdPhone(r.phone)} ${r.message} ${r.sent_by ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const paged = paginate(rows, parsePaging(searchParams));

  const today = new Date().toDateString();
  const sent = all.filter((r) => r.status === 'sent').length;
  const failed = all.length - sent;
  const todayCount = all.filter((r) => new Date(r.created_at).toDateString() === today).length;
  const parts = all.filter((r) => r.status === 'sent').reduce((s, r) => s + (Number(r.parts) || 1), 0);

  const kindLabel = (k: string) =>
    k === 'umrah' ? t.kindUmrah : k === 'hajj' ? t.kindHajj : k === 'careof' ? t.kindCareOf : t.kindCustom;
  const profileHref = (r: SmsLogRow) =>
    r.recipient_id && (r.recipient_kind === 'umrah' || r.recipient_kind === 'hajj')
      ? localizedPath(locale, `/admin/${r.recipient_kind}/${r.recipient_id}`)
      : r.recipient_id && r.recipient_kind === 'careof'
        ? localizedPath(locale, `/admin/care-of/${r.recipient_id}`)
        : null;

  const exportRows = rows.map((r) => [
    fmt(r.created_at),
    r.recipient_name ?? '',
    kindLabel(r.recipient_kind),
    formatBdPhone(r.phone),
    r.message,
    r.status === 'sent' ? t.resultSentLabel : t.resultFailedLabel,
    r.error ?? '',
    r.sent_by ?? '',
  ]);

  const filterLink = (value: string, label: string) => (
    <Link
      href={localizedPath(locale, `/admin/sms/history${value || q ? `?${new URLSearchParams({ ...(value ? { status: value } : {}), ...(q ? { q } : {}) })}` : ''}`)}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition',
        status === value
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title={t.historyTitle}
        subtitle={t.historySubtitle}
        actions={
          rows.length > 0 ? (
            <ExportBar
              filename="sms-history"
              title={t.exportTitle}
              subtitle={`${rows.length} SMS`}
              headers={[t.thDate, t.thRecipient, 'Type', t.thPhone, t.thMessage, t.thStatus, 'Error', t.thBy]}
              rows={exportRows}
              orientation="l"
            />
          ) : undefined
        }
      />

      {!available && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{t.migrationHint}</div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.statSent} value={sent} icon={CheckCircle2} accent="emerald" />
        <StatCard label={t.statFailed} value={failed} icon={XCircle} accent={failed ? 'red' : 'slate'} />
        <StatCard label={t.statToday} value={todayCount} icon={CalendarDays} accent="gold" />
        <StatCard label={t.statParts} value={parts} icon={MessageSquareText} accent="blue" />
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2" action={localizedPath(locale, '/admin/sms/history')}>
        {filterLink('', t.filterAll)}
        {filterLink('sent', t.filterSent)}
        {filterLink('failed', t.filterFailed)}
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder={t.searchHistory} className={cn(inputClass, 'ml-auto h-9 w-full py-1.5 sm:w-72')} />
      </form>

      {rows.length === 0 ? (
        <EmptyState title={t.historyEmpty} hint={t.historyEmptyHint} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thDate}</th>
              <th className={thClass}>{t.thRecipient}</th>
              <th className={thClass}>{t.thPhone}</th>
              <th className={thClass}>{t.thMessage}</th>
              <th className={thClass}>{t.thStatus}</th>
              <th className={thClass}>{t.thBy}</th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((r) => {
              const href = profileHref(r);
              return (
                <tr key={r.id} className="transition hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap text-xs text-ink-muted`}>{fmt(r.created_at)}</td>
                  <td className={tdClass}>
                    {href ? (
                      <Link href={href} className="font-semibold text-ink hover:text-brand-700">
                        {r.recipient_name || '—'}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{r.recipient_name || '—'}</span>
                    )}
                    <span className="block text-xs text-ink-muted">{kindLabel(r.recipient_kind)}</span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatBdPhone(r.phone)}</td>
                  <td className={`${tdClass} max-w-[26rem]`}>
                    <p className="line-clamp-2 whitespace-pre-line text-sm" title={r.message}>
                      {r.message}
                    </p>
                    {r.error && <p className="mt-0.5 text-xs text-red-600">{r.error}</p>}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={r.status === 'sent' ? 'emerald' : 'red'}>
                      {r.status === 'sent' ? t.resultSentLabel : t.resultFailedLabel}
                    </Badge>
                    {r.parts > 1 && <span className="ml-1.5 text-xs text-ink-muted">×{r.parts}</span>}
                  </td>
                  <td className={`${tdClass} max-w-[12rem] truncate text-xs text-ink-muted`} title={r.sent_by ?? ''}>
                    {r.sent_by ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pagination paged={paged} />
    </>
  );
}
