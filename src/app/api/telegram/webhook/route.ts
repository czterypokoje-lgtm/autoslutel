import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram, answerTelegramCallback, editTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TelegramUpdate {
  message?: { chat?: { id?: number | string }; text?: string };
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id?: number; chat?: { id?: number | string } };
  };
}

/** `/start <technician_id>` — the deep link from Mijn profiel, connecting this chat. */
async function handleTechnicianStart(chatId: number | string, technicianId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('technicians')
    .update({ telegram_chat_id: String(chatId) })
    .eq('id', technicianId);
  if (error) {
    console.error('Telegram chat id link failed:', error.message);
    return;
  }
  await sendTelegram(String(chatId), 'Gekoppeld! U ontvangt hier voortaan meldingen van Autosleutel24.');
}

/** `/start admin_<user_id>` — the same connect link, from an office user's Mijn profiel instead. */
async function handleAdminStart(chatId: number | string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('admin_telegram')
    .upsert({ user_id: userId, telegram_chat_id: String(chatId) }, { onConflict: 'user_id' });
  if (error) {
    console.error('Telegram admin chat id link failed:', error.message);
    return;
  }
  await sendTelegram(String(chatId), 'Gekoppeld! U ontvangt hier voortaan meldingen van Autosleutel24.');
}

/** Same wording as OfferList.tsx's own respond() — one set of outcomes, two surfaces. */
const CALLBACK_OUTCOME: Record<string, string> = {
  geaccepteerd: '✅ Klus geaccepteerd — u vindt hem bij Vandaag.',
  afgewezen: '❌ Klus geweigerd.',
  al_vergeven: 'Net te laat — een collega was er eerder bij.',
  verlopen: 'Dit aanbod is verlopen.',
  niet_gevonden: 'Dit aanbod bestaat niet meer of is al beantwoord.',
  geen_monteur: 'Uw Telegram is niet aan een monteur gekoppeld.',
};

/**
 * "Accepteren"/"Weigeren" tapped on a job-offer message. Answers the tap
 * (Telegram shows a spinner on the button until this happens) and rewrites
 * the message so the buttons don't sit there answerable a second time.
 */
async function handleOfferCallback(query: NonNullable<TelegramUpdate['callback_query']>) {
  const match = /^(accept|decline):([0-9a-f-]{36})$/i.exec(query.data ?? '');
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;

  if (!match || chatId === undefined || messageId === undefined) {
    await answerTelegramCallback(query.id);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('crm_respond_to_offer_telegram', {
    p_offer_id: match[2],
    p_chat_id: String(chatId),
    p_accept: match[1] === 'accept',
  });

  if (error) console.error('Telegram offer response failed:', error.message);
  const outcome = error ? 'Bijwerken mislukt.' : (CALLBACK_OUTCOME[String(data)] ?? String(data));

  await answerTelegramCallback(query.id, outcome);
  await editTelegramMessage(chatId, messageId, outcome);
}

/**
 * Telegram calling us back, every time someone messages the bot or taps a
 * button on one of its messages.
 *
 * `X-Telegram-Bot-Api-Secret-Token` — set once via Telegram's `setWebhook`
 * `secret_token` param — is the only thing standing between this and anyone
 * on the internet posting a fake `/start` or offer response. No admin-client
 * write happens without it matching.
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let body: TelegramUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body.callback_query) {
    await handleOfferCallback(body.callback_query);
    return NextResponse.json({ ok: true });
  }

  const text = body.message?.text ?? '';
  const chatId = body.message?.chat?.id;
  const match = /^\/start(?:@\w+)?\s+(admin_)?([0-9a-f-]{36})/i.exec(text);

  if (match && chatId !== undefined && UUID.test(match[2])) {
    if (match[1]) {
      await handleAdminStart(chatId, match[2]);
    } else {
      await handleTechnicianStart(chatId, match[2]);
    }
  }

  // Telegram only cares about the 200 — it retries anything else.
  return NextResponse.json({ ok: true });
}
