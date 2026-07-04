import { PageHeader, EmptyState, TableWrap, thClass, tdClass, Badge } from '@/components/manage/ui';
import { AffiliateForm } from '@/components/manage/affiliates/AffiliateForm';
import { AffiliateRowActions } from '@/components/manage/affiliates/AffiliateRowActions';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { branchShort } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/careof';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Care of / Affiliates' };

export default async function CareOfPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const affiliates = await loadActiveAffiliates();

  return (
    <>
      <PageHeader title={t.pageTitle} subtitle={t.pageSubtitle} actions={<AffiliateForm />} />

      {affiliates.length === 0 ? (
        <EmptyState title={t.emptyTitle} hint={t.emptyHint} />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">{t.total(affiliates.length)}</p>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{t.thCode}</th>
                <th className={thClass}>{t.thName}</th>
                <th className={thClass}>{t.thPhone}</th>
                <th className={thClass}>{t.thAddress}</th>
                <th className={thClass}>{t.thBranch}</th>
                <th className={`${thClass} text-right`}>{t.thManage}</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id} className="transition hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap font-mono text-xs text-ink-muted`}>{a.code ?? '—'}</td>
                  <td className={`${tdClass} font-semibold text-ink`}>{a.name}</td>
                  <td className={`${tdClass} tabular-nums`}>{a.phone ?? '—'}</td>
                  <td className={`${tdClass} max-w-[18rem] truncate text-ink-muted`} title={a.address ?? ''}>
                    {a.address || '—'}
                  </td>
                  <td className={tdClass}>
                    <Badge>{branchShort(a.branch)}</Badge>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right`}>
                    <AffiliateRowActions affiliate={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}
    </>
  );
}
