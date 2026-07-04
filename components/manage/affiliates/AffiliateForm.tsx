'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useLockedBranch } from '@/components/providers/BranchScope';
import { getDict } from '@/lib/dictionaries/areas/careof';

/** Collapsible creator for a care-of / affiliate. Mirrors HeadForm. */
export function AffiliateForm() {
  const router = useRouter();
  const t = getDict(useLocale());
  const lockedBranch = useLockedBranch();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [branch, setBranch] = useState<string>(BRANCHES[0].value);

  function reset() {
    setName('');
    setPhone('');
    setAddress('');
    setCode('');
    setBranch(BRANCHES[0].value);
  }

  async function submit() {
    if (!name.trim()) {
      toast.error(t.errName);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          code: code.trim(),
          branch: lockedBranch ?? branch,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.errCreate);
        return;
      }
      toast.success(t.created);
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t.newAffiliate}
      </Button>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{t.formTitle}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition hover:bg-muted"
          aria-label={t.close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} required className="sm:col-span-2">
          <input className={inputClass} value={name} placeholder={t.namePlaceholder} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t.phone}>
          <input className={inputClass} value={phone} placeholder={t.phonePlaceholder} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </Field>
        <Field label={t.code} hint={t.codeHint}>
          <input className={inputClass} value={code} placeholder="CO-0001" onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label={t.address} className="sm:col-span-2">
          <textarea className={inputClass} rows={2} value={address} placeholder={t.addressPlaceholder} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        {lockedBranch ? (
          <input type="hidden" name="branch" value={lockedBranch} />
        ) : (
          <Field label={t.branch}>
            <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t.cancel}
        </Button>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.create}
        </Button>
      </div>
    </Card>
  );
}
