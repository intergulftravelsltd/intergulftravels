import Link from 'next/link';
import { Package as PackageIcon } from 'lucide-react';
import {
  PageHeader,
  Card,
  Money,
  Badge,
  EmptyState,
  TableWrap,
  thClass,
  tdClass,
} from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { PackageForm } from '@/components/manage/hajj/PackageForm';
import { PackageDelete } from '@/components/manage/PackageDelete';
import { PackageStats } from '@/components/manage/PackageStats';
import { parsePackageMeta } from '@/lib/management/package-meta';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadHeadMap, dueForHead, loadHajjPackages } from '@/lib/management/hajj';
import { money } from '@/lib/management/format';
import { branchShort } from '@/lib/management/branches';
import type { HajjPilgrim, MgmtPackage } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getDict(getLocale()).metaPackages };
}

const CURRENT_YEAR = new Date().getFullYear();

async function loadPilgrims(): Promise<HajjPilgrim[]> {
  try {
    const scope = await getStaffScope();
    let q = mgmtDb().from('hajj_pilgrims').select('*');
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []) as HajjPilgrim[];
  } catch {
    return [];
  }
}

export default async function HajjPackagesPage({
  searchParams,
}: {
  searchParams: { package?: string };
}) {
  const locale = getLocale();
  const t = getDict(locale);
  const [packages, pilgrims, heads] = await Promise.all([
    loadHajjPackages(),
    loadPilgrims(),
    loadHeadMap(),
  ]);

  // assigned-count per package
  const countByPkg = new Map<string, number>();
  for (const p of pilgrims) {
    if (p.package_id) countByPkg.set(p.package_id, (countByPkg.get(p.package_id) ?? 0) + 1);
  }

  const selectedId = searchParams.package ?? '';
  const selectedPkg: MgmtPackage | undefined = packages.find((p) => p.id === selectedId);

  // Package-wise pilgrim list
  const assigned = selectedPkg
    ? pilgrims
        .filter((p) => p.package_id === selectedPkg.id)
        .map((p) => {
          const head = p.account_head_id ? heads.get(p.account_head_id) : undefined;
          const paid = head ? Number(head.credit_total) : 0;
          const due = Math.max(0, dueForHead(p.account_head_id, heads));
          return { p, paid, due };
        })
    : [];

  const assignedExport = assigned.map((r) => [
    r.p.tracking_no ?? '',
    r.p.name,
    r.p.phone ?? '',
    r.p.reg_type === 'registered' ? t.exTypeRegistered : t.exTypePreRegistration,
    money(r.paid, false),
    money(r.due, false),
    branchShort(r.p.branch),
  ]);

  return (
    <>
      <PageHeader
        title={t.packagesTitle}
        subtitle={t.packagesSubtitle}
        actions={<PackageForm defaultYear={CURRENT_YEAR + 1} variant="create" />}
      />

      {packages.length === 0 ? (
        <EmptyState
          title={t.noPackagesYet}
          hint={t.noPackagesHint}
          action={<PackageForm defaultYear={CURRENT_YEAR + 1} variant="create" />}
        />
      ) : (
        <TableWrap className="mb-8">
          <thead>
            <tr>
              <th className={thClass}>{t.thPkgPackage}</th>
              <th className={thClass}>{t.thYear}</th>
              <th className={`${thClass} text-right`}>{t.thPrice}</th>
              <th className={`${thClass} text-right`}>{t.thSeats}</th>
              <th className={`${thClass} text-right`}>{t.thAssigned}</th>
              <th className={thClass}>{t.thBranch}</th>
              <th className={thClass}>{t.thStatus}</th>
              <th className={`${thClass} text-right`}>{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => {
              const assignedCount = countByPkg.get(pkg.id) ?? 0;
              return (
                <tr key={pkg.id} className="transition hover:bg-muted/40">
                  <td className={tdClass}>
                    <span className="font-medium text-ink">{pkg.name}</span>
                    {parsePackageMeta(pkg.description).note && (
                      <span className="block text-xs text-ink-muted">{parsePackageMeta(pkg.description).note}</span>
                    )}
                  </td>
                  <td className={tdClass}>{pkg.year ?? '—'}</td>
                  <td className={`${tdClass} text-right`}>
                    <Money value={pkg.price} />
                  </td>
                  <td className={`${tdClass} text-right`}>{pkg.seats ?? '—'}</td>
                  <td className={`${tdClass} text-right`}>
                    <Link
                      href={localizedPath(locale, `/admin/hajj/packages?package=${pkg.id}`)}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {assignedCount}
                    </Link>
                  </td>
                  <td className={tdClass}>{branchShort(pkg.branch)}</td>
                  <td className={tdClass}>
                    {pkg.active ? <Badge tone="emerald">{t.pkgActive}</Badge> : <Badge tone="slate">{t.pkgInactive}</Badge>}
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="inline-flex items-center justify-end gap-2">
                      <PackageForm pkg={pkg} defaultYear={CURRENT_YEAR + 1} variant="edit" />
                      <PackageDelete id={pkg.id} name={pkg.name} endpoint="/api/admin/hajj/packages" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      {/* Package-wise pilgrim list */}
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-brand-700" />
            <h2 className="font-display text-base font-semibold text-ink">{t.packageWisePilgrims}</h2>
          </div>
          {packages.length > 0 && (
            <form method="get" className="flex items-center gap-2">
              <select
                name="package"
                defaultValue={selectedId}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-ink"
              >
                <option value="">{t.choosePackage}</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.year ? ` · ${p.year}` : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-ink-muted hover:border-brand-600/40 hover:text-brand-700"
              >
                {t.view}
              </button>
            </form>
          )}
        </div>

        {selectedPkg && (
          <PackageStats
            price={selectedPkg.price}
            description={selectedPkg.description}
            seats={selectedPkg.seats}
            assignedCount={assigned.length}
          />
        )}

        {!selectedPkg ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            {t.choosePackageHint}
          </p>
        ) : assigned.length === 0 ? (
          <EmptyState
            title={t.noPilgrimsOnPackage.replace('{name}', selectedPkg.name)}
            hint={t.assignFromProfileHint}
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-muted">
                {assigned.length} {assigned.length === 1 ? t.pilgrimSingular : t.pilgrimPlural} · {selectedPkg.name}
              </p>
              <ExportBar
                filename={`hajj-package-${selectedPkg.name.replace(/\s+/g, '-').toLowerCase()}`}
                title={`${selectedPkg.name} — ${t.assignedTitle}`}
                subtitle={`${assigned.length} ${assigned.length === 1 ? t.pilgrimSingular : t.pilgrimPlural} · ${t.priceLabel} ${money(
                  selectedPkg.price,
                )}`}
                headers={[t.exTracking, t.exName, t.exPhone, t.pkgExType, t.exPaid, t.exDue, t.exBranch]}
                rows={assignedExport}
                orientation="l"
                totals={[t.exPaid, t.exDue]}
              />
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th className={thClass}>{t.thTracking}</th>
                  <th className={thClass}>{t.thName}</th>
                  <th className={thClass}>{t.thPhone}</th>
                  <th className={thClass}>{t.thType}</th>
                  <th className={`${thClass} text-right`}>{t.thPaid}</th>
                  <th className={`${thClass} text-right`}>{t.thDue}</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map(({ p, paid, due }) => (
                  <tr key={p.id} className="transition hover:bg-muted/40">
                    <td className={tdClass}>
                      <Link href={localizedPath(locale, `/admin/hajj/${p.id}`)} className="font-medium text-brand-700 hover:underline">
                        {p.tracking_no ?? '—'}
                      </Link>
                    </td>
                    <td className={tdClass}>
                      <Link href={localizedPath(locale, `/admin/hajj/${p.id}`)} className="font-medium text-ink hover:text-brand-700">
                        {p.name}
                      </Link>
                      {(p.phone || p.district) && (
                        <p className="text-xs text-ink-muted">{[p.phone, p.district].filter(Boolean).join(' · ')}</p>
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
                    <td className={`${tdClass} text-right`}>
                      <Money value={paid} />
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Money value={due} className={due > 0 ? 'font-semibold text-red-600' : ''} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </>
        )}
      </Card>
    </>
  );
}
