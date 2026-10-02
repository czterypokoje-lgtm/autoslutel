import { NextResponse, after } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { verifyResendSignature } from '@/lib/resendWebhook';
import { upsertConversation, recordMessage, type MessageAttachment } from '@/lib/berichtenStore';
import { htmlToText, parseAddress } from '@/lib/berichten';
import { maybeAnswer } from '@/lib/berichtenAgent';
import { SITE_CONFIG } from '@/config/site.config';

export const dynamic = 'force-dynamic';

/**
 * Inbound e-mail, the channel that had no way in.
 *
 * `src/lib/email.ts` has been able to *send* since the order confirmations
 * were written, but nothing has ever received: somebody writing to
 * info@autosleutel24.nl existed only in a mailbox, and the CRM could not tell
 * you they had been in touch.
 *
 * The mailbox stays exactly where it is. Resend hands out an inbound address
 * on its own domain, so the only setup outside this repo is one forwarding
 * rule in the host's webmail — no MX change, no moving the mail, nothing that
 * can take info@ down if it goes wrong.
 */

interface ReceivedAttachment {
  id?: string;
  filename?: string | null;
  content_type?: string | null;
  content_disposition?: string | null;
  size?: number | null;
}

interface ReceivedPayload {
  type?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string | null;
    message_id?: string | null;
    attachments?: ReceivedAttachment[];
  };
}

/** The addresses that are us. Mail from ourselves is a forwarding loop, not a lead. */
function isOurOwnAddress(address: string): boolean {
  const ours = new Set(
    [SITE_CONFIG.email, process.env.MAIL_FROM, process.env.LEAD_ALERT_EMAIL]
      .map((value) => parseAddress(value).address)
      .filter((value): value is string => Boolean(value)),
  );
  return ours.has(address);
}

/**
 * The body, which the webhook does not carry.
 *
 * ponytail: two requests per e-mail, because Resend's `email.received` payload
 * is metadata only — sender, subject, attachment list — and the body comes
 * from the Receiving API. That is the provider's shape, not a choice made
 * here; there is no single-request version to collapse this into.
 */
async function fetchBody(emailId: string): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[inbox/email] RESEND_API_KEY ontbreekt — bericht opgeslagen zonder inhoud');
    return '';
  }

  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('[inbox/email] inhoud ophalen mislukt:', res.status, await res.text());
      return '';
    }

    const mail = (await res.json()) as { text?: string | null; html?: string | null };

    /* Plain text when the sender provided it; otherwise flatten the HTML part. */
    const text = typeof mail.text === 'string' ? mail.text.trim() : '';
    return text || htmlToText(mail.html);
  } catch (error) {
    console.error('[inbox/email] inhoud ophalen faalde:', error instanceof Error ? error.message : error);
    return '';
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  /*
   * Fails closed, the same way the ElevenLabs route does. An unsigned inbound
   * endpoint is a way for anyone to write rows into the office's postvak.
   */
  const signed =
    Boolean(secret) &&
    verifyResendSignature(rawBody, {
      id: request.headers.get('svix-id'),
      timestamp: request.headers.get('svix-timestamp'),
      signature: request.headers.get('svix-signature'),
    }, secret as string);

  if (!signed) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  let payload: ReceivedPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    /* Malformed but signed: nothing to retry, so do not ask for a redelivery. */
    return NextResponse.json({ ok: true });
  }

  const data = payload.data;
  if (payload.type !== 'email.received' || !data?.email_id) {
    return NextResponse.json({ ok: true });
  }

  /* Bound once so the narrowing survives into the closures below. */
  const emailId = data.email_id;
  const { address, name } = parseAddress(data.from);

  if (!address) {
    console.error('[inbox/email] geen afzender in de payload:', data.from);
    return NextResponse.json({ ok: true });
  }

  if (isOurOwnAddress(address)) {
    /* Our own mail coming back through the forward. Dropped, not stored. */
    return NextResponse.json({ ok: true });
  }

  const body = await fetchBody(emailId);

  /*
   * Metadata only, and on purpose.
   *
   * ponytail: the bytes stay on Resend and are fetched through
   * /api/admin/inbox/attachment when somebody actually clicks the file —
   * three extra hops per attachment inside a webhook, for a photo most
   * threads never open, is work done on the off chance. The ceiling is
   * Resend's retention: once they expire a received e-mail the file is gone.
   * If that starts mattering, copy the bytes to Vercel Blob here, the way the
   * seven upload routes already do.
   */
  const attachments: MessageAttachment[] = (data.attachments ?? [])
    .filter((file) => file.id)
    .map((file) => ({
      url: `/api/admin/inbox/attachment?email=${encodeURIComponent(emailId)}&file=${encodeURIComponent(file.id as string)}`,
      name: file.filename ?? 'bijlage',
      type: file.content_type ?? null,
    }));

  /*
   * Stored inside the request rather than in `after()`, unlike the ElevenLabs
   * webhook. A failure has to reach Resend as a 500 so it retries: an e-mail
   * dropped here is a customer the office never knows wrote in. The unique
   * constraint on (conversation_id, provider_message_id) makes that retry a
   * no-op rather than a duplicate.
   */
  const admin = createSupabaseAdminClient();

  const conversationId = await upsertConversation(admin, {
    channel: 'email',
    externalId: address,
    displayName: name,
    subject: data.subject,
  });

  if (!conversationId) {
    return NextResponse.json({ error: 'Gesprek openen mislukt' }, { status: 500 });
  }

  const stored = await recordMessage(admin, {
    conversationId,
    direction: 'in',
    author: 'customer',
    body: body || null,
    attachments,
    providerMessageId: emailId,
  });

  if (!stored) {
    return NextResponse.json({ error: 'Bericht opslaan mislukt' }, { status: 500 });
  }

  /*
   * Telegram is the convenience half, so it runs after the response — the same
   * office chat `notifyNewLead` uses, and no e-mail alert: mailing the office
   * about an e-mail is one forwarding rule away from a loop.
   */
  after(async () => {
    /* The assistant answers first, when the thread is still hers. It no-ops
       without ANTHROPIC_API_KEY, so this is safe to ship before the key is
       set — and the office is told either way. */
    await maybeAnswer(admin, conversationId);

    const officeChat = process.env.TELEGRAM_OFFICE_CHAT_ID;
    if (!officeChat) return;

    const lines = [
      '📧 Nieuwe e-mail in het postvak',
      `Van: ${name ? `${name} — ${address}` : address}`,
      data.subject ? `Onderwerp: ${data.subject}` : null,
      body ? `\n${body.slice(0, 600)}${body.length > 600 ? '…' : ''}` : null,
      `\n${SITE_CONFIG.domain}/admin/berichten`,
    ].filter(Boolean);

    await sendTelegram(officeChat, lines.join('\n'));
  });

  return NextResponse.json({ ok: true });
}
