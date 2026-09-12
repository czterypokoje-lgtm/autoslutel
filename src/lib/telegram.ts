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

/** Best-effort, same as the WhatsApp version this replaces: never on the critical path. */
export async function sendTelegram(chatId: string | null | undefined, message: string): Promise<void> {
  if (!chatId || !TOKEN) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      console.error('Telegram send failed:', await res.text());
    }
  } catch (err) {
    console.error('Telegram send failed:', err instanceof Error ? err.message : err);
  }
}
