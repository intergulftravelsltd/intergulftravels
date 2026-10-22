import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff } from '@/lib/management/guard';
import { getStaffScope } from '@/lib/management/scope';
import { logActivity, mgmtDb } from '@/lib/management/server';
import { loadSmsConfig } from '@/lib/sms/config';
import { sendViaKhudebarta } from '@/lib/sms/khudebarta';
import { resolveSmsRecipients, type SmsDirectoryEntry } from '@/lib/sms/recipients';
import { normalizeBdPhone } from '@/lib/sms/phone';
import { renderSmsTemplate, smsLength, SMS_BATCH_MAX, SMS_MAX_CHARS, type SmsSendResult } from '@/lib/sms/message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A batch of 20 gateway calls (3 at a time) can take a while on a slow link.
export const maxDuration = 60;

const schema = z.object({
  message: z.string().trim().min(1, 'Type the message first.').max(SMS_MAX_CHARS, 'The message is too long.'),
  /** Groups every batch of one "Send" click. */
  campaignId: z.string().trim().max(60).optional(),
  /** Head office only: send with this agency's gateway settings (test sends). */
  branch: z.string().trim().max(60).optional(),
  recipients: z
    .array(
      z.object({
        /** "umrah:<id>" | "hajj:<id>" | "careof:<id>" | "custom:<phone>" */
        key: z.string().trim().min(1).max(120),
        /** Only used for custom:<phone> keys. */
        phone: z.string().trim().max(40).optional(),
        name: z.string().trim().max(160).optional(),
      }),
    )
    .min(1, 'Pick at least one recipient.')
    .max(SMS_BATCH_MAX),
});

type Target ={ key: string; kind: string; id: string | null; name: string; to: string | null; text: string };

/**
 * Send one message (with {name}/{due}/… merged per recipient) to up to 20
 * recipients. Numbers for passengers, pilgrims and care-ofs are re-read from
 * the database (branch-scoped) — the browser only sends their ids.
 */
export async function POST(request: Request) {
  const guard = await requireStaff();
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.status === 401 ? 'Not signed in.' : 'Staff access required.' },
      { status: guard.status },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' }, { status: 400 });
  }
  const d = parsed.data;

  const scope = await getStaffScope();
  // Branch staff always use their own agency's gateway; the head office may
  // name a concern (its SMS Settings tabs) — 'general' means head office.
  const branch = scope.branch ?? (d.branch && d.branch !== 'general' ? d.branch : null);
  const { config } = await loadSmsConfig(branch);
  if (!config) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'SMS gateway not configured — add the khudebarta keys under SMS Settings.' },
      { status: 400 },
    );
  }

  // ---- Resolve every target to a number + personalised text --------------
  const directoryKeys = d.recipients.map((r) => r.key).filter((k) => !k.startsWith('custom:'));
  const directory = await resolveSmsRecipients(directoryKeys);
  const targets: Target[] = d.recipients.map((r) => {
    if (r.key.startsWith('custom:')) {
      const to = normalizeBdPhone(r.phone ?? r.key.slice('custom:'.length));
      const name = r.name?.trim() || (to ?? r.key.slice('custom:'.length));
      return { key: r.key, kind: 'custom', id: null, name, to, text: renderSmsTemplate(d.message, { name }) };
    }
    const entry: SmsDirectoryEntry | undefined = directory.get(r.key);
    if (!entry) return { key: r.key, kind: r.key.split(':')[0], id: null, name: r.name ?? r.key, to: null, text: d.message };
    return { key: r.key, kind: entry.kind, id: entry.id, name: entry.name, to: entry.to, text: renderSmsTemplate(d.message, entry.fields) };
  });

  // ---- Send (a few at a time; the gateway is one request per number) ----
  const results: SmsSendResult[] = new Array(targets.length);
  const logRows: Record<string, unknown>[] = [];
  const CONCURRENCY = 3;
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length) {
      const i = cursor++;
      const t = targets[i];
      if (!t.to) {
        results[i] = { key: t.key, name: t.name, to: '', ok: false, messageId: null, error: 'No valid mobile number.' };
        continue;
      }
      const r = await sendViaKhudebarta(config, t.to, t.text);
      results[i] = { key: t.key, name: t.name, to: t.to, ok: r.ok, messageId: r.messageId, error: r.ok ? null : r.description };
      logRows.push({
        branch: branch ?? 'general',
        sent_by: guard.user.email,
        campaign_id: d.campaignId ?? null,
        recipient_kind: t.kind,
        recipient_id: t.id,
        recipient_name: t.name,
        phone: t.to,
        message: t.text,
        parts: Math.max(1, smsLength(t.text).parts),
        status: r.ok ? 'sent' : 'failed',
        provider: 'khudebarta',
        provider_message_id: r.messageId,
        provider_status: r.status,
        error: r.ok ? null : r.description,
      });
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

  // ---- Log (best effort — a missing 0013 table never blocks sending) ------
  if (logRows.length) {
    try {
      const { error } = await mgmtDb().from('sms_log').insert(logRows);
      if (error) console.warn('[admin/sms] log skipped (run supabase/migrations/0013_sms_log.sql):', error.message);
    } catch (err) {
      console.warn('[admin/sms] log failed:', err);
    }
  }

  const sent = results.filter((r) => r.ok).length;
  await logActivity({
    user_id: guard.user.id,
    user_email: guard.user.email,
    action: 'sms.send',
    entity: 'sms',
    entity_id: d.campaignId,
    detail: { sent, failed: results.length - sent, sender: config.senderId },
    branch: branch ?? 'general',
  });

  return NextResponse.json({ ok: true, sent, failed: results.length - sent, results });
}
