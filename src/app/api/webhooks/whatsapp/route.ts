import { NextResponse, after } from 'next/server';
import { afterInbound } from '@/lib/inbox/handleInbound';
import { addMessage, setMessageStatus, whatsappThread } from '@/lib/inbox/store';
import { parseWebhook, verifyMetaSignature } from '@/lib/inbox/whatsapp';
import { toE164NL } from '@/lib/phone';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ensureWhatsappLead } from '@/lib/whatsappLead';

export const dynamic = 'force-dynamic';

/**
 * Meta WhatsApp Cloud API webhook.
 *
 * GET is Meta's one-time verification handshake. POST carries messages and
 * delivery statuses; every POST is signed with the app secret and anything
 * unsigned is dropped. Store first, answer 200, then do the slow work in
 * `after()` — Meta retries anything that does not answer within seconds, and
 * the unique provider id makes a retry harmless anyway.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) return NextResponse.json({ error: 'Niet beschikbaar' }, { status: 503 });
  if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === expected) {
    return new Response(q.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyMetaSignature(raw, request.headers.get('x-hub-signature-256'), process.env.META_APP_SECRET)) {
    return NextResponse.json({ error: 'Ongeldige handtekening' }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  const { messages, statuses } = parseWebhook(payload);

  for (const s of statuses) {
    if (s.id) await setMessageStatus(s.id, s.status, s.error).catch((e) => console.error('[whatsapp] status update failed', e));
  }

  for (const m of messages) {
    try {
      const phone = toE164NL(`+${m.from}`) ?? `+${m.from}`;
      const thread = await whatsappThread(phone, m.name, m.from);
      const stored = await addMessage(thread, {
        direction: 'in',
        author: 'customer',
        body: m.text,
        external_id: m.id,
        meta: { type: m.type, sent_at: m.timestamp ? new Date(m.timestamp).toISOString() : null },
      });
      if (!stored) continue; // retry of a message we already have
      after(async () => {
        try {
          await ensureWhatsappLead(createSupabaseAdminClient(), phone, m.text);
        } catch (error) {
          console.error('[whatsapp] lead step failed', error);
        }
        await afterInbound(thread, stored);
      });
    } catch (error) {
      console.error('[whatsapp] inbound failed', error);
    }
  }

  return NextResponse.json({ ok: true });
}
