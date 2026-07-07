import { mgmtDb } from '@/lib/management/server';
import { getStaffScope } from '@/lib/management/scope';
import { naturalBalance, type AccountHead, type MgmtPackage, type UmrahPassenger } from '@/lib/management/types';

export type PassengerRow = UmrahPassenger & {
  package_name: string | null;
  paid: number;
  due: number;
};

/** Months until a passport expiry date (negative if already expired). */
export function monthsUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
}

export function isExpiringSoon(dateStr: string | null | undefined, withinMonths = 6): boolean {
  const m = monthsUntil(dateStr);
  return m !== null && m < withinMonths;
}

/** Active umrah packages for select inputs. */
export async function loadUmrahPackages(): Promise<MgmtPackage[]> {
  try {
    const scope = await getStaffScope();
    const db = mgmtDb();
    let q = db.from('mgmt_packages').select('*').eq('type', 'umrah');
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return [];
    return (data ?? []) as MgmtPackage[];
  } catch {
    return [];
  }
}

/** Bank account heads for payment receipt selects. */
export async function loadBankAccounts(): Promise<{ id: string; name: string }[]> {
  try {
    const scope = await getStaffScope();
    const db = mgmtDb();
    let q = db.from('account_heads').select('id, name').eq('subtype', 'bank').eq('active', true);
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('name');
    if (error) return [];
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}

/**
 * Load passengers joined with their package name and computed paid/due.
 * Due is the natural balance of the customer account head (what they still owe).
 */
export async function loadPassengers(): Promise<PassengerRow[]> {
  try {
    const scope = await getStaffScope();
    const db = mgmtDb();
    let q = db.from('umrah_passengers').select('*');
    if (scope.branch) q = q.eq('branch', scope.branch);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error || !data) return [];

    const passengers = data as UmrahPassenger[];
    if (passengers.length === 0) return [];

    const headIds = passengers.map((p) => p.account_head_id).filter(Boolean) as string[];
    const pkgIds = Array.from(new Set(passengers.map((p) => p.package_id).filter(Boolean))) as string[];

    // Account heads → due.
    const heads = new Map<string, AccountHead>();
    if (headIds.length) {
      const { data: hData } = await db.from('account_heads').select('*').in('id', headIds);
      (hData ?? []).forEach((h: AccountHead) => heads.set(h.id, h));
    }

    // Packages → names.
    const pkgs = new Map<string, string>();
    if (pkgIds.length) {
      const { data: pData } = await db.from('mgmt_packages').select('id, name').in('id', pkgIds);
      (pData ?? []).forEach((p: { id: string; name: string }) => pkgs.set(p.id, p.name));
    }

    return passengers.map((p) => {
      const head = p.account_head_id ? heads.get(p.account_head_id) : undefined;
      // Paid + due both come from the customer ledger (total credits / natural
      // balance) so manually-posted vouchers count too — matching the statement
      // receipt and the Hajj list.
      const paid = head ? Math.max(0, Number(head.credit_total)) : 0;
      const due = head ? Math.max(0, naturalBalance(head)) : 0;
      return {
        ...p,
        package_name: p.package_id ? pkgs.get(p.package_id) ?? null : null,
        paid,
        due,
      };
    });
  } catch {
    return [];
  }
}
