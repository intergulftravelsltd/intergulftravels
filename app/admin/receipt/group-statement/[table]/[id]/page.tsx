import { notFound } from 'next/navigation';
import { getStaffScope } from '@/lib/management/scope';
import { loadGroupLedger, type GroupTable } from '@/lib/management/group';
import { money } from '@/lib/management/format';
import { branchLabel } from '@/lib/management/branches';
import { branchCompany } from '@/lib/site';
import { getLocale } from '@/lib/i18n-server';
import { GroupStatementReceipt } from '@/components/manage/GroupStatementReceipt';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Group Statement', robots: { index: false, follow: false } };

const TABLES: Record<string, GroupTable> = { hajj: 'hajj_pilgrims', umrah: 'umrah_passengers' };

/** Printable combined statement for a permanent family/group (head id in URL). */
export default async function GroupStatementPage({ params }: { params: { table: string; id: string } }) {
  const locale = getLocale();
  const table = TABLES[params.table];
  if (!table) notFound();

  const group = await loadGroupLedger(table, params.id);
  if (!group) notFound();

  const scope = await getStaffScope();
  if (scope.branch && group.branch !== scope.branch) notFound();

  const program =
    params.table === 'hajj' ? (locale === 'bn' ? 'হজ' : 'Hajj') : locale === 'bn' ? 'উমরাহ' : 'Umrah';

  const charges = group.members.map((m) => m.charged);
  const uniform = charges.every((c) => c > 0 && c === charges[0]) ? charges[0] : null;
  const perHeadLine =
    uniform !== null
      ? `${money(uniform)} × ${group.members.length} ${locale === 'bn' ? 'জন' : 'persons'}`
      : '';

  return (
    <GroupStatementReceipt
      locale={locale}
      data={{
        company: branchCompany(group.branch),
        program,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        branch: branchLabel(group.branch),
        headName: group.headName,
        rows: group.members.map((m) => ({
          name: m.name,
          ref: m.ref,
          isHead: m.isHead,
          charged: money(m.charged, false),
          paid: money(m.paid, false),
          due: money(m.due, false),
        })),
        ledger: group.ledger.map((line) => ({
          date: line.date,
          member: line.member,
          particulars: line.particulars,
          voucher: line.voucher,
          charge: line.charge ? money(line.charge, false) : '',
          paid: line.paid ? money(line.paid, false) : '',
          balance: money(line.balance, false),
        })),
        totalCharged: money(group.totalCharged, false),
        totalPaid: money(group.totalPaid, false),
        totalDue: money(group.totalDue, false),
        perHeadLine,
      }}
    />
  );
}
