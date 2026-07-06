'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2, Pencil, X } from 'lucide-react';
import { confirmDialog } from '@/components/admin/confirm';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import type { Affiliate } from '@/lib/management/types';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useLockedBranch } from '@/components/providers/BranchScope';
import { getDict } from '@/lib/dictionaries/areas/careof';

/** Edit (modal) or deactivate a care-of / affiliate. Mirrors HeadRowActions. */
export function AffiliateRowActions({ affiliate }: { affiliate: Affiliate }) {
  const router = useRouter();
  const t = getDict(useLocale());
  const lockedBranch = useLockedBranch();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function remove() {
    if (
      !(await confirmDialog({
        message: t.confirmRemove(affiliate.name),
        confirmText: t.remove,
        danger: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/affiliates?id=${encodeURIComponent(affiliate.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.errRemove);
        return;
      }
      toast.success(t.removed);
      router.refresh();
    } catch {
      toast.error(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: affiliate.id,
      name: String(fd.get('name') ?? '').trim(),
      code: String(fd.get('code') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
      address: String(fd.get('address') ?? '').trim(),
      type: String(fd.get('type') ?? affiliate.type),
      branch: String(fd.get('branch') ?? affiliate.branch),
    };
    if (!payload.name) {
      toast.error(t.errName);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.errUpdate);
        return;
      }
      toast.success(t.updated);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
      >
        <Pencil className="h-3.5 w-3.5" /> {t.edit}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {t.remove}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-left shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">{t.editTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-muted"
                aria-label={t.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label={t.name} required className="sm:col-span-2">
                <input name="name" defaultValue={affiliate.name} className={inputClass} placeholder={t.namePlaceholder} />
              </Field>
              <Field label={t.code} hint={t.codeHint}>
                <input name="code" defaultValue={affiliate.code ?? ''} className={inputClass} placeholder="CO-0001" />
              </Field>
              <Field label={t.phone}>
                <input name="phone" defaultValue={affiliate.phone ?? ''} className={inputClass} placeholder={t.phonePlaceholder} inputMode="tel" />
              </Field>
              <Field label={t.type}>
                <select name="type" defaultValue={affiliate.type} className={inputClass}>
                  <option value="agent">{t.typeAgent}</option>
                  <option value="family">{t.typeFamily}</option>
                </select>
              </Field>
              <Field label={t.address} className="sm:col-span-2">
                <textarea name="address" defaultValue={affiliate.address ?? ''} rows={2} className={inputClass} placeholder={t.addressPlaceholder} />
              </Field>
              {lockedBranch ? (
                <input type="hidden" name="branch" value={lockedBranch} />
              ) : (
                <Field label={t.branch}>
                  <select name="branch" defaultValue={affiliate.branch} className={inputClass}>
                    {BRANCHES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <div className="mt-1 flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t.saveChanges}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                  {t.cancel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
