import Link from 'next/link';
import { Wallet, Banknote } from 'lucide-react';
import { PageHeader, StatCard, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { HeadForm } from '@/components/manage/accounts/HeadForm';
import { loadActiveHeads } from '@/lib/management/accounts-data';
import { naturalBalance } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cash & Bank' };

export default async function CashBankPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const heads = await loadActiveHeads();
  const accounts = heads.filter((h) => h.subtype === 'cash' || h.subtype === 'bank');

  const cashTotal = accounts
    .filter((h) => h.subtype === 'cash')
    .reduce((s, h) => s + naturalBalance(h), 0);
  // Overdrawn banks are a liability — keep them out of the real bank cash total.
  const bankBalances = accounts.filter((h) => h.subtype === 'bank').map((h) => naturalBalance(h));
  const bankTotal = bankBalances.reduce((s, b) => s + (b >= 0 ? b : 0), 0);
  const overdraftTotal = bankBalances.reduce((s, b) => s + (b < 0 ? -b : 0), 0);

  return (
    <>
      <PageHeader
        title={t.cashBank.title}
        subtitle={t.cashBank.subtitle}
        actions={<HeadForm bankOnly />}
      />

      <div className={`mb-6 grid gap-4 sm:grid-cols-2 ${overdraftTotal > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <StatCard label={t.cashBank.cashInHand} value={<Money value={cashTotal} />} icon={Wallet} accent="emerald" />
        <StatCard label={t.cashBank.totalInBanks} value={<Money value={bankTotal} />} icon={Banknote} accent="gold" />
        {overdraftTotal > 0 && (
          <StatCard
            label={locale === 'bn' ? 'ব্যাংক ওভারড্রাফট' : 'Bank Overdraft'}
            value={<Money value={overdraftTotal} />}
            icon={Banknote}
            accent="red"
          />
        )}
        <StatCard label={t.cashBank.liquidTotal} value={<Money value={cashTotal + bankTotal} />} accent="slate" />
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title={t.cashBank.noAccountsTitle}
          hint={t.cashBank.noAccountsHint}
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.cashBank.thAccount}</th>
              <th className={thClass}>{t.cashBank.thType}</th>
              <th className={thClass}>{t.cashBank.thBankNumber}</th>
              <th className={thClass}>{t.cashBank.thBranch}</th>
              <th className={`${thClass} text-right`}>{t.cashBank.thBalance}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((h) => (
              <tr key={h.id}>
                <td className={tdClass}>
                  <Link href={localizedPath(locale, `/admin/accounts/heads/${h.id}`)} className="font-medium text-brand-700 hover:underline">
                    {h.name}
                  </Link>
                </td>
                <td className={tdClass}>
                  <Badge tone={h.subtype === 'cash' ? 'emerald' : 'gold'}>{h.subtype === 'cash' ? t.common.cash : t.common.bank}</Badge>
                </td>
                <td className={`${tdClass} text-ink-muted`}>
                  {h.subtype === 'bank' ? (
                    <span>
                      {h.bank_name || '—'}
                      {h.account_no ? ` · ${h.account_no}` : ''}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={tdClass}>{branchShort(h.branch)}</td>
                <td className={`${tdClass} text-right`}>
                  <Money value={naturalBalance(h)} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
