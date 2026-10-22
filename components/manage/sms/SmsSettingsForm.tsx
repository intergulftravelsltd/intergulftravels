'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, Send, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card, Field, inputClass } from '@/components/manage/ui';
import { Button } from '@/components/ui/Button';
import { confirmDialog } from '@/components/admin/confirm';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminsms';
import type { SmsConfigPublic } from '@/lib/sms/config';
import { normalizeBdPhone, formatBdPhone } from '@/lib/sms/phone';
import { cn } from '@/lib/utils';

/**
 * khudebarta.com gateway settings for one agency. Keys are write-only: the
 * form only ever learns whether a key is saved (and its last 4 characters).
 */
export function SmsSettingsForm({ initial, companyName }: { initial: SmsConfigPublic; companyName: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = getDict(locale);
  const [cfg, setCfg] = useState<SmsConfigPublic>(initial);
  const [senderId, setSenderId] = useState(initial.senderId);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [apiUrl, setApiUrl] = useState(initial.apiUrl);
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testMessage, setTestMessage] = useState(t.testDefault.replace('{company}', companyName));
  const [testing, setTesting] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sms/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: cfg.branch, senderId, apiKey, secretKey, apiUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.saveFailed);
        return;
      }
      if (data.config) setCfg(data.config as SmsConfigPublic);
      setApiKey('');
      setSecretKey('');
      toast.success(t.saved);
      router.refresh();
    } catch {
      toast.error(t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!(await confirmDialog({ message: t.resetConfirm, confirmText: t.reset, danger: true }))) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sms/settings?branch=${encodeURIComponent(cfg.branch)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? t.saveFailed);
        return;
      }
      if (data.config) {
        const next = data.config as SmsConfigPublic;
        setCfg(next);
        setSenderId(next.senderId);
        setApiUrl(next.apiUrl);
      }
      toast.success(t.resetDone);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    const to = normalizeBdPhone(testTo);
    if (!to) {
      toast.error(t.invalidPhone);
      return;
    }
    if (!testMessage.trim()) {
      toast.error(t.needMessage);
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          branch: cfg.branch,
          campaignId: 'test',
          recipients: [{ key: `custom:${to}`, phone: to, name: 'Test' }],
        }),
      });
      const data = await res.json().catch(() => ({}));
      const result = data?.results?.[0] as { ok?: boolean; error?: string | null } | undefined;
      if (!res.ok || !data?.ok || !result?.ok) {
        toast.error(`${t.testFailed}: ${result?.error ?? data?.error ?? t.sendFailed}`);
        return;
      }
      toast.success(t.testSent(formatBdPhone(to)));
    } catch {
      toast.error(t.networkError);
    } finally {
      setTesting(false);
    }
  }

  const sourceText =
    cfg.source === 'branch'
      ? t.sourceBranch
      : cfg.source === 'general'
        ? t.sourceGeneral
        : cfg.source === 'env'
          ? t.sourceEnv
          : t.sourceNone;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t.gateway}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.gatewayHint}</p>
        </div>

        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm',
            cfg.configured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
          )}
        >
          {cfg.configured ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{sourceText}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.senderIdLabel} required className="sm:col-span-2">
            <input
              className={inputClass}
              value={senderId}
              maxLength={20}
              placeholder={t.senderIdPlaceholder}
              onChange={(e) => setSenderId(e.target.value)}
            />
          </Field>
          <Field label={t.apiKey} required={!cfg.hasApiKey} hint={cfg.hasApiKey ? `${t.keepExisting} (${cfg.apiKeyHint})` : undefined}>
            <input
              className={inputClass}
              type="password"
              autoComplete="off"
              value={apiKey}
              maxLength={200}
              placeholder={cfg.hasApiKey ? cfg.apiKeyHint : ''}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </Field>
          <Field label={t.secretKey} required={!cfg.hasSecretKey} hint={cfg.hasSecretKey ? t.keepExisting : undefined}>
            <input
              className={inputClass}
              type="password"
              autoComplete="off"
              value={secretKey}
              maxLength={200}
              placeholder={cfg.hasSecretKey ? '••••••••' : ''}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </Field>
          <Field label={t.apiUrl} hint={t.apiUrlHint} className="sm:col-span-2">
            <input className={cn(inputClass, 'font-mono text-sm')} value={apiUrl} maxLength={200} onChange={(e) => setApiUrl(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" disabled={saving || !(cfg.hasApiKey || cfg.hasSecretKey)} onClick={reset}>
            <RotateCcw className="h-4 w-4" /> {t.reset}
          </Button>
          <Button type="button" onClick={save} disabled={saving || !senderId.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 self-start">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand-700" />
          <h2 className="font-display text-base font-semibold text-ink">{t.testTitle}</h2>
        </div>
        <p className="text-sm text-ink-muted">{t.testHint}</p>
        <Field label={t.testPhone}>
          <input className={inputClass} value={testTo} inputMode="tel" placeholder="01XXXXXXXXX" onChange={(e) => setTestTo(e.target.value)} />
        </Field>
        <Field label={t.testMessage}>
          <textarea className={inputClass} rows={3} value={testMessage} maxLength={300} onChange={(e) => setTestMessage(e.target.value)} />
        </Field>
        <Button type="button" variant="outline" size="sm" disabled={testing || !cfg.configured} onClick={sendTest}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t.testSend}
        </Button>
      </Card>
    </div>
  );
}
