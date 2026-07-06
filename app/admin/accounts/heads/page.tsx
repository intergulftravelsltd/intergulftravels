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

  // Customer / passenger ledgers (auto-created per pilgrim) are shown as their
  // own section rather than lumped under Assets — a pilgrim's balance swings
  // between due (asset) and advance/refund (liability), so "Customer Ledger" is
  // clearer for day-to-day work. Their DB type stays 'asset' for correct maths.
  const grouped: { key: string; label: string; rows: AccountHead[] }[] = [];
  const customerRows = heads.filter((h) => h.subtype === 'customer');
  if (customerRows.length) {
    grouped.push({ key: 'customer', label: t.heads.customerLedger, rows: customerRows });
  }
  for (const type of TYPE_ORDER) {
    const rows = heads.filter((h) => h.type === type && h.subtype !== 'customer');
    if (rows.length) grouped.push({ key: type, label: t.heads[TYPE_LABEL_KEY[type]], rows });
  }

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
            <section key={g.key}>
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
