import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed, no-database share links for a pilgrim's public form page.
 * Token = `<uuid>.<hmac>` where the HMAC is keyed off a server secret, so the
 * link works from anywhere without login, can't be guessed, and needs no
 * schema change or stored token.
 */

type ShareTable = 'hajj' | 'umrah';

function secret(): string {
  return (
    process.env.SHARE_LINK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'inter-gulf-share'
  );
}

function sign(table: ShareTable, id: string): string {
  return createHmac('sha256', secret()).update(`share:${table}:${id}`).digest('base64url').slice(0, 24);
}

/** Public path (relative) for a pilgrim's shareable form. */
export function sharePath(table: ShareTable, id: string): string {
  return `/share/${table}/${id}.${sign(table, id)}`;
}

/** Verify a `<uuid>.<sig>` token; returns the record id or null. */
export function verifyShareToken(table: ShareTable, token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(table, id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  try {
    return timingSafeEqual(a, b) ? id : null;
  } catch {
    return null;
  }
}
