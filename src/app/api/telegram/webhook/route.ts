import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Telegram calling us back, every time someone messages the bot.
 *
 * The only message that matters is the `/start <technician_id>` a technician's
 * own "Open Telegram en druk op Start" link sends automatically — that
 * `technician_id` is the deep-link payload from mijn-profiel/page.tsx, and it's
 * how this endpoint knows whose row gets this chat id. Everything else is
 * acknowledged (200, so Telegram stops retrying) and otherwise ignored.
 *
 * `X-Telegram-Bot-Api-Secret-Token` — set once via Telegram's `setWebhook`
 * `secret_token` param — is the only thing standing between this and anyone
 * on the internet posting `/start <someone-else's-id>` to hijack their
 * notifications. No admin-client write happens without it matching.
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let body: { message?: { chat?: { id?: number | string }; text?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = body.message?.text ?? '';
  const chatId = body.message?.chat?.id;
  const match = /^\/start(?:@\w+)?\s+([0-9a-f-]{36})/i.exec(text);

  if (match && chatId !== undefined && UUID.test(match[1])) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('technicians')
      .update({ telegram_chat_id: String(chatId) })
      .eq('id', match[1]);
    if (error) {
      console.error('Telegram chat id link failed:', error.message);
    } else {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Gekoppeld! U ontvangt hier voortaan meldingen van Autosleutel24.',
        }),
      }).catch(() => null);
    }
  }

  // Telegram only cares about the 200 — it retries anything else.
  return NextResponse.json({ ok: true });
}
