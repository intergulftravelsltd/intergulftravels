import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { buildStatementReceipt } from '@/lib/management/statement';
import { isGroupFund, type Affiliate } from '@/lib/management/types';
import { getLocale } from '@/lib/i18n-server';
import { Receipt } from '@/components/manage/Receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Group Fund Statement', robots: { index: false, follow: false } };

/** Printable statement of a group leader's fund account: every receipt and
 *  every package charge debited for pilgrims under them, with running balance. */
export default async function FundStatementPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const db = mgmtDb();
  const scope = await getStaffScope();

  const { data } = await db.from('affiliates').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const affiliate = data as Affiliate;
  if (scope.branch && affiliate.branch !== scope.branch) notFound();
  if (!isGroupFund(affiliate)) notFound();

  const receipt = await buildStatementReceipt({
    headId: affiliate.account_head_id as string,
    party: {
      name: affiliate.name,
      phone: affiliate.phone,
      address: affiliate.address,
      passportNo: null,
      branch: affiliate.branch,
    },
    program: locale === 'bn' ? 'গ্রুপ ফান্ড' : 'Group Fund',
    packageName: '',
    locale,
  });

  return <Receipt data={receipt} locale={locale} />;
}
