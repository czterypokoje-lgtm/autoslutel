import 'server-only';

/**
 * Notifications to technicians, via a Telegram bot instead of WhatsApp's
 * Business API: no business verification, no message templates waiting on
 * approval, free. The one real requirement Telegram keeps — a bot can never
 * message someone who hasn't messaged it first — is handled by the connect
 * flow in Mijn profiel plus the webhook below, once per technician, instead
 * of WhatsApp's per-message-type template review.
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/** Best-effort, on purpose: never on the critical path of whatever triggered it. */
async function callTelegram(method: string, payload: Record<string, unknown>): Promise<void> {
  if (!TOKEN) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Telegram ${method} failed:`, await res.text());
    }
  } catch (err) {
    console.error(`Telegram ${method} failed:`, err instanceof Error ? err.message : err);
  }
}

export async function sendTelegram(chatId: string | null | undefined, message: string): Promise<void> {
  if (!chatId) return;
  await callTelegram('sendMessage', { chat_id: chatId, text: message });
}

/**
 * A job offer, with "Accepteren"/"Weigeren" as real Telegram buttons instead
 * of plain text — the technician is already reading this message, so this is
 * one tap instead of opening the CRM to do the same thing from Aanbod.
 * `offerId` rides in `callback_data`, read back by the webhook's
 * callback_query handler to know which job_offers row a tap is answering.
 */
export async function sendTelegramOffer(
  chatId: string | null | undefined,
  message: string,
  offerId: string
): Promise<void> {
  if (!chatId) return;
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: message,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Accepteren', callback_data: `accept:${offerId}` },
          { text: '❌ Weigeren', callback_data: `decline:${offerId}` },
        ],
      ],
    },
  });
}

/**
 * Telegram shows a spinner on the tapped button until this is called — every
 * callback_query the webhook receives must answer it, whether or not
 * anything else about the tap succeeded.
 */
export async function answerTelegramCallback(callbackQueryId: string, text?: string): Promise<void> {
  await callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

/** Replaces the offer message's text and drops its buttons once it's been answered. */
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string
): Promise<void> {
  await callTelegram('editMessageText', { chat_id: chatId, message_id: messageId, text });
}
