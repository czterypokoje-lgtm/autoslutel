import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Meta WhatsApp Cloud API — the official channel, so the number stays in the
 * business's own Meta Business portfolio and nothing runs an unofficial
 * WhatsApp Web session that Meta can ban.
 *
 * Env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN (a System User token,
 * never a 24-hour user token), WHATSAPP_VERIFY_TOKEN (any random string, typed
 * into the Meta app's webhook form), META_APP_SECRET (signs every webhook).
 */

const GRAPH = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION ?? 'v22.0'}`;

export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const given = header.slice('sha256='.length);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'));
}

export interface InboundText {
  id: string;
  from: string; // digits, no plus
  name: string | null;
  text: string;
  type: string;
  timestamp: number;
}
export interface StatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  error: string | null;
}

/** The parts of the webhook we act on. Anything else is logged and dropped. */
export function parseWebhook(payload: unknown): { messages: InboundText[]; statuses: StatusUpdate[] } {
  const messages: InboundText[] = [];
  const statuses: StatusUpdate[] = [];
  const root = payload as { entry?: { changes?: { value?: Record<string, unknown> }[] }[] } | null;
  for (const entry of root?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const contacts = (value.contacts as { wa_id?: string; profile?: { name?: string } }[] | undefined) ?? [];
      const nameOf = (waId: string) => contacts.find((c) => c.wa_id === waId)?.profile?.name ?? null;
      for (const m of (value.messages as Record<string, unknown>[] | undefined) ?? []) {
        const id = String(m.id ?? '');
        const from = String(m.from ?? '').replace(/\D/g, '');
        if (!id || !from) continue;
        const type = String(m.type ?? 'unknown');
        const text =
          type === 'text'
            ? String((m.text as { body?: string })?.body ?? '')
            : type === 'button'
              ? String((m.button as { text?: string })?.text ?? '')
              : type === 'interactive'
                ? String(
                    (m.interactive as { button_reply?: { title?: string }; list_reply?: { title?: string } })?.button_reply?.title ??
                      (m.interactive as { list_reply?: { title?: string } })?.list_reply?.title ??
                      ''
                  )
                : `[${type}]`; // image/audio/document/location: noted, not fetched (privacy, and nobody asked for media yet)
        messages.push({ id, from, name: nameOf(from), text: text.trim() || `[${type}]`, type, timestamp: Number(m.timestamp ?? 0) * 1000 });
      }
      for (const s of (value.statuses as Record<string, unknown>[] | undefined) ?? []) {
        const status = String(s.status ?? '');
        if (status !== 'sent' && status !== 'delivered' && status !== 'read' && status !== 'failed') continue;
        const errors = s.errors as { title?: string; message?: string }[] | undefined;
        statuses.push({ id: String(s.id ?? ''), status, error: errors?.[0]?.message ?? errors?.[0]?.title ?? null });
      }
    }
  }
  return { messages, statuses };
}

/**
 * Free-form text is allowed only within 24 hours of the customer's last
 * message. Outside that window Meta rejects it; the office then has to ring,
 * or we need an approved template (not built: nobody has written one yet).
 */
export function withinServiceWindow(lastInboundAt: string | null): boolean {
  if (!lastInboundAt) return false;
  return Date.now() - new Date(lastInboundAt).getTime() < 24 * 3_600_000;
}

export const whatsappConfigured = () => Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** POST one message payload to the Graph API. Shared by the text and template senders below. */
async function postMessage(body: Record<string, unknown>): Promise<SendResult> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) return { ok: false, error: 'WhatsApp is niet geconfigureerd' };
  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...body }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as { messages?: { id: string }[]; error?: { message?: string } } | null;
    if (!res.ok || !json?.messages?.[0]?.id) {
      return { ok: false, error: json?.error?.message ?? `Meta antwoordde ${res.status}` };
    }
    return { ok: true, id: json.messages[0].id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Verzenden mislukt' };
  }
}

export async function sendWhatsAppText(toE164: string, text: string): Promise<SendResult> {
  return postMessage({
    to: toE164.replace(/\D/g, ''),
    type: 'text',
    text: { preview_url: false, body: text.slice(0, 4096) },
  });
}

/**
 * A Meta-approved template, the only way to open a chat outside the 24-hour
 * service window (see withinServiceWindow above) — a business-initiated
 * review request always is.
 */
export async function sendWhatsAppTemplate(toE164: string, name: string, language = 'nl', bodyParams: string[] = []): Promise<SendResult> {
  return postMessage({
    to: toE164.replace(/\D/g, ''),
    type: 'template',
    template: {
      name,
      language: { code: language },
      components: bodyParams.length ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }] : [],
    },
  });
}
