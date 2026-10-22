'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { inputClass, Money, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { money } from '@/lib/management/format';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';
import { localizedPath } from '@/lib/i18n';

export type PkgPassenger = {
  id: string;
  name: string;
  passport_no: string | null;
  phone: string | null;
  package_id: string | null;
  paid: number;
  due: number;
};

type PkgOption = { id: string; name: string };

export function PackageWiseList({
  packages,
  passengers,
}: {
  packages: PkgOption[];
  passengers: PkgPassenger[];
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const [packageId, setPackageId] = useState(packages[0]?.id ?? '');

  const selected = packages.find((p) => p.id === packageId);
  const rows = useMemo(
    () => passengers.filter((p) => p.package_id === packageId),
    [passengers, packageId],
  );

  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalDue = rows.reduce((s, r) => s + r.due, 0);

  const exportRows = rows.map((r) => [
    r.name,
    r.passport_no ?? '',
    r.phone ?? '',
    money(r.paid, false),
    money(r.due, false),
  ]);

  if (packages.length === 0) {
    return (
      <EmptyState
        title={t.noPackagesReport}
        hint={t.noPackagesReportHint}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          className={`${inputClass} sm:max-w-xs`}
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {rows.length > 0 && (
          <ExportBar
            filename={`umrah-${(selected?.name ?? 'package').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            title={`Umrah Package — ${selected?.name ?? ''}`}
            subtitle={`${rows.length} ${rows.length === 1 ? t.pwPassengerSingular : t.pwPassengerPlural} · ${t.pwExportPaid} ${money(totalPaid)} · ${t.pwExportDue} ${money(totalDue)}`}
            headers={[t.exName, t.exPassport, t.exPhone, t.pwExportPaid, t.pwExportDue]}
            rows={exportRows}
            totals={[t.pwExportPaid, t.pwExportDue]}
          />
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t.noPassengersOnPackage}
          hint={t.noPassengersOnPackageHint}
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{t.thPassenger}</th>
                <th className={thClass}>{t.thPassport}</th>
                <th className={thClass}>{t.thPhone}</th>
                <th className={`${thClass} text-right`}>{t.thPaid}</th>
                <th className={`${thClass} text-right`}>{t.thDue}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-muted/40">
                  <td className={tdClass}>
                    <Link href={localizedPath(locale, `/admin/umrah/${r.id}`)} className="font-semibold text-ink hover:text-brand-700">
                      {r.name}
                    </Link>
                    {r.phone && <p className="text-xs text-ink-muted">{r.phone}</p>}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{r.passport_no ?? '—'}</td>
                  <td className={`${tdClass} tabular-nums`}>{r.phone ?? '—'}</td>
                  <td className={`${tdClass} text-right`}><Money value={r.paid} /></td>
                  <td className={`${tdClass} text-right`}>
                    {r.due > 0 ? <Money value={r.due} className="font-semibold text-red-600" /> : <Money value={0} />}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/50 font-semibold">
                <td className={tdClass} colSpan={3}>{t.totalLine} — {rows.length} {rows.length === 1 ? t.pwPassengerSingular : t.pwPassengerPlural}</td>
                <td className={`${tdClass} text-right`}><Money value={totalPaid} /></td>
                <td className={`${tdClass} text-right`}><Money value={totalDue} /></td>
              </tr>
            </tbody>
          </TableWrap>
        </>
      )}
    </div>
  );
}
