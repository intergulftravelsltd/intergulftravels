import Link from 'next/link';
import { HandCoins } from 'lucide-react';
import { PageHeader, StatCard, Money, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { ExportBar } from '@/components/manage/ExportBar';
import { loadActiveHeads } from '@/lib/management/accounts-data';
import { naturalBalance } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { Pagination } from '@/components/manage/Pagination';
import { paginate, parsePaging } from '@/lib/pagination';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Customer Dues' };

export default async function DuePage({ searchParams }: { searchParams: { page?: string; per?: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const heads = await loadActiveHeads();

  const dues = heads
    .filter((h) => h.subtype === 'customer')
    .map((h) => ({ head: h, due: naturalBalance(h) }))
    .filter((r) => r.due > 0)
    .sort((a, b) => b.due - a.due);

  const totalDue = dues.reduce((s, r) => s + r.due, 0);
  const paged = paginate(dues, parsePaging(searchParams));

  const exportRows = dues.map((r) => [
    r.head.name,
    r.head.party_phone ?? '',
    branchShort(r.head.branch),
    money(r.due, false),
  ]);

  return (
    <>
      <PageHeader
        title={t.due.title}
        subtitle={t.due.subtitle}
        actions={
          dues.length > 0 ? (
            <ExportBar
              filename="customer-dues"
              title={t.due.exportTitle}
              subtitle={`${t.due.totalReceivableLabel}: ${money(totalDue)}`}
              headers={[t.due.exHCustomer, t.due.exHPhone, t.due.exHBranch, t.due.exHDue]}
              rows={exportRows}
            />
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t.due.totalReceivable} value={<Money value={totalDue} />} icon={HandCoins} accent="red" />
        <StatCard label={t.due.customersWithDues} value={dues.length} accent="slate" />
      </div>

      {dues.length === 0 ? (
        <EmptyState
          title={t.due.noDuesTitle}
          hint={t.due.noDuesHint}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.due.thCustomer}</th>
              <th className={thClass}>{t.due.thPhone}</th>
              <th className={thClass}>{t.due.thBranch}</th>
              <th className={`${thClass} text-right`}>{t.due.thDue}</th>
            </tr>
          </thead>
          <tbody>
            {paged.items.map((r) => (
              <tr key={r.head.id}>
                <td className={tdClass}>
                  <Link href={localizedPath(locale, `/admin/accounts/heads/${r.head.id}`)} className="font-medium text-brand-700 hover:underline">
                    {r.head.name}
                  </Link>
                </td>
                <td className={`${tdClass} text-ink-muted`}>{r.head.party_phone || '—'}</td>
                <td className={tdClass}>{branchShort(r.head.branch)}</td>
                <td className={`${tdClass} text-right font-semibold tabular-nums text-red-600`}>{money(r.due)}</td>
              </tr>
            ))}
            {paged.isLast && (
              <tr className="bg-muted/60">
                <td className={`${tdClass} font-semibold`} colSpan={3}>
                  {t.due.totalReceivableLabel}
                </td>
                <td className={`${tdClass} text-right font-bold tabular-nums`}>{money(totalDue)}</td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      )}
      <Pagination paged={paged} />
    </>
  );
}
