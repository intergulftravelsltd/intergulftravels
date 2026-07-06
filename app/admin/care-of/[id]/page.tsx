import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Wallet, HandCoins, Banknote } from 'lucide-react';
import { PageHeader, StatCard, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { naturalBalance, type AccountHead, type Affiliate, type HajjPilgrim, type UmrahPassenger } from '@/lib/management/types';
import { branchShort } from '@/lib/management/branches';
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

export default async function CareOfDetailPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data: affRow } = await db.from('affiliates').select('*').eq('id', params.id).maybeSingle();
  if (!affRow) notFound();
  const affiliate = affRow as Affiliate;
  if (scope.branch && affiliate.branch !== scope.branch) notFound();

  // Pilgrims linked to this care-of, both programs, branch-scoped.
  let hajjQ = db.from('hajj_pilgrims').select('*').eq('affiliate_id', params.id);
  let umrahQ = db.from('umrah_passengers').select('*').eq('affiliate_id', params.id);
  if (scope.branch) {
    hajjQ = hajjQ.eq('branch', scope.branch);
    umrahQ = umrahQ.eq('branch', scope.branch);
  }
  const [{ data: hajjData }, { data: umrahData }] = await Promise.all([hajjQ, umrahQ]);
  const hajj = (hajjData ?? []) as HajjPilgrim[];
  const umrah = (umrahData ?? []) as UmrahPassenger[];
  const all = [...hajj, ...umrah];

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
    return {
      id: p.id,
      name: p.name,
      program,
      packageName: p.package_id ? pkgs.get(p.package_id) ?? null : null,
      charged: head ? Number(head.debit_total) : 0,
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

  const meta = [affiliate.code, affiliate.phone, affiliate.address, branchShort(affiliate.branch)]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Link
        href={localizedPath(locale, '/admin/care-of')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> {t.backToList}
      </Link>

      <PageHeader
        title={affiliate.name}
        subtitle={`${meta}${meta ? ' · ' : ''}${t.membersCount(members.length)}`}
        actions={
          <Badge tone={affiliate.type === 'family' ? 'gold' : 'emerald'}>
            {affiliate.type === 'family' ? t.typeFamily : t.typeAgent}
          </Badge>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t.totalPackage} value={<Money value={totalCharged} />} icon={Wallet} accent="slate" />
        <StatCard label={t.totalPaid} value={<Money value={totalPaid} />} icon={Banknote} accent="emerald" />
        <StatCard label={t.totalDue} value={<Money value={totalDue} />} icon={HandCoins} accent="red" />
      </div>

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
              <th className={`${thClass} text-right`}>{t.thPaid}</th>
              <th className={`${thClass} text-right`}>{t.thDue}</th>
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
                <td className={`${tdClass} text-right`}>
                  <Money value={m.paid} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={Math.max(0, m.due)} className={m.due > 0 ? 'font-semibold text-red-600' : ''} />
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-brand-600/30 bg-muted/40 font-semibold">
              <td className={tdClass} colSpan={3}>
                {t.membersCount(members.length)}
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={totalCharged} />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={totalPaid} />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={totalDue} className="text-red-600" />
              </td>
            </tr>
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
