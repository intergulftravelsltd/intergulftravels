import Link from 'next/link';
import { PageHeader, Card, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { HeadForm } from '@/components/manage/accounts/HeadForm';
import { HeadRowActions } from '@/components/manage/accounts/HeadRowActions';
import { loadActiveHeads } from '@/lib/management/accounts-data';
import { naturalBalance, type AccountHead, type AccountType } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath, type Locale } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account Heads' };

const TYPE_ORDER: AccountType[] = ['asset', 'liability', 'income', 'expense', 'equity'];
const TYPE_LABEL_KEY: Record<AccountType, keyof ReturnType<typeof getDict>['heads']> = {
  asset: 'assets',
  liability: 'liabilities',
  income: 'income',
  expense: 'expenses',
  equity: 'equity',
};

export default async function HeadsPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const heads = await loadActiveHeads();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: t.heads[TYPE_LABEL_KEY[type]],
    rows: heads.filter((h) => h.type === type),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <PageHeader
        title={t.heads.title}
        subtitle={t.heads.subtitle}
      />

      <div className="mb-6">
        <HeadForm />
      </div>

      {heads.length === 0 ? (
        <EmptyState
          title={t.heads.noHeadsTitle}
          hint={t.heads.noHeadsHint}
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.type}>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">{g.label}</h2>
              <TableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>{t.heads.thName}</th>
                    <th className={thClass}>{t.heads.thCode}</th>
                    <th className={thClass}>{t.heads.thSubtype}</th>
                    <th className={thClass}>{t.heads.thBranch}</th>
                    <th className={`${thClass} text-right`}>{t.heads.thBalance}</th>
                    <th className={`${thClass} text-right`}>{t.heads.thAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((h) => (
                    <HeadRow key={h.id} head={h} locale={locale} t={t} />
                  ))}
                </tbody>
              </TableWrap>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function HeadRow({ head, locale, t }: { head: AccountHead; locale: Locale; t: ReturnType<typeof getDict> }) {
  const balance = naturalBalance(head);
  return (
    <tr>
      <td className={tdClass}>
        <Link href={localizedPath(locale, `/admin/accounts/heads/${head.id}`)} className="font-medium text-brand-700 hover:underline">
          {head.name}
        </Link>
        {head.is_system && (
          <span className="ml-2 align-middle">
            <Badge tone="slate">{t.heads.system}</Badge>
          </span>
        )}
      </td>
      <td className={`${tdClass} font-mono text-xs text-ink-muted`}>{head.code ?? '—'}</td>
      <td className={`${tdClass} capitalize`}>{head.subtype}</td>
      <td className={tdClass}>{branchShort(head.branch)}</td>
      <td className={`${tdClass} text-right`}>
        <Money value={balance} />
      </td>
      <td className={`${tdClass} text-right`}>
        <HeadRowActions head={head} />
      </td>
    </tr>
  );
}
