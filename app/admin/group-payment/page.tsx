import { PageHeader } from '@/components/manage/ui';
import { GroupPaymentForm, type GroupMember } from '@/components/manage/GroupPaymentForm';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadHeadMap, dueForHead, loadBankAccounts } from '@/lib/management/hajj';
import { loadPassengers } from '@/lib/management/umrah';
import type { HajjPilgrim } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'গ্রুপ পেমেন্ট' : 'Group Payment' };
}

async function loadHajjMembers(): Promise<GroupMember[]> {
  try {
    const scope = await getStaffScope();
    let q = mgmtDb()
      .from('hajj_pilgrims')
      .select('id, name, tracking_no, phone, branch, account_head_id, status')
      .neq('status', 'cancelled');
    if (scope.branch) q = q.eq('branch', scope.branch);
    // The pilgrim list and the head map are independent — one round-trip.
    const [{ data }, heads] = await Promise.all([
      q.order('created_at', { ascending: false }),
      loadHeadMap(),
    ]);
    const rows = (data ?? []) as Pick<
      HajjPilgrim,
      'id' | 'name' | 'tracking_no' | 'phone' | 'branch' | 'account_head_id' | 'status'
    >[];
    return rows
      .map((p) => ({
        id: p.id,
        name: p.name,
        sub: [p.tracking_no, p.phone].filter(Boolean).join(' · '),
        branch: p.branch,
        due: Math.max(0, dueForHead(p.account_head_id, heads)),
        hasHead: Boolean(p.account_head_id),
      }));
  } catch {
    return [];
  }
}

async function loadUmrahMembers(): Promise<GroupMember[]> {
  const passengers = await loadPassengers();
  return passengers
    .filter((p) => p.status !== 'cancelled')
    .map((p) => ({
      id: p.id,
      name: p.name,
      sub: [p.passport_no, p.phone].filter(Boolean).join(' · '),
      branch: p.branch,
      due: p.due,
      hasHead: Boolean(p.account_head_id),
    }));
}

export default async function GroupPaymentPage({ searchParams }: { searchParams: { type?: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const [hajjMembers, umrahMembers, banks] = await Promise.all([
    loadHajjMembers(),
    loadUmrahMembers(),
    loadBankAccounts(),
  ]);

  return (
    <>
      <PageHeader
        title={locale === 'bn' ? 'গ্রুপ / পারিবারিক পেমেন্ট' : 'Group / Family Payment'}
        subtitle={
          locale === 'bn'
            ? 'একজনের নামে একসাথে কয়েকজনের পেমেন্ট নিন — প্রত্যেকের হিসাবে আলাদা জমা হবে, রসিদ হবে একটাই।'
            : "Take one bulk payment under one payer's name — each member's ledger is credited separately, with a single combined receipt."
        }
      />
      <GroupPaymentForm
        hajjMembers={hajjMembers}
        umrahMembers={umrahMembers}
        bankAccounts={banks}
        initialTable={searchParams.type === 'umrah' ? 'umrah' : 'hajj'}
        noBankText={t.noBankAccounts}
      />
    </>
  );
}
