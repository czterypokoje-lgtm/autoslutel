import { SITE_CONFIG } from '@/config/site.config';

/**
 * Transactional e-mail.
 *
 * A customer who pays currently receives nothing at all: no order number, no
 * confirmation of what was bought, no statement of the fourteen days they have
 * to change their mind. Sending that confirmation is not optional — BW 6:230v
 * lid 7 requires the trader to confirm the agreement on a durable medium
 * within a reasonable time after the order.
 *
 * Resend is used because it needs one API key and no SDK. Set:
 *
 *   RESEND_API_KEY=re_…
 *   MAIL_FROM="Autosleutel24 <bestellingen@autosleutel24.nl>"   (optional)
 *
 * With no key configured nothing is sent and the failure is logged loudly
 * rather than swallowed — an order that silently sends no confirmation is a
 * complaint waiting to happen, and the log is where that gets noticed.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface Mail {
  to: string;
  subject: string;
  /** Plain text. Line breaks are turned into paragraphs for the HTML part. */
  text: string;
  replyTo?: string;
}

/** Very small text-to-HTML: paragraphs only, everything escaped. */
function asHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const body = escaped
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 1em">${block.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#0f172a;max-width:600px">${body}</div>`;
}

export async function sendMail({ to, subject, text, replyTo }: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error(
      `[email] RESEND_API_KEY is not configured — "${subject}" to ${to} was not sent`
    );
    return false;
  }

  const from = process.env.MAIL_FROM ?? `${SITE_CONFIG.name} <${SITE_CONFIG.email}>`;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html: asHtml(text),
        reply_to: replyTo ?? SITE_CONFIG.email,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error('[email] provider rejected the message', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] send failed', error);
    return false;
  }
}

interface OrderLine {
  title: string;
  quantity: number;
  lineTotal: number;
}

const euro = (value: number) => `€${value.toFixed(2).replace('.', ',')}`;

/**
 * The confirmation the customer gets once Mollie reports the payment as paid.
 *
 * It carries what the law asks for on a durable medium: what was bought, what
 * it cost, where it goes, and the fourteen days — including the fact that a
 * key cut or programmed for their car is excluded from it.
 */
export function orderConfirmation(order: {
  order_number: string;
  name: string;
  email: string;
  street: string;
  postcode: string;
  city: string;
  items: OrderLine[];
  total_inc: number;
  shipping_cost: number;
  needs_technician: boolean;
}): Mail {
  const lines = order.items
    .map((i) => `  ${i.quantity}× ${i.title} — ${euro(i.lineTotal)}`)
    .join('\n');

  const text = `Beste ${order.name},

Bedankt voor uw bestelling bij ${SITE_CONFIG.name}. Wij hebben uw betaling ontvangen.

Bestelnummer: ${order.order_number}

${lines}

Verzendkosten: ${order.shipping_cost === 0 ? 'gratis' : euro(order.shipping_cost)}
Totaal betaald: ${euro(order.total_inc)} (incl. btw)

Bezorgadres:
${order.name}
${order.street}
${order.postcode} ${order.city}

${
  order.needs_technician
    ? 'U heeft gekozen voor een monteurbezoek. Wij bellen u binnen één werkdag om een tijd af te spreken. Houd uw kenteken en een legitimatiebewijs bij de hand — zonder eigendomsbewijs werken wij niet aan een voertuig.'
    : 'Wij verzenden uw bestelling binnen 2 tot 3 werkdagen. U ontvangt een bericht zodra het pakket onderweg is.'
}

Bedenktijd: u mag de bestelling binnen 14 dagen na ontvangst retourneren. Sleutels die op uw auto zijn ingeleerd of waarvan de baard is gefreesd zijn op maat gemaakt en vallen daarbuiten. De volledige regeling staat op ${SITE_CONFIG.domain}/verzending-en-retour.

Vragen? Bel ${SITE_CONFIG.phone} of antwoord op deze e-mail.

${SITE_CONFIG.name}
${SITE_CONFIG.domain}`;

  return {
    to: order.email,
    subject: `Bestelling ${order.order_number} — bevestiging`,
    text,
  };
}

/** The copy that goes to the office, so an order cannot be missed. */
export function orderNotification(order: {
  order_number: string;
  name: string;
  email: string;
  phone: string | null;
  postcode: string;
  city: string;
  total_inc: number;
  needs_technician: boolean;
  items: OrderLine[];
}): Mail {
  const text = `Nieuwe betaalde bestelling: ${order.order_number}

${order.items.map((i) => `  ${i.quantity}× ${i.title}`).join('\n')}

Totaal: ${euro(order.total_inc)}
Klant: ${order.name} — ${order.email}${order.phone ? ` — ${order.phone}` : ''}
Bezorging: ${order.postcode} ${order.city}
${order.needs_technician ? 'MONTEURBEZOEK — bel de klant binnen één werkdag.' : ''}

Open in het CRM: ${SITE_CONFIG.domain}/admin/orders`;

  return {
    to: SITE_CONFIG.email,
    subject: `${order.needs_technician ? '[MONTEUR] ' : ''}Bestelling ${order.order_number} betaald`,
    text,
    replyTo: order.email,
  };
}
