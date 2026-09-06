import Link from 'next/link';
import { PageHeader, EmptyState, TableWrap, thClass, tdClass, Badge } from '@/components/manage/ui';
import { AffiliateForm } from '@/components/manage/affiliates/AffiliateForm';
import { AffiliateRowActions } from '@/components/manage/affiliates/AffiliateRowActions';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { branchShort } from '@/lib/management/branches';
import { isGroupFund } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/careof';

/**
 * Care-of / affiliate list for one section. Hajj and Umrah each get their own
 * page (sidebar → Hajj → Care of (Hajj), Umrah → Care of (Umrah)); records
 * tagged "Hajj & Umrah" appear in both.
 */
export async function CareOfListPage({ program }: { program?: 'hajj' | 'umrah' }) {
  const locale = getLocale();
  const t = getDict(locale);
  const affiliates = await loadActiveAffiliates(program);
  const from = program ?? '';

  const title = program === 'hajj' ? t.pageTitleHajj : program === 'umrah' ? t.pageTitleUmrah : t.pageTitle;
  const subtitle =
    program === 'hajj' ? t.pageSubtitleHajj : program === 'umrah' ? t.pageSubtitleUmrah : t.pageSubtitle;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<AffiliateForm program={program ?? 'both'} />} />

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
                <th className={thClass}>{t.thType}</th>
                <th className={thClass}>{t.thFundMode}</th>
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
                  <td className={`${tdClass} font-semibold`}>
                    <Link
                      href={localizedPath(locale, `/admin/care-of/${a.id}${from ? `?from=${from}` : ''}`)}
                      className="text-ink hover:text-brand-700"
                    >
                      {a.name}
                    </Link>
                    {(a.program ?? 'both') === 'both' && program && (
                      <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                        {t.programBoth}
                      </span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={a.type === 'family' ? 'gold' : 'emerald'}>
                      {a.type === 'family' ? t.typeFamily : t.typeAgent}
                    </Badge>
                  </td>
                  <td className={tdClass}>
                    {isGroupFund(a) || a.fund_mode === 'group_fund' ? (
                      <Badge tone="gold">{t.fundBadge}</Badge>
                    ) : (
                      <span className="text-xs text-ink-muted">Individual</span>
                    )}
                  </td>
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
