import { NextResponse, after } from 'next/server';
import { fetchReceivedEmail, isAutomated, stripQuoted, verifySvix } from '@/lib/inbox/emailIn';
import { afterInbound } from '@/lib/inbox/handleInbound';
import { addMessage, emailThread } from '@/lib/inbox/store';

export const dynamic = 'force-dynamic';

/**
 * Resend `email.received` webhook: a mail forwarded from the office mailbox
 * has arrived at the CRM address. Signature-checked (Svix), then the body is
 * fetched from Resend — the webhook itself carries only the envelope.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Niet beschikbaar' }, { status: 503 });
  if (!verifySvix(raw, request.headers, secret)) {
    return NextResponse.json({ error: 'Ongeldige handtekening' }, { status: 401 });
  }
  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  if (event.type !== 'email.received' || !event.data?.email_id) return NextResponse.json({ ok: true, ignored: event.type ?? null });

  const mail = await fetchReceivedEmail(event.data.email_id);
  if (!mail || !mail.from) return NextResponse.json({ ok: true, ignored: 'unreadable' });

  /* Our own outbound address, bounces and auto-replies never become conversations. */
  const own = (process.env.MAIL_FROM ?? '').match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? (process.env.MAIL_FROM ?? '').toLowerCase();
  if ((own && mail.from === own) || isAutomated(mail)) return NextResponse.json({ ok: true, ignored: 'automated' });

  const body = stripQuoted(mail.text) || mail.text.trim();
  if (!body && !mail.attachments.length) return NextResponse.json({ ok: true, ignored: 'empty' });

  try {
    const thread = await emailThread({
      email: mail.from,
      name: mail.fromName,
      subject: mail.subject.replace(/^\s*(fwd?|re|aw|wg)\s*:\s*/gi, '').trim() || null,
      messageId: mail.messageId,
      references: mail.references,
    });
    const stored = await addMessage(thread, {
      direction: 'in',
      author: 'customer',
      body: body || '[alleen bijlagen]',
      external_id: `resend:${mail.id}`,
      message_id: mail.messageId,
      meta: { subject: mail.subject, attachments: mail.attachments.map((a) => a.filename), to: mail.to },
    });
    if (stored) after(() => afterInbound(thread, stored));
  } catch (error) {
    console.error('[resend] inbound failed', error);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
