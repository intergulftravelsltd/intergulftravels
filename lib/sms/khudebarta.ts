import { DEFAULT_SMS_API_URL, FALLBACK_SMS_API_URL, type SmsConfig } from '@/lib/sms/config';

/* ------------------------------------------------------------------ *
 *  khudebarta.com HTTP gateway (server-only).
 *
 *    POST <apiUrl>/sendtext
 *    { apikey, secretkey, callerID, toUser, messageContent }
 *    → { Status: "0" | "-NN", StatusDescription, Message_ID }
 *
 *  The gateway answers HTTP 200 even on failure — success is Status "0".
 *  Their HTTPS port (3770) has had an expired certificate before, so a
 *  network/TLS failure on the default URL falls back once to the vendor's
 *  documented plain-HTTP port (3775), form-encoded exactly as their own
 *  WordPress plugin posts it.
 * ------------------------------------------------------------------ */

export type GatewayResult = {
  ok: boolean;
  /** Vendor status code as text ("0" = sent). */
  status: string;
  description: string;
  messageId: string | null;
  endpoint: string;
};

const REQUEST_TIMEOUT_MS = 15_000;

/** Friendly text for the codes the vendor documents; anything else shows the code. */
const KNOWN_STATUS: Record<string, string> = {
  '0': 'Sent',
  '-3': 'Invalid destination number',
  '-55': 'Destination number is empty',
  '-44': 'This number is blocked',
  '-45': 'This number is blocked by the gateway admin',
  '-62': 'Gateway internal error — try again',
  '-66': 'Invalid API key or secret key',
  '-1': 'Request rejected by the gateway',
  '-4': 'Account problem at the gateway',
  '-5': 'Insufficient SMS balance',
  '-6': 'Account problem at the gateway',
  '-7': 'Account problem at the gateway',
  '-42': 'Sender id (masking name) not approved',
  '-52': 'Sender id (masking name) problem',
  '-54': 'Account problem at the gateway',
  '-59': 'Account problem at the gateway',
  '-64': 'Server IP not allowed by the gateway',
  '-67': 'Account problem at the gateway',
};

type GatewayResponse = { Status?: unknown; StatusDescription?: unknown; Message_ID?: unknown };

function describe(status: string, description: unknown): string {
  if (typeof description === 'string' && description.trim()) return description.trim();
  return KNOWN_STATUS[status] ?? `Gateway error (code ${status})`;
}

async function post(endpoint: string, payload: Record<string, string>, encoding: 'json' | 'form'): Promise<GatewayResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers:
      encoding === 'json'
        ? { 'content-type': 'application/json', accept: 'application/json' }
        : { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: encoding === 'json' ? JSON.stringify(payload) : new URLSearchParams(payload).toString(),
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  let body: GatewayResponse | null = null;
  try {
    body = JSON.parse(text) as GatewayResponse;
  } catch {
    body = null;
  }
  if (!body || (body.Status === undefined && body.StatusDescription === undefined)) {
    return {
      ok: false,
      status: `http-${res.status}`,
      description: `Unexpected reply from the gateway (HTTP ${res.status})${text ? `: ${text.slice(0, 140)}` : ''}`,
      messageId: null,
      endpoint,
    };
  }
  const status = typeof body.Status === 'string' || typeof body.Status === 'number' ? String(body.Status) : '';
  const messageId =
    typeof body.Message_ID === 'string' || typeof body.Message_ID === 'number' ? String(body.Message_ID) : null;
  const ok = status === '0';
  return { ok, status: status || 'unknown', description: ok ? 'Sent' : describe(status || 'unknown', body.StatusDescription), messageId, endpoint };
}

function networkFailure(err: unknown, endpoint: string): GatewayResult {
  const cause = (err as { cause?: { code?: string } } | null)?.cause?.code;
  const name = (err as { name?: string } | null)?.name;
  const reason =
    name === 'TimeoutError' || name === 'AbortError'
      ? 'the gateway did not answer in time'
      : cause
        ? `network error ${cause}`
        : (err as Error)?.message || 'network error';
  return { ok: false, status: 'network', description: `Could not reach the SMS gateway (${reason}).`, messageId: null, endpoint };
}

/** Send one SMS. Never throws — every outcome is a GatewayResult. */
export async function sendViaKhudebarta(cfg: SmsConfig, to: string, text: string): Promise<GatewayResult> {
  const base = (cfg.apiUrl || DEFAULT_SMS_API_URL).replace(/\/+$/, '');
  const payload = {
    apikey: cfg.apiKey,
    secretkey: cfg.secretKey,
    callerID: cfg.senderId,
    toUser: to,
    messageContent: text,
  };
  try {
    return await post(`${base}/sendtext`, payload, 'json');
  } catch (err) {
    if (base !== DEFAULT_SMS_API_URL) return networkFailure(err, `${base}/sendtext`);
    // HTTPS port unreachable (expired certificate, port filtered …) → the
    // vendor's plain-HTTP port, posted the way their official plugin does.
    const fallback = `${FALLBACK_SMS_API_URL}/sendtext`;
    try {
      return await post(fallback, payload, 'form');
    } catch (err2) {
      return networkFailure(err2, fallback);
    }
  }
}
