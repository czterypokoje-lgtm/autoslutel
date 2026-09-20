import 'server-only';
import { SITE_CONFIG } from '@/config/site.config';
import { sendMail } from './email';
import { sendTelegram } from './telegram';

/**
 * Tell the office a lead just came in.
 *
 * Until this existed, /api/leads inserted the row and returned. Nothing was
 * sent anywhere — no mail, no Telegram, no push. The only way to learn that
 * somebody had asked for a key at 23:40 was for a human to open the CRM and
 * look. 149 of the 199 leads in the table are still at status `new`, which is
 * not a triage backlog so much as a list of people nobody was told about.
 *
 * Two channels, because they fail differently:
 *
 *   e-mail     works today (RESEND_API_KEY is already set) and survives being
 *              read hours later, but nobody watches an inbox at 23:40.
 *   Telegram   is the one that actually buzzes a phone, and is free — but it
 *              needs TELEGRAM_BOT_TOKEN plus a chat id for the office, which
 *              is a thing somebody has to go and set up once.
 *
 * Best-effort by contract: a lead is saved before this runs, and a failure
 * here must never turn a captured lead into an error page for the customer.
 * But "best-effort" is not "silent" — every channel that is not configured
 * says so in the log, because an alert nobody receives is the bug this file
 * was written to end.
 */

export interface LeadAlert {
  id?: string | number | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: string | null;
  service?: string | null;
  location?: string | null;
  postcode?: string | null;
  kenteken?: string | null;
  source?: string | null;
  scenario?: string | null;
  quoted_price?: number | null;
  status?: string | null;
}

const euro = (value: number) => `€${value.toFixed(2).replace('.', ',')}`;

/** "Volkswagen Golf 2016", or null when the form did not ask. */
function carLine(lead: LeadAlert): string | null {
  const line = [lead.brand, lead.model, lead.year].filter(Boolean).join(' ');
  return line || null;
}

/**
 * The alert body, shared by both channels so they can never drift apart.
 *
 * Ordered by what decides whether to ring back first: who, on what number,
 * for which car and job, where. A quoted price only appears when the form
 * actually showed one — an invented figure here would be the figure the
 * technician repeats on the phone.
 */
function compose(lead: LeadAlert): { subject: string; text: string } {
  const car = carLine(lead);
  const who = lead.name?.trim() || 'Naam niet opgegeven';
  const where = [lead.postcode, lead.location].filter(Boolean).join(' · ') || 'Locatie onbekend';

  const lines = [
    `Nieuwe lead — ${who}`,
    '',
    `Telefoon:  ${lead.phone ?? '— (geen nummer opgegeven)'}`,
    lead.email ? `E-mail:    ${lead.email}` : null,
    `Locatie:   ${where}`,
    '',
    `Auto:      ${car ?? 'niet opgegeven'}${lead.kenteken ? ` (${lead.kenteken})` : ''}`,
    `Dienst:    ${lead.service ?? 'niet opgegeven'}`,
    lead.scenario ? `Situatie:  ${lead.scenario}` : null,
    typeof lead.quoted_price === 'number' ? `Richtprijs getoond: ${euro(lead.quoted_price)}` : null,
    '',
    `Bron:      ${lead.source ?? 'onbekend'}`,
    /*
     * The intake route flags a repeat of the same number inside 72 hours as
     * `duplicate` rather than dropping it. Saying so here stops somebody
     * ringing a customer who was already called this morning.
     */
    lead.status === 'duplicate'
      ? 'LET OP: zelfde nummer belde/mailde al binnen 72 uur — mogelijk dubbel.'
      : null,
    '',
    `Open in het CRM: ${SITE_CONFIG.domain}/admin/leads`,
  ].filter((l) => l !== null);

  const subject = `Nieuwe lead: ${car ?? lead.service ?? 'aanvraag'}${lead.postcode ? ` — ${lead.postcode}` : ''}`;
  return { subject, text: lines.join('\n') };
}

/**
 * Fire the alert. Returns which channels actually delivered, so the caller
 * can log a lead that reached nobody rather than assuming it was seen.
 */
export async function notifyNewLead(lead: LeadAlert): Promise<{ mail: boolean; telegram: boolean }> {
  const { subject, text } = compose(lead);

  const officeChat = process.env.TELEGRAM_OFFICE_CHAT_ID;
  const officeMail = process.env.LEAD_ALERT_EMAIL ?? SITE_CONFIG.email;

  /* Both at once: neither is on the other's critical path, and a lead alert
     is not worth two sequential network round trips. */
  const [mail, telegram] = await Promise.all([
    sendMail({
      to: officeMail,
      subject,
      text,
      /* Reply goes to the customer when they left an address, so answering
         the alert answers the customer. */
      replyTo: lead.email ?? undefined,
    }).catch(() => false),

    (async () => {
      if (!officeChat) return false;
      if (!process.env.TELEGRAM_BOT_TOKEN) return false;
      await sendTelegram(officeChat, text);
      return true;
    })().catch(() => false),
  ]);

  if (!mail && !telegram) {
    console.error(
      `[lead-alert] lead ${lead.id ?? '(unknown id)'} reached NOBODY. ` +
        'Set RESEND_API_KEY (e-mail) and/or TELEGRAM_BOT_TOKEN + TELEGRAM_OFFICE_CHAT_ID (push).'
    );
  } else if (!telegram) {
    console.warn(
      '[lead-alert] e-mail only — set TELEGRAM_OFFICE_CHAT_ID for a notification that ' +
        'actually buzzes a phone outside office hours.'
    );
  }

  return { mail, telegram };
}
