import Link from 'next/link';
import { Users, UserPlus, BadgeCheck, Wallet, HandCoins } from 'lucide-react';
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
import { PilgrimFilters, type HajjSort } from '@/components/manage/hajj/PilgrimFilters';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { RowMenu } from '@/components/manage/RowMenu';
import { sharePath } from '@/lib/management/share-token';
import type { Cell } from '@/lib/export-cells';
import { Button } from '@/components/ui/Button';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadHeadMap, dueForHead, loadHajjPackages } from '@/lib/management/hajj';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { docStatusDone, DOC_STATUS_TOTAL } from '@/lib/management/doc-status';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { isGroupFund, type HajjPilgrim, type MgmtPackage } from '@/lib/management/types';
import { orderByGroup } from '@/lib/management/group-order';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { getDict as getShellDict } from '@/lib/dictionaries/areas/adminshell';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaPilgrims };
}

const CURRENT_YEAR = new Date().getFullYear();

type Search = {
  year?: string;
  reg_type?: string;
  package?: string;
  branch?: string;
  status?: string;
  q?: string;
  docs?: string;
  care_of?: string;
  gender?: string;
  sort?: string;
  page?: string;
  per?: string;
};

async function loadPilgrims(): Promise<HajjPilgrim[]> {
  try {
    const scope = await getStaffScope();
    let q = mgmtDb().from('hajj_pilgrims').select('*');
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) {
      console.error('[admin/hajj] load failed:', error.message);
      return [];
    }
    return (data ?? []) as HajjPilgrim[];
  } catch (err) {
    console.error('[admin/hajj] unexpected error:', err);
    return [];
  }
}

