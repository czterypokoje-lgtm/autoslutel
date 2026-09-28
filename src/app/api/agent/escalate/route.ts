import { NextResponse } from 'next/server';
import { checkAgent, asText } from '@/lib/agentAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { callOffice } from '@/lib/elevenlabsCall';
import { toE164NL } from '@/lib/phone';

export const dynamic = 'force-dynamic';

/**
 * The one tool the agent calls when the answer is a person.
 *
 * First choice is always a live transfer, which ElevenLabs does by itself
 * (transfer_to_number, configured in the console —
 * docs/elevenlabs-console-setup.md). This route is the second half of that: the
 * transfer nobody answered, and any channel that has no call to hand over. It
 * notifies the office and, for the two reasons that cannot wait, rings it.
 *
 * Deliberately writes nothing to the database. The durable record of the
 * conversation already arrives in agent_conversations from the post-call
 * webhook; a second half-record written mid-conversation would be a row the
 * office has to reconcile against the transcript it gets ten minutes later.
 *
 * Urgency is decided here, not by the agent. A model that can be talked into a
 * price can be talked into "this is an emergency", and the cost of that is
 * somebody's phone at three in the morning.
 */

type Reason = 'noodgeval' | 'mens_gevraagd' | 'terugbelverzoek';

/** Which reasons ring a phone, and what the office sees first in Telegram. */
const REASON: Record<Reason, { urgent: boolean; label: string }> = {
  noodgeval: { urgent: true, label: '🚨 NOODGEVAL — kind of dier in de auto, of langs de weg' },
  mens_gevraagd: { urgent: true, label: '🙋 Klant vraagt om een mens' },
  terugbelverzoek: { urgent: false, label: '📋 Terugbelverzoek' },
};

const isReason = (value: unknown): value is Reason =>
  typeof value === 'string' && value in REASON;

export async function POST(request: Request) {
  const auth = checkAgent(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  if (!isReason(body.reason)) {
    return NextResponse.json({ error: 'reason moet noodgeval, mens_gevraagd of terugbelverzoek zijn' }, { status: 400 });
  }
  const reason = body.reason;
  const { urgent, label } = REASON[reason];

  /* 600 rather than asText's default 80: this is a summary, not a field. */
  const summary = asText(body.summary, 600) ?? 'Geen samenvatting meegegeven.';
  const customerName = asText(body.customer_name, 60);
  const customerPhone = toE164NL(asText(body.customer_phone, 40));
  const channel = asText(body.channel, 20) ?? 'onbekend';

  const message = [
    label,
    `Kanaal: ${channel}`,
    customerName || customerPhone ? `Klant: ${[customerName, customerPhone].filter(Boolean).join(' · ')}` : null,
    '',
    summary,
  ]
    .filter((line) => line !== null)
    .join('\n');

  /* A rehearsal for scripts/test-agent.mjs — it must be able to prove this
     route works without ringing the office to do it. */
  if (body.dry_run === true) {
    return NextResponse.json({ escalated: false, dry_run: true, urgent, message });
  }

  const admin = createSupabaseAdminClient();
  const { data: recipients } = await admin.from('admin_telegram').select('telegram_chat_id');

  let notified = 0;
  for (const recipient of recipients ?? []) {
    /* sendTelegram swallows its own errors, so count what we handed over and
       treat an empty recipient list — not a failed send — as "nobody reached". */
    await sendTelegram(recipient.telegram_chat_id, message);
    notified += 1;
  }

  const called = urgent ? await callOffice({ summary, customerName, customerPhone, channel }) : false;

  /*
   * What the agent is allowed to say, decided by what actually happened. If
   * neither channel worked, it may not promise a colleague — the caller's own
   * next move (calling the office number themselves) is worth more than a
   * reassurance nobody is acting on.
   */
  const say = called
    ? 'Ik heb een collega aan de lijn gekregen, u wordt binnen een paar minuten gebeld.'
    : notified > 0
      ? 'Ik heb dit doorgegeven aan een collega, die belt u zo terug.'
      : 'Ik kan op dit moment geen collega bereiken. Belt u ons rechtstreeks, dan helpt iemand u direct.';

  return NextResponse.json({ escalated: notified > 0 || called, urgent, notified, called, say });
}
