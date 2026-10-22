import { notFound, redirect } from 'next/navigation';
import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { buildStatementReceipt } from '@/lib/management/statement';
import { loadGroupLedger, type GroupTable } from '@/lib/management/group';
import { getLocale } from '@/lib/i18n-server';
import { localizedPath } from '@/lib/i18n';
import { Receipt } from '@/components/manage/Receipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Receipt', robots: { index: false, follow: false } };

const TABLES: Record<string, GroupTable> = { umrah: 'umrah_passengers', hajj: 'hajj_pilgrims' };

export default async function PassengerReceiptPage({
  params,
  searchParams,
}: {
  params: { table: string; id: string };
  searchParams: { own?: string };
}) {
  const locale = getLocale();
  const table = TABLES[params.table];
  if (!table) notFound();

  // Anyone in a permanent family/group gets the GROUP statement: the head's
  // own ledger carries everybody's payments against one package (a huge
  // negative balance) and a member's carries a package with no payments —
  // neither is a document to hand to a customer. `?own=1` still opens the
  // individual ledger when staff really want it.
  if (searchParams.own !== '1') {
    const group = await loadGroupLedger(table, params.id);
    if (group) redirect(localizedPath(locale, `/admin/receipt/group-statement/${params.table}/${group.headId}`));
  }

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
    locale,
  });

  return <Receipt data={data} locale={locale} />;
}
