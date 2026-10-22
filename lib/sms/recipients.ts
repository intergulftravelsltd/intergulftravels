import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { loadPassengers } from '@/lib/management/umrah';
import { loadHeadMap, dueForHead, loadHajjPackages } from '@/lib/management/hajj';
import { loadActiveAffiliates } from '@/lib/management/affiliates';
import { money } from '@/lib/management/format';
import type { HajjPilgrim } from '@/lib/management/types';
import { normalizeBdPhone } from '@/lib/sms/phone';
import type { SmsFields } from '@/lib/sms/message';

/* ------------------------------------------------------------------ *
 *  Who an SMS can go to: every Umrah passenger, every Hajj pilgrim and
 *  every care-of / group leader in the caller's branch, each with the
 *  normalized number and the merge fields ({name}, {due}, …) the message
 *  may use. Server-only; the composer receives this as plain data.
 * ------------------------------------------------------------------ */

export type SmsRecipientKind = 'umrah' | 'hajj' | 'careof';

export type SmsDirectoryEntry = {
  /** "umrah:<id>" / "hajj:<id>" / "careof:<id>" — the selection key. */
  key: string;
  kind: SmsRecipientKind;
  id: string;
  name: string;
  /** As stored on the record. */
  phone: string | null;
  /** Gateway-ready 8801XXXXXXXXX, or null when the stored number is unusable. */
  to: string | null;
  /** One-line context for the picker: passport / tracking, package, care-of … */
  sub: string;
  status: string;
  /** Hajj year (for the year filter). */
  year: number | null;
  /** Care-of id a passenger / pilgrim sits under (for "members of this leader"). */
  careOfId: string | null;
  /** Section a care-of belongs to (care-of entries only). */
  program: 'hajj' | 'umrah' | 'both' | null;
  fields: SmsFields;
};

export type SmsDirectory = {
  umrah: SmsDirectoryEntry[];
  hajj: SmsDirectoryEntry[];
  careof: SmsDirectoryEntry[];
};

export const recipientKey = (kind: SmsRecipientKind, id: string) => `${kind}:${id}`;

async function loadUmrahEntries(): Promise<SmsDirectoryEntry[]> {
  const rows = await loadPassengers();
  return rows
    .filter((p) => p.status !== 'cancelled')
    .map((p) => ({
      key: recipientKey('umrah', p.id),
      kind: 'umrah' as const,
      id: p.id,
      name: p.name,
      phone: p.phone,
      to: normalizeBdPhone(p.phone),
      sub: [p.passport_no, p.package_name].filter(Boolean).join(' · '),
      status: p.status,
      year: null,
      careOfId: p.affiliate_id ?? null,
      program: null,
      fields: {
        name: p.name,
        due: money(p.due, false),
        paid: money(p.paid, false),
        package: p.package_name ?? '',
        passport: p.passport_no ?? '',
        tracking: '',
      },
    }));
}

async function loadHajjEntries(): Promise<SmsDirectoryEntry[]> {
  try {
    const scope = await getStaffScope();
    let q = mgmtDb()
      .from('hajj_pilgrims')
      .select('id, name, tracking_no, passport_no, phone, year, status, package_id, account_head_id, affiliate_id')
      .neq('status', 'cancelled');
    if (scope.branch) q = q.eq('branch', scope.branch);
    const [{ data }, heads, packages] = await Promise.all([
      q.order('created_at', { ascending: false }),
      loadHeadMap(),
      loadHajjPackages(),
    ]);
    const pkgName = new Map(packages.map((p) => [p.id, p.name]));
    const rows = (data ?? []) as Pick<
      HajjPilgrim,
      'id' | 'name' | 'tracking_no' | 'passport_no' | 'phone' | 'year' | 'status' | 'package_id' | 'account_head_id' | 'affiliate_id'
    >[];
    return rows.map((p) => {
      const head = p.account_head_id ? heads.get(p.account_head_id) : undefined;
      const paid = head ? Math.max(0, Number(head.credit_total)) : 0;
      const due = Math.max(0, dueForHead(p.account_head_id, heads));
      const pkg = p.package_id ? pkgName.get(p.package_id) ?? '' : '';
      return {
        key: recipientKey('hajj', p.id),
        kind: 'hajj' as const,
        id: p.id,
        name: p.name,
        phone: p.phone,
        to: normalizeBdPhone(p.phone),
        sub: [p.tracking_no, p.year ? String(p.year) : null, pkg].filter(Boolean).join(' · '),
        status: p.status,
        year: p.year ?? null,
        careOfId: p.affiliate_id ?? null,
        program: null,
        fields: {
          name: p.name,
          due: money(due, false),
          paid: money(paid, false),
          package: pkg,
          passport: p.passport_no ?? '',
          tracking: p.tracking_no ?? '',
        },
      };
    });
  } catch {
    return [];
  }
}

async function loadCareOfEntries(): Promise<SmsDirectoryEntry[]> {
  const rows = await loadActiveAffiliates();
  return rows.map((a) => ({
    key: recipientKey('careof', a.id),
    kind: 'careof' as const,
    id: a.id,
    name: a.name,
    phone: a.phone,
    to: normalizeBdPhone(a.phone),
    sub: [a.code, a.program === 'hajj' ? 'Hajj' : a.program === 'umrah' ? 'Umrah' : 'Hajj & Umrah'].filter(Boolean).join(' · '),
    status: 'active',
    year: null,
    careOfId: null,
    program: a.program ?? 'both',
    fields: { name: a.name, due: '', paid: '', package: '', passport: '', tracking: '' },
  }));
}

/** Everyone in scope, grouped by kind (one round of queries, run concurrently). */
export async function loadSmsDirectory(): Promise<SmsDirectory> {
  const [umrah, hajj, careof] = await Promise.all([loadUmrahEntries(), loadHajjEntries(), loadCareOfEntries()]);
  return { umrah, hajj, careof };
}

/** Resolve selection keys back to fresh directory entries (branch-scoped). */
export async function resolveSmsRecipients(keys: string[]): Promise<Map<string, SmsDirectoryEntry>> {
  const wanted = new Set(keys);
  const out = new Map<string, SmsDirectoryEntry>();
  if (!wanted.size) return out;
  const kinds = new Set(keys.map((k) => k.split(':')[0]));
  const [umrah, hajj, careof] = await Promise.all([
    kinds.has('umrah') ? loadUmrahEntries() : Promise.resolve([]),
    kinds.has('hajj') ? loadHajjEntries() : Promise.resolve([]),
    kinds.has('careof') ? loadCareOfEntries() : Promise.resolve([]),
  ]);
  for (const e of [...umrah, ...hajj, ...careof]) if (wanted.has(e.key)) out.set(e.key, e);
  return out;
}
