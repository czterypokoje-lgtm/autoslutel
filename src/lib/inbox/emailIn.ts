import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Inbound e-mail through Resend (the provider we already send with).
 *
 * The mailbox itself stays at Google Workspace: info@ keeps working exactly as
 * now. A Gmail forwarding rule copies each incoming mail to the CRM address
 * (INBOX_EMAIL, on a subdomain whose MX points at Resend), Resend posts an
 * `email.received` webhook, and we fetch the body here. Nothing about the
 * existing mailbox changes, so turning this off is deleting one filter.
 *
 * Env: RESEND_API_KEY (exists), RESEND_WEBHOOK_SECRET (whsec_… from the Resend
 * webhook page), INBOX_EMAIL (the forwarding target, e.g. crm@in.autosleutel24.nl).
 */

const TOLERANCE_SECS = 5 * 60;

/** Svix signature as Resend sends it: HMAC-SHA256 of "id.timestamp.body" with the base64 part of whsec_. */
export function verifySvix(rawBody: string, headers: Headers, secret: string | undefined): boolean {
  if (!secret) return false;
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigs = headers.get('svix-signature');
  if (!id || !ts || !sigs) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > TOLERANCE_SECS) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest();
  return sigs.split(' ').some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export interface ReceivedEmail {
  id: string;
  from: string;
  fromName: string | null;
  to: string[];
  subject: string;
  text: string;
  messageId: string | null;
  references: string[];
  headers: Record<string, string>;
  attachments: { filename: string; content_type?: string }[];
}

const parseAddress = (raw: string): { email: string; name: string | null } => {
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { email: m[2].trim().toLowerCase(), name: m[1].trim() || null };
  return { email: raw.trim().toLowerCase(), name: null };
};

const messageIds = (value: string | undefined) => (value ? value.match(/<[^>]+>/g) ?? [] : []);

/** Very small HTML → text for mails without a text part. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The part the customer typed, without the quoted history under it. Gmail and
 * Outlook both introduce the quote with a line we can recognise; failing that,
 * the first run of `>` lines ends the new text.
 */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) break;
    if (/^(Op|On) .{3,160}\b(schreef|wrote)\b.*:\s*$/.test(line.trim())) break;
    if (/^-{2,}\s*(Original|Oorspronkelijk)/i.test(line.trim())) break;
    if (/^(From|Van):\s.+$/.test(line.trim()) && out.length) break;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Bounces, out-of-office and mailing-list noise must not become conversations. */
export function isAutomated(mail: Pick<ReceivedEmail, 'from' | 'headers' | 'subject'>): boolean {
  const h = mail.headers;
  const auto = (h['auto-submitted'] ?? '').toLowerCase();
  if (auto && auto !== 'no') return true;
  if ((h['x-auto-response-suppress'] ?? '').length) return true;
  if (/bulk|list|junk|auto_reply/i.test(h['precedence'] ?? '')) return true;
  if (h['list-id'] || h['list-unsubscribe']) return true;
  if (/^(mailer-daemon|postmaster|no-?reply|noreply)@/i.test(mail.from)) return true;
  if (/^(automatisch antwoord|automatic reply|out of office|afwezig)/i.test(mail.subject)) return true;
  return false;
}

export async function fetchReceivedEmail(id: string): Promise<ReceivedEmail | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !/^[0-9a-f-]{20,40}$/i.test(id)) return null;
  const res = await fetch(`https://api.resend.com/emails/receiving/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error('[inbox] Resend receiving fetch failed', res.status, await res.text().catch(() => ''));
    return null;
  }
  const j = (await res.json()) as Record<string, unknown>;
  const headers: Record<string, string> = {};
  const rawHeaders = j.headers;
  if (Array.isArray(rawHeaders)) {
    for (const h of rawHeaders as { name?: string; value?: string }[]) if (h?.name) headers[h.name.toLowerCase()] = String(h.value ?? '');
  } else if (rawHeaders && typeof rawHeaders === 'object') {
    for (const [k, v] of Object.entries(rawHeaders as Record<string, unknown>)) headers[k.toLowerCase()] = String(v ?? '');
  }
  const from = parseAddress(String(headers['from'] || j.from || ''));
  const text = typeof j.text === 'string' && j.text.trim() ? j.text : typeof j.html === 'string' ? htmlToText(j.html) : '';
  const messageId = (typeof j.message_id === 'string' && j.message_id) || headers['message-id'] || null;
  const references = [...messageIds(headers['in-reply-to']), ...messageIds(headers['references'])];
  return {
    id: String(j.id ?? id),
    from: from.email,
    fromName: from.name,
    to: Array.isArray(j.to) ? (j.to as string[]) : [],
    subject: String(j.subject ?? ''),
    text,
    messageId,
    references,
    headers,
    attachments: Array.isArray(j.attachments) ? (j.attachments as ReceivedEmail['attachments']) : [],
  };
}
