'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, PackageCheck, PackageMinus } from 'lucide-react';
import { confirmDialog } from '@/components/admin/confirm';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { money } from '@/lib/management/format';
import type { MgmtPackage } from '@/lib/management/types';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminumrah';

type PackageOption = Pick<MgmtPackage, 'id' | 'name' | 'price' | 'year'>;

export function AssignPackage({
  passengerId,
  packages,
  currentPackageId,
  alreadyCharged,
}: {
  passengerId: string;
  packages: PackageOption[];
  currentPackageId: string | null;
  alreadyCharged: boolean;
}) {
  const locale = useLocale();
  const t = getDict(locale);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [packageId, setPackageId] = useState(currentPackageId ?? '');

  const selected = packages.find((p) => p.id === packageId);

  const L =
    locale === 'bn'
      ? {
          remove: 'প্যাকেজ বাদ দিন',
          confirm: 'এই যাত্রীর প্যাকেজ বাদ দেবেন? প্যাকেজ খরচ লেজার থেকে reverse হবে; পেমেন্ট আগের মতোই থাকবে।',
          removed: 'প্যাকেজ বাদ দেওয়া হয়েছে, খরচ reverse হয়েছে।',
          failed: 'প্যাকেজ বাদ দেওয়া যায়নি।',
          changeHint: 'অন্য প্যাকেজ দিলে আগের প্যাকেজ খরচ reverse হয়ে নতুন দাম বসবে।',
        }
      : {
          remove: 'Remove package',
          confirm: 'Remove the package from this passenger? The package charge will be reversed in the ledger; payments stay as they are.',
          removed: 'Package removed and its charge reversed.',
          failed: 'Could not remove the package.',
          changeHint: 'Choosing a different package reverses the old charge and posts the new price.',
        };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!packageId) {
      toast.error(t.toastChoosePackage);
      return;
    }
    if (packageId === currentPackageId) {
      toast.info(t.toastAlreadyOnPackage);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/umrah/${passengerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      });
      const data = await res.json().catch(() => ({}));
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
      const res = await fetch(`/api/admin/umrah/${passengerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unassign_package: true }),
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
    <form onSubmit={submit} className="space-y-3">
      <Field label={t.umrahPackage}>
        <select className={inputClass} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
          <option value="">{t.selectPackage}</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.year ? ` (${p.year})` : ''} — {money(p.price)}
            </option>
          ))}
        </select>
      </Field>

      {selected && packageId !== currentPackageId && (
        <p className="rounded-xl bg-gold-50 px-3 py-2 text-xs font-medium text-gold-700">
          {t.assignWillCharge.replace('{amount}', money(selected.price))}
          {alreadyCharged && currentPackageId ? ` ${L.changeHint}` : ''}
        </p>
      )}
      {alreadyCharged && packageId === currentPackageId && (
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <PackageCheck className="h-3.5 w-3.5" />
          {t.alreadyChargedHint}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {currentPackageId && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={remove}
            disabled={removing}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageMinus className="h-4 w-4" />}
            {L.remove}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={saving || !packageId}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? t.assigningEllipsis : currentPackageId ? t.updatePackage : t.assignPackage}
        </Button>
      </div>
    </form>
  );
}
