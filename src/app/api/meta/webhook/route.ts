import { NextResponse, after } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { verifyMetaSignature, readVerificationChallenge } from '@/lib/metaWebhook';
import { upsertConversation, recordMessage } from '@/lib/berichtenStore';
import { readMetaMessage, type MetaMessagingEvent } from '@/lib/berichten';
import { SITE_CONFIG } from '@/config/site.config';

export const dynamic = 'force-dynamic';

/**
 * Instagram DMs and Facebook Messenger, in one route.
 *
 * Meta delivers both in the same envelope — `entry[].messaging[]` — and tells
 * them apart only by the top-level `object`. Two routes would be the same
 * parser twice, and the day one of them learned about echoes or read receipts
 * and the other did not is the day the postvak starts storing its own replies
 * as customer messages.
 */

interface MetaPayload {
  object?: string;
  entry?: { id?: string; time?: number; messaging?: MetaMessagingEvent[] }[];
}

/** Meta's GET handshake, made when the webhook is saved and whenever it moves. */
export async function GET(request: Request) {
  const challenge = readVerificationChallenge(
    new URL(request.url),
    process.env.META_VERIFY_TOKEN ?? '',
  );

  if (challenge === null) {
    /* 403, not an empty 200: the dashboard reports a refusal as "could not
       validate" and quietly accepts a blank success, which leaves a webhook
       that looks configured and delivers nothing. */
    return new NextResponse('Verificatie mislukt', { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * The customer's display name, which the webhook does not carry.
 *
 * Fetched once, only for a thread that has none yet, and only inside after()
 * so it never delays the response Meta is waiting on. A thread headed by a
 * raw IGSID is unusable to whoever has to answer it.
 */
async function fillDisplayName(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  conversationId: string,
  senderId: string,
): Promise<void> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return;

  const { data } = await admin
    .from('inbox_conversations')
    .select('display_name')
    .eq('id', conversationId)
    .maybeSingle();

  if (data?.display_name) return;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v26.0/${senderId}?fields=name,username&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return;

    const profile = (await res.json()) as { name?: string; username?: string };
    const name = profile.name ?? profile.username;
    if (!name) return;

    await admin
      .from('inbox_conversations')
      .update({ display_name: name })
      .eq('id', conversationId);
  } catch {
    /* A missing name is cosmetic. Never let it cost the message. */
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const appSecret = process.env.META_APP_SECRET ?? '';

  /* Fails closed, like every other webhook here. */
  if (!verifyMetaSignature(rawBody, request.headers.get('x-hub-signature-256'), appSecret)) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let payload: MetaPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const channel =
    payload.object === 'instagram' ? 'instagram'
    : payload.object === 'page' ? 'messenger'
    : null;

  if (!channel) return NextResponse.json({ ok: true });

  const admin = createSupabaseAdminClient();
  const arrivals: { conversationId: string; senderId: string; text: string }[] = [];
  let failed = false;

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      /*
       * Which events are real customer messages is decided in berichten.ts,
       * where it is pure and covered by scripts/check-meta-webhook.mts —
       * echoes of our own replies are the failure that would otherwise be
       * invisible until the postvak was full of them.
       *
       * ponytail: the attachment URLs it returns are Meta's CDN links and they
       * expire. Stored as sent, so a photo opened today works and one opened
       * next month may not. Copying the bytes to Vercel Blob is the upgrade,
       * the same decision the inbound-mail route makes for the same reason.
       */
      const inbound = readMetaMessage(event, entry.id);
      if (!inbound) continue;

      const conversationId = await upsertConversation(admin, {
        channel,
        externalId: inbound.senderId,
      });

      if (!conversationId) {
        failed = true;
        continue;
      }

      const stored = await recordMessage(admin, {
        conversationId,
        direction: 'in',
        author: 'customer',
        body: inbound.text || null,
        attachments: inbound.attachments,
        providerMessageId: inbound.providerMessageId,
      });

      if (!stored) {
        failed = true;
        continue;
      }

      arrivals.push({ conversationId, senderId: inbound.senderId, text: inbound.text });
    }
  }

  /*
   * A 500 asks Meta to redeliver, which the unique constraint on
   * (conversation_id, provider_message_id) makes safe — a redelivered message
   * is a no-op, not a duplicate. A DM is a lead, so a retry is worth more than
   * a tidy log.
   */
  if (failed) {
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  after(async () => {
    for (const arrival of arrivals) {
      await fillDisplayName(admin, arrival.conversationId, arrival.senderId);
    }

    const officeChat = process.env.TELEGRAM_OFFICE_CHAT_ID;
    if (!officeChat || arrivals.length === 0) return;

    const label = channel === 'instagram' ? '📸 Instagram' : '💬 Messenger';
    for (const arrival of arrivals) {
      const lines = [
        `${label} — nieuw bericht`,
        arrival.text ? `\n${arrival.text.slice(0, 600)}${arrival.text.length > 600 ? '…' : ''}` : '[bijlage]',
        `\n${SITE_CONFIG.domain}/admin/berichten`,
      ];
      await sendTelegram(officeChat, lines.join('\n'));
    }
  });

  return NextResponse.json({ ok: true });
}
