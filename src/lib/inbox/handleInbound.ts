import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { b, esc } from '@/lib/telegramText';
import { draftReply } from './ai';
import { sendReply } from './send';
import { addMessage, linkLead, threadMessages, type Message, type Thread } from './store';

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
