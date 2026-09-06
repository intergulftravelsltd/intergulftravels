'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import type { HeadOption } from './VoucherForm';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';
import { useLockedBranch } from '@/components/providers/BranchScope';

const today = () => new Date().toISOString().slice(0, 10);

/** Quick expense voucher — posts in expense mode to /api/admin/accounts/entry. */
export function AddExpenseForm({
  expenseHeads,
  bankHeads,
}: {
  expenseHeads: HeadOption[];
  bankHeads: HeadOption[];
}) {
  const router = useRouter();
  const t = getDict(useLocale());
  const lockedBranch = useLockedBranch();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expenseId, setExpenseId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [bankId, setBankId] = useState('');
  const [branch, setBranch] = useState<string>(BRANCHES[0].value);
  const [narration, setNarration] = useState('');
  const [manualRef, setManualRef] = useState('');

  function reset() {
    setExpenseId('');
    setAmount('');
    setDate(today());
    setMethod('cash');
    setBankId('');
    setBranch(BRANCHES[0].value);
    setNarration('');
  }

  async function submit() {
    if (!expenseId) return toast.error(t.addExpense.errExpenseHead);
    const value = Number(amount);
    if (!value || value <= 0) return toast.error(t.addExpense.errAmount);
    if (method === 'bank' && !bankId) return toast.error(t.addExpense.errBankAccount);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/accounts/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'expense',
          expense_account_id: expenseId,
          amount: value,
          date,
          method,
          bank_account_id: method === 'bank' ? bankId : undefined,
          branch,
          narration: narration.trim() || null,
          manual_ref: manualRef.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.addExpense.errRecord);
        return;
      }
      setManualRef('');
      toast.success(t.addExpense.posted(String(data.voucher_no)));
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} disabled={expenseHeads.length === 0}>
        <Plus className="h-4 w-4" /> {t.addExpense.addExpense}
      </Button>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{t.addExpense.recordExpense}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition hover:bg-muted"
          aria-label={t.common.close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.addExpense.expenseHead} required>
          <select className={inputClass} value={expenseId} onChange={(e) => setExpenseId(e.target.value)}>
            <option value="">{t.addExpense.selectExpenseHead}</option>
            {expenseHeads.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.addExpense.amount} required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={amount}
            placeholder={t.addExpense.amountPlaceholder}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        <Field label={t.addExpense.paidFrom}>
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
                {m === 'cash' ? t.addExpense.cash : t.addExpense.bank}
              </button>
            ))}
          </div>
        </Field>
        {method === 'bank' && (
          <Field label={t.addExpense.bankAccount} required>
            <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <option value="">{t.addExpense.selectBankAccount}</option>
              {bankHeads.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t.addExpense.date} required>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {lockedBranch ? (
          <input type="hidden" name="branch" value={lockedBranch} />
        ) : (
          <Field label={t.addExpense.branch}>
            <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t.addExpense.manualRef}>
          <input
            className={inputClass}
            value={manualRef}
            maxLength={60}
            placeholder={t.addExpense.manualRefPlaceholder}
            onChange={(e) => setManualRef(e.target.value)}
          />
        </Field>

        <Field label={t.addExpense.narration} className="sm:col-span-2">
          <input
            className={inputClass}
            value={narration}
            placeholder={t.addExpense.narrationPlaceholder}
            onChange={(e) => setNarration(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t.addExpense.cancel}
        </Button>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.addExpense.postExpense}
        </Button>
      </div>
    </Card>
  );
}
