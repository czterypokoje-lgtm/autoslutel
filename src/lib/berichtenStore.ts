import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendMail } from './email.ts';
import {
  isPhoneChannel,
  normaliseExternalId,
  replySubject,
  type InboxChannel,
} from './berichten.ts';

/**
 * The only place a row is written to inbox_conversations or inbox_messages.
 *
 * Four callers reach this: the inbound e-mail webhook, the reply action on
 * /admin/berichten, the ElevenLabs post-call webhook, and — once Meta approves
 * the app — the Instagram/Messenger webhook. Every one of them needs the same
 * three steps in the same order, and the identity rule has to be identical
 * across all four or the same customer ends up with two threads.
 *
 * The Supabase client is a parameter rather than built here, deliberately. A
 * webhook has no session and must use the service-role client; the reply
 * action has one and must write through it so RLS stays the real guard. This
 * file has no opinion about which — the caller is the one that knows.
 */

export interface MessageAttachment {
  url: string;
  name?: string | null;
  type?: string | null;
}

interface UpsertInput {
  channel: InboxChannel;
  /** Raw, as the provider sent it. Normalised here so no caller can skip it. */
  externalId: string | null | undefined;
  displayName?: string | null;
  subject?: string | null;
}

/**
 * Find or open the thread for one person on one channel.
 *
 * Returns null when the identifier is unusable, because the alternative — a
 * thread keyed on something unparseable — is a duplicate of a conversation
 * that already exists, and that is the one failure this key exists to stop.
 */
export async function upsertConversation(
  supabase: SupabaseClient,
  { channel, externalId, displayName, subject }: UpsertInput,
): Promise<string | null> {
  const external = normaliseExternalId(channel, externalId);
  if (!external) {
    console.error(`[berichten] onbruikbare afzender op ${channel}:`, externalId);
    return null;
  }

  /*
   * Only non-empty values go into the payload. PostgREST turns an upsert into
   * `on conflict do update set` over exactly the columns it is given, so
   * including `display_name: null` would wipe a name an earlier message had
   * supplied.
   */
  const payload: Record<string, unknown> = { channel, external_id: external };
  if (displayName?.trim()) payload.display_name = displayName.trim();
  if (subject?.trim()) payload.subject = subject.trim();

  const { data, error } = await supabase
    .from('inbox_conversations')
    .upsert(payload, { onConflict: 'channel,external_id' })
    .select('id, state, lead_id')
    .single();

  if (error || !data) {
    console.error('[berichten] gesprek openen mislukt:', error?.message);
    return null;
  }

  const id = String(data.id);

  /*
   * Two things that cannot be expressed in the upsert itself:
   *
   *   - a closed thread reopens when the customer writes again. `state` is
   *     left out of the payload above so a reply does not reset a snooze, but
   *     a closed conversation that gets a new message is not closed any more.
   *   - the lead link is resolved once, the first time we can resolve it.
   *     Re-running the match on every message would overwrite a lead someone
   *     attached by hand with whatever the phone number happens to find.
   */
  const patch: Record<string, unknown> = {};
  if (data.state === 'closed') patch.state = 'open';
  if (!data.lead_id) {
    const leadId = await findLeadId(supabase, channel, external);
    if (leadId) patch.lead_id = leadId;
  }

  if (Object.keys(patch).length) {
    const { error: patchError } = await supabase
      .from('inbox_conversations')
      .update(patch)
      .eq('id', id);
    if (patchError) {
      /* Not fatal: the message still belongs in the thread. */
      console.error('[berichten] gesprek bijwerken mislukt:', patchError.message);
    }
  }

  return id;
}

/**
 * The lead this thread is about, where the channel gives us enough to tell.
 *
 * Phone-bearing channels join on `leads.phone_e164` — the same match
 * /admin/gesprekken has made since the conversations console shipped. E-mail
 * joins on the address, case-insensitively, because `leads.email` stores
 * whatever the customer typed into the form.
 *
 * Instagram and Messenger return null and query nothing: an IGSID appears on
 * no lead, so there is nothing to match and a fuzzy attempt would attach the
 * wrong customer.
 */
async function findLeadId(
  supabase: SupabaseClient,
  channel: InboxChannel,
  external: string,
): Promise<string | null> {
  const base = supabase
    .from('leads')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  const result = isPhoneChannel(channel)
    ? await base.eq('phone_e164', external)
    : channel === 'email'
      ? await base.ilike('email', external)
      : null;

  if (!result) return null;
  if (result.error) {
    console.error('[berichten] lead zoeken mislukt:', result.error.message);
    return null;
  }

  const id = result.data?.[0]?.id;
  return id ? String(id) : null;
}

