import { notFound } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { buildStatementReceipt } from '@/lib/management/statement';
import { getLocale } from '@/lib/i18n-server';
import { Receipt } from '@/components/manage/Receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Receipt', robots: { index: false, follow: false } };

const TABLES: Record<string, string> = { umrah: 'umrah_passengers', hajj: 'hajj_pilgrims' };

export default async function PassengerReceiptPage({ params }: { params: { table: string; id: string } }) {
  const locale = getLocale();
  const table = TABLES[params.table];
  if (!table) notFound();

  const db = mgmtDb();
  const scope = await getStaffScope();

  // hajj_pilgrims has a separate `district` column; umrah_passengers doesn't.
  const columns =
    params.table === 'hajj'
      ? 'name, phone, address, district, package_id, account_head_id, branch, passport_no'
      : 'name, phone, address, package_id, account_head_id, branch, passport_no';
  const { data: personRow } = await db.from(table).select(columns).eq('id', params.id).maybeSingle();
  if (!personRow) notFound();
  const person = personRow as unknown as {
    name: string;
    phone: string | null;
    address: string | null;
    district?: string | null;
    package_id: string | null;
    account_head_id: string | null;
    branch: string;
    passport_no: string | null;
  };
  if (scope.branch && person.branch !== scope.branch) notFound();
  if (!person.account_head_id) notFound();

  let packageName = '';
  if (person.package_id) {
    const { data: pkg } = await db.from('mgmt_packages').select('name').eq('id', person.package_id).maybeSingle();
    packageName = (pkg as { name?: string } | null)?.name ?? '';
  }

  const program =
    params.table === 'hajj' ? (locale === 'bn' ? 'হজ' : 'Hajj') : locale === 'bn' ? 'উমরাহ' : 'Umrah';

  const data = await buildStatementReceipt({
    headId: person.account_head_id,
    party: {
      name: person.name,
      phone: person.phone,
      address: person.address,
      district: person.district ?? null,
      passportNo: person.passport_no,
      branch: person.branch,
    },
    program,
    packageName,
  });

  return <Receipt data={data} locale={locale} />;
}
