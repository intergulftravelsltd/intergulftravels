'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminhajj';

export type BankOption = { id: string; name: string };

export function RecordPayment({
  pilgrimId,
  bankAccounts,
}: {
  pilgrimId: string;
  bankAccounts: BankOption[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = getDict(locale);
  const manualRefLabel = locale === 'bn' ? 'ম্যানুয়াল রসিদ নং' : 'Manual Receipt No.';
  const manualRefPlaceholder = locale === 'bn' ? 'কাগজের মানি রিসিটের নম্বর (ঐচ্ছিক)' : 'Number on the paper money receipt (optional)';
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');

  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = e.currentTarget;
    const fd = new FormData(form);

    const amount = Number(fd.get('amount') ?? 0);
    if (!(amount > 0)) {
      toast.error(t.toastAmountPositive);
      return;
    }
    if (method === 'bank' && !fd.get('bank_account_id')) {
      toast.error(t.toastSelectBank);
      return;
    }

    const payload = {
      amount,
      method,
      bank_account_id: method === 'bank' ? String(fd.get('bank_account_id') ?? '') || null : null,
      type: String(fd.get('type') ?? 'installment'),
      date: String(fd.get('date') ?? today),
      narration: String(fd.get('narration') ?? ''),
      manual_ref: String(fd.get('manual_ref') ?? '').trim() || null,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hajj/${pilgrimId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.toastPaymentFail);
        return;
      }
      toast.success(t.toastPaymentRecorded);
      form.reset();
      setMethod('cash');
      router.refresh();
    } catch {
      toast.error(t.toastNetwork);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label={t.amountTaka} required>
        <input name="amount" type="number" min={0} step="any" className={inputClass} placeholder="0" />
      </Field>
      <Field label={t.date}>
        <input name="date" type="date" defaultValue={today} className={inputClass} />
      </Field>
      <Field label={t.method} required>
        <select
          name="method"
          className={inputClass}
          value={method}
          onChange={(e) => setMethod(e.target.value as 'cash' | 'bank')}
        >
          <option value="cash">{t.methodCash}</option>
          <option value="bank">{t.methodBank}</option>
        </select>
      </Field>
      {method === 'bank' && (
        <Field label={t.bankAccount} required>
          <select name="bank_account_id" className={inputClass} defaultValue="">
            <option value="">{t.selectAccount}</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {bankAccounts.length === 0 && (
            <span className="mt-1 block text-xs text-red-600">{t.noBankAccounts}</span>
          )}
        </Field>
      )}
      <Field label={t.typeLabel}>
        <select name="type" className={inputClass} defaultValue="installment">
          <option value="installment">{t.typeInstallment}</option>
          <option value="advance">{t.typeAdvance}</option>
          <option value="token">{t.typeToken}</option>
          <option value="full">{t.typeFull}</option>
          <option value="refund">{t.typeRefund}</option>
        </select>
      </Field>
      <Field label={manualRefLabel}>
        <input name="manual_ref" maxLength={60} className={inputClass} placeholder={manualRefPlaceholder} />
      </Field>
      <Field label={t.narration}>
        <input name="narration" className={inputClass} placeholder={t.narrationPlaceholder} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? t.recordingEllipsis : t.recordPayment}
        </Button>
      </div>
    </form>
  );
}
