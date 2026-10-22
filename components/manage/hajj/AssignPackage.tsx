'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, PackageMinus } from 'lucide-react';
import { confirmDialog } from '@/components/admin/confirm';
import { inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import type { MgmtPackage } from '@/lib/management/types';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

type PkgOption = Pick<MgmtPackage, 'id' | 'name' | 'price' | 'year'>;

export function AssignPackage({
  pilgrimId,
  packages,
  currentPackageId,
  alreadyCharged = true,
}: {
  pilgrimId: string;
  packages: PkgOption[];
  currentPackageId: string | null;
  /** False when a package is assigned but no package-charge journal exists (repair needed). */
  alreadyCharged?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = getDict(locale);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [packageId, setPackageId] = useState(currentPackageId ?? '');

  const L =
    locale === 'bn'
      ? {
          remove: 'প্যাকেজ বাদ দিন',
          confirm: 'এই হাজীর প্যাকেজ বাদ দেবেন? প্যাকেজ খরচ লেজার থেকে reverse হবে; পেমেন্ট আগের মতোই থাকবে।',
          removed: 'প্যাকেজ বাদ দেওয়া হয়েছে, খরচ reverse হয়েছে।',
          failed: 'প্যাকেজ বাদ দেওয়া যায়নি।',
          changeHint: 'অন্য প্যাকেজ দিলে আগের প্যাকেজ খরচ reverse হয়ে নতুন দাম বসবে।',
          notCharged:
            'প্যাকেজ দেওয়া আছে কিন্তু এর খরচ লেজারে পোস্ট হয়নি — তাই বকেয়া ০ দেখাচ্ছে। বাটনে চাপলে প্যাকেজের দাম খরচ হিসেবে পোস্ট হবে।',
          postCharge: 'প্যাকেজ খরচ পোস্ট করুন',
          chargePosted: 'প্যাকেজ খরচ লেজারে পোস্ট হয়েছে।',
        }
      : {
          remove: 'Remove package',
          confirm: 'Remove the package from this pilgrim? The package charge will be reversed in the ledger; payments stay as they are.',
          removed: 'Package removed and its charge reversed.',
          failed: 'Could not remove the package.',
          changeHint: 'Choosing a different package reverses the old charge and posts the new price.',
          notCharged:
            'This package is assigned but its charge was never posted to the ledger, so the due shows 0. The button posts the package price as the charge.',
          postCharge: 'Post package charge',
          chargePosted: 'Package charge posted to the ledger.',
        };

  // Same package re-sent = repair: the server posts the missing charge.
  const repairing = !!currentPackageId && packageId === currentPackageId && !alreadyCharged;

  async function assign() {
    if (saving) return;
    if (!packageId) {
      toast.error(t.toastSelectPackage);
      return;
    }
    if (packageId === currentPackageId && alreadyCharged) {
      toast.info(t.toastAlreadyAssigned);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hajj/${pilgrimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-package', package_id: packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.toastAssignFail);
        return;
      }
      toast.success(repairing ? L.chargePosted : t.toastAssigned);
      router.refresh();
    } catch {
      toast.error(t.toastNetwork);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (removing || !currentPackageId) return;
    if (!(await confirmDialog({ message: L.confirm, confirmText: L.remove, danger: true }))) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/hajj/${pilgrimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unassign-package' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? L.failed);
        return;
      }
      toast.success(L.removed);
      setPackageId('');
      router.refresh();
    } catch {
      toast.error(t.toastNetwork);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-medium text-ink">{t.packageLabel}</span>
          <select
            className={inputClass}
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
          >
            <option value="">{t.selectPackage}</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.year ? ` · ${p.year}` : ''} · ৳ {Number(p.price).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={assign}
          disabled={saving || packages.length === 0}
          className={repairing ? 'bg-amber-600 hover:bg-amber-700' : undefined}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {repairing ? L.postCharge : currentPackageId ? t.changePackage : t.assignPackage}
        </Button>
        {currentPackageId && (
          <Button type="button" variant="outline" onClick={remove} disabled={removing} className="border-red-300 text-red-600 hover:bg-red-50">
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageMinus className="h-4 w-4" />}
            {L.remove}
          </Button>
        )}
      </div>
      {repairing && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {L.notCharged}
        </p>
      )}
      {currentPackageId && <p className="text-xs text-ink-muted">{L.changeHint}</p>}
    </div>
  );
}
