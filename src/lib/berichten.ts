/**
 * The channel vocabulary for the postvak, and the one rule that makes it work:
 * a conversation is identified by `(channel, external_id)`.
 *
 * Browser-safe, imported by the console as well as by server code — the
 * database and sending half lives in `berichtenStore.ts`, guarded with
 * `server-only`. Same split, and for the same reason, as whatsapp.ts keeping
 * its link builders away from anything that talks to a provider: a file a
 * phone downloads must not drag an API client in behind it.
 */
import { toE164NL } from './phone.ts';

export const INBOX_CHANNELS = [
  'email',
  'whatsapp',
  'instagram',
  'messenger',
  'phone',
  'sms',
] as const;

export type InboxChannel = (typeof INBOX_CHANNELS)[number];

/** What the office calls each channel. The badge in the thread list reads this. */
export const CHANNEL_LABELS: Record<InboxChannel, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
  phone: 'Telefoon',
  sms: 'SMS',
};

/**
 * The channels whose `external_id` is a phone number, and which therefore join
 * straight onto `leads.phone_e164`.
 *
 * Instagram and Messenger are deliberately not here: their ids are scoped to
 * one Meta app and mean nothing anywhere else, which is why those threads get
 * a "koppel aan lead" button instead of an automatic match.
 */
export const PHONE_CHANNELS: readonly InboxChannel[] = ['whatsapp', 'phone', 'sms'];

export function isPhoneChannel(channel: InboxChannel): boolean {
  return PHONE_CHANNELS.includes(channel);
}

/**
 * The identifier a thread is keyed on, normalised by that channel's own rules.
 *
 * Returns null rather than a best guess when the input is unusable — an
 * unparseable id would open a second thread for a customer who already has
 * one, which is the exact failure this key exists to prevent.
 */
export function normaliseExternalId(
  channel: InboxChannel,
  raw: string | null | undefined,
): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  if (channel === 'email') {
    const address = value.toLowerCase();
    /*
     * Deliberately loose: one @, something either side, a dot in the domain.
     * A stricter pattern rejects addresses that exist, and the cost of a
     * wrong reject here is a lost lead.
     */
    return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(address) ? address : null;
  }

  if (isPhoneChannel(channel)) {
    /* One normaliser for every number in this database. */
    return toE164NL(value);
  }

  /* Instagram IGSID, Messenger PSID — opaque, pass through untouched. */
  return value;
}

/**
 * The subject line of a reply.
 *
 * Threading does not depend on this — `(channel, external_id)` does that — but
 * a reply whose subject does not mention the original reads as a cold mail
 * from a stranger in the customer's client.
 */
export function replySubject(subject: string | null | undefined): string {
  const clean = String(subject ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Re: uw bericht aan Autosleutel24';
  if (/^re\s*:/i.test(clean)) return clean;
  return `Re: ${clean}`;
}

/** "info@autosleutel24.nl" -> "info", for the avatar initial in the list. */
export function conversationInitial(displayName: string | null, externalId: string): string {
  const source = (displayName ?? '').trim() || externalId;
  const letter = source.replace(/[^\p{L}\p{N}]/gu, '').charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

/**
 * `"Jan Jansen" <jan@example.nl>` -> the address and the name, separately.
 *
 * Providers are inconsistent about this: Resend's `from` is sometimes a bare
 * address and sometimes a full RFC 5322 mailbox. Keying a thread on the whole
 * string would give one customer a new conversation the day they change the
 * display name in their mail client.
 */
export function parseAddress(raw: string | null | undefined): {
  address: string | null;
  name: string | null;
} {
  const value = String(raw ?? '').trim();
  if (!value) return { address: null, name: null };

  const angled = value.match(/^(.*)<([^<>]+)>\s*$/);
  if (angled) {
    const name = angled[1].trim().replace(/^"(.*)"$/, '$1').trim();
    return { address: angled[2].trim().toLowerCase(), name: name || null };
  }

  return { address: value.toLowerCase(), name: null };
}

/**
 * Enough HTML-to-text to read a customer's mail in the thread.
 *
 * Only used when an e-mail arrives with an HTML part and no plain-text one,
 * which Outlook and the Gmail web client both do. Not a renderer and not
 * trying to be: the alternative is showing the office a wall of markup, or
 * dropping the message body entirely.
 *
 * Tags are stripped rather than rendered, which also means nothing a sender
 * wrote can be injected into the console — the thread displays this as text.
 */
export function htmlToText(html: string | null | undefined): string {
  const source = String(html ?? '');
  if (!source) return '';

  return source
    /* Content that is not prose at all. */
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    /* The tags that mean "new line" to a reader. */
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6]|blockquote)\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    /* The five entities that actually turn up in mail. */
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    /* Collapse the blank lines an HTML mail is mostly made of. */
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/*
 * Meta's standard messaging window: 24 hours from the customer's last message,
 * on Instagram and on Messenger alike.
 *
 * Lives here, browser-safe, because both halves need the same answer — the
 * server refuses the send, and the console greys the composer out with the
 * reason showing. Two copies of this rule would eventually disagree, and the
 * version that disagrees in the browser is the one that lets somebody type a
 * long reply that is rejected the moment they press send.
 */
export const META_WINDOW_MS = 24 * 60 * 60 * 1000;

export function metaWindowOpen(lastInboundAt: string | null | undefined): boolean {
  if (!lastInboundAt) return false;
  const since = Date.now() - new Date(lastInboundAt).getTime();
  return Number.isFinite(since) && since >= 0 && since < META_WINDOW_MS;
}

/* ── Meta webhook events ────────────────────────────────────────────────── */

export interface MetaMessagingEvent {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    attachments?: { type?: string; payload?: { url?: string } | null }[];
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
  };
  read?: unknown;
  delivery?: unknown;
  reaction?: unknown;
  postback?: unknown;
}

export interface InboundMetaMessage {
  senderId: string;
  text: string;
  attachments: { url: string; name: string | null; type: string | null }[];
  providerMessageId: string | null;
}

/**
 * Whether one entry in Meta's `messaging[]` array is a customer message, and
 * what it says.
 *
 * Pure, and separated from the route, because this is the part that fails
 * quietly. Read receipts, delivery confirmations, reactions and postbacks all
 * arrive in the same array as real messages, and — the one that actually
 * corrupts the postvak — so do our own replies. Messenger flags those
 * `is_echo`; Instagram does not, and instead sends them with the account's own
 * id as the sender. Miss either and every answer the office sends is stored a
 * second time as though the customer had written it.
 *
 * `entryId` is `entry[].id`: the Page id for Messenger, the Instagram account
 * id for Instagram. Either way it is us.
 */
export function readMetaMessage(
  event: MetaMessagingEvent,
  entryId: string | null | undefined,
): InboundMetaMessage | null {
  const message = event.message;
  const senderId = event.sender?.id;

  /* Not a message at all. */
  if (!message || !senderId) return null;

  /* Our own reply, coming back at us. Both shapes. */
  if (message.is_echo) return null;
  if (entryId && senderId === entryId) return null;

  if (message.is_deleted) return null;

  const text = message.is_unsupported
    ? '[bericht dat Meta niet doorgeeft]'
    : (message.text ?? '');

  const attachments = (message.attachments ?? [])
    .filter((file) => file.payload?.url)
    .map((file) => ({
      url: file.payload?.url as string,
      name: file.type ?? 'bijlage',
      type: file.type ?? null,
    }));

  /* A message with neither words nor a file is nothing to show. */
  if (!text && attachments.length === 0) return null;

  return { senderId, text, attachments, providerMessageId: message.mid ?? null };
}
