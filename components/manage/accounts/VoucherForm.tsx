'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, BookOpen } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { BRANCHES } from '@/lib/management/branches';
import { money } from '@/lib/management/format';
import { useLocale } from '@/components/providers/LocaleProvider';
import { useLockedBranch } from '@/components/providers/BranchScope';
import { getDict } from '@/lib/dictionaries/areas/adminaccounting';

export type HeadOption = {
  id: string;
  name: string;
  type: string;
  subtype: string;
  code: string | null;
  party_phone?: string | null;
};

/** Name + phone so two people with the same name can be told apart. */
export function headLabel(h: HeadOption): string {
  return h.party_phone ? `${h.name} · ${h.party_phone}` : h.name;
}

type Mode = 'income' | 'expense' | 'transfer' | 'journal';

const MODES: { value: Mode; icon: typeof BookOpen }[] = [
  { value: 'income', icon: ArrowDownToLine },
  { value: 'expense', icon: ArrowUpFromLine },
  { value: 'transfer', icon: ArrowLeftRight },
  { value: 'journal', icon: BookOpen },
];

const MODE_LABEL_KEY: Record<Mode, keyof ReturnType<typeof getDict>['voucherForm']> = {
  income: 'modeIncome',
  expense: 'modeExpense',
  transfer: 'modeTransfer',
  journal: 'modeJournal',
};

const MODE_HINT_KEY: Record<Mode, keyof ReturnType<typeof getDict>['voucherForm']> = {
  income: 'hintIncome',
  expense: 'hintExpense',
  transfer: 'hintTransfer',
  journal: 'hintJournal',
};

const today = () => new Date().toISOString().slice(0, 10);

