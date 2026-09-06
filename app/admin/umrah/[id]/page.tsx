import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  Phone,
  MapPin,
  CreditCard,
  CalendarClock,
  CalendarCheck,
  Cake,
  HandCoins,
  Wallet,
  Receipt,
  Printer,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { PageHeader, Card, Money, Badge, EmptyState, TableWrap, thClass, tdClass } from '@/components/manage/ui';
import { RecordPayment } from '@/components/manage/umrah/RecordPayment';
import { DiscountForm } from '@/components/manage/DiscountForm';
import { AssignGroupHead } from '@/components/manage/AssignGroupHead';
import { GroupLedgerCard } from '@/components/manage/GroupLedgerCard';
import { loadGroupLedger, loadGroupHeadOptions } from '@/lib/management/group';
import { AssignPackage } from '@/components/manage/umrah/AssignPackage';
import { StatusControl } from '@/components/manage/umrah/StatusControl';
import { PrintProfile } from '@/components/manage/umrah/PrintProfile';
import { mgmtDb } from '@/lib/management/server';
import { naturalBalance, isGroupFund, type AccountHead, type UmrahPassenger, type Payment } from '@/lib/management/types';
import { loadUmrahPackages, loadBankAccounts, monthsUntil, isExpiringSoon } from '@/lib/management/umrah';
import { loadAffiliate } from '@/lib/management/affiliates';
import { getDict as getCareDict } from '@/lib/dictionaries/areas/careof';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Passenger Profile' };

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ProfileData = {
  passenger: UmrahPassenger | null;
  head: AccountHead | null;
  packageName: string | null;
  packagePrice: number | null;
  payments: Payment[];
  alreadyCharged: boolean;
};

