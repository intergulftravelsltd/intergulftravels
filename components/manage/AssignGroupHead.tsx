'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Users, X } from 'lucide-react';
import { inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/components/providers/LocaleProvider';

export type HeadOption = { id: string; name: string; ref: string };

const L = {
  en: {
    hint: 'Pick the family/group head — this account will be counted under theirs permanently, like a package assignment.',
    search: 'Search head by name / no…',
    select: 'Select group head…',
    save: 'Add to group',
    saving: 'Saving…',
    detach: 'Remove from group',
    detaching: 'Removing…',
    linked: 'Added to the group — the combined statement now shows below.',
    detached: 'Removed from the group.',
    needHead: 'Select a group head first.',
    fail: 'Could not save the group link.',
    network: 'Network error. Please try again.',
    memberOf: 'Group head:',
    isHead: (n: number) => `This person is a group head — ${n} member${n === 1 ? '' : 's'} under them.`,
  },
  bn: {
    hint: 'পরিবার/গ্রুপের প্রধান বাছাই করুন — প্যাকেজ অ্যাসাইনের মতোই এই হিসাবটা স্থায়ীভাবে ওনার অধীনে গণনা হবে।',
    search: 'নাম / নম্বর দিয়ে প্রধান খুঁজুন…',
    select: 'গ্রুপ প্রধান বাছাই করুন…',
    save: 'গ্রুপে যুক্ত করুন',
    saving: 'সংরক্ষণ হচ্ছে…',
    detach: 'গ্রুপ থেকে সরান',
    detaching: 'সরানো হচ্ছে…',
    linked: 'গ্রুপে যুক্ত হয়েছে — নিচে সম্মিলিত হিসাব দেখা যাচ্ছে।',
    detached: 'গ্রুপ থেকে সরানো হয়েছে।',
    needHead: 'আগে গ্রুপ প্রধান বাছাই করুন।',
    fail: 'গ্রুপ লিংক সংরক্ষণ করা যায়নি।',
    network: 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।',
    memberOf: 'গ্রুপ প্রধান:',
    isHead: (n: number) => `ইনি নিজেই একটি গ্রুপের প্রধান — ওনার অধীনে ${n} জন সদস্য।`,
  },
};

/** Assign / detach the permanent group head for one pilgrim or passenger. */
export function AssignGroupHead({
  table,
  personId,
  currentHead,
  memberCount,
  options,
}: {
  table: 'hajj' | 'umrah';
  personId: string;
  /** The current head when this person is a member of a group. */
  currentHead: { id: string; name: string } | null;
  /** How many members point at this person (they are a head themselves). */
  memberCount: number;
  options: HeadOption[];
}) {
  const router = useRouter();
  const t = L[useLocale()];
  const [search, setSearch] = useState('');
  const [headId, setHeadId] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.name} ${o.ref}`.toLowerCase().includes(q));
  }, [options, search]);

  async function submit(nextHeadId: string | null) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/group-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, member_id: personId, head_id: nextHeadId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.fail);
        return;
      }
      toast.success(nextHeadId ? t.linked : t.detached);
      setHeadId('');
      router.refresh();
    } catch {
      toast.error(t.network);
    } finally {
      setBusy(false);
    }
  }

  if (memberCount > 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-brand-50/60 px-3.5 py-2.5 text-sm font-medium text-brand-700">
        <Users className="h-4 w-4 shrink-0" /> {t.isHead(memberCount)}
      </p>
    );
  }

  if (currentHead) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink">
          {t.memberOf} <span className="font-semibold text-brand-700">{currentHead.name}</span>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => submit(null)} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          {busy ? t.detaching : t.detach}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">{t.hint}</p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.search}
        className={inputClass}
      />
      <div className="flex flex-wrap items-center gap-3">
        <select value={headId} onChange={(e) => setHeadId(e.target.value)} className={`${inputClass} max-w-xs`}>
          <option value="">{t.select}</option>
          {filtered.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.ref ? ` · ${o.ref}` : ''}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          onClick={() => (headId ? submit(headId) : toast.error(t.needHead))}
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {busy ? t.saving : t.save}
        </Button>
      </div>
    </div>
  );
}
