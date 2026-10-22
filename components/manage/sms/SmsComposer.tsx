'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, CheckCircle2, Contact, Hash, Loader2, Moon, RotateCcw, Search, Send, Users, X, XCircle } from 'lucide-react';
import { Card, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { confirmDialog } from '@/components/admin/confirm';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminsms';
import type { SmsDirectory, SmsDirectoryEntry } from '@/lib/sms/recipients';
import { formatBdPhone, parsePhoneList } from '@/lib/sms/phone';
import {
  renderSmsTemplate,
  smsLength,
  SMS_BATCH_MAX,
  SMS_MAX_CHARS,
  SMS_PLACEHOLDERS,
  type SmsSendResult,
} from '@/lib/sms/message';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 *  Send SMS composer.
 *
 *  Left: recipients — four tabs (Umrah passengers, Hajj pilgrims, care-of /
 *  group leaders, typed numbers) with search, year / care-of filters and
 *  "Select all shown", so one passenger, everyone, chosen leaders or all
 *  leaders are each two clicks. Right: the message with {name}/{due}/…
 *  merge fields, live SMS-part count and a per-recipient preview. Sending
 *  goes in batches of 20 through /api/admin/sms/send with a progress bar
 *  and a per-recipient result list (failed ones can be retried).
 * ------------------------------------------------------------------ */

type Tab = 'umrah' | 'hajj' | 'careof' | 'custom';
type Target = { key: string; name: string; to: string | null; fields: Record<string, string> };

const BATCH = SMS_BATCH_MAX;

export function SmsComposer({
  directory,
  initialSelected,
  senderId,
  configured,
  historyHref,
}: {
  directory: SmsDirectory;
  initialSelected: string[];
  senderId: string;
  configured: boolean;
  historyHref: string;
}) {
  const locale = useLocale();
  const t = getDict(locale);

  const firstKind = initialSelected[0]?.split(':')[0];
  const [tab, setTab] = useState<Tab>(firstKind === 'hajj' || firstKind === 'careof' ? firstKind : 'umrah');
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [careOfFilter, setCareOfFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [customText, setCustomText] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<SmsSendResult[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const byKey = useMemo(() => {
    const m = new Map<string, SmsDirectoryEntry>();
    for (const list of [directory.umrah, directory.hajj, directory.careof]) for (const e of list) m.set(e.key, e);
    return m;
  }, [directory]);

  const years = useMemo(
    () => Array.from(new Set(directory.hajj.map((e) => e.year).filter((y): y is number => !!y))).sort((a, b) => b - a),
    [directory.hajj],
  );
  const careOfOptions = useMemo(
    () => directory.careof.filter((c) => tab === 'careof' || !c.program || c.program === 'both' || c.program === tab),
    [directory.careof, tab],
  );

  // ---- Entries visible in the current tab --------------------------------
  const shown = useMemo(() => {
    if (tab === 'custom') return [] as SmsDirectoryEntry[];
    const q = search.trim().toLowerCase();
    return directory[tab].filter((e) => {
      if (tab === 'hajj' && year && String(e.year ?? '') !== year) return false;
      if (tab !== 'careof' && careOfFilter && e.careOfId !== careOfFilter) return false;
      if (!q) return true;
      return `${e.name} ${e.phone ?? ''} ${formatBdPhone(e.to)} ${e.sub}`.toLowerCase().includes(q);
    });
  }, [directory, tab, search, year, careOfFilter]);

  const custom = useMemo(() => parsePhoneList(customText), [customText]);
  const customValid = custom.filter((c) => c.to);

  // ---- Final recipient list (valid numbers only) --------------------------
  const targets: Target[] = useMemo(() => {
    const out: Target[] = [];
    const seen = new Set<string>();
    for (const key of selected) {
      const e = byKey.get(key);
      if (!e?.to || seen.has(e.to)) continue;
      seen.add(e.to);
      out.push({ key, name: e.name, to: e.to, fields: e.fields as Record<string, string> });
    }
    for (const c of customValid) {
      if (!c.to || seen.has(c.to)) continue;
      seen.add(c.to);
      out.push({ key: `custom:${c.to}`, name: formatBdPhone(c.to), to: c.to, fields: { name: formatBdPhone(c.to) } });
    }
    return out;
  }, [selected, byKey, customValid]);

  const selectedEntries = useMemo(
    () => Array.from(selected).map((k) => byKey.get(k)).filter((e): e is SmsDirectoryEntry => !!e),
    [selected, byKey],
  );

  const len = smsLength(message);
  const previewTarget = targets[0];
  const preview = previewTarget && message.trim() ? renderSmsTemplate(message, previewTarget.fields) : '';
  const previewLen = preview ? smsLength(preview) : len;
  const estimatedSms = targets.length * Math.max(1, previewLen.parts);

  // ---- Selection helpers ---------------------------------------------------
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const selectShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of shown) if (e.to) next.add(e.key);
      return next;
    });
  const clearShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of shown) next.delete(e.key);
      return next;
    });

  const insertPlaceholder = (p: string) => {
    const el = textareaRef.current;
    const token = `{${p}}`;
    if (!el) {
      setMessage((m) => m + token);
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = message.slice(0, start) + token + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  // ---- Sending -------------------------------------------------------------
  async function run(list: Target[]) {
    setSending(true);
    setResults([]);
    setProgress({ done: 0, total: list.length });
    const campaignId = `sms-${Date.now().toString(36)}`;
    const out: SmsSendResult[] = [];
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      try {
        const res = await fetch('/api/admin/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            campaignId,
            recipients: batch.map((r) => ({ key: r.key, phone: r.to ?? undefined, name: r.name })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          const err = (data?.error as string | undefined) ?? t.sendFailed;
          for (const b of batch) out.push({ key: b.key, name: b.name, to: b.to ?? '', ok: false, messageId: null, error: err });
          if (data?.configured === false) {
            toast.error(err);
            setResults([...out]);
            break;
          }
        } else {
          out.push(...((data.results as SmsSendResult[]) ?? []));
        }
      } catch {
        for (const b of batch) out.push({ key: b.key, name: b.name, to: b.to ?? '', ok: false, messageId: null, error: t.networkError });
      }
      setProgress({ done: Math.min(i + BATCH, list.length), total: list.length });
      setResults([...out]);
    }
    setSending(false);
    const sent = out.filter((r) => r.ok).length;
    const failed = out.length - sent;
    if (failed === 0) toast.success(t.doneSummary(sent, failed));
    else toast.warning(t.doneSummary(sent, failed));
  }

  async function send() {
    if (!configured) {
      toast.error(t.notConfiguredTitle);
      return;
    }
    if (!targets.length) {
      toast.error(t.needRecipients);
      return;
    }
    if (!message.trim()) {
      toast.error(t.needMessage);
      return;
    }
    if (len.chars > SMS_MAX_CHARS) {
      toast.error(t.tooLong);
      return;
    }
    if (!(await confirmDialog({ title: t.confirmTitle, message: t.confirm(targets.length), confirmText: t.send }))) return;
    await run(targets);
  }

  async function retryFailed() {
    if (!results) return;
    const failedKeys = new Set(results.filter((r) => !r.ok).map((r) => r.key));
    const list = targets.filter((x) => failedKeys.has(x.key));
    if (!list.length) return;
    await run(list);
  }

  const tabs: { id: Tab; label: string; count: number; icon: typeof Users }[] = [
    { id: 'umrah', label: t.tabUmrah, count: directory.umrah.length, icon: Moon },
    { id: 'hajj', label: t.tabHajj, count: directory.hajj.length, icon: Users },
    { id: 'careof', label: t.tabCareOf, count: directory.careof.length, icon: Contact },
    { id: 'custom', label: t.tabCustom, count: customValid.length, icon: Hash },
  ];

  const sentCount = results?.filter((r) => r.ok).length ?? 0;
  const failedCount = results ? results.length - sentCount : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------------- Recipients ---------------- */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">{t.recipients}</h2>
            <p className="mt-0.5 text-xs text-ink-muted">{t.recipientsHint}</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-600/15">
            {t.selectedCount(targets.length)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setSearch('');
                setCareOfFilter('');
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                tab === id
                  ? 'border-brand-600 bg-brand-600 text-white shadow-emerald'
                  : 'border-border bg-card text-ink-muted hover:border-brand-600/40 hover:text-brand-700',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
              <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', tab === id ? 'bg-white/20' : 'bg-muted')}>{count}</span>
            </button>
          ))}
        </div>

        {tab === 'custom' ? (
          <div className="space-y-2">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={8}
              placeholder={'01712345678\n01812345678'}
              className={cn(inputClass, 'font-mono text-sm')}
            />
            <p className="text-xs text-ink-muted">
              {t.customHint}
              {custom.length > 0 && (
                <>
                  {' · '}
                  <span className="font-semibold text-brand-700">{t.customValid(customValid.length)}</span>
                  {custom.length - customValid.length > 0 && (
                    <>
                      {' · '}
                      <span className="font-semibold text-red-600">{t.customInvalid(custom.length - customValid.length)}</span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[12rem] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.search}
                  className={cn(inputClass, 'h-10 py-2 pl-9')}
                />
              </label>
              {tab === 'hajj' && years.length > 0 && (
                <select value={year} onChange={(e) => setYear(e.target.value)} className={cn(inputClass, 'h-10 w-auto py-2')}>
                  <option value="">{t.allYears}</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
              {tab !== 'careof' && careOfOptions.length > 0 && (
                <select
                  value={careOfFilter}
                  onChange={(e) => setCareOfFilter(e.target.value)}
                  className={cn(inputClass, 'h-10 w-auto max-w-[14rem] py-2')}
                  title={t.membersOf}
                >
                  <option value="">{t.tabCareOf}: —</option>
                  {careOfOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectShown}
                disabled={!shown.length}
                className="inline-flex items-center gap-1 rounded-full border border-brand-600/40 px-3 py-1 font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" /> {t.selectAllShown} ({shown.filter((e) => e.to).length})
              </button>
              <button
                type="button"
                onClick={clearShown}
                disabled={!shown.some((e) => selected.has(e.key))}
                className="rounded-full border border-border px-3 py-1 font-semibold text-ink-muted transition hover:text-ink disabled:opacity-40"
              >
                {t.clearShown}
              </button>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="ml-auto rounded-full border border-border px-3 py-1 font-semibold text-ink-muted transition hover:border-red-300 hover:text-red-600"
                >
                  {t.clearAll}
                </button>
              )}
            </div>

            <ul className="max-h-[26rem] divide-y divide-border/70 overflow-y-auto rounded-xl border border-border bg-card">
              {shown.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-muted">{t.nothingShown}</li>}
              {shown.map((e) => {
                const on = selected.has(e.key);
                const disabled = !e.to;
                return (
                  <li key={e.key}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-muted/50',
                        on && 'bg-brand-50/60',
                        disabled && 'cursor-not-allowed opacity-55',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={on}
                        disabled={disabled}
                        onChange={() => toggle(e.key)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{e.name}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          {e.to ? formatBdPhone(e.to) : <span className="text-red-600">{t.noPhone}</span>}
                          {e.sub ? ` · ${e.sub}` : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {selectedEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedEntries.slice(0, 12).map((e) => (
              <span
                key={e.key}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ink"
              >
                {e.name}
                <button
                  type="button"
                  onClick={() => toggle(e.key)}
                  aria-label={`× ${e.name}`}
                  className="grid h-4 w-4 place-items-center rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedEntries.length > 12 && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">+{selectedEntries.length - 12}</span>
            )}
          </div>
        )}
      </Card>

      {/* ---------------- Message ---------------- */}
      <div className="space-y-6">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-ink">{t.message}</h2>
            <span className="text-xs text-ink-muted">
              {t.sender}:{' '}
              <span className={cn('font-semibold', senderId ? 'text-ink' : 'text-red-600')}>{senderId || t.senderUnset}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-muted">{t.placeholders}:</span>
            {SMS_PLACEHOLDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => insertPlaceholder(p)}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
              >
                {`{${p}}`}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={SMS_MAX_CHARS}
            placeholder={t.messagePlaceholder}
            className={cn(inputClass, 'text-[0.95rem] leading-relaxed')}
          />
          <p className="text-xs text-ink-muted">{t.placeholderHint}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="tabular-nums">
              <span className="font-semibold text-ink">{len.chars}</span> {t.chars}
            </span>
            <span className="text-ink-muted">·</span>
            <span className="font-semibold text-ink">{len.unicode ? t.unicode : t.gsm}</span>
            <span className="text-ink-muted">·</span>
            <span className={cn('font-semibold', len.parts > 1 ? 'text-amber-600' : 'text-ink')}>{t.parts(len.parts)}</span>
            <span className="text-ink-muted">({len.remaining} ↓)</span>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
              {t.preview}
              {previewTarget && preview ? ` — ${t.previewFor(previewTarget.name)}` : ''}
            </p>
            {preview ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{preview}</p>
            ) : (
              <p className="text-sm text-ink-muted">{t.previewEmpty}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-ink">{t.estimate(targets.length, estimatedSms)}</p>
            <Button type="button" onClick={send} disabled={sending || !configured || !targets.length || !message.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? t.sending : t.send}
            </Button>
          </div>

          {sending && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{t.progress(progress.done, progress.total)}</p>
            </div>
          )}
        </Card>

        {results && results.length > 0 && (
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">{t.doneTitle}</h2>
                <p className="text-sm text-ink-muted">{t.doneSummary(sentCount, failedCount)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {failedCount > 0 && !sending && (
                  <Button type="button" size="sm" variant="outline" onClick={retryFailed}>
                    <RotateCcw className="h-4 w-4" /> {t.retryFailed}
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={() => setResults(null)} disabled={sending}>
                  {t.newMessage}
                </Button>
                <Link href={historyHref} className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  {t.viewHistory}
                </Link>
              </div>
            </div>
            <ul className="max-h-72 divide-y divide-border/70 overflow-y-auto rounded-xl border border-border">
              {results.map((r, i) => (
                <li key={`${r.key}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                  {r.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{r.name}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {formatBdPhone(r.to)}
                      {r.error ? ` · ${r.error}` : ''}
                    </span>
                  </span>
                  <span className={cn('text-xs font-bold', r.ok ? 'text-emerald-700' : 'text-red-600')}>
                    {r.ok ? t.resultSent : t.resultFailed}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