export default async function HajjPilgrimsPage({ searchParams }: { searchParams: Search }) {
  const locale = getLocale();
  const t = getDict(locale);
  const ct = getCareDict(locale);
  const st = getShellDict(locale).rowActions;
  const [allPilgrims, packages, heads, affiliates] = await Promise.all([
    loadPilgrims(),
    loadHajjPackages(),
    loadHeadMap(),
    loadActiveAffiliates('hajj'),
  ]);

  const pkgById = new Map<string, MgmtPackage>(packages.map((p) => [p.id, p]));
  const affMap = new Map(affiliates.map((a) => [a.id, a]));

  // Permanent family groups (migration 0008; harmless when absent). Members'
  // money rolls up under their head, with advances netted against dues.
  const nameById = new Map(allPilgrims.map((p) => [p.id, p.name]));
  const pilgrimById = new Map(allPilgrims.map((p) => [p.id, p]));
  const groupMembersByHead = new Map<string, string[]>();
  for (const p of allPilgrims) {
    if (p.group_head_id) {
      groupMembersByHead.set(p.group_head_id, [...(groupMembersByHead.get(p.group_head_id) ?? []), p.id]);
    }
  }
  const groupIdsOf = (headPilgrimId: string) => [headPilgrimId, ...(groupMembersByHead.get(headPilgrimId) ?? [])];
  const groupDueOf = (headPilgrimId: string) =>
    Math.max(
      0,
      groupIdsOf(headPilgrimId).reduce(
        (s, id) => s + dueForHead(pilgrimById.get(id)?.account_head_id ?? null, heads),
        0,
      ),
    );
  const groupPaidOf = (headPilgrimId: string) =>
    groupIdsOf(headPilgrimId).reduce((s, id) => {
      const accId = pilgrimById.get(id)?.account_head_id;
      const acc = accId ? heads.get(accId) : undefined;
      return s + (acc ? Number(acc.credit_total) : 0);
    }, 0);

  // Year tabs: every year present plus the current + next year.
  const yearSet = new Set<number>([CURRENT_YEAR, CURRENT_YEAR + 1]);
  for (const p of allPilgrims) if (p.year) yearSet.add(p.year);
  const years = Array.from(yearSet).sort((a, b) => b - a);

  const selectedYear = searchParams.year ? Number(searchParams.year) : years[0] ?? CURRENT_YEAR;
  const regType = searchParams.reg_type ?? '';
  const pkgFilter = searchParams.package ?? '';
  const branchFilter = searchParams.branch ?? '';
  const statusFilter = searchParams.status ?? '';
  const docsFilter = searchParams.docs ?? '';
  const careOfFilter = searchParams.care_of ?? '';
  const genderFilter = (searchParams.gender ?? '').toLowerCase();
  const q = (searchParams.q ?? '').trim().toLowerCase();

  // Year-scoped set drives the stat cards.
  const yearPilgrims = allPilgrims.filter((p) => p.year === selectedYear);

  const filtered = yearPilgrims.filter((p) => {
    if (regType && p.reg_type !== regType) return false;
    if (pkgFilter && p.package_id !== pkgFilter) return false;
    if (branchFilter && p.branch !== branchFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (docsFilter === 'complete' && docStatusDone(p.doc_status) !== DOC_STATUS_TOTAL) return false;
    if (docsFilter === 'incomplete' && docStatusDone(p.doc_status) === DOC_STATUS_TOTAL) return false;
    if (careOfFilter === 'none' && p.affiliate_id) return false;
    if (careOfFilter && careOfFilter !== 'none' && p.affiliate_id !== careOfFilter) return false;
    if (genderFilter && (p.gender ?? '').toLowerCase() !== genderFilter) return false;
    if (q) {
      const hay = `${p.name} ${p.tracking_no ?? ''} ${p.phone ?? ''} ${p.passport_no ?? ''} ${p.nid ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Stats over the whole year (not the filtered subset). Group members are
  // counted through their head so an advance nets against a member's due.
  const preReg = yearPilgrims.filter((p) => p.reg_type === 'pre-registration').length;
  const registered = yearPilgrims.filter((p) => p.reg_type === 'registered').length;
  const totalDue = yearPilgrims.reduce((sum, p) => {
    if (p.group_head_id) return sum; // rolled into their head's group figure
    if (groupMembersByHead.has(p.id)) return sum + groupDueOf(p.id);
    return sum + Math.max(0, dueForHead(p.account_head_id, heads));
  }, 0);

  // Build rows with paid/due once for both the table and the export.
  const rows = filtered.map((p) => {
    const head = p.account_head_id ? heads.get(p.account_head_id) : undefined;
    const due = dueForHead(p.account_head_id, heads);
    const charged = head ? Number(head.debit_total) : 0;
    const received = head ? Number(head.credit_total) : 0;
    // Paid against this customer = credits to their (asset) head.
    const paid = received;
    return {
      p,
      pkgName: p.package_id ? pkgById.get(p.package_id)?.name ?? '—' : '—',
      paid,
      due,
      charged,
    };
  });

  const genderLabel = (g?: string | null) => (g === 'male' ? ct.male : g === 'female' ? ct.female : '');
  // Sort (newest first by default — the load order) then slice the page.
  const sort = (searchParams.sort ?? 'newest') as HajjSort;
  const sorted = [...rows].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.p.name.localeCompare(b.p.name);
      case 'tracking':
        return (a.p.tracking_no ?? '').localeCompare(b.p.tracking_no ?? '');
      case 'due':
        return Math.max(0, b.due) - Math.max(0, a.due);
      case 'paid':
        return b.paid - a.paid;
      default:
        return 0;
    }
  });
  const paged = paginate(sorted, parsePaging(searchParams));

  // Printed / exported list: a group member carries "Group with <head>" under
  // Paid and a bold amber name, the head a bold brand name with the member
  // count, and a Group Fund pilgrim the leader's name — so single and grouped
  // pilgrims read apart at a glance. Own figures per row, so the totals line
  // under the table adds up.
  const groupWith = (head: string) => (locale === 'bn' ? `গ্রুপ: ${head}` : `Group with ${head}`);
  const fundWith = (leader: string) => (locale === 'bn' ? `গ্রুপ ফান্ড · ${leader}` : `Group Fund · ${leader}`);
  const headNote = (n: number) => (locale === 'bn' ? `গ্রুপ প্রধান · ${n} জন` : `Group head · ${n} members`);
  // Printed order: each group as a block (leader, then members), singles last.
  const printRows = orderByGroup(sorted, (r) => r.p.id, (r) => r.p.group_head_id, groupMembersByHead);
  const exportRows: Cell[][] = printRows.map((r) => {
    const careOf = r.p.affiliate_id ? affMap.get(r.p.affiliate_id) : undefined;
    const fund = isGroupFund(careOf) ? careOf : undefined;
    const headName = r.p.group_head_id ? nameById.get(r.p.group_head_id) : undefined;
    const members = groupMembersByHead.get(r.p.id)?.length ?? 0;
    const nameCell: Cell = headName
      ? { v: r.p.name, bold: true, tone: 'amber' }
      : members
        ? { v: r.p.name, bold: true, tone: 'brand', note: headNote(members) }
        : r.p.name;
    const paidCell: Cell = fund
      ? { v: fundWith(fund.name), bold: true, tone: 'amber' }
      : headName
        ? r.paid > 0
          ? { v: money(r.paid, false), bold: true, tone: 'amber', note: groupWith(headName) }
          : { v: groupWith(headName), bold: true, tone: 'amber' }
        : money(r.paid, false);
    const dueCell: Cell = fund ? { v: '—', tone: 'muted' } : money(Math.max(0, r.due), false);
    return [
      r.p.tracking_no ?? '',
      nameCell,
      r.p.phone ?? '',
      genderLabel(r.p.gender),
      r.p.year,
      r.p.reg_type === 'registered' ? t.exTypeRegistered : t.exTypePreRegistration,
      r.pkgName,
      paidCell,
      dueCell,
      branchShort(r.p.branch),
      r.p.status,
    ];
  });

  const fmtDob = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  // Format B — Airlines / Visa office list: no money or phone, just identity.
  const airlinesRows = printRows.map((r, i) => [
    i + 1,
    r.p.name,
    r.p.passport_no ?? '',
    fmtDob(r.p.dob),
    r.p.nid ?? '',
    r.p.note ?? '',
  ]);

  return (
    <>
      <PageHeader
        title={t.pilgrimsTitle}
        subtitle={t.pilgrimsSubtitle}
        actions={
          <>
            <ExportMenu
              sets={[
                {
                  key: 'due',
                  label: locale === 'bn' ? 'বকেয়া তালিকা' : 'Due list',
                  hint: locale === 'bn' ? 'নাম, ফোন, প্যাকেজ, পরিশোধ ও বকেয়া' : 'Name, phone, package, paid and due',
                  filename: `hajj-pilgrims-${selectedYear}`,
                  title: `${t.pilgrimsTitle} — ${selectedYear}`,
                  subtitle: `${filtered.length} ${filtered.length === 1 ? t.recordSingular : t.recordPlural}`,
                  headers: [t.exTracking, t.exName, t.exPhone, t.gender, t.exYear, t.exType, t.exPackage, t.exPaid, t.exDue, t.exBranch, t.exStatus],
                  rows: exportRows,
                  orientation: 'l',
                  totals: [t.exPaid, t.exDue],
                },
                {
                  key: 'airlines',
                  label: locale === 'bn' ? 'এয়ারলাইনস / ভিসা' : 'Airlines / Visa',
                  hint: locale === 'bn' ? 'শুধু পরিচয় — টাকা বা ফোন নম্বর ছাড়া' : 'Identity only — no money or phone numbers',
                  filename: `hajj-airlines-visa-list-${selectedYear}`,
                  title:
                    locale === 'bn'
                      ? `হজ হাজী তালিকা — এয়ারলাইনস / ভিসা — ${selectedYear}`
                      : `Hajj Pilgrim List — Airlines / Visa — ${selectedYear}`,
                  subtitle: `${filtered.length} ${filtered.length === 1 ? t.recordSingular : t.recordPlural}`,
                  headers:
                    locale === 'bn'
                      ? ['ক্রমিক', 'নাম', 'পাসপোর্ট নং', 'জন্ম তারিখ', 'এনআইডি', 'নোট']
                      : ['Serial', 'Name', 'Passport No', 'Date of Birth', 'NID', 'Note'],
                  rows: airlinesRows,
                  orientation: 'l',
                },
              ]}
            />
            <Button
              href={localizedPath(
                locale,
                `/admin/hajj/doc-report?year=${selectedYear}${pkgFilter ? `&package=${pkgFilter}` : ''}`,
              )}
              size="sm"
              variant="outline"
            >
              {locale === 'bn' ? 'ডকুমেন্ট রিপোর্ট' : 'Document report'}
            </Button>
            <Button href={localizedPath(locale, '/admin/group-payment?type=hajj')} size="sm" variant="outline">
              <HandCoins className="h-4 w-4" /> {locale === 'bn' ? 'গ্রুপ পেমেন্ট' : 'Group payment'}
            </Button>
            <Button href={localizedPath(locale, '/admin/hajj/new')} size="sm">
              <UserPlus className="h-4 w-4" /> {t.newPreReg}
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`${t.statPilgrims} · ${selectedYear}`} value={yearPilgrims.length} icon={Users} accent="emerald" />
        <StatCard label={t.statPreRegistered} value={preReg} icon={UserPlus} accent="slate" />
        <StatCard label={t.statRegistered} value={registered} icon={BadgeCheck} accent="gold" />
        <StatCard label={t.statTotalDue} value={<Money value={totalDue} />} icon={Wallet} accent="red" />
      </div>

      {/* Filters — one row (year dropdown first), apply on change */}
      <PilgrimFilters
        year={selectedYear}
        years={years}
        packages={packages.map((p) => ({ id: p.id, name: p.name }))}
        careOfs={affiliates.map((a) => ({ id: a.id, name: a.name, code: a.code }))}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={t.noPilgrimsFound}
          hint={
            yearPilgrims.length === 0
              ? t.noPilgrimsYearHint.replace('{year}', String(selectedYear))
              : t.noMatchHint
          }
          action={
            <Button href={localizedPath(locale, '/admin/hajj/new')} size="sm">
              <UserPlus className="h-4 w-4" /> {t.addPilgrim}
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thTracking}</th>
              <th className={thClass}>{t.thName}</th>
              <th className={thClass}>{t.thPhone}</th>
              <th className={thClass}>{t.thType}</th>
              <th className={thClass}>{t.thPackage}</th>
              <th className={`${thClass} text-right`}>{t.thPaid}</th>
              <th className={`${thClass} text-right`}>{t.thDue}</th>
              <th className={thClass}>{ct.thDocs}</th>
              <th className={thClass}>{t.thStatus}</th>
              <th className={`${thClass} text-right`}>{t.thManage}</th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map(({ p, pkgName, paid, due }) => {
              const done = docStatusDone(p.doc_status);
              const careOf = p.affiliate_id ? affMap.get(p.affiliate_id) : undefined;
              const viaFund = isGroupFund(careOf);
              const groupHeadName = p.group_head_id ? nameById.get(p.group_head_id) : undefined;
              const isGroupHead = groupMembersByHead.has(p.id);
              const fundCell = careOf ? (
                <Link
                  href={localizedPath(locale, `/admin/care-of/${careOf.id}?from=hajj`)}
                  className="inline-block max-w-[10rem] truncate text-xs font-semibold text-amber-600 hover:underline"
                  title={careOf.name}
                >
                  {ct.fundBadge}
                </Link>
              ) : null;
              return (
              <tr key={p.id} className="transition hover:bg-muted/40">
                <td className={tdClass}>
                  <Link href={localizedPath(locale, `/admin/hajj/${p.id}`)} className="font-medium text-brand-700 hover:underline">
                    {p.tracking_no ?? '—'}
                  </Link>
                </td>
                <td className={tdClass}>
                  <Link
                    href={localizedPath(locale, `/admin/hajj/${p.id}`)}
                    className={
                      groupHeadName ? 'font-bold text-amber-700 hover:text-amber-800' : 'font-medium text-ink hover:text-brand-700'
                    }
                  >
                    {p.name}
                  </Link>
                  {p.name_bn && <span className="block text-xs text-ink-muted">{p.name_bn}</span>}
                  {(p.phone || p.district) && (
                    <span className="block text-xs text-ink-muted">{[p.phone, p.district].filter(Boolean).join(' · ')}</span>
                  )}
                  {careOf && (
                    <span className="block text-xs font-medium text-brand-700">
                      {ct.careOf}: {careOf.name}
                      {viaFund && <span className="ml-1 text-amber-600">· {ct.fundBadge}</span>}
                    </span>
                  )}
                  {p.group_head_id && nameById.has(p.group_head_id) && (
                    <span className="block text-xs font-medium text-amber-600">
                      {locale === 'bn' ? 'গ্রুপ' : 'Group'}: {nameById.get(p.group_head_id)}
                    </span>
                  )}
                  {isGroupHead && (
                    <span className="block text-xs font-medium text-amber-600">
                      {locale === 'bn'
                        ? `গ্রুপ প্রধান · ${groupMembersByHead.get(p.id)?.length ?? 0} জন`
                        : `Group head · ${groupMembersByHead.get(p.id)?.length ?? 0} members`}
                    </span>
                  )}
                </td>
                <td className={tdClass}>{p.phone ?? '—'}</td>
                <td className={tdClass}>
                  {p.reg_type === 'registered' ? (
                    <Badge tone="emerald">{t.badgeRegistered}</Badge>
                  ) : (
                    <Badge tone="slate">{t.badgePreReg}</Badge>
                  )}
                </td>
                <td className={tdClass}>{pkgName}</td>
                <td className={`${tdClass} text-right`}>
                  {viaFund ? (
                    fundCell
                  ) : groupHeadName ? (
                    <>
                      {paid > 0 && <Money value={paid} className="block" />}
                      <span
                        className="inline-block max-w-[11rem] truncate text-xs font-semibold text-amber-600"
                        title={groupHeadName}
                      >
                        {locale === 'bn' ? `গ্রুপ: ${groupHeadName}` : `Group with ${groupHeadName}`}
                      </span>
                    </>
                  ) : isGroupHead ? (
                    <>
                      <Money value={groupPaidOf(p.id)} />
                      <span className="block text-xs text-ink-muted">
                        {locale === 'bn' ? 'গ্রুপ মোট' : 'Group total'}
                      </span>
                    </>
                  ) : (
                    <Money value={paid} />
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
                      const gd = groupDueOf(p.id);
                      return (
                        <>
                          <Money value={gd} className={gd > 0 ? 'font-semibold text-red-600' : ''} />
                          <span className="block text-xs text-ink-muted">
                            {locale === 'bn' ? 'গ্রুপ মোট' : 'Group total'}
                          </span>
                        </>
                      );
                    })()
                  ) : (
                    <Money value={Math.max(0, due)} className={due > 0 ? 'font-semibold text-red-600' : ''} />
                  )}
                </td>
                <td className={tdClass}>
                  <Badge tone={done === DOC_STATUS_TOTAL ? 'emerald' : done === 0 ? 'slate' : 'gold'}>
                    {done}/{DOC_STATUS_TOTAL}
                  </Badge>
                </td>
                <td className={tdClass}>
                  {p.status === 'active' && <Badge tone="blue">{t.badgeActive}</Badge>}
                  {p.status === 'completed' && <Badge tone="emerald">{t.badgeCompleted}</Badge>}
                  {p.status === 'cancelled' && <Badge tone="red">{t.badgeCancelled}</Badge>}
                </td>
                <td className={`${tdClass} whitespace-nowrap text-right`}>
                  <RowMenu
                    name={p.name}
                    items={[
                      {
                        kind: 'link',
                        icon: 'print',
                        label: st.printReceipt,
                        href: localizedPath(locale, `/admin/receipt/passenger/hajj/${p.id}`),
                        newTab: true,
                      },
                      { kind: 'link', icon: 'share', label: st.shareLink, href: sharePath('hajj', p.id), newTab: true },
                      {
                        kind: 'docs',
                        label: st.viewDocs,
                        value: p.doc_status,
                        program: 'hajj',
                        subtitle: p.tracking_no ?? undefined,
                      },
                      { kind: 'link', icon: 'sms', label: st.sendSms, href: localizedPath(locale, `/admin/sms?to=hajj:${p.id}`) },
                      { kind: 'link', icon: 'edit', label: st.edit, href: localizedPath(locale, `/admin/hajj/${p.id}/edit`) },
                      {
                        kind: 'delete',
                        label: st.remove,
                        endpoint: `/api/admin/hajj/${p.id}`,
                        confirmMessage: t.confirmDelete
                          .replace('{name}', p.name)
                          .replace('{suffix}', p.tracking_no ? ` (${p.tracking_no})` : ''),
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
    </>
  );
}
