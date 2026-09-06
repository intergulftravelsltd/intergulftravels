'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, PackageMinus } from 'lucide-react';
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
}: {
  pilgrimId: string;
  packages: PkgOption[];
  currentPackageId: string | null;
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
        }
      : {
          remove: 'Remove package',
          confirm: 'Remove the package from this pilgrim? The package charge will be reversed in the ledger; payments stay as they are.',
          removed: 'Package removed and its charge reversed.',
          failed: 'Could not remove the package.',
          changeHint: 'Choosing a different package reverses the old charge and posts the new price.',
        };

  async function assign() {
    if (saving) return;
    if (!packageId) {
      toast.error(t.toastSelectPackage);
      return;
    }
    if (packageId === currentPackageId) {
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
      toast.success(t.toastAssigned);
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
        <Button type="button" onClick={assign} disabled={saving || packages.length === 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {currentPackageId ? t.changePackage : t.assignPackage}
        </Button>
        {currentPackageId && (
          <Button type="button" variant="outline" onClick={remove} disabled={removing} className="border-red-300 text-red-600 hover:bg-red-50">
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageMinus className="h-4 w-4" />}
            {L.remove}
          </Button>
        )}
      </div>
      {currentPackageId && <p className="text-xs text-ink-muted">{L.changeHint}</p>}
    </div>
  );
}
