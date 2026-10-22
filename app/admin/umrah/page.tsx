import Link from 'next/link';
import { Users, UserCheck, HandCoins, CalendarClock, Plus, Plane } from 'lucide-react';
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
import { ExportMenu } from '@/components/manage/ExportMenu';
import { RowMenu } from '@/components/manage/RowMenu';
import { sharePath } from '@/lib/management/share-token';
import type { Cell } from '@/lib/export-cells';
import { Button } from '@/components/ui/Button';
import { PassengerFilters, type UmrahSort } from '@/components/manage/umrah/PassengerFilters';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { loadPassengers, loadUmrahPackages, isExpiringSoon, monthsUntil, type PassengerRow } from '@/lib/management/umrah';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { docStatusDoneFor, docStatusTotalFor } from '@/lib/management/doc-status';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import { isGroupFund } from '@/lib/management/types';
import { orderByGroup } from '@/lib/management/group-order';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { getDict as getShellDict } from '@/lib/dictionaries/areas/adminshell';

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
  if (sp.docs === 'complete')
    out = out.filter((r) => docStatusDoneFor(r.doc_status, 'umrah') === docStatusTotalFor('umrah'));
  else if (sp.docs === 'incomplete')
    out = out.filter((r) => docStatusDoneFor(r.doc_status, 'umrah') < docStatusTotalFor('umrah'));
  if (sp.care_of === 'none') out = out.filter((r) => !r.affiliate_id);
  else if (sp.care_of) out = out.filter((r) => r.affiliate_id === sp.care_of);
  if (sp.gender) out = out.filter((r) => (r.gender ?? '').toLowerCase() === sp.gender);
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
  const st = getShellDict(locale).rowActions;
  const [all, packages, affiliates] = await Promise.all([
    loadPassengers(),
    loadUmrahPackages(),
    loadActiveAffiliates('umrah'),
  ]);
  const affMap = new Map(affiliates.map((a) => [a.id, a]));
  const filteredRows = applyFilters(all, searchParams);
  const sort = (searchParams.sort ?? 'newest') as UmrahSort;
  const rows = [...filteredRows].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'due':
        return b.due - a.due;
      case 'paid':
        return b.paid - a.paid;
      case 'expiry':
        return (a.passport_expiry ?? '9999').localeCompare(b.passport_expiry ?? '9999');
      default:
        return 0;
    }
  });
  const paged = paginate(rows, parsePaging(searchParams));
  const genderLabel = (g?: string | null) => (g === 'male' ? ct.male : g === 'female' ? ct.female : '');

  // Permanent family groups (migration 0008; harmless when absent). Members'
  // money rolls up under their head, with advances netted against dues.
  const nameById = new Map(all.map((p) => [p.id, p.name]));
  const passengerById = new Map(all.map((p) => [p.id, p]));
  const groupMembersByHead = new Map<string, string[]>();
  for (const p of all) {
    if (p.group_head_id) {
      groupMembersByHead.set(p.group_head_id, [...(groupMembersByHead.get(p.group_head_id) ?? []), p.id]);
    }
  }
  const groupIdsOf = (headId: string) => [headId, ...(groupMembersByHead.get(headId) ?? [])];
  const groupDueOf = (headId: string) =>
    Math.max(0, groupIdsOf(headId).reduce((s, id) => s + (passengerById.get(id)?.balance ?? 0), 0));
  const groupPaidOf = (headId: string) =>
    groupIdsOf(headId).reduce((s, id) => s + (passengerById.get(id)?.paid ?? 0), 0);

  const statusLabel = (s: string) =>
    s === 'cancelled' ? t.statusCancelled : s === 'completed' ? t.statusCompleted : t.statusActive;

  // Stats are computed across the full (unfiltered) set. Group members are
  // counted through their head so an advance nets against a member's due.
  const total = all.length;
  const assigned = all.filter((r) => r.package_id).length;
  const unassigned = total - assigned;
  const totalDue = all.reduce((s, r) => {
    if (r.group_head_id) return s; // rolled into their head's group figure
    if (groupMembersByHead.has(r.id)) return s + groupDueOf(r.id);
    return s + r.due;
  }, 0);
  const expiringSoon = all.filter((r) => isExpiringSoon(r.passport_expiry) && r.status === 'active').length;

  // Printed / exported list: a group member carries "Group with <head>" under
  // Paid and a bold amber name, the head a bold brand name with the member
  // count, and a Group Fund passenger the leader's name — so single and
  // grouped passengers read apart at a glance. Own figures per row, so the
  // totals line under the table adds up.
  const groupWith = (head: string) => (locale === 'bn' ? `গ্রুপ: ${head}` : `Group with ${head}`);
  const fundWith = (leader: string) => (locale === 'bn' ? `গ্রুপ ফান্ড · ${leader}` : `Group Fund · ${leader}`);
  const headNote = (n: number) => (locale === 'bn' ? `গ্রুপ প্রধান · ${n} জন` : `Group head · ${n} members`);
  // Printed order: each group as a block (leader, then members), singles last.
  const printRows = orderByGroup(rows, (r) => r.id, (r) => r.group_head_id, groupMembersByHead);
  const exportRows: Cell[][] = printRows.map((r) => {
    const careOf = r.affiliate_id ? affMap.get(r.affiliate_id) : undefined;
    const fund = isGroupFund(careOf) ? careOf : undefined;
    const headName = r.group_head_id ? nameById.get(r.group_head_id) : undefined;
    const members = groupMembersByHead.get(r.id)?.length ?? 0;
    const nameCell: Cell = headName
      ? { v: r.name, bold: true, tone: 'amber' }
      : members
        ? { v: r.name, bold: true, tone: 'brand', note: headNote(members) }
        : r.name;
    const paidCell: Cell = fund
      ? { v: fundWith(fund.name), bold: true, tone: 'amber' }
      : headName
        ? r.paid > 0
          ? { v: money(r.paid, false), bold: true, tone: 'amber', note: groupWith(headName) }
          : { v: groupWith(headName), bold: true, tone: 'amber' }
        : money(r.paid, false);
    const dueCell: Cell = fund ? { v: '—', tone: 'muted' } : money(r.due, false);
    return [
      nameCell,
      r.passport_no ?? '',
      fmtDate(r.passport_expiry),
      r.phone ?? '',
      genderLabel(r.gender),
      r.package_name ?? t.unassigned,
      paidCell,
      dueCell,
    ];
  });

  // Format B — Airlines / Visa office list: no money or phone, just identity.
  const airlinesRows = printRows.map((r, i) => [
    i + 1,
    r.name,
    r.passport_no ?? '',
    fmtDate(r.dob),
    fmtDate(r.passport_expiry),
    r.note ?? '',
  ]);

  return (
    <>
      <PageHeader
        title={t.passengersTitle}
        subtitle={t.passengersSubtitle}
        actions={
          <>
            <ExportMenu
              sets={[
                {
                  key: 'due',
                  label: locale === 'bn' ? 'বকেয়া তালিকা' : 'Due list',
                  hint: locale === 'bn' ? 'নাম, পাসপোর্ট, ফোন, প্যাকেজ, পরিশোধ ও বকেয়া' : 'Name, passport, phone, package, paid and due',
                  filename: 'umrah-passengers',
                  title: t.passengersTitle,
                  subtitle: `${rows.length} ${rows.length === 1 ? t.recordSingular : t.recordPlural}`,
                  headers: [t.exName, t.exPassport, t.exExpiry, t.exPhone, locale === 'bn' ? 'লিঙ্গ' : 'Gender', t.exPackage, t.exPaid, t.exDue],
                  rows: exportRows,
                  orientation: 'l',
                  totals: [t.exPaid, t.exDue],
                },
                {
                  key: 'airlines',
                  label: locale === 'bn' ? 'এয়ারলাইনস / ভিসা' : 'Airlines / Visa',
                  hint: locale === 'bn' ? 'শুধু পরিচয় — টাকা বা ফোন নম্বর ছাড়া' : 'Identity only — no money or phone numbers',
                  filename: 'umrah-airlines-visa-list',
                  title: locale === 'bn' ? 'উমরাহ যাত্রী তালিকা — এয়ারলাইনস / ভিসা' : 'Umrah Passenger List — Airlines / Visa',
                  subtitle: `${rows.length} ${rows.length === 1 ? t.recordSingular : t.recordPlural}`,
                  headers:
                    locale === 'bn'
                      ? ['ক্রমিক', 'নাম', 'পাসপোর্ট নং', 'জন্ম তারিখ', 'পাসপোর্ট মেয়াদ', 'নোট']
                      : ['Serial', 'Name', 'Passport No', 'Date of Birth', 'Passport Expiry', 'Note'],
                  rows: airlinesRows,
                  orientation: 'l',
                },
              ]}
            />
            <Button
              href={localizedPath(
                locale,
                `/admin/umrah/doc-report${searchParams.package ? `?package=${searchParams.package}` : ''}`,
              )}
              variant="outline"
            >
              {locale === 'bn' ? 'ডকুমেন্ট রিপোর্ট' : 'Document report'}
            </Button>
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
            {paged.items.map((r) => {
              const months = monthsUntil(r.passport_expiry);
              const expiring = isExpiringSoon(r.passport_expiry);
              const expired = months !== null && months < 0;
              const done = docStatusDoneFor(r.doc_status, 'umrah');
              const docTotal = docStatusTotalFor('umrah');
              const careOf = r.affiliate_id ? affMap.get(r.affiliate_id) : undefined;
              const viaFund = isGroupFund(careOf);
              const groupHeadName = r.group_head_id ? nameById.get(r.group_head_id) : undefined;
              const isGroupHead = groupMembersByHead.has(r.id);
              const fundCell = careOf ? (
                <Link
                  href={localizedPath(locale, `/admin/care-of/${careOf.id}?from=umrah`)}
                  className="inline-block max-w-[10rem] truncate text-xs font-semibold text-amber-600 hover:underline"
                  title={careOf.name}
                >
                  {ct.fundBadge}
                </Link>
              ) : null;
              return (
                <tr key={r.id} className="transition hover:bg-muted/40">
                  <td className={tdClass}>
                    <Link
                      href={localizedPath(locale, `/admin/umrah/${r.id}`)}
                      className={
                        groupHeadName
                          ? 'font-bold text-amber-700 hover:text-amber-800'
                          : 'font-semibold text-ink hover:text-brand-700'
                      }
                    >
                      {r.name}
                    </Link>
                    {r.name_bn && <p className="text-xs text-ink-muted">{r.name_bn}</p>}
                    {(r.phone || r.address) && (
                      <p className="text-xs text-ink-muted">{[r.phone, r.address].filter(Boolean).join(' · ')}</p>
                    )}
                    {careOf && (
                      <p className="text-xs font-medium text-brand-700">
                        {ct.careOf}: {careOf.name}
                        {viaFund && <span className="ml-1 text-amber-600">· {ct.fundBadge}</span>}
                      </p>
                    )}
                    {r.group_head_id && nameById.has(r.group_head_id) && (
                      <p className="text-xs font-medium text-amber-600">
                        {locale === 'bn' ? 'গ্রুপ' : 'Group'}: {nameById.get(r.group_head_id)}
                      </p>
                    )}
                    {isGroupHead && (
                      <p className="text-xs font-medium text-amber-600">
                        {locale === 'bn'
                          ? `গ্রুপ প্রধান · ${groupMembersByHead.get(r.id)?.length ?? 0} জন`
                          : `Group head · ${groupMembersByHead.get(r.id)?.length ?? 0} members`}
                      </p>
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
                    {viaFund ? (
                      fundCell
                    ) : groupHeadName ? (
                      <>
                        {r.paid > 0 && <Money value={r.paid} className="block" />}
                        <span
                          className="inline-block max-w-[11rem] truncate text-xs font-semibold text-amber-600"
                          title={groupHeadName}
                        >
                          {locale === 'bn' ? `গ্রুপ: ${groupHeadName}` : `Group with ${groupHeadName}`}
                        </span>
                      </>
                    ) : isGroupHead ? (
                      <>
                        <Money value={groupPaidOf(r.id)} />
                        <span className="block text-xs text-ink-muted">
                          {locale === 'bn' ? 'গ্রুপ মোট' : 'Group total'}
                        </span>
                      </>
                    ) : (
                      <Money value={r.paid} />
                    )}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    {viaFund ? (
                      fundCell
                    ) : groupHeadName ? (
                      <span
                        className="inline-block max-w-[10rem] truncate text-xs font-semibold text-amber-600"
                        title={groupHeadName}
                      >
                        {locale === 'bn' ? `সংযুক্ত: ${groupHeadName}` : `Linked: ${groupHeadName}`}
                      </span>
                    ) : isGroupHead ? (
                      (() => {
                        const gd = groupDueOf(r.id);
                        return (
                          <>
                            <Money value={gd} className={gd > 0 ? 'font-semibold text-red-600' : ''} />
                            <span className="block text-xs text-ink-muted">
                              {locale === 'bn' ? 'গ্রুপ মোট' : 'Group total'}
                            </span>
                          </>
                        );
                      })()
                    ) : r.due > 0 ? (
                      <Money value={r.due} className="font-semibold text-red-600" />
                    ) : (
                      <Money value={0} />
                    )}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={done === docTotal ? 'emerald' : done === 0 ? 'slate' : 'gold'}>
                      {done}/{docTotal}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    <Badge>{branchShort(r.branch)}</Badge>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <RowMenu
                      name={r.name}
                      items={[
                        {
                          kind: 'link',
                          icon: 'print',
                          label: st.printReceipt,
                          href: localizedPath(locale, `/admin/receipt/passenger/umrah/${r.id}`),
                          newTab: true,
                        },
                        { kind: 'link', icon: 'share', label: st.shareLink, href: sharePath('umrah', r.id), newTab: true },
                        {
                          kind: 'docs',
                          label: st.viewDocs,
                          value: r.doc_status,
                          program: 'umrah',
                          subtitle: r.passport_no ?? undefined,
                        },
                        { kind: 'link', icon: 'sms', label: st.sendSms, href: localizedPath(locale, `/admin/sms?to=umrah:${r.id}`) },
                        { kind: 'link', icon: 'edit', label: st.edit, href: localizedPath(locale, `/admin/umrah/${r.id}/edit`) },
                        {
                          kind: 'delete',
                          label: st.remove,
                          endpoint: `/api/admin/umrah/${r.id}`,
                          confirmMessage: t.confirmDelete.replace('{name}', r.name),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}
      <Pagination paged={paged} />

      {total === 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
          <Plane className="h-3.5 w-3.5" /> {t.footerNote}
        </p>
      )}
    </>
  );
}
