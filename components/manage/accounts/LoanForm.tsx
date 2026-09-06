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
import { useLockedBranch } from '@/components/providers/BranchScope';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

const today = () => new Date().toISOString().slice(0, 10);

export function LoanForm({ bankHeads }: { bankHeads: HeadOption[] }) {
  const router = useRouter();
  const t = getDict(useLocale());
  const lockedBranch = useLockedBranch();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [type, setType] = useState<'given' | 'taken'>('given');
  const [principal, setPrincipal] = useState('');
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [bankId, setBankId] = useState('');
  const [branch, setBranch] = useState<string>(BRANCHES[0].value);
  const [narration, setNarration] = useState('');
  const [manualRef, setManualRef] = useState('');

  function reset() {
    setPartyName('');
    setPartyPhone('');
    setType('given');
    setPrincipal('');
    setDate(today());
    setDueDate('');
    setMethod('cash');
    setBankId('');
    setBranch(BRANCHES[0].value);
    setNarration('');
  }

  async function submit() {
    if (!partyName.trim()) return toast.error(t.loanForm.errParty);
    const value = Number(principal);
    if (!value || value <= 0) return toast.error(t.loanForm.errPrincipal);
    if (method === 'bank' && !bankId) return toast.error(t.loanForm.errBankAccount);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/accounts/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party_name: partyName.trim(),
          party_phone: partyPhone.trim() || null,
          type,
          principal: value,
          date,
          due_date: dueDate || null,
          method,
          bank_account_id: method === 'bank' ? bankId : null,
          branch,
          narration: narration.trim() || null,
          manual_ref: manualRef.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.loanForm.errRecord);
        return;
      }
      toast.success(t.loanForm.recorded(String(data.voucher_no)));
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
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t.loanForm.addLoan}
      </Button>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{t.loanForm.recordLoan}</h2>
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
        <Field label={t.loanForm.loanType} required>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('given')}
              className={
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ' +
                (type === 'given'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border text-ink-muted hover:border-brand-600/40')
              }
            >
              {t.loanForm.givenWeLent}
            </button>
            <button
              type="button"
              onClick={() => setType('taken')}
              className={
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ' +
                (type === 'taken'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border text-ink-muted hover:border-brand-600/40')
              }
            >
              {t.loanForm.takenWeBorrowed}
            </button>
          </div>
        </Field>

        <Field label={t.loanForm.principal} required>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={principal}
            placeholder={t.loanForm.principalPlaceholder}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </Field>

        <Field label={type === 'given' ? t.loanForm.borrowerName : t.loanForm.lenderName} required>
          <input
            className={inputClass}
            value={partyName}
            placeholder={t.loanForm.fullName}
            onChange={(e) => setPartyName(e.target.value)}
          />
        </Field>
        <Field label={t.loanForm.phone}>
          <input
            className={inputClass}
            value={partyPhone}
            placeholder={t.loanForm.phonePlaceholder}
            onChange={(e) => setPartyPhone(e.target.value)}
          />
        </Field>

        <Field label={t.loanForm.date} required>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={t.loanForm.dueDate}>
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>

        <Field label={type === 'given' ? t.loanForm.paidFrom : t.loanForm.receivedIn}>
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
                {m === 'cash' ? t.loanForm.cash : t.loanForm.bank}
              </button>
            ))}
          </div>
        </Field>
        {method === 'bank' && (
          <Field label={t.loanForm.bankAccount} required>
            <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
              <option value="">{t.loanForm.selectBankAccount}</option>
              {bankHeads.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {lockedBranch ? (
          <input type="hidden" name="branch" value={lockedBranch} />
        ) : (
          <Field label={t.loanForm.branch}>
            <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t.loanForm.manualRef}>
          <input
            className={inputClass}
            value={manualRef}
            maxLength={60}
            placeholder={t.loanForm.manualRefPlaceholder}
            onChange={(e) => setManualRef(e.target.value)}
          />
        </Field>

        <Field label={t.loanForm.narration} className="sm:col-span-2">
          <input
            className={inputClass}
            value={narration}
            placeholder={t.loanForm.narrationPlaceholder}
            onChange={(e) => setNarration(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t.loanForm.cancel}
        </Button>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.loanForm.recordLoanBtn}
        </Button>
      </div>
    </Card>
  );
}