export function VoucherForm({ heads }: { heads: HeadOption[] }) {
  const router = useRouter();
  const t = getDict(useLocale());
  const lockedBranch = useLockedBranch();
  const [mode, setMode] = useState<Mode>('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [branch, setBranch] = useState<string>(BRANCHES[0].value);
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [narration, setNarration] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // mode-specific selections
  const [incomeId, setIncomeId] = useState('');
  const [expenseId, setExpenseId] = useState('');
  const [bankId, setBankId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [debitId, setDebitId] = useState('');
  const [creditId, setCreditId] = useState('');

  const incomeHeads = useMemo(() => heads.filter((h) => h.type === 'income'), [heads]);
  const expenseHeads = useMemo(() => heads.filter((h) => h.type === 'expense'), [heads]);
  const bankHeads = useMemo(() => heads.filter((h) => h.subtype === 'bank'), [heads]);
  const cashBankHeads = useMemo(() => heads.filter((h) => h.subtype === 'cash' || h.subtype === 'bank'), [heads]);

  function reset() {
    setAmount('');
    setNarration('');
    setManualRef('');
    setIncomeId('');
    setExpenseId('');
    setBankId('');
    setFromId('');
    setToId('');
    setDebitId('');
    setCreditId('');
  }

  async function submit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error(t.voucherForm.errAmount);
      return;
    }

    const body: Record<string, unknown> = {
      mode,
      amount: value,
      date,
      branch,
      method,
      narration,
      manual_ref: manualRef.trim() || null,
    };

    if (mode === 'income') {
      if (!incomeId) return toast.error(t.voucherForm.errIncomeHead);
      if (method === 'bank' && !bankId) return toast.error(t.voucherForm.errBankAccount);
      body.income_account_id = incomeId;
      if (method === 'bank') body.bank_account_id = bankId;
    } else if (mode === 'expense') {
      if (!expenseId) return toast.error(t.voucherForm.errExpenseHead);
      if (method === 'bank' && !bankId) return toast.error(t.voucherForm.errBankAccount);
      body.expense_account_id = expenseId;
      if (method === 'bank') body.bank_account_id = bankId;
    } else if (mode === 'transfer') {
      if (!fromId || !toId) return toast.error(t.voucherForm.errTransferAccounts);
      if (fromId === toId) return toast.error(t.voucherForm.errTransferDiffer);
      body.from_account_id = fromId;
      body.to_account_id = toId;
    } else {
      if (!debitId || !creditId) return toast.error(t.voucherForm.errJournalAccounts);
      if (debitId === creditId) return toast.error(t.voucherForm.errJournalDiffer);
      body.debit_account_id = debitId;
      body.credit_account_id = creditId;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/accounts/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.voucherForm.errCouldNotPost);
        return;
      }
      toast.success(t.voucherForm.voucherPosted(String(data.voucher_no)));
      reset();
      router.refresh();
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  const noHeads = heads.length === 0;

  return (
    <Card className="space-y-6">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MODES.map((m) => {
          const Icon = m.icon;
          const on = m.value === mode;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition ' +
                (on
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700')
              }
            >
              <Icon className="h-5 w-5" />
              {t.voucherForm[MODE_LABEL_KEY[m.value]] as string}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-muted">{t.voucherForm[MODE_HINT_KEY[mode]] as string}</p>

      {noHeads ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-ink-muted">
          {t.voucherForm.noHeads}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.voucherForm.date} required>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={t.voucherForm.amount} required>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={inputClass}
              value={amount}
              placeholder={t.voucherForm.amountPlaceholder}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>

          {/* Income mode */}
          {mode === 'income' && (
            <>
              <Field label={t.voucherForm.incomeHead} required>
                <select className={inputClass} value={incomeId} onChange={(e) => setIncomeId(e.target.value)}>
                  <option value="">{t.voucherForm.selectIncomeHead}</option>
                  {incomeHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </Field>
              <MethodPair method={method} setMethod={setMethod} bankId={bankId} setBankId={setBankId} bankHeads={bankHeads} t={t} />
            </>
          )}

          {/* Expense mode */}
          {mode === 'expense' && (
            <>
              <Field label={t.voucherForm.expenseHead} required>
                <select className={inputClass} value={expenseId} onChange={(e) => setExpenseId(e.target.value)}>
                  <option value="">{t.voucherForm.selectExpenseHead}</option>
                  {expenseHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </Field>
              <MethodPair method={method} setMethod={setMethod} bankId={bankId} setBankId={setBankId} bankHeads={bankHeads} t={t} payOut />
            </>
          )}

          {/* Transfer (contra) mode */}
          {mode === 'transfer' && (
            <>
              <Field label={t.voucherForm.fromAccount} required>
                <select className={inputClass} value={fromId} onChange={(e) => setFromId(e.target.value)}>
                  <option value="">{t.voucherForm.selectSource}</option>
                  {cashBankHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.voucherForm.toAccount} required>
                <select className={inputClass} value={toId} onChange={(e) => setToId(e.target.value)}>
                  <option value="">{t.voucherForm.selectDestination}</option>
                  {cashBankHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {/* Journal mode */}
          {mode === 'journal' && (
            <>
              <Field label={t.voucherForm.debitAccount} required>
                <select className={inputClass} value={debitId} onChange={(e) => setDebitId(e.target.value)}>
                  <option value="">{t.voucherForm.selectDebitHead}</option>
                  {heads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {headLabel(h)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.voucherForm.creditAccount} required>
                <select className={inputClass} value={creditId} onChange={(e) => setCreditId(e.target.value)}>
                  <option value="">{t.voucherForm.selectCreditHead}</option>
                  {heads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {headLabel(h)}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {lockedBranch ? (
            <input type="hidden" name="branch" value={lockedBranch} />
          ) : (
            <Field label={t.voucherForm.branch}>
              <select className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label={t.voucherForm.manualRef} hint={t.voucherForm.manualRefHint}>
            <input
              className={inputClass}
              value={manualRef}
              maxLength={60}
              placeholder={t.voucherForm.manualRefPlaceholder}
              onChange={(e) => setManualRef(e.target.value)}
            />
          </Field>

          <Field label={t.voucherForm.narration} className="sm:col-span-2">
            <input
              className={inputClass}
              value={narration}
              placeholder={t.voucherForm.narrationPlaceholder}
              onChange={(e) => setNarration(e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-ink-muted">
          {amount && Number(amount) > 0 ? (
            <>
              {t.voucherForm.postingPrefix} <span className="font-semibold text-ink">{money(Number(amount))}</span> {t.voucherForm.postingAsA}{' '}
              <span className="font-semibold text-ink">{(t.voucherForm[MODE_LABEL_KEY[mode]] as string).toLowerCase()}</span> {t.voucherForm.postingVoucherSuffix}
            </>
          ) : (
            t.voucherForm.enterDetails
          )}
        </p>
        <Button type="button" onClick={submit} disabled={submitting || noHeads}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.voucherForm.postVoucher}
        </Button>
      </div>
    </Card>
  );
}

function MethodPair({
  method,
  setMethod,
  bankId,
  setBankId,
  bankHeads,
  t,
  payOut,
}: {
  method: 'cash' | 'bank';
  setMethod: (m: 'cash' | 'bank') => void;
  bankId: string;
  setBankId: (id: string) => void;
  bankHeads: HeadOption[];
  t: ReturnType<typeof getDict>;
  payOut?: boolean;
}) {
  return (
    <>
      <Field label={payOut ? t.voucherForm.paidFrom : t.voucherForm.receivedIn}>
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
              {m === 'cash' ? t.voucherForm.cash : t.voucherForm.bank}
            </button>
          ))}
        </div>
      </Field>
      {method === 'bank' && (
        <Field label={t.voucherForm.bankAccount} required>
          <select className={inputClass} value={bankId} onChange={(e) => setBankId(e.target.value)}>
            <option value="">{t.voucherForm.selectBankAccount}</option>
            {bankHeads.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          {bankHeads.length === 0 && (
            <span className="mt-1 block text-xs text-amber-600">
              {t.voucherForm.noBankYet}
            </span>
          )}
        </Field>
      )}
    </>
  );
}
