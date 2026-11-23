import 'server-only';
import { isStopMessage } from '@/lib/reviewRequest';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { b, esc } from '@/lib/telegramText';
import { draftReply } from './ai';
import { replyGuard } from './guard';
import { sendReply } from './send';
import { addMessage, linkLead, threadMessages, type Message, type Thread } from './store';
import { sendWhatsAppText, whatsappConfigured } from './whatsapp';

const STOP_CONFIRMATION = 'U ontvangt geen berichten meer van ons. Heeft u toch een vraag, dan kunt u ons altijd bellen of appen.';

/*
 * What happens after a customer's message is safely stored: find the lead,
 * tell the office, and let the assistant draft or answer as the thread's
 * ai_mode allows. Runs in `after()`, so the webhook has already answered 200
 * and a slow model call cannot make the provider retry.
 */

const LABEL = { whatsapp: 'WhatsApp', email: 'E-mail', form: 'Websiteformulier' } as const;

async function officeChats(): Promise<string[]> {
  const { data, error } = await createSupabaseAdminClient().from('admin_telegram').select('telegram_chat_id');
  if (error) console.error('[inbox] admin_telegram read failed:', error.message);
  return [...new Set((data ?? []).map((r) => String(r.telegram_chat_id)).filter(Boolean))];
}

async function tellOffice(text: string) {
  for (const chat of await officeChats()) {
    try {
      await sendTelegram(chat, text);
    } catch (error) {
      console.error('[inbox] telegram failed', error);
    }
  }
}

const who = (t: Thread) => t.name ?? t.phone ?? t.email ?? 'onbekend';
const link = () => `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.autosleutel24.nl'}/admin/gesprekken`;

export async function afterInbound(thread: Thread, message: Message, opts: { notify?: boolean } = {}): Promise<void> {
  try {
    await linkLead(thread);
  } catch (error) {
    console.error('[inbox] lead link failed', error);
  }

  if (opts.notify !== false) {
    await tellOffice(`💬 ${b(LABEL[thread.channel])} van ${b(who(thread))}\n${esc(message.body.slice(0, 300))}\n\n${link()}`);
  }

  // A WhatsApp STOP-like reply is an opt-out of ALL future business-initiated
  // messages (review requests included, not just the assistant), so it is
  // handled here — before the AI step — rather than inside draftReply.
  if (thread.channel === 'whatsapp' && isStopMessage(message.body)) {
    await handleOptOut(thread);
    return;
  }

  if (thread.ai_mode === 'off') return;
  try {
    const history = await threadMessages(thread.id);
    const draft = await draftReply(thread, history);
    if (!draft) return;

    /*
     * Auto only when three things hold: the thread says so, the global kill
     * switch (INBOX_AI_AUTO=0) is not pulled, and the assistant is not the only
     * one talking. Three assistant replies in a row with no person on our side
     * means the other end is a bot or an auto-responder; that conversation is
     * handed to a person instead of looping.
     */
    const recentAi = history.slice(-6).filter((m) => m.direction === 'out' && m.author === 'ai' && m.status === 'sent').length;
    const autoAllowed = thread.ai_mode === 'auto' && process.env.INBOX_AI_AUTO !== '0' && recentAi < 3;
    if (thread.ai_mode === 'auto' && !autoAllowed && recentAi >= 3) {
      await tellOffice(`⏸ Assistent gestopt bij ${b(who(thread))}: drie antwoorden zonder reactie van een medewerker. Neem over.\n${link()}`);
    }

    if (autoAllowed && !draft.needsHuman) {
      /*
       * Deterministic check behind the model's own `needs_human`: a reply
       * that states a price not verbatim in the facts, or promises a clock
       * time, never auto-sends, model's judgement notwithstanding. It is
       * stored as a draft and paged to the office exactly like any other
       * needs_human case.
       */
      const guardHit = replyGuard(draft.reply, draft.facts);
      if (guardHit) {
        const reason = `guard:${guardHit}`;
        await addMessage(thread, { direction: 'out', author: 'ai', body: draft.reply, status: 'draft', meta: { reason } });
        await tellOffice(`🙋 ${b(LABEL[thread.channel])} van ${b(who(thread))} vraagt om een medewerker: ${esc(reason)}\n${link()}`);
        return;
      }

      const sent = await sendReply(thread, draft.reply, 'ai');
      if (!sent.ok) {
        await addMessage(thread, { direction: 'out', author: 'ai', body: draft.reply, status: 'draft', meta: { reason: draft.reason, autoFailed: sent.error } });
        await tellOffice(`⚠️ Automatisch antwoord aan ${b(who(thread))} is niet verstuurd: ${esc(sent.error)}\n${link()}`);
      }
      return;
    }

    if (draft.reply) {
      await addMessage(thread, { direction: 'out', author: 'ai', body: draft.reply, status: 'draft', meta: { reason: draft.reason } });
    }
    if (draft.needsHuman) {
      await tellOffice(`🙋 ${b(LABEL[thread.channel])} van ${b(who(thread))} vraagt om een medewerker: ${esc(draft.reason || 'zie gesprek')}\n${link()}`);
    }
  } catch (error) {
    console.error('[inbox] assistant step failed', error);
  }
}

/**
 * Record the opt-out (phone, not job/lead — see migration 0109), silence the
 * assistant on this thread, and confirm once. The confirmation is itself a
 * business-initiated send, so it only goes out when WhatsApp is configured —
 * same guard the review-request cron uses.
 */
async function handleOptOut(thread: Thread): Promise<void> {
  if (!thread.phone) return;
  const db = createSupabaseAdminClient();
  const { error } = await db.from('whatsapp_optouts').upsert({ phone_e164: thread.phone, source: 'reply' }, { onConflict: 'phone_e164', ignoreDuplicates: true });
  if (error) console.error('[inbox] opt-out upsert failed', error.message);

  if (thread.ai_mode !== 'off') {
    await db.from('inbox_threads').update({ ai_mode: 'off' }).eq('id', thread.id);
  }

  if (!whatsappConfigured()) return;
  const sent = await sendWhatsAppText(thread.phone, STOP_CONFIRMATION);
  await addMessage(thread, {
    direction: 'out',
    author: 'system',
    body: STOP_CONFIRMATION,
    status: sent.ok ? 'sent' : 'failed',
    external_id: sent.ok ? sent.id : null,
    meta: sent.ok ? { via: 'whatsapp', reason: 'opt_out' } : { via: 'whatsapp', reason: 'opt_out', error: sent.error },
  });
}
