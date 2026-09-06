'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Search, Users, Printer } from 'lucide-react';
import { Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { money } from '@/lib/management/format';
import { useLocale } from '@/components/providers/LocaleProvider';
import { localizedPath } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type GroupMember = {
  id: string;
  name: string;
  sub: string;
  branch: string;
  due: number;
  hasHead: boolean;
};

export type BankOption = { id: string; name: string };

const L = {
  en: {
    tabHajj: 'Hajj',
    tabUmrah: 'Umrah',
    members: 'Select members',
    membersHint: 'Tick everyone covered by this payment, then set each amount.',
    search: 'Search name / tracking / phone…',
    due: 'Due',
    noHead: 'no account yet — open the profile once',
    selected: 'Selected members & amounts',
    noneSelected: 'No members selected yet.',
    amount: 'Amount (৳)',
    fillDue: 'Fill due',
    payer: 'Payment in the name of (payer)',
    payerHint: 'The single person the combined receipt is issued to — e.g. the family head.',
    payerCustom: 'Someone else (type the name)',
    payerName: 'Payer name',
    payerPhone: 'Payer phone',
    method: 'Method',
    cash: 'Cash',
    bank: 'Bank',
    bankAccount: 'Bank account',
    selectAccount: 'Select account…',
    type: 'Payment type',
    typeInstallment: 'Installment',
    typeAdvance: 'Advance',
    typeToken: 'Token money',
    typeFull: 'Full payment',
    date: 'Date',
    note: 'Note',
    notePlaceholder: 'Optional note for the receipts',
    total: 'Total',
    submit: 'Record group payment',
    submitting: 'Recording…',
    needMembers: 'Select at least one member.',
    needAmounts: 'Every selected member needs an amount greater than zero.',
    needPayer: 'Enter the payer name.',
    needBank: 'Select a bank account.',
    success: 'Group payment recorded — opening the combined receipt.',
    fail: 'Could not record the group payment.',
    network: 'Network error. Please try again.',
  },
  bn: {
    tabHajj: 'হজ',
    tabUmrah: 'উমরাহ',
    members: 'সদস্য নির্বাচন করুন',
    membersHint: 'এই পেমেন্টে যাদের টাকা দেওয়া হচ্ছে সবাইকে টিক দিন, তারপর প্রত্যেকের পরিমাণ বসান।',
    search: 'নাম / ট্র্যাকিং / ফোন খুঁজুন…',
    due: 'বকেয়া',
    noHead: 'হিসাব খোলা হয়নি — একবার প্রোফাইল খুলুন',
    selected: 'নির্বাচিত সদস্য ও পরিমাণ',
    noneSelected: 'এখনও কোনো সদস্য নির্বাচন হয়নি।',
    amount: 'পরিমাণ (৳)',
    fillDue: 'বকেয়া বসান',
    payer: 'যার নামে পেমেন্ট (পরিশোধকারী)',
    payerHint: 'সম্মিলিত রসিদ যার নামে হবে — যেমন পরিবারের প্রধান।',
    payerCustom: 'অন্য কেউ (নাম লিখুন)',
    payerName: 'পরিশোধকারীর নাম',
    payerPhone: 'পরিশোধকারীর ফোন',
    method: 'মাধ্যম',
    cash: 'নগদ',
    bank: 'ব্যাংক',
    bankAccount: 'ব্যাংক অ্যাকাউন্ট',
    selectAccount: 'অ্যাকাউন্ট বাছাই করুন…',
    type: 'পেমেন্টের ধরন',
    typeInstallment: 'কিস্তি',
    typeAdvance: 'অগ্রিম',
    typeToken: 'টোকেন মানি',
    typeFull: 'সম্পূর্ণ পরিশোধ',
    date: 'তারিখ',
    note: 'নোট',
    notePlaceholder: 'রসিদের জন্য ঐচ্ছিক নোট',
    total: 'মোট',
    submit: 'গ্রুপ পেমেন্ট রেকর্ড করুন',
    submitting: 'রেকর্ড হচ্ছে…',
    needMembers: 'অন্তত একজন সদস্য নির্বাচন করুন।',
    needAmounts: 'নির্বাচিত প্রত্যেক সদস্যের পরিমাণ শূন্যের বেশি দিন।',
    needPayer: 'পরিশোধকারীর নাম দিন।',
    needBank: 'ব্যাংক অ্যাকাউন্ট বাছাই করুন।',
    success: 'গ্রুপ পেমেন্ট রেকর্ড হয়েছে — সম্মিলিত রসিদ খুলছে।',
    fail: 'গ্রুপ পেমেন্ট রেকর্ড করা যায়নি।',
    network: 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',
  },
};

/**
 * Bulk payment form: pick several hajj/umrah members, set per-member amounts,
 * choose the single payer the combined receipt is issued to, and record all
 * payments in one go.
 */
export function GroupPaymentForm({
  hajjMembers,
  umrahMembers,
  bankAccounts,
  initialTable,
  noBankText,
}: {
  hajjMembers: GroupMember[];
  umrahMembers: GroupMember[];
  bankAccounts: BankOption[];
  initialTable: 'hajj' | 'umrah';
  noBankText: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = L[locale];

  const [table, setTable] = useState<'hajj' | 'umrah'>(initialTable);
  const [search, setSearch] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [payerId, setPayerId] = useState<string>(''); // member id or 'custom'
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [bankId, setBankId] = useState('');
  const [payType, setPayType] = useState('installment');
  const [manualRef, setManualRef] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const members = table === 'hajj' ? hajjMembers : umrahMembers;
  const selectedIds = Object.keys(amounts);
  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
  const total = selectedMembers.reduce((s, m) => s + (Number(amounts[m.id]) || 0), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => `${m.name} ${m.sub}`.toLowerCase().includes(q));
  }, [members, search]);

  function switchTable(next: 'hajj' | 'umrah') {
    if (next === table) return;
    setTable(next);
    setAmounts({});
    setPayerId('');
  }

  function toggle(m: GroupMember) {
    if (!m.hasHead) return;
    setAmounts((prev) => {
      const next = { ...prev };
      if (m.id in next) {
        delete next[m.id];
        if (payerId === m.id) setPayerId('');
      } else {
        next[m.id] = m.due > 0 ? String(m.due) : '';
        if (!payerId) setPayerId(m.id);
      }
      return next;
    });
  }

  const resolvedPayerName =
    payerId === 'custom' ? payerName.trim() : members.find((m) => m.id === payerId)?.name ?? '';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    if (selectedMembers.length === 0) return void toast.error(t.needMembers);
    if (selectedMembers.some((m) => !(Number(amounts[m.id]) > 0))) return void toast.error(t.needAmounts);
    if (!resolvedPayerName) return void toast.error(t.needPayer);
    if (method === 'bank' && !bankId) return void toast.error(t.needBank);

    setSaving(true);
    try {
      const res = await fetch('/api/admin/group-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table,
          payer_name: resolvedPayerName,
          payer_phone: payerPhone.trim() || null,
          method,
          bank_account_id: method === 'bank' ? bankId : null,
          type: payType,
          date,
          narration: note.trim() || null,
          manual_ref: manualRef.trim() || null,
          items: selectedMembers.map((m) => ({ id: m.id, amount: Number(amounts[m.id]) })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.fail);
        return;
      }
      toast.success(t.success);
      if (data.receiptUrl) window.open(localizedPath(locale, data.receiptUrl), '_blank', 'noopener');
      setAmounts({});
      setPayerId('');
      setNote('');
      router.refresh();
    } catch {
      toast.error(t.network);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      {/* Left: member picker */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Users className="h-4 w-4 text-brand-600" /> {t.members}
          </h2>
          <div className="flex rounded-full border border-border p-0.5 text-xs font-semibold">
            {(['hajj', 'umrah'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTable(tab)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 transition',
                  table === tab ? 'bg-brand-600 text-white' : 'text-ink-muted hover:text-brand-700',
                )}
              >
                {tab === 'hajj' ? t.tabHajj : t.tabUmrah}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-xs text-ink-muted">{t.membersHint}</p>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="max-h-[26rem] space-y-1 overflow-auto pr-1">
          {filtered.map((m) => {
            const on = m.id in amounts;
            return (
              <label
                key={m.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition',
                  on ? 'border-brand-600 bg-brand-50/60' : 'border-border hover:border-brand-600/40',
                  !m.hasHead && 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" checked={on} onChange={() => toggle(m)} disabled={!m.hasHead} className="h-4 w-4 accent-brand-600" />
                  <span>
                    <span className="block font-medium text-ink">{m.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {m.sub || '—'}
                      {!m.hasHead && ` · ${t.noHead}`}
                    </span>
                  </span>
                </span>
                {m.due > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-red-600">
                    {t.due}: {money(m.due)}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </section>

      {/* Right: amounts + payer + method */}
      <section className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">{t.selected}</h2>
          {selectedMembers.length === 0 ? (
            <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-ink-muted">{t.noneSelected}</p>
          ) : (
            <div className="space-y-2">
              {selectedMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="truncate text-xs text-ink-muted">{m.sub || '—'}</p>
                  </div>
                  {m.due > 0 && Number(amounts[m.id] || 0) !== m.due && (
                    <button
                      type="button"
                      onClick={() => setAmounts((prev) => ({ ...prev, [m.id]: String(m.due) }))}
                      className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
                    >
                      {t.fillDue}
                    </button>
                  )}
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={amounts[m.id] ?? ''}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="0"
                    aria-label={`${t.amount} — ${m.name}`}
                    className={`${inputClass} w-32 shrink-0 text-right`}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-ink">{t.total}</span>
                <span className="text-lg font-bold text-brand-700">{money(total)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.payer} required hint={t.payerHint} className="sm:col-span-2">
              <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {selectedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
                <option value="custom">{t.payerCustom}</option>
              </select>
            </Field>
            {payerId === 'custom' && (
              <Field label={t.payerName} required>
                <input value={payerName} onChange={(e) => setPayerName(e.target.value)} className={inputClass} />
              </Field>
            )}
            <Field label={t.payerPhone}>
              <input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} className={inputClass} placeholder="01XXXXXXXXX" inputMode="tel" />
            </Field>
            <Field label={t.method} required>
              <select value={method} onChange={(e) => setMethod(e.target.value as 'cash' | 'bank')} className={inputClass}>
                <option value="cash">{t.cash}</option>
                <option value="bank">{t.bank}</option>
              </select>
            </Field>
            {method === 'bank' && (
              <Field label={t.bankAccount} required>
                <select value={bankId} onChange={(e) => setBankId(e.target.value)} className={inputClass}>
                  <option value="">{t.selectAccount}</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {bankAccounts.length === 0 && <span className="mt-1 block text-xs text-red-600">{noBankText}</span>}
              </Field>
            )}
            <Field label={t.type}>
              <select value={payType} onChange={(e) => setPayType(e.target.value)} className={inputClass}>
                <option value="installment">{t.typeInstallment}</option>
                <option value="advance">{t.typeAdvance}</option>
                <option value="token">{t.typeToken}</option>
                <option value="full">{t.typeFull}</option>
              </select>
            </Field>
            <Field label={t.date}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label={locale === 'bn' ? 'ম্যানুয়াল রসিদ নং' : 'Manual Receipt No.'}>
              <input
                value={manualRef}
                maxLength={60}
                onChange={(e) => setManualRef(e.target.value)}
                className={inputClass}
                placeholder={locale === 'bn' ? 'কাগজের মানি রিসিটের নম্বর (ঐচ্ছিক)' : 'Number on the paper money receipt (optional)'}
              />
            </Field>
            <Field label={t.note}>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder={t.notePlaceholder} />
            </Field>
          </div>

          <div className="mt-5">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              {saving ? t.submitting : t.submit}
            </Button>
          </div>
        </div>
      </section>
    </form>
  );
}
