'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, BadgePercent } from 'lucide-react';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/providers/LocaleProvider';

const L = {
  en: {
    amount: 'Discount amount (৳)',
    date: 'Date',
    note: 'Note',
    notePlaceholder: 'Reason (optional) — e.g. family group, special consideration',
    submit: 'Apply discount',
    submitting: 'Applying…',
    positive: 'Enter an amount greater than zero.',
    success: 'Discount applied — due updated.',
    fail: 'Could not apply the discount.',
    network: 'Network error. Please try again.',
    hint: 'Any manual amount — it reduces the due instantly and shows as its own line in the statement.',
  },
  bn: {
    amount: 'ডিসকাউন্টের পরিমাণ (৳)',
    date: 'তারিখ',
    note: 'নোট',
    notePlaceholder: 'কারণ (ঐচ্ছিক) — যেমন পারিবারিক গ্রুপ, বিশেষ বিবেচনা',
    submit: 'ডিসকাউন্ট প্রয়োগ করুন',
    submitting: 'প্রয়োগ হচ্ছে…',
    positive: 'শূন্যের বেশি পরিমাণ দিন।',
    success: 'ডিসকাউন্ট প্রয়োগ হয়েছে — বকেয়া আপডেট হয়েছে।',
    fail: 'ডিসকাউন্ট প্রয়োগ করা যায়নি।',
    network: 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',
    hint: 'যেকোনো পরিমাণ ম্যানুয়ালি বসান — বকেয়া সাথে সাথে কমবে এবং হিসাব বিবরণীতে আলাদা লাইনে দেখা যাবে।',
  },
};

/** Manual-amount discount form for a hajj pilgrim / umrah passenger profile. */
export function DiscountForm({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const t = L[useLocale()];
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const amount = Number(fd.get('amount') ?? 0);
    if (!(amount > 0)) {
      toast.error(t.positive);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          date: String(fd.get('date') ?? today),
          narration: String(fd.get('narration') ?? ''),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.fail);
        return;
      }
      toast.success(t.success);
      form.reset();
      router.refresh();
    } catch {
      toast.error(t.network);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label={t.amount} required>
        <input name="amount" type="number" min={0} step="any" className={inputClass} placeholder="0" />
      </Field>
      <Field label={t.date}>
        <input name="date" type="date" defaultValue={today} className={inputClass} />
      </Field>
      <Field label={t.note} className="sm:col-span-2">
        <input name="narration" className={inputClass} placeholder={t.notePlaceholder} />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgePercent className="h-4 w-4" />}
          {saving ? t.submitting : t.submit}
        </Button>
        <p className="text-xs text-ink-muted">{t.hint}</p>
      </div>
    </form>
  );
}
