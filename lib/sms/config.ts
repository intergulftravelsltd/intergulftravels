import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';

/* ------------------------------------------------------------------ *
 *  SMS gateway settings — khudebarta.com masking SMS.
 *
 *  Multi-tenant like the Company Profile: each agency (branch) keeps its
 *  own API key, secret and sender id (the masking name) in site_settings
 *  under `sms_gateway:<branch>`; the head office's `sms_gateway:general`
 *  is the fallback, and KHUDEBARTA_* environment variables the fallback
 *  after that. Server-only — never ship the keys to the browser.
 * ------------------------------------------------------------------ */

export const SMS_CONFIG_PREFIX = 'sms_gateway:';
export const DEFAULT_SMS_API_URL = 'https://portal.khudebarta.com:3770';
/** The vendor's documented plain-HTTP port — used only if the HTTPS port fails. */
export const FALLBACK_SMS_API_URL = 'http://portal.khudebarta.com:3775';

export type SmsConfig = {
  apiKey: string;
  secretKey: string;
  /** Masking sender id (callerID), e.g. "MOKBUL HAJJ". */
  senderId: string;
  apiUrl: string;
};

export type SmsConfigSource = 'branch' | 'general' | 'env' | 'none';

/** What the settings form may see: no secrets, just whether they are set. */
export type SmsConfigPublic = {
  branch: string;
  senderId: string;
  apiUrl: string;
  hasApiKey: boolean;
  apiKeyHint: string;
  hasSecretKey: boolean;
  /** Where the effective config for this branch comes from. */
  source: SmsConfigSource;
  configured: boolean;
};

export const smsConfigKey = (branch: string) => `${SMS_CONFIG_PREFIX}${branch}`;

function clean(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function fromEnv(): SmsConfig | null {
  const apiKey = clean(process.env.KHUDEBARTA_API_KEY);
  const secretKey = clean(process.env.KHUDEBARTA_SECRET_KEY);
  const senderId = clean(process.env.KHUDEBARTA_SENDER_ID);
  if (!apiKey || !secretKey || !senderId) return null;
  return { apiKey, secretKey, senderId, apiUrl: clean(process.env.KHUDEBARTA_API_URL) || DEFAULT_SMS_API_URL };
}

/** The raw stored record for one branch (partial — fields may be blank). */
export async function readStoredSmsConfig(branch: string): Promise<Partial<SmsConfig> | null> {
  try {
    const db = createAdminClient();
    const { data } = await db.from('site_settings').select('value').eq('key', smsConfigKey(branch)).maybeSingle();
    const v = data?.value;
    if (!v || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    return {
      apiKey: clean(o.apiKey),
      secretKey: clean(o.secretKey),
      senderId: clean(o.senderId),
      apiUrl: clean(o.apiUrl),
    };
  } catch {
    return null;
  }
}

function complete(p: Partial<SmsConfig> | null): SmsConfig | null {
  if (!p?.apiKey || !p.secretKey || !p.senderId) return null;
  return { apiKey: p.apiKey, secretKey: p.secretKey, senderId: p.senderId, apiUrl: p.apiUrl || DEFAULT_SMS_API_URL };
}

/**
 * Effective gateway config for a branch (null = head office): the branch's
 * own settings, else the head office's, else the environment.
 */
export const loadSmsConfig = cache(async function loadSmsConfig(
  branch?: string | null,
): Promise<{ config: SmsConfig | null; source: SmsConfigSource }> {
  const own = branch ? complete(await readStoredSmsConfig(branch)) : null;
  if (own) return { config: own, source: 'branch' };
  const general = complete(await readStoredSmsConfig('general'));
  if (general) return { config: general, source: branch ? 'general' : 'branch' };
  const env = fromEnv();
  if (env) return { config: env, source: 'env' };
  return { config: null, source: 'none' };
});

/** Settings-form view of a branch's config — secrets reduced to "set / last 4". */
export async function loadSmsConfigPublic(branch: string): Promise<SmsConfigPublic> {
  const stored = await readStoredSmsConfig(branch);
  const effective = await loadSmsConfig(branch === 'general' ? null : branch);
  const apiKey = stored?.apiKey ?? '';
  return {
    branch,
    senderId: stored?.senderId || effective.config?.senderId || '',
    apiUrl: stored?.apiUrl || DEFAULT_SMS_API_URL,
    hasApiKey: !!apiKey,
    apiKeyHint: apiKey ? `••••${apiKey.slice(-4)}` : '',
    hasSecretKey: !!stored?.secretKey,
    source: effective.source,
    configured: !!effective.config,
  };
}
