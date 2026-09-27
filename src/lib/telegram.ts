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

/**
 * A bon or a faktura, with "Goedkeuren"/"Afwijzen" as real buttons — the
 * office half of the Telegram expense flow. Same shape as sendTelegramOffer
 * above, kept as its own function rather than a shared one: two surfaces with
 * two callback prefixes, matching how crm_respond_to_offer_whatsapp was
 * written beside its Telegram twin instead of refactoring both.
 */
export async function sendTelegramExpense(
  chatId: string | null | undefined,
  message: string,
  expenseId: string
): Promise<void> {
  if (!chatId) return;
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: message,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Goedkeuren', callback_data: `exp_ok:${expenseId}` },
          { text: '❌ Afwijzen', callback_data: `exp_no:${expenseId}` },
        ],
      ],
    },
  });
}

/*
 * What Telegram may hand us and what it becomes in the `facturen` bucket,
 * whose allowed_mime_types (0020_invoice_storage.sql) is the real list. A
 * photo taken in the Telegram app is always JPEG; a forwarded supplier
 * invoice is usually a PDF.
 */
const FILE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
};

export interface TelegramFile {
  bytes: Buffer;
  extension: string;
  mimeType: string;
}

/**
 * Fetches a file the bot was sent, in the two calls Telegram requires:
 * `getFile` for the path, then a plain download from the file host.
 *
 * Unlike the senders above this one has to report failure — the caller is
 * about to write a database row that claims the file is stored. Null means
 * do not write it.
 */
export async function downloadTelegramFile(fileId: string): Promise<TelegramFile | null> {
  if (!TOKEN) return null;
  try {
    const lookup = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId }),
    });
    const found = (await lookup.json()) as { ok?: boolean; result?: { file_path?: string } };
    const path = found.result?.file_path;
    if (!found.ok || !path) {
      console.error('Telegram getFile failed:', JSON.stringify(found));
      return null;
    }

    const extension = (path.split('.').pop() ?? '').toLowerCase();
    const mimeType = FILE_TYPES[extension];
    if (!mimeType) return null;

    const download = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${path}`);
    if (!download.ok) {
      console.error('Telegram file download failed:', download.status);
      return null;
    }
    return {
      bytes: Buffer.from(await download.arrayBuffer()),
      extension: extension === 'jpeg' ? 'jpg' : extension,
      mimeType,
    };
  } catch (err) {
    console.error('Telegram file download failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
