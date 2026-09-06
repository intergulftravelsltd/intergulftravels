import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Wallet, HandCoins, Banknote, BookOpen, Printer, PiggyBank } from 'lucide-react';
import { PageHeader, StatCard, Money, Badge, Card, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { FundReceiveForm } from '@/components/manage/affiliates/FundReceiveForm';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadBankAccounts } from '@/lib/management/hajj';
import {
  isGroupFund,
  naturalBalance,
  type AccountHead,
  type Affiliate,
  type HajjPilgrim,
  type Transaction,
  type UmrahPassenger,
} from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/careof';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Care of — Group' };

type Member = {
  id: string;
  name: string;
  program: 'hajj' | 'umrah';
  packageName: string | null;
  charged: number;
  paid: number;
  due: number;
};

export default async function CareOfDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string };
}) {
  const locale = getLocale();
  const t = getDict(locale);
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: affRow } = await db.from('affiliates').select('*').eq('id', params.id).maybeSingle();
  if (!affRow) notFound();
  const affiliate = affRow as Affiliate;
  if (scope.branch && affiliate.branch !== scope.branch) notFound();

  const groupFund = isGroupFund(affiliate);

  // Pilgrims linked to this care-of, both programs, branch-scoped.
  let hajjQ = db.from('hajj_pilgrims').select('*').eq('affiliate_id', params.id);
  let umrahQ = db.from('umrah_passengers').select('*').eq('affiliate_id', params.id);
  if (scope.branch) {
    hajjQ = hajjQ.eq('branch', scope.branch);
    umrahQ = umrahQ.eq('branch', scope.branch);
  }
  const [{ data: hajjData }, { data: umrahData }, fundHeadRes, fundTxRes, banks] = await Promise.all([
    hajjQ,
    umrahQ,
    groupFund
      ? db.from('account_heads').select('*').eq('id', affiliate.account_head_id as string).maybeSingle()
      : Promise.resolve({ data: null as AccountHead | null }),
    groupFund
      ? db
          .from('transactions')
          .select('*')
          .eq('debit_account_id', affiliate.account_head_id as string)
          .in('ref_table', ['hajj_pilgrims', 'umrah_passengers'])
      : Promise.resolve({ data: [] as Transaction[] }),
    groupFund ? loadBankAccounts() : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  const hajj = (hajjData ?? []) as HajjPilgrim[];
  const umrah = (umrahData ?? []) as UmrahPassenger[];
  const all = [...hajj, ...umrah];
  const fundHead = (fundHeadRes.data as AccountHead | null) ?? null;
  const fundTxs = (fundTxRes.data ?? []) as Transaction[];

  // Package charges debited from the fund head, per pilgrim.
  const fundChargeByRef = new Map<string, number>();
  for (const tx of fundTxs) {
    if (tx.ref_id) fundChargeByRef.set(tx.ref_id, (fundChargeByRef.get(tx.ref_id) ?? 0) + Number(tx.amount));
  }

  // Head balances (charged / paid / due) + package names.
  const headIds = all.map((p) => p.account_head_id).filter(Boolean) as string[];
  const pkgIds = Array.from(new Set(all.map((p) => p.package_id).filter(Boolean))) as string[];

  const heads = new Map<string, AccountHead>();
  if (headIds.length) {
    const { data } = await db.from('account_heads').select('*').in('id', headIds);
    ((data ?? []) as AccountHead[]).forEach((h) => heads.set(h.id, h));
  }
  const pkgs = new Map<string, string>();
  if (pkgIds.length) {
    const { data } = await db.from('mgmt_packages').select('id, name').in('id', pkgIds);
    ((data ?? []) as { id: string; name: string }[]).forEach((p) => pkgs.set(p.id, p.name));
  }

  const toMember = (p: HajjPilgrim | UmrahPassenger, program: 'hajj' | 'umrah'): Member => {
    const head = p.account_head_id ? heads.get(p.account_head_id) : undefined;
    const ownCharged = head ? Number(head.debit_total) : 0;
    return {
      id: p.id,
      name: p.name,
      program,
      packageName: p.package_id ? pkgs.get(p.package_id) ?? null : null,
      // Under a Group Fund the package charge sits on the leader's head.
      charged: groupFund ? (fundChargeByRef.get(p.id) ?? 0) + ownCharged : ownCharged,
      paid: head ? Number(head.credit_total) : 0,
      due: head ? naturalBalance(head) : 0,
    };
  };
  const members: Member[] = [
    ...hajj.map((p) => toMember(p, 'hajj')),
    ...umrah.map((p) => toMember(p, 'umrah')),
  ];

  const totalCharged = members.reduce((s, m) => s + m.charged, 0);
  const totalPaid = members.reduce((s, m) => s + m.paid, 0);
  const totalDue = members.reduce((s, m) => s + Math.max(0, m.due), 0);

  // Group Fund figures straight from the leader's ledger head.
  const fundReceived = fundHead ? Number(fundHead.credit_total) : 0;
  const fundCharged = fundHead ? Number(fundHead.debit_total) : 0;
  const fundBalance = fundHead ? naturalBalance(fundHead) : 0; // > 0 due from leader, < 0 advance
  const chargedCount = new Set(fundTxs.map((tx) => tx.ref_id).filter(Boolean)).size;

  const meta = [affiliate.code, affiliate.phone, affiliate.address, branchShort(affiliate.branch)]
    .filter(Boolean)
    .join(' · ');

  const from = searchParams.from === 'umrah' ? 'umrah' : searchParams.from === 'hajj' ? 'hajj' : affiliate.program === 'umrah' ? 'umrah' : 'hajj';
  const backHref = `/admin/${from}/care-of`;

  return (
    <>
      <Link
        href={localizedPath(locale, backHref)}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t.backToList}
      </Link>

      <PageHeader
        title={affiliate.name}
        subtitle={`${meta}${meta ? ' · ' : ''}${t.membersCount(members.length)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={affiliate.type === 'family' ? 'gold' : 'emerald'}>
              {affiliate.type === 'family' ? t.typeFamily : t.typeAgent}
            </Badge>
            {groupFund && <Badge tone="gold">{t.fundBadge}</Badge>}
            {groupFund && fundHead && (
              <>
                <Link
                  href={localizedPath(locale, `/admin/accounts/heads/${fundHead.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                >
                  <BookOpen className="h-4 w-4" /> {t.openLedger}
                </Link>
                <a
                  href={localizedPath(locale, `/admin/receipt/fund/${affiliate.id}`)}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                >
                  <Printer className="h-4 w-4" /> {t.printStatement}
                </a>
              </>
            )}
          </div>
        }
      />

      {groupFund ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label={t.fundReceived} value={<Money value={fundReceived} />} icon={Banknote} accent="emerald" />
            <StatCard
              label={t.fundCharged}
              value={<Money value={fundCharged} />}
              hint={t.fundChargedCount(chargedCount)}
              icon={Wallet}
              accent="slate"
            />
            <StatCard
              label={fundBalance > 0 ? t.fundDue : t.fundAdvance}
              value={<Money value={Math.abs(fundBalance)} />}
              icon={PiggyBank}
              accent={fundBalance > 0 ? 'red' : 'gold'}
            />
          </div>

          <Card className="mb-6">
            <div className="mb-4">
              <h2 className="font-display text-base font-semibold text-ink">{t.receiveFund}</h2>
              <p className="mt-0.5 text-sm text-ink-muted">{t.receiveFundHint}</p>
            </div>
            <FundReceiveForm affiliateId={affiliate.id} bankAccounts={banks} />
          </Card>
        </>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={t.totalPackage} value={<Money value={totalCharged} />} icon={Wallet} accent="slate" />
          <StatCard label={t.totalPaid} value={<Money value={totalPaid} />} icon={Banknote} accent="emerald" />
          <StatCard label={t.totalDue} value={<Money value={totalDue} />} icon={HandCoins} accent="red" />
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState title={t.noMembers} hint={t.noMembersHint} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>{t.thMember}</th>
              <th className={thClass}>{t.thProgram}</th>
              <th className={thClass}>{t.thMemberPackage}</th>
              <th className={`${thClass} text-right`}>{t.thCharged}</th>
              {!groupFund && <th className={`${thClass} text-right`}>{t.thPaid}</th>}
              {!groupFund && <th className={`${thClass} text-right`}>{t.thDue}</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={`${m.program}-${m.id}`} className="transition hover:bg-muted/40">
                <td className={tdClass}>
                  <Link
                    href={localizedPath(locale, `/admin/${m.program}/${m.id}`)}
                    className="font-medium text-ink hover:text-brand-700"
                  >
                    {m.name}
                  </Link>
                </td>
                <td className={tdClass}>
                  <Badge tone={m.program === 'hajj' ? 'emerald' : 'blue'}>
                    {m.program === 'hajj' ? t.programHajj : t.programUmrah}
                  </Badge>
                </td>
                <td className={tdClass}>{m.packageName ?? '—'}</td>
                <td className={`${tdClass} text-right`}>
                  <Money value={m.charged} />
                </td>
                {!groupFund && (
                  <td className={`${tdClass} text-right`}>
                    <Money value={m.paid} />
                  </td>
                )}
                {!groupFund && (
                  <td className={`${tdClass} text-right`}>
                    <Money value={Math.max(0, m.due)} className={m.due > 0 ? 'font-semibold text-red-600' : ''} />
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-brand-600/30 bg-muted/40 font-semibold">
              <td className={tdClass} colSpan={3}>
                {t.membersCount(members.length)}
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={groupFund ? fundCharged : totalCharged} />
              </td>
              {!groupFund && (
                <td className={`${tdClass} text-right`}>
                  <Money value={totalPaid} />
                </td>
              )}
              {!groupFund && (
                <td className={`${tdClass} text-right`}>
                  <Money value={totalDue} className="text-red-600" />
                </td>
              )}
            </tr>
          </tbody>
        </TableWrap>
      )}
      {groupFund && fundBalance !== 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          {money(fundReceived)} {locale === 'bn' ? 'জমা' : 'received'} − {money(fundCharged)}{' '}
          {locale === 'bn' ? 'প্যাকেজ খরচ' : 'package charges'} ={' '}
          <span className={fundBalance > 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>
            {money(Math.abs(fundBalance))} {fundBalance > 0 ? t.fundDue.toLowerCase() : t.fundAdvance.toLowerCase()}
          </span>
        </p>
      )}
    </>
  );
}
