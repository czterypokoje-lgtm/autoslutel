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

/*
 * ── Bieden op een klus ──────────────────────────────────────────────────────
 *
 * Three taps and one number: a day, an hour, a price. Each tap carries
 * everything the next step needs in its own callback_data, so the bot keeps
 * no session anywhere — Telegram's 64-byte limit is the only budget, and a
 * uuid plus a prefix fits inside it with room to spare.
 */

/** Two-hour windows. Early and late on purpose: this trade is a lockout at 7am. */
export const BID_SLOTS: Array<[string, string]> = [
  ['08:00', '10:00'],
  ['10:00', '12:00'],
  ['12:00', '14:00'],
  ['14:00', '16:00'],
  ['16:00', '18:00'],
  ['18:00', '20:00'],
  ['20:00', '22:00'],
];

const DAY_LABELS = ['Vandaag', 'Morgen', 'Overmorgen', 'Over 3 dagen'];

/** The job, and the four days they could do it. */
export async function sendTelegramBidOffer(
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
        DAY_LABELS.slice(0, 2).map((label, index) => ({
          text: label,
          callback_data: `bd:${offerId}:${index}`,
        })),
        DAY_LABELS.slice(2).map((label, index) => ({
          text: label,
          callback_data: `bd:${offerId}:${index + 2}`,
        })),
        [{ text: '❌ Nee, laat maar', callback_data: `bn:${offerId}` }],
      ],
    },
  });
}

/** Having picked a day, which two hours. */
export async function editToSlotChoice(
  chatId: string | number,
  messageId: number,
  offerId: string,
  dayLabel: string
): Promise<void> {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < BID_SLOTS.length; i += 2) {
    rows.push(
      BID_SLOTS.slice(i, i + 2).map(([from, to], offset) => ({
        text: `${from}–${to}`,
        callback_data: `bh:${offerId}:${i + offset}`,
      }))
    );
  }
  rows.push([{ text: '← Andere dag', callback_data: `bb:${offerId}` }]);

  await callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: `${dayLabel} — hoe laat kunt u er zijn?`,
    reply_markup: { inline_keyboard: rows },
  });
}

/** Back to the four days, when they change their mind. */
export async function editToDayChoice(
  chatId: string | number,
  messageId: number,
  offerId: string,
  message: string
): Promise<void> {
  await callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: message,
    reply_markup: {
      inline_keyboard: [
        DAY_LABELS.slice(0, 2).map((label, index) => ({
          text: label,
          callback_data: `bd:${offerId}:${index}`,
        })),
        DAY_LABELS.slice(2).map((label, index) => ({
          text: label,
          callback_data: `bd:${offerId}:${index + 2}`,
        })),
        [{ text: '❌ Nee, laat maar', callback_data: `bn:${offerId}` }],
      ],
    },
  });
}

export const dayLabel = (index: number): string => DAY_LABELS[index] ?? 'Die dag';

/**
 * The menu.
 *
 * A monteur reads this on a phone in a van, so it is six taps and no typing.
 * Each button answers with text in the same chat rather than sending them to
 * a login screen — opening the CRM on a phone mid-job is exactly the thing
 * they will not do.
 */
export async function sendTelegramMenu(chatId: string | null | undefined): Promise<void> {
  if (!chatId) return;
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: 'Waar kan ik u mee helpen?',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 Mijn klussen', callback_data: 'm:jobs' },
          { text: '📨 Open aanbod', callback_data: 'm:offers' },
        ],
        [
          { text: '💰 Mijn saldo', callback_data: 'm:saldo' },
          { text: '📦 Mijn bus', callback_data: 'm:bus' },
        ],
        [
          { text: '🧾 Facturen', callback_data: 'm:facturen' },
          { text: '💸 Uitgaven', callback_data: 'm:uitgaven' },
        ],
      ],
    },
  });
}
