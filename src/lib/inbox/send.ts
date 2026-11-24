import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BRAND } from '@/config/install';
import { SITE_CONFIG } from '@/config/site.config';
import { deliverMail } from '@/lib/email';
import { providerRequestsEnabled } from '@/lib/providerRequests';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { addMessage, threadMessages, type Message, type Thread } from './store';
import { sendWhatsAppText, whatsappConfigured, withinServiceWindow } from './whatsapp';

/*
 * The one place a reply leaves the CRM. Every send is stored, sent or failed,
 * and a reply written by a person ends the assistant's 'auto' mode on that
 * thread — the human takeover, with no extra button.
 */

/** Which way a reply to this thread can go. Forms answer by e-mail; a WhatsApp
 *  number we have never heard from cannot be messaged without a template. */
export function replyChannel(thread: Pick<Thread, 'channel' | 'email' | 'phone'>): 'whatsapp' | 'email' | null {
  if (thread.channel === 'whatsapp') return thread.phone ? 'whatsapp' : null;
  return thread.email ? 'email' : null;
}

export type SendResult = { ok: true; message: Message } | { ok: false; error: string };

export async function sendReply(
  thread: Thread,
  text: string,
  author: string,
  db: SupabaseClient = createSupabaseAdminClient()
): Promise<SendResult> {
  const body = text.trim();
  if (!body) return { ok: false, error: 'Leeg bericht' };
  const via = replyChannel(thread);
  if (!via) return { ok: false, error: 'Geen e-mailadres of WhatsApp-nummer bij dit gesprek' };
  if (!providerRequestsEnabled()) return { ok: false, error: 'Demo: verzenden staat uit' };

  let externalId: string | null = null;
  if (via === 'whatsapp') {
    if (!whatsappConfigured()) return { ok: false, error: 'WhatsApp is nog niet gekoppeld (WHATSAPP_* ontbreekt)' };
    if (!withinServiceWindow(thread.last_inbound_at)) {
      return { ok: false, error: 'Buiten het 24-uursvenster van WhatsApp: bel de klant, of wacht tot die weer schrijft.' };
    }
    const sent = await sendWhatsAppText(thread.phone!, body);
    if (!sent.ok) {
      await addMessage(thread, { direction: 'out', author, body, status: 'failed', meta: { error: sent.error } }, db);
      return { ok: false, error: sent.error };
    }
    externalId = sent.id;
  } else {
    const history = await threadMessages(thread.id, db);
    const inboundIds = history.filter((m) => m.direction === 'in' && m.message_id).map((m) => m.message_id!) ;
    const subject = thread.subject ? (/^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`) : 'Uw bericht aan ons';
    const headers: Record<string, string> = {};
    if (inboundIds.length) {
      headers['In-Reply-To'] = inboundIds[inboundIds.length - 1];
      headers['References'] = inboundIds.join(' ');
    }
    /* Customer replies leave as info@ (INBOX_FROM), not as the order-confirmation sender in MAIL_FROM. */
    const from = process.env.INBOX_FROM || `${BRAND.name} <${SITE_CONFIG.email}>`;
    const sent = await deliverMail({ to: thread.email!, subject, text: body, headers, from });
    if (!sent) {
      await addMessage(thread, { direction: 'out', author, body, status: 'failed', meta: { error: 'E-mail niet verzonden' } }, db);
      return { ok: false, error: 'E-mail niet verzonden (zie serverlog)' };
    }
    externalId = `resend:${sent.id}`;
  }

  const message = await addMessage(thread, { direction: 'out', author, body, status: 'sent', external_id: externalId, meta: { via } }, db);
  if (!message) return { ok: false, error: 'Opslaan mislukt' };

  const patch: Record<string, unknown> = { status: 'open' };
  if (author !== 'ai' && thread.ai_mode === 'auto') patch.ai_mode = 'draft';
  await db.from('inbox_threads').update(patch).eq('id', thread.id);
  /* A sent reply makes earlier drafts stale. */
  await db.from('inbox_messages').delete().eq('thread_id', thread.id).eq('status', 'draft');
  return { ok: true, message };
}
