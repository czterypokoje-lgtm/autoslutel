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
export type Topic = 'retour' | 'aanvraag' | 'bestelling' | 'afspraak' | 'service' | 'systeem' | 'overig';

export const TOPIC_LABEL: Record<Topic, string> = {
  retour: 'Retour',
  aanvraag: 'Prijsaanvraag',
  bestelling: 'Bestelling',
  afspraak: 'Afspraak',
  service: 'Service & klacht',
  systeem: 'Systeem & leverancier',
  overig: 'Overig',
};

/* One colour per topic, readable in light and dark. */
export const TOPIC_CLASS: Record<Topic, string> = {
  retour: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
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
  if (/\b(retour\w*|terugstur\w*|terugbetal\w*|refund\w*)\b/i.test(text)) return 'retour';
  if (c.channel === 'email' && SYSTEM_WORDS.test(text) && !ORDER_WORDS.test(text) && !REQUEST_WORDS.test(text) && !c.lead) return 'systeem';
  if (c.job) return 'afspraak';
  if (SERVICE_WORDS.test(text)) return 'service';
  if (ORDER_WORDS.test(text)) return 'bestelling';
  if (APPOINTMENT_WORDS.test(text)) return 'afspraak';
  if (REQUEST_WORDS.test(text) || c.lead) return 'aanvraag';
  return 'overig';
}

export function inboxOf(c: Conversation) {
  const topic = topicOf(c);
  if (topic === 'systeem') return 'systeem';
  if (ORDER_WORDS.test(textOf(c)) || topic === 'retour') return 'webshop';
  if (c.job || c.lead || topic === 'aanvraag' || topic === 'afspraak' || topic === 'service') return 'leads';
  return 'overig';
}

export function tagsOf(c: Conversation) {
  const words = [c.lead?.car, c.job?.car, c.lead?.service, c.thread?.subject, ...c.turns.filter(turn => turn.role === 'user').map(turn => turn.message)].join(' ').toLowerCase();
  const brand = words.match(/\b(bmw|audi|volkswagen|opel|mercedes|ford|peugeot|renault|toyota|kia|seat|volvo|fiat)\b/)?.[1];
  const part = words.match(/\b(sleutel|transponder|afstandsbediening|smartkey)(?:s)?\b/)?.[1];
  const service = words.match(/\b(bijmaken|programmeren|reparatie|retour|vervangen)\b/)?.[1];
  const urgency = words.match(/\b(spoed|dringend|urgent)\b/)?.[1];
  return [brand, part, service, urgency].filter((value): value is string => Boolean(value));
}

export function briefOf(c: Conversation) {
  const index = c.turns.findIndex(turn => turn.role === 'user' && turn.message.trim());
  return { index, question: c.turns[index]?.message ?? c.thread?.subject ?? null,
    known: [c.job?.car ?? c.lead?.car, c.job?.service ?? c.lead?.service].filter(Boolean).join(' · '),
    outcome: ({
      success:'Gelukt', failure:'Mislukt', unknown:'Onbekend', open:'Open', closed:'Afgehandeld',
      gepland:'Gepland', afgerond:'Afgerond', geannuleerd:'Geannuleerd',
    } as Record<string,string>)[c.outcome ?? c.job?.status ?? c.thread?.status ?? ''] ?? 'Onbekend',
    next: c.thread?.status === 'closed' ? 'Afgehandeld' : c.thread?.draft ? 'Concept controleren' : 'Gesprek beoordelen' };
}
