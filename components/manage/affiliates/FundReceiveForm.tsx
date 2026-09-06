'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, HandCoins } from 'lucide-react';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/providers/LocaleProvider';
import { localizedPath } from '@/lib/i18n';
import { getDict } from '@/lib/dictionaries/areas/careof';

const today = () => new Date().toISOString().slice(0, 10);

/** Record bulk money received from a Group Fund leader (Dr Cash/Bank, Cr fund head). */
export function FundReceiveForm({
  affiliateId,
  bankAccounts,
}: {
  affiliateId: string;
  bankAccounts: { id: string; name: string }[];
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = getDict(locale);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [bankId, setBankId] = useState('');
  const [narration, setNarration] = useState('');
  const [manualRef, setManualRef] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const value = Number(amount);
    if (!(value > 0)) return void toast.error(locale === 'bn' ? 'শূন্যের বেশি পরিমাণ লিখুন।' : 'Enter an amount greater than zero.');
    if (method === 'bank' && !bankId) return void toast.error(locale === 'bn' ? 'ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।' : 'Select the bank account.');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: value,
          date,
          method,
          bank_account_id: method === 'bank' ? bankId : null,
          narration: narration.trim() || null,
          manual_ref: manualRef.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.fundFailed);
        return;
      }
      toast.success(`${t.fundRecorded}${data.voucher_no ? ` · ${data.voucher_no}` : ''}`);
      if (data.id) window.open(localizedPath(locale, `/admin/receipt/${data.id}`), '_blank', 'noopener');
      setAmount('');
      setNarration('');
      setManualRef('');
      router.refresh();
    } catch {
      toast.error(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label={t.fundAmount} required>
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          className={inputClass}
          value={amount}
          placeholder="0"
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label={t.fundDate} required>
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label={t.fundMethod}>
        <div className="flex gap-2">
          {(['cash', 'bank'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ' +
                (method === m
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border text-ink-muted hover:border-brand-600/40')
              }
            >
              {m === 'cash' ? (locale === 'bn' ? 'নগদ' : 'Cash') : locale === 'bn' ? 'ব্যাংক' : 'Bank'}
            </button>
          ))}
        </div>
      </Field>
      {method === 'bank' ? (
        <Field label={t.fundBank} required>
          <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
            <option value="">{locale === 'bn' ? 'ব্যাংক অ্যাকাউন্ট নির্বাচন করুন…' : 'Select bank account…'}</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label={t.fundManualRef}>
          <input
            className={inputClass}
            value={manualRef}
            maxLength={60}
            placeholder={t.fundManualRefPlaceholder}
            onChange={(e) => setManualRef(e.target.value)}
          />
        </Field>
      )}
      {method === 'bank' && (
        <Field label={t.fundManualRef}>
          <input
            className={inputClass}
            value={manualRef}
            maxLength={60}
            placeholder={t.fundManualRefPlaceholder}
            onChange={(e) => setManualRef(e.target.value)}
          />
        </Field>
      )}
      <Field label={t.fundNarration} className={method === 'bank' ? '' : 'sm:col-span-2'}>
        <input
          className={inputClass}
          value={narration}
          placeholder={t.fundNarrationPlaceholder}
          onChange={(e) => setNarration(e.target.value)}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
          {t.fundSubmit}
        </Button>
      </div>
    </form>
  );
}