async function loadProfile(id: string): Promise<ProfileData> {
  const empty: ProfileData = { passenger: null, head: null, packageName: null, packagePrice: null, payments: [], alreadyCharged: false };
  try {
    const db = mgmtDb();
    const { data: passenger } = await db.from('umrah_passengers').select('*').eq('id', id).maybeSingle();
    if (!passenger) return empty;

    const [headRes, payRes, chargeRes] = await Promise.all([
      passenger.account_head_id
        ? db.from('account_heads').select('*').eq('id', passenger.account_head_id).maybeSingle()
        : Promise.resolve({ data: null }),
      db
        .from('payments')
        .select('*')
        .eq('party_table', 'umrah_passengers')
        .eq('party_id', id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      db
        .from('transactions')
        .select('id')
        .eq('ref_table', 'umrah_passengers')
        .eq('ref_id', id)
        .eq('type', 'journal')
        .limit(1),
    ]);

    let packageName: string | null = null;
    let packagePrice: number | null = null;
    if (passenger.package_id) {
      const { data: pkg } = await db.from('mgmt_packages').select('name, price').eq('id', passenger.package_id).maybeSingle();
      packageName = pkg?.name ?? null;
      packagePrice = pkg ? Number(pkg.price) : null;
    }

    return {
      passenger: passenger as UmrahPassenger,
      head: (headRes.data as AccountHead) ?? null,
      packageName,
      packagePrice,
      payments: (payRes.data ?? []) as Payment[],
      alreadyCharged: !!(chargeRes.data && chargeRes.data.length > 0),
    };
  } catch {
    return empty;
  }
}

export default async function PassengerProfilePage({ params }: { params: { id: string } }) {
  // The group ledger is keyed by the URL id alone, so it loads with the
  // profile instead of after it; only the head-options list (needs the row's
  // branch) waits for the profile.
  const [{ passenger, head, packageName, packagePrice, payments, alreadyCharged }, packages, bankAccounts, group] =
    await Promise.all([
      loadProfile(params.id),
      loadUmrahPackages(),
      loadBankAccounts(),
      loadGroupLedger('umrah_passengers', params.id),
    ]);

  const locale = getLocale();
  const t = getDict(locale);

  if (!passenger) notFound();

  // Permanent family-group context (migration 0008; loaders are best-effort).
  const [groupHeadOptions, affiliate] = await Promise.all([
    loadGroupHeadOptions('umrah_passengers', passenger.id, passenger.branch),
    loadAffiliate(passenger.affiliate_id),
  ]);
  const ct = getCareDict(locale);
  const viaFund = isGroupFund(affiliate);
  const isGroupMember = Boolean(passenger.group_head_id) && group !== null;
  const groupCurrentHead = isGroupMember && group ? { id: group.headId, name: group.headName } : null;
  const groupMemberCount = group && group.headId === passenger.id ? group.members.length - 1 : 0;

  const statusLabel = (s: string) =>
    s === 'cancelled' ? t.statusCancelled : s === 'completed' ? t.statusCompleted : t.statusActive;
  const typeLabel = (ty: string) =>
    ty === 'refund'
      ? t.typeRefund
      : ty === 'advance'
        ? t.typeAdvance
        : ty === 'token'
          ? t.typeToken
          : ty === 'full'
            ? t.typeFull
            : t.typeInstallment;
  const methodLabel = (m: string) => (m === 'bank' ? t.methodBankDisplay : t.methodCashDisplay);

  const due = head ? Math.max(0, naturalBalance(head)) : 0;
  const paid = payments.reduce((s, p) => s + (p.type === 'refund' ? -Number(p.amount) : Number(p.amount)), 0);

  // In a family group the summary card mirrors the combined group figures, so
  // the page never shows two different numbers for the same passenger.
  const summaryPaid = group ? group.totalPaid : paid;
  const summaryDue = group ? group.totalDue : due;
  const months = monthsUntil(passenger.passport_expiry);
  const expiring = isExpiringSoon(passenger.passport_expiry);
  const expired = months !== null && months < 0;

  const printInfo: [string, string][] = [
    [t.printNameEnglish, passenger.name],
    [t.printNameBangla, passenger.name_bn ?? '—'],
    [t.printPassportNo, passenger.passport_no ?? '—'],
    [t.printPassportIssue, fmtDate(passenger.passport_issue)],
    [t.printPassportExpiry, fmtDate(passenger.passport_expiry)],
    [t.printDob, fmtDate(passenger.dob)],
    [t.printPhone, passenger.phone ?? '—'],
    [t.printAddress, passenger.address ?? '—'],
    [t.printBranch, branchLabel(passenger.branch)],
    [t.printPackage, packageName ?? t.unassigned],
    [t.printPackagePrice, packagePrice != null ? money(packagePrice) : '—'],
    [t.printTotalPaid, money(paid)],
    [t.printBalanceDue, money(due)],
    [t.printStatus, statusLabel(passenger.status)],
  ];
  const printPayments = payments.map((p) => ({
    date: fmtDate(p.date),
    voucher: [p.voucher_no ?? '—', p.manual_ref].filter(Boolean).join(' / '),
    type: typeLabel(p.type),
    method: methodLabel(p.method),
    amount: money(p.amount, false),
  }));

  return (
    <>
      <Link
        href={localizedPath(locale, '/admin/umrah')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-brand-700"
      >
        <ChevronLeft className="h-4 w-4" /> {t.backToPassengers}
      </Link>

      <PageHeader
        title={passenger.name}
        subtitle={passenger.name_bn ?? branchLabel(passenger.branch)}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={localizedPath(locale, `/admin/umrah/${passenger.id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-ink shadow-soft transition hover:border-brand-600/40 hover:text-brand-700"
            >
              <Pencil className="h-4 w-4" /> {t.edit}
            </Link>
            <PrintProfile
              name={passenger.name}
              subtitle={`${branchLabel(passenger.branch)} · ${packageName ?? t.unassigned}`}
              info={printInfo}
              payments={printPayments}
            />
          </div>
        }
      />

      {expired && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle className="h-4 w-4" /> {t.passportExpiredAlert}
        </div>
      )}
      {!expired && expiring && passenger.status === 'active' && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" /> {t.passportExpiringAlert.replace('{months}', String(months))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ---- Left column ---- */}
        <div className="space-y-6">
          {/* Identity + passport */}
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row">
              {passenger.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={passenger.photo_url}
                  alt={passenger.name}
                  className="h-40 w-32 shrink-0 rounded-2xl border border-border object-cover"
                />
              ) : (
                <div className="grid h-40 w-32 shrink-0 place-items-center rounded-2xl border border-dashed border-border bg-muted text-xs text-ink-muted">
                  {t.noPhoto}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold text-ink">{t.passportContact}</h2>
                <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Info icon={CreditCard} label={t.infoPassportNo} value={passenger.passport_no ?? '—'} mono />
                  <Info
                    icon={CalendarCheck}
                    label={t.infoIssueDate}
                    value={fmtDate(passenger.passport_issue)}
                  />
                  <Info
                    icon={CalendarClock}
                    label={t.infoExpiryDate}
                    value={fmtDate(passenger.passport_expiry)}
                    danger={expired}
                    warn={!expired && expiring}
                  />
                  <Info icon={Cake} label={t.infoDob} value={fmtDate(passenger.dob)} />
                  <Info
                    icon={Cake}
                    label={locale === 'bn' ? 'লিঙ্গ' : 'Gender'}
                    value={passenger.gender === 'male' ? ct.male : passenger.gender === 'female' ? ct.female : '—'}
                  />
                  <Info icon={Phone} label={t.infoPhone} value={passenger.phone ?? '—'} mono />
                  <Info icon={MapPin} label={t.infoAddress} value={passenger.address ?? '—'} />
                </dl>
                {passenger.note && (
                  <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm text-ink-muted">{passenger.note}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Payment history */}
          <Card className="!p-0">
            <div className="flex items-center justify-between gap-3 p-5">
              <h2 className="font-display text-lg font-semibold text-ink">{t.paymentHistory}</h2>
              <Badge tone="emerald">{payments.length} {payments.length === 1 ? t.entrySingular : t.entryPlural}</Badge>
            </div>
            {payments.length === 0 ? (
              <div className="px-5 pb-6">
                <EmptyState
                  title={t.noPaymentsTitle}
                  hint={t.noPaymentsHint}
                />
              </div>
            ) : (
              <TableWrap className="!rounded-t-none !border-0 !border-t !shadow-none">
                <thead>
                  <tr>
                    <th className={thClass}>{t.thDate}</th>
                    <th className={thClass}>{t.thVoucher}</th>
                    <th className={thClass}>{t.thType}</th>
                    <th className={thClass}>{t.thMethod}</th>
                    <th className={`${thClass} text-right`}>{t.thAmount}</th>
                    <th className={thClass}>{t.thNarration}</th>
                    <th className={`${thClass} text-right`}></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="transition hover:bg-muted/40">
                      <td className={tdClass}>{fmtDate(p.date)}</td>
                      <td className={`${tdClass} tabular-nums`}>
                        {p.voucher_no ?? '—'}
                        {p.manual_ref && <span className="block text-xs text-ink-muted">{p.manual_ref}</span>}
                      </td>
                      <td className={tdClass}>
                        <Badge tone={p.type === 'refund' ? 'red' : 'gold'}>{typeLabel(p.type)}</Badge>
                      </td>
                      <td className={tdClass}>{methodLabel(p.method)}</td>
                      <td className={`${tdClass} text-right`}>
                        <Money value={p.type === 'refund' ? -Number(p.amount) : Number(p.amount)} />
                      </td>
                      <td className={`${tdClass} text-ink-muted`}>{p.narration ?? '—'}</td>
                      <td className={`${tdClass} whitespace-nowrap text-right`}>
                        <Link
                          href={localizedPath(locale, `/admin/receipt/${p.id}`)}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
                        >
                          <Printer className="h-3.5 w-3.5" /> {locale === 'bn' ? 'রসিদ' : 'Receipt'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>

        {/* ---- Right column ---- */}
        <div className="space-y-6">
          {/* Account summary */}
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">{t.accountSummary}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-brand-700">
                  <Wallet className="h-3.5 w-3.5" /> {t.paid}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">{money(summaryPaid)}</p>
              </div>
              <div className={`rounded-2xl p-4 ${summaryDue > 0 ? 'bg-red-50' : 'bg-muted'}`}>
                <p className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${summaryDue > 0 ? 'text-red-600' : 'text-ink-muted'}`}>
                  <HandCoins className="h-3.5 w-3.5" /> {t.due}
                </p>
                <p className={`mt-1 font-display text-lg font-semibold ${summaryDue > 0 ? 'text-red-600' : 'text-ink'}`}>{money(summaryDue)}</p>
              </div>
            </div>
            {group && (
              <p className="text-xs font-medium text-amber-600">
                {locale === 'bn'
                  ? `গ্রুপ মোট — প্রধান: ${group.headName} · ${group.members.length} জন`
                  : `Group total — head: ${group.headName} · ${group.members.length} members`}
              </p>
            )}
            {packagePrice != null && (
              <p className="text-xs text-ink-muted">
                {t.packagePriceLine} <span className="font-medium text-ink">{money(packagePrice)}</span>
                {head?.code && <> · {t.ledgerLine} <span className="font-medium text-ink">{head.code}</span></>}
              </p>
            )}
            <div className="border-t border-border pt-3">
              <p className="mb-1.5 text-sm font-medium text-ink">{t.statusHeading}</p>
              <StatusControl passengerId={passenger.id} status={passenger.status} />
            </div>
          </Card>

          {/* Assign package */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">{t.packageHeading}</h2>
              {packageName ? <Badge tone="emerald">{t.badgeAssigned}</Badge> : <Badge>{t.badgeUnassigned}</Badge>}
            </div>
            {packageName && <p className="text-sm text-ink-muted">{t.currentLine} <span className="font-medium text-ink">{packageName}</span></p>}
            {packages.filter((p) => p.active || p.id === passenger.package_id).length === 0 ? (
              <p className="text-sm text-ink-muted">
                {t.noPackagesProfile} <Link href={localizedPath(locale, '/admin/umrah/packages')} className="font-medium text-brand-700">{t.createOne}</Link>.
              </p>
            ) : (
              <AssignPackage
                passengerId={passenger.id}
                currentPackageId={passenger.package_id}
                alreadyCharged={alreadyCharged}
                packages={packages
                  .filter((p) => p.active || p.id === passenger.package_id)
                  .map((p) => ({ id: p.id, name: p.name, price: p.price, year: p.year }))}
              />
            )}
          </Card>

          {/* Record payment */}
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <Receipt className="h-4 w-4 text-brand-600" /> {t.recordPaymentHeading}
            </h2>
            {viaFund && affiliate ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">{ct.fundBadge} · {affiliate.name}</p>
                <p className="mt-1">{ct.fundNotice(affiliate.name)}</p>
                <Link
                  href={localizedPath(locale, `/admin/care-of/${affiliate.id}?from=umrah`)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  {ct.openFund}
                </Link>
              </div>
            ) : (
              <RecordPayment passengerId={passenger.id} bankAccounts={bankAccounts} due={due} />
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              {locale === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}
            </h2>
            <DiscountForm endpoint={`/api/admin/umrah/${passenger.id}/discount`} />
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              {locale === 'bn' ? 'গ্রুপ / পরিবার' : 'Group / Family'}
            </h2>
            <AssignGroupHead
              table="umrah"
              personId={passenger.id}
              currentHead={groupCurrentHead}
              memberCount={groupMemberCount}
              options={groupHeadOptions}
            />
          </Card>

          {group && <GroupLedgerCard group={group} table="umrah" locale={locale} />}
        </div>
      </div>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  mono,
  danger,
  warn,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  mono?: boolean;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
        <dd className={`text-sm font-medium ${danger ? 'text-red-600' : warn ? 'text-amber-600' : 'text-ink'} ${mono ? 'tabular-nums' : ''}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}
