import Link from 'next/link';
import { Printer, Crown } from 'lucide-react';
import { TableWrap, thClass, tdClass, Money, Badge } from '@/components/manage/ui';
import { money } from '@/lib/management/format';
import type { GroupLedger } from '@/lib/management/group';
import { localizedPath, type Locale } from '@/lib/i18n';

const L = {
  en: {
    heading: 'Group / family account',
    sub: (head: string, n: number) => `Head: ${head} · ${n} members (combined, permanent)`,
    member: 'Member',
    charged: 'Package',
    paid: 'Paid',
    due: 'Due',
    total: 'Group total',
    head: 'Head',
    print: 'Print group statement',
    perHead: (amount: string, n: number) => `${amount} × ${n} persons`,
    ledgerHeading: 'Statement — charges first, then payments date-wise',
    colDate: 'Date',
    colParticulars: 'Particulars',
    colCharge: 'Charge',
    colPaid: 'Paid',
    colBalance: 'Balance',
    netDue: 'Net group due',
  },
  bn: {
    heading: 'গ্রুপ / পারিবারিক হিসাব',
    sub: (head: string, n: number) => `প্রধান: ${head} · ${n} জন সদস্য (সম্মিলিত, স্থায়ী)`,
    member: 'সদস্য',
    charged: 'প্যাকেজ',
    paid: 'পরিশোধিত',
    due: 'বকেয়া',
    total: 'গ্রুপ মোট',
    head: 'প্রধান',
    print: 'গ্রুপ হিসাব প্রিন্ট',
    perHead: (amount: string, n: number) => `${amount} × ${n} জন`,
    ledgerHeading: 'হিসাব বিবরণী — আগে খরচ, তারপর তারিখ অনুযায়ী পেমেন্ট',
    colDate: 'তারিখ',
    colParticulars: 'বিবরণ',
    colCharge: 'চার্জ',
    colPaid: 'পরিশোধ',
    colBalance: 'ব্যালেন্স',
    netDue: 'গ্রুপের নিট বকেয়া',
  },
};

/**
 * The combined, permanent family-group statement — identical on the head's and
 * every member's profile: each member's package/paid/due plus group totals
 * (e.g. ৳1,60,000 × 3 = ৳4,80,000).
 */
export function GroupLedgerCard({
  group,
  table,
  locale,
}: {
  group: GroupLedger;
  table: 'hajj' | 'umrah';
  locale: Locale;
}) {
  const t = L[locale];

  // The manager's "১,৬০,০০০ × ৩ জন" line — only when every member is charged
  // the same package amount.
  const charges = group.members.map((m) => m.charged).filter((c) => c > 0);
  const uniform =
    charges.length === group.members.length && charges.every((c) => c === charges[0]) ? charges[0] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t.heading}</h2>
          <p className="text-sm text-ink-muted">{t.sub(group.headName, group.members.length)}</p>
        </div>
        <Link
          href={localizedPath(locale, `/admin/receipt/group-statement/${table}/${group.headId}`)}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
        >
          <Printer className="h-4 w-4" /> {t.print}
        </Link>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th className={thClass}>{t.member}</th>
            <th className={`${thClass} text-right`}>{t.charged}</th>
            <th className={`${thClass} text-right`}>{t.paid}</th>
            <th className={`${thClass} text-right`}>{t.due}</th>
          </tr>
        </thead>
        <tbody>
          {group.members.map((m) => (
            <tr key={m.id} className="transition hover:bg-muted/40">
              <td className={tdClass}>
                <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                  {m.isHead && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  {m.name}
                </span>
                {m.ref && <span className="block text-xs text-ink-muted">{m.ref}</span>}
                {m.isHead && (
                  <span className="mt-0.5 inline-block">
                    <Badge tone="gold">{t.head}</Badge>
                  </span>
                )}
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={m.charged} />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={m.paid} />
              </td>
              <td className={`${tdClass} text-right`}>
                <Money value={m.due} className={m.due > 0 ? 'font-semibold text-red-600' : ''} />
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-brand-600/40 bg-brand-50/40 font-bold">
            <td className={tdClass}>
              {t.total}
              {uniform !== null && (
                <span className="block text-xs font-medium text-ink-muted">
                  {t.perHead(money(uniform), group.members.length)}
                </span>
              )}
            </td>
            <td className={`${tdClass} text-right`}>
              <Money value={group.totalCharged} />
            </td>
            <td className={`${tdClass} text-right`}>
              <Money value={group.totalPaid} className="text-emerald-700" />
            </td>
            <td className={`${tdClass} text-right`}>
              <Money value={group.totalDue} className={group.totalDue > 0 ? 'text-red-600' : ''} />
            </td>
          </tr>
        </tbody>
      </TableWrap>

      {group.ledger.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-ink">{t.ledgerHeading}</p>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>{t.colDate}</th>
                <th className={thClass}>{t.colParticulars}</th>
                <th className={`${thClass} text-right`}>{t.colCharge}</th>
                <th className={`${thClass} text-right`}>{t.colPaid}</th>
                <th className={`${thClass} text-right`}>{t.colBalance}</th>
              </tr>
            </thead>
            <tbody>
              {group.ledger.map((line, i) => (
                <tr key={i} className="transition hover:bg-muted/40">
                  <td className={`${tdClass} whitespace-nowrap`}>{line.date}</td>
                  <td className={tdClass}>
                    <span className="font-medium text-ink">{line.member}</span>
                    <span className="block text-xs text-ink-muted">
                      {line.particulars}
                      {line.voucher ? ` · ${line.voucher}` : ''}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right`}>{line.charge ? <Money value={line.charge} /> : ''}</td>
                  <td className={`${tdClass} text-right`}>
                    {line.paid ? <Money value={line.paid} className="text-emerald-700" /> : ''}
                  </td>
                  <td className={`${tdClass} text-right font-medium`}>
                    <Money value={line.balance} />
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-brand-600/40 bg-brand-50/40 font-bold">
                <td className={tdClass} colSpan={2}>
                  {t.netDue}
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={group.totalCharged} />
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={group.totalPaid} className="text-emerald-700" />
                </td>
                <td className={`${tdClass} text-right`}>
                  <Money value={group.totalDue} className={group.totalDue > 0 ? 'text-red-600' : ''} />
                </td>
              </tr>
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
}
