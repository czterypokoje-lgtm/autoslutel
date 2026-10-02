import 'server-only';
import type { InboxChannel } from './berichten.ts';

/**
 * Sending a DM, on Instagram or on Facebook Messenger.
 *
 * One function for both, because Meta made them one API: the same host, the
 * same path, the same Page access token. What decides where a message lands is
 * the recipient id — an IGSID goes to Instagram, a PSID goes to Messenger —
 * not the endpoint. The only real difference is `messaging_type`, which
 * Messenger wants and Instagram does not.
 *
 * ponytail: this is the Facebook-Login path (graph.facebook.com + Page token),
 * chosen because autosleutel24 already has a Page and wants Messenger anyway —
 * one app, one token, one review, two channels. The alternative is
 * graph.instagram.com with its own Instagram user token, which needs no Page
 * but also does nothing for Messenger and expires every 60 days. If Instagram
 * sends start failing with a routing error while Messenger keeps working, that
 * is the fork to revisit.
 */

const GRAPH_VERSION = 'v26.0';

/*
 * Instagram caps a message at 1,000 bytes — bytes, not characters, so an
 * accented Dutch reply is shorter than it looks. Messenger allows 2,000.
 * Truncating silently would send half an answer, so the caller is told.
 */
const LIMITS: Partial<Record<InboxChannel, number>> = {
  instagram: 1000,
  messenger: 2000,
};

export type MetaSendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; error: string };

export function metaConfigured(): boolean {
  return Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN);
}

export async function sendMetaMessage(
  channel: 'instagram' | 'messenger',
  recipientId: string,
  text: string,
): Promise<MetaSendResult> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    return { ok: false, error: 'Meta is nog niet gekoppeld — zie Instellingen.' };
  }

  const limit = LIMITS[channel] ?? 1000;
  if (Buffer.byteLength(text, 'utf8') > limit) {
    return {
      ok: false,
      error: `Dit bericht is te lang voor ${channel === 'instagram' ? 'Instagram' : 'Messenger'} (max ${limit} tekens, accenten tellen dubbel).`,
    };
  }

  const body: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: { text },
  };

  /* Messenger wants to know this is an answer, not an unprompted message.
     Instagram rejects the field outright. */
  if (channel === 'messenger') body.messaging_type = 'RESPONSE';

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      },
    );

    const payload = (await res.json().catch(() => null)) as
      | { message_id?: string; error?: { message?: string; code?: number } }
      | null;

    if (!res.ok) {
      /*
       * Meta's own message is the useful one and is safe to show: it says
       * "outside the allowed window" or "token expired" in words an office
       * can act on, where a bare 400 sends somebody to the logs.
       */
      const detail = payload?.error?.message ?? `HTTP ${res.status}`;
      console.error('[meta] versturen mislukt:', res.status, detail);
      return { ok: false, error: `Meta weigerde het bericht: ${detail}` };
    }

    return { ok: true, messageId: payload?.message_id ?? null };
  } catch (error) {
    console.error('[meta] versturen faalde:', error instanceof Error ? error.message : error);
    return { ok: false, error: 'Meta was niet bereikbaar.' };
  }
}
