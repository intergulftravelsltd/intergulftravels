import Link from 'next/link';
import { Users, UserCheck, HandCoins, CalendarClock, Plus, Plane, Printer, Share2 } from 'lucide-react';
import {
  PageHeader,
  StatCard,
  Money,
  Badge,
  EmptyState,
  TableWrap,
  thClass,
  tdClass,
} from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { RecordRowActions } from '@/components/manage/RecordRowActions';
import { DocStatusViewer } from '@/components/manage/DocStatusViewer';
import { sharePath } from '@/lib/management/share-token';
import { Button } from '@/components/ui/Button';
import { PassengerFilters } from '@/components/manage/umrah/PassengerFilters';
import { loadPassengers, loadUmrahPackages, isExpiringSoon, monthsUntil, type PassengerRow } from '@/lib/management/umrah';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { docStatusDone, DOC_STATUS_TOTAL } from '@/lib/management/doc-status';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Umrah Passengers' };

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function applyFilters(rows: PassengerRow[], sp: Record<string, string | undefined>): PassengerRow[] {
  let out = rows;
  const q = sp.q?.trim().toLowerCase();
  if (q) {
    out = out.filter((r) =>
      [r.name, r.name_bn, r.passport_no, r.phone].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  if (sp.package === 'unassigned') out = out.filter((r) => !r.package_id);
  else if (sp.package) out = out.filter((r) => r.package_id === sp.package);
  if (sp.branch) out = out.filter((r) => r.branch === sp.branch);
  if (sp.status) out = out.filter((r) => r.status === sp.status);
  if (sp.expiring === '1') out = out.filter((r) => isExpiringSoon(r.passport_expiry));
  if (sp.docs === 'complete') out = out.filter((r) => docStatusDone(r.doc_status) === DOC_STATUS_TOTAL);
  else if (sp.docs === 'incomplete') out = out.filter((r) => docStatusDone(r.doc_status) < DOC_STATUS_TOTAL);
  if (sp.care_of === 'none') out = out.filter((r) => !r.affiliate_id);
  else if (sp.care_of) out = out.filter((r) => r.affiliate_id === sp.care_of);
  return out;
}

export default async function UmrahPassengersPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const locale = getLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const [all, packages, affiliates] = await Promise.all([
    loadPassengers(),
    loadUmrahPackages(),
    loadActiveAffiliates(),
  ]);
  const affMap = new Map(affiliates.map((a) => [a.id, a]));
  const rows = applyFilters(all, searchParams);

  const statusLabel = (s: string) =>
    s === 'cancelled' ? t.statusCancelled : s === 'completed' ? t.statusCompleted : t.statusActive;

  // Stats are computed across the full (unfiltered) set.
  const total = all.length;
  const assigned = all.filter((r) => r.package_id).length;
  const unassigned = total - assigned;
  const totalDue = all.reduce((s, r) => s + r.due, 0);
  const expiringSoon = all.filter((r) => isExpiringSoon(r.passport_expiry) && r.status === 'active').length;

  const exportRows = rows.map((r) => [
    r.name,
    r.passport_no ?? '',
    fmtDate(r.passport_expiry),
    r.phone ?? '',
    r.package_name ?? t.unassigned,
    money(r.paid, false),
    money(r.due, false),
  ]);

  return (
    <>
      <PageHeader
        title={t.passengersTitle}
        subtitle={t.passengersSubtitle}
        actions={
          <>
            <ExportBar
              filename="umrah-passengers"
              title={t.passengersTitle}
              subtitle={`${rows.length} ${rows.length === 1 ? t.recordSingular : t.recordPlural}`}
              headers={[t.exName, t.exPassport, t.exExpiry, t.exPhone, t.exPackage, t.exPaid, t.exDue]}
              rows={exportRows}
              orientation="l"
            />
            <Button href={localizedPath(locale, '/admin/group-payment?type=umrah')} variant="outline">
              <HandCoins className="h-4 w-4" /> {locale === 'bn' ? 'গ্রুপ পেমেন্ট' : 'Group payment'}
            </Button>
            <Button href={localizedPath(locale, '/admin/umrah/new')}>
              <Plus className="h-4 w-4" /> {t.newPassenger}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.statTotalPassengers} value={total} icon={Users} />
        <StatCard
          label={t.statAssigned}
          value={assigned}
          hint={t.statUnassignedHint.replace('{count}', String(unassigned))}
          icon={UserCheck}
          accent="gold"
        />
        <StatCard label={t.statTotalDue} value={<Money value={totalDue} />} icon={HandCoins} accent="red" />
        <StatCard
          label={t.statPassportsExpiring}
          value={expiringSoon}
          hint={t.statWithinSixMonths}
          icon={CalendarClock}
          accent="slate"
        />
      </div>

      <PassengerFilters
        packages={packages.map((p) => ({ id: p.id, name: p.name }))}
        careOfs={affiliates.map((a) => ({ id: a.id, name: a.name, code: a.code }))}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={total === 0 ? t.emptyNoPassengers : t.emptyNoMatch}
          hint={total === 0 ? t.emptyNoPassengersHint : t.emptyNoMatchHint}
          action={
            total === 0 ? (
              <Button href={localizedPath(locale, '/admin/umrah/new')}>
                <Plus className="h-4 w-4" /> {t.newPassenger}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thPassenger}</th>
              <th className={thClass}>{t.thPassport}</th>
              <th className={thClass}>{t.thExpiry}</th>
              <th className={thClass}>{t.thPhone}</th>
              <th className={thClass}>{t.thPackage}</th>
              <th className={`${thClass} text-right`}>{t.thPaid}</th>
              <th className={`${thClass} text-right`}>{t.thDue}</th>
              <th className={thClass}>{ct.thDocs}</th>
              <th className={thClass}>{t.thBranch}</th>
              <th className={`${thClass} text-right`}>{t.thManage}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const months = monthsUntil(r.passport_expiry);
              const expiring = isExpiringSoon(r.passport_expiry);
              const expired = months !== null && months < 0;
              const done = docStatusDone(r.doc_status);
              const careOf = r.affiliate_id ? affMap.get(r.affiliate_id) : undefined;
              return (
                <tr key={r.id} className="transition hover:bg-muted/40">
                  <td className={tdClass}>
                    <Link href={localizedPath(locale, `/admin/umrah/${r.id}`)} className="font-semibold text-ink hover:text-brand-700">
                      {r.name}
                    </Link>
                    {r.name_bn && <p className="text-xs text-ink-muted">{r.name_bn}</p>}
                    {(r.phone || r.address) && (
                      <p className="text-xs text-ink-muted">{[r.phone, r.address].filter(Boolean).join(' · ')}</p>
                    )}
                    {careOf && (
                      <p className="text-xs font-medium text-brand-700">{ct.careOf}: {careOf.name}</p>
                    )}
                    {r.status !== 'active' && (
                      <span className="mt-1 inline-block">
                        <Badge tone={r.status === 'cancelled' ? 'red' : 'emerald'}>{statusLabel(r.status)}</Badge>
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{r.passport_no ?? '—'}</td>
                  <td className={tdClass}>
                    {r.passport_expiry ? (
                      <span className={expired ? 'font-semibold text-red-600' : expiring ? 'font-semibold text-amber-600' : ''}>
                        {fmtDate(r.passport_expiry)}
                        {expired && <span className="ml-1 text-xs">({t.expired})</span>}
                        {!expired && expiring && months !== null && (
                          <span className="ml-1 text-xs">({months}{t.monthsSuffix})</span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{r.phone ?? '—'}</td>
                  <td className={tdClass}>
                    {r.package_name ? (
                      r.package_name
                    ) : (
                      <span className="text-ink-muted">{t.unassigned}</span>
                    )}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <Money value={r.paid} />
                  </td>
                  <td className={`${tdClass} text-right`}>
                    {r.due > 0 ? <Money value={r.due} className="font-semibold text-red-600" /> : <Money value={0} />}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={done === DOC_STATUS_TOTAL ? 'emerald' : done === 0 ? 'slate' : 'gold'}>
                      {done}/{DOC_STATUS_TOTAL}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <Badge>{branchShort(r.branch)}</Badge>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={localizedPath(locale, `/admin/receipt/passenger/umrah/${r.id}`)}
                        target="_blank"
                        rel="noopener"
                        title={locale === 'bn' ? 'রসিদ প্রিন্ট' : 'Print receipt'}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={sharePath('umrah', r.id)}
                        target="_blank"
                        rel="noopener"
                        title={locale === 'bn' ? 'শেয়ারযোগ্য ফরম লিংক' : 'Shareable form link'}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </a>
                      <DocStatusViewer name={r.name} subtitle={r.passport_no ?? undefined} value={r.doc_status} />
                      <RecordRowActions
                        editHref={localizedPath(locale, `/admin/umrah/${r.id}/edit`)}
                        deleteEndpoint={`/api/admin/umrah/${r.id}`}
                        name={r.name}
                        confirmMessage={t.confirmDelete.replace('{name}', r.name)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      {total === 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Plane className="h-3.5 w-3.5" /> {t.footerNote}
        </p>
      )}
    </>
  );
}
