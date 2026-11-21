import type { Conversation } from '../ConversationConsole';

/*
 * What a conversation is about, so the office can work one kind at a time.
 *
 * Plain rules on the words, no model call: it runs for every row on every
 * render, must be free, and a wrong guess only moves a row between tabs. Order
 * matters — the first rule that fits wins:
 *   systeem    a supplier, platform or robot writing to info@ (Shopify, Google,
 *              Mollie, invoices). Not a customer; kept out of Postvak IN.
 *   afspraak   there is a job, or the customer talks about a visit/time.
 *   service    something we did is not working, warranty, a complaint.
 *   bestelling the webshop: order numbers, shipping, delivery, track & trace.
 *   aanvraag   a customer asking for a key, a price or help with a car.
 */
export type Topic = 'aanvraag' | 'bestelling' | 'afspraak' | 'service' | 'systeem' | 'overig';

export const TOPIC_LABEL: Record<Topic, string> = {
  aanvraag: 'Prijsaanvraag',
  bestelling: 'Bestelling',
  afspraak: 'Afspraak',
  service: 'Service & klacht',
  systeem: 'Systeem & leverancier',
  overig: 'Overig',
};

/* One colour per topic, readable in light and dark. */
export const TOPIC_CLASS: Record<Topic, string> = {
  aanvraag: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  bestelling: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  afspraak: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  service: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
  systeem: 'bg-muted text-muted-foreground',
  overig: 'bg-muted text-muted-foreground',
};

/* Senders that are never a customer: platforms, payment, ads, our own tools. */
const SYSTEM_SENDER =
  /(@|\.)(shopify|google|googlemail|mollie|stripe|paypal|vercel|resend|github|elevenlabs|facebookmail|meta|microsoft|apple|amazon|bol|kvk|belastingdienst|transip|hubspot|mailchimp|trustpilot|kiyoh)\.|^(no-?reply|noreply|billing|invoice|invoices|facturen?|notifications?|mailer-daemon|postmaster|support)@/i;
const SYSTEM_WORDS = /\b(factuur|invoice|your (next )?bill|receipt|betalingsherinnering|payout|uitbetaling|subscription|abonnement|verification code|verificatiecode|wachtwoord|password reset|newsletter|nieuwsbrief|unsubscribe)\b/i;
const APPOINTMENT_WORDS = /\b(afspraak|langskomen|langs komen|monteur|hoe laat|tijdslot|vandaag nog|morgen|ingepland|bevestig(d|ing)?)\b/i;
const ORDER_WORDS = /\b(bestelling|bestelnummer|order(nummer)?|verzend\w*|verzonden|levering|bezorg\w*|pakket|track\s*&?\s*trace|postnl|dhl|webshop|retour)\b|#\d{4,}/i;
const SERVICE_WORDS = /\b(klacht|garantie|werkt niet|doet het niet|kapot|stuk|defect|terugbetal\w*|ontevreden|probleem met)\b/i;
const REQUEST_WORDS = /\b(sleutel|prijs|kost(en)?|offerte|bijmaken|kwijt|verloren|reserve|kenteken|transponder|smart ?key|afstandsbediening|auto|bouwjaar)\b/i;

/** The text a conversation is judged on: subject, summary and the customer's first messages. */
function textOf(c: Conversation): string {
  const customer = c.turns.filter((t) => t.role === 'user').slice(0, 4).map((t) => t.message);
  return [c.thread?.subject, c.summary, c.lead?.service, ...customer].filter(Boolean).join('\n').slice(0, 3000);
}

export function topicOf(c: Conversation): Topic {
  const text = textOf(c);
  if (c.thread?.email && SYSTEM_SENDER.test(c.thread.email)) return 'systeem';
  if (c.channel === 'email' && SYSTEM_WORDS.test(text) && !c.lead) return 'systeem';
  if (c.job) return 'afspraak';
  if (SERVICE_WORDS.test(text)) return 'service';
  if (ORDER_WORDS.test(text)) return 'bestelling';
  if (APPOINTMENT_WORDS.test(text)) return 'afspraak';
  if (REQUEST_WORDS.test(text) || c.lead) return 'aanvraag';
  return 'overig';
}
