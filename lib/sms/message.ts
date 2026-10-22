/* ------------------------------------------------------------------ *
 *  SMS text helpers shared by the composer (client) and the send route
 *  (server): {placeholder} merge fields and the GSM-7 / Unicode part
 *  count that decides how many SMS a message costs.
 * ------------------------------------------------------------------ */

/** Merge fields a message may use; each recipient supplies its own values. */
export const SMS_PLACEHOLDERS = ['name', 'due', 'paid', 'package', 'passport', 'tracking'] as const;
export type SmsPlaceholder = (typeof SMS_PLACEHOLDERS)[number];
export type SmsFields = Partial<Record<SmsPlaceholder, string>>;

/** "Dear {name}, your due is Tk {due}" → with the recipient's values. Unknown keys stay as typed. */
export function renderSmsTemplate(template: string, fields: SmsFields): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = (fields as Record<string, string | undefined>)[key];
    return v === undefined ? match : v;
  });
}

// GSM 03.38 basic character set (one septet each) + the extension table (two septets each).
const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM7_EXT = '^{}\\[~]|€';

export type SmsLength = {
  /** Characters as the user sees them (code units). */
  chars: number;
  /** True when any character forces the 16-bit alphabet (Bangla, emoji, smart quotes …). */
  unicode: boolean;
  /** Number of SMS segments this text is billed as. */
  parts: number;
  /** Characters allowed per segment at the current part count. */
  perPart: number;
  /** Characters left before the next segment starts. */
  remaining: number;
};

/**
 * Segment maths: GSM-7 texts fit 160 characters in one SMS (153 per part when
 * split); anything outside GSM-7 — all Bangla — switches to Unicode: 70 in
 * one SMS, 67 per part when split.
 */
export function smsLength(text: string): SmsLength {
  let unicode = false;
  let septets = 0;
  for (const ch of text) {
    if (GSM7_BASIC.includes(ch)) septets += 1;
    else if (GSM7_EXT.includes(ch)) septets += 2;
    else {
      unicode = true;
      break;
    }
  }
  const chars = unicode ? text.length : septets;
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  if (chars === 0) return { chars: 0, unicode, parts: 0, perPart: single, remaining: single };
  if (chars <= single) return { chars, unicode, parts: 1, perPart: single, remaining: single - chars };
  const parts = Math.ceil(chars / multi);
  return { chars, unicode, parts, perPart: multi, remaining: parts * multi - chars };
}

/** Hard cap on one message (10 Unicode parts) so a stray paste never bills hundreds of SMS. */
export const SMS_MAX_CHARS = 670;

/** The composer sends recipients to /api/admin/sms/send in batches of this size. */
export const SMS_BATCH_MAX = 20;

/** One line of the send route's reply — per recipient. */
export type SmsSendResult = {
  key: string;
  name: string;
  to: string;
  ok: boolean;
  messageId: string | null;
  error: string | null;
};
