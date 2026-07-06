'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2, Pencil, X } from 'lucide-react';
import { confirmDialog } from '@/components/admin/confirm';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import type { AccountHead, AccountType, AccountSubtype } from '@/lib/management/types';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';
import { useLockedBranch } from '@/components/providers/BranchScope';

const TYPES: AccountType[] = ['asset', 'liability', 'income', 'expense', 'equity'];
const SUBTYPES: AccountSubtype[] = [
  'cash', 'bank', 'customer', 'supplier', 'loan', 'expense', 'income', 'general', 'equity',
];
const TYPE_LABEL_KEY: Record<AccountType, keyof ReturnType<typeof getDict>['headForm']> = {
  asset: 'typeAsset',
  liability: 'typeLiability',
  income: 'typeIncome',
  expense: 'typeExpense',
  equity: 'typeEquity',
};
const SUBTYPE_LABEL_KEY: Record<AccountSubtype, keyof ReturnType<typeof getDict>['headForm']> = {
  general: 'subGeneral',
  cash: 'subCash',
  bank: 'subBank',
  customer: 'subCustomer',
  supplier: 'subSupplier',
  loan: 'subLoan',
  income: 'subIncome',
  expense: 'subExpense',
  equity: 'subEquity',
};

/** Edit (modal) or deactivate a non-system account head. */
export function HeadRowActions({ head }: { head: AccountHead }) {
  const router = useRouter();
  const lockedBranch = useLockedBranch();
  const tt = getDict(useLocale());
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subtype, setSubtype] = useState<AccountSubtype>(head.subtype);

  async function remove() {
    if (
      !(await confirmDialog({
        message: tt.headRowActions.removeConfirm(head.name),
        confirmText: tt.headRowActions.delete,
        danger: true,
      }))
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/accounts/heads?id=${encodeURIComponent(head.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? tt.headRowActions.errRemove);
        return;
      }
      toast.success(tt.headRowActions.removed(head.name));
      router.refresh();
    } catch {
      toast.error(tt.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: head.id,
      name: String(fd.get('name') ?? '').trim(),
      code: String(fd.get('code') ?? '').trim(),
      type: String(fd.get('type') ?? head.type),
      subtype,
      branch: String(fd.get('branch') ?? head.branch),
      party_phone: String(fd.get('party_phone') ?? '').trim(),
      bank_name: subtype === 'bank' ? String(fd.get('bank_name') ?? '').trim() : '',
      account_no: subtype === 'bank' ? String(fd.get('account_no') ?? '').trim() : '',
    };
    if (!payload.name) {
      toast.error(tt.headRowActions.errName);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/accounts/heads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? tt.headRowActions.errUpdate);
        return;
      }
      toast.success(tt.headRowActions.updated);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(tt.common.networkError);
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
        aria-label={tt.headRowActions.editAria(head.name)}
      >
        <Pencil className="h-3.5 w-3.5" /> {tt.headRowActions.edit}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
        aria-label={tt.headRowActions.removeAria(head.name)}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {tt.headRowActions.remove}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-left shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">{tt.headRowActions.editAccountHead}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-muted"
                aria-label={tt.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <Field label={tt.headRowActions.accountName} required className="sm:col-span-2">
                <input
                  name="name"
                  defaultValue={head.name}
                  className={inputClass}
                  placeholder={tt.headRowActions.accountNamePlaceholder}
                />
              </Field>
              <Field label={tt.headRowActions.code}>
                <input name="code" defaultValue={head.code ?? ''} className={inputClass} placeholder={tt.headRowActions.codePlaceholder} />
              </Field>
              <Field label={tt.headRowActions.type} required>
                <select name="type" defaultValue={head.type} className={inputClass}>
                  {TYPES.map((tv) => (
                    <option key={tv} value={tv} className="capitalize">{tt.headForm[TYPE_LABEL_KEY[tv]] as string}</option>
                  ))}
                </select>
              </Field>
              <Field label={tt.headRowActions.subtype} required>
                <select
                  name="subtype"
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value as AccountSubtype)}
                  className={inputClass}
                >
                  {SUBTYPES.map((s) => (
                    <option key={s} value={s} className="capitalize">{tt.headForm[SUBTYPE_LABEL_KEY[s]] as string}</option>
                  ))}
                </select>
              </Field>
              {lockedBranch ? (
                <input type="hidden" name="branch" value={lockedBranch} />
              ) : (
                <Field label={tt.headRowActions.branchConcern}>
                  <select name="branch" defaultValue={head.branch} className={inputClass}>
                    <option value="general">{tt.headRowActions.generalHeadOffice}</option>
                    {BRANCHES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label={tt.headRowActions.contactPhone}>
                <input name="party_phone" defaultValue={head.party_phone ?? ''} className={inputClass} placeholder={tt.headRowActions.contactPhonePlaceholder} />
              </Field>
              {subtype === 'bank' && (
                <>
                  <Field label={tt.headRowActions.bankName}>
                    <input name="bank_name" defaultValue={head.bank_name ?? ''} className={inputClass} />
                  </Field>
                  <Field label={tt.headRowActions.bankAccountNo}>
                    <input name="account_no" defaultValue={head.account_no ?? ''} className={inputClass} />
                  </Field>
                </>
              )}

              <div className="mt-1 flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tt.headRowActions.saveChanges}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                  {tt.headRowActions.cancel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