interface RecordInput {
  conversationId: string;
  direction: 'in' | 'out';
  author: 'customer' | 'ai' | 'human';
  body?: string | null;
  attachments?: MessageAttachment[];
  /** The provider's own id, where there is one. Null for a transcript turn. */
  providerMessageId?: string | null;
  sentBy?: string | null;
  error?: string | null;
}

/**
 * Append one message. The trigger on the table bumps the conversation's
 * last_message_at and unread flag, so nothing here has to remember to.
 *
 * A unique violation is success, not failure: it means this exact provider
 * message is already stored, which is what a retried webhook delivery looks
 * like. Webhooks retry — every provider in this codebase does.
 */
export async function recordMessage(
  supabase: SupabaseClient,
  input: RecordInput,
): Promise<boolean> {
  const { error } = await supabase.from('inbox_messages').insert({
    conversation_id: input.conversationId,
    direction: input.direction,
    author: input.author,
    body: input.body ?? null,
    attachments: input.attachments ?? [],
    provider_message_id: input.providerMessageId ?? null,
    sent_by: input.sentBy ?? null,
    error: input.error ?? null,
  });

  if (!error) return true;
  if (error.code === '23505') return true;

  console.error('[berichten] bericht opslaan mislukt:', error.message);
  return false;
}

/** Clears the unread flag. The console calls this when a thread is opened. */
export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('inbox_conversations')
    .update({ unread: false })
    .eq('id', conversationId);
  if (error) console.error('[berichten] gelezen markeren mislukt:', error.message);
}

export type SendResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

const MAX_BODY = 4000;

/**
 * Send a reply on whichever channel the thread came in on, then store it.
 *
 * A `switch`, not an interface with one implementation per channel. The
 * platform notes are explicit that provider abstractions stay premature until
 * there is a second business running this software — until then a case per
 * channel is the shorter and the more readable of the two.
 */
export async function sendInboxMessage(
  supabase: SupabaseClient,
  conversationId: string,
  body: string,
  sentBy: string | null,
): Promise<SendResult> {
  const text = String(body ?? '').trim();
  if (!text) return { ok: false, error: 'Een leeg bericht wordt niet verstuurd.' };
  if (text.length > MAX_BODY) {
    return { ok: false, error: `Een bericht mag maximaal ${MAX_BODY} tekens zijn.` };
  }

  const { data: conversation, error } = await supabase
    .from('inbox_conversations')
    .select('id, channel, external_id, subject')
    .eq('id', conversationId)
    .single();

  if (error || !conversation) {
    return { ok: false, error: 'Dit gesprek bestaat niet meer.' };
  }

  const channel = conversation.channel as InboxChannel;

  switch (channel) {
    case 'email': {
      const sent = await sendMail({
        to: String(conversation.external_id),
        subject: replySubject(conversation.subject),
        text,
      });
      if (!sent) {
        return {
          ok: false,
          error: 'De e-mail is niet verstuurd. Controleer RESEND_API_KEY in de instellingen.',
        };
      }
      break;
    }

    case 'whatsapp':
    case 'phone':
    case 'sms':
      /*
       * The number belongs to the ElevenLabs agent, whose post-call webhook
       * only reports a conversation once it has ended — there is no mid-chat
       * send to borrow. Answering happens on a handset through the
       * WhatsApp button, which the console shows for these threads.
       */
      return {
        ok: false,
        error:
          'WhatsApp en telefoon lopen via de assistent. Gebruik de WhatsApp-knop om zelf te antwoorden.',
      };

    case 'instagram':
    case 'messenger':
      return {
        ok: false,
        error: 'Instagram en Facebook zijn nog niet aangesloten.',
      };
  }

  const stored = await recordMessage(supabase, {
    conversationId,
    direction: 'out',
    author: 'human',
    body: text,
    sentBy,
  });

  /*
   * Sent but not stored. Reported as a success with a warning, on purpose: the
   * customer has the message, and an error here would make the office send it
   * a second time, which is the worse of the two failures.
   */
  if (!stored) {
    return {
      ok: true,
      warning: 'Verstuurd, maar niet opgeslagen in het gesprek — meld dit.',
    };
  }

  return { ok: true };
}
