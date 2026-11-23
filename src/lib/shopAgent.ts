/**
 * The webshop agent: what it may say about an order, a return and who takes
 * over. Autosleutel24's own shop (public.orders, written by the "shop" app).
 *
 * Pure functions only, no database and no '@/' import, so
 * tests/unit/shop-agent.test.mjs runs them under plain Node. The routes under
 * /api/agent/shop read the rows and hand them in.
 *
 * Time promises: only the complaint answer time (two working days) is a
 * confirmed fact (agent_knowledge company.complaints); every other sentence
 * says "zo snel mogelijk" and no number.
 *
 * Same rule as the phone agent: the agent never decides anything that costs
 * money or trust. It reports a status the database holds, registers a return
 * request, and hands over. Whether a return is accepted, a refund paid or an
 * exception made is the office's call; the code below never says "no" to a
 * return on its own, it only says "a colleague looks at this".
 */

/* ── reading what the agent sends ────────────────────────────────────── */

/**
 * Spoken or typed order number → the numbers worth looking up.
 *
 * The shop issues AS24-YY-XXXXXX: two year digits and six random characters
 * from an alphabet without I, O, 0 and 1 (shop/src/app/api/checkout/route.ts
 * orderNumber). Customers say it with spaces, drop the dashes, or leave off
 * "AS24". The old AS24-YYYY-NNNNN shape from before the random codes is still
 * accepted, for orders placed with it.
 */
export function orderNumberCandidates(value: unknown): string[] {
  if (typeof value !== 'string' && typeof value !== 'number') return [];
  const raw = String(value).toUpperCase().trim();
  if (!raw || raw.length > 40) return [];
  const compact = raw.replace(/[^A-Z0-9]/g, '');

  const out = new Set<string>();
  const current = compact.match(/^(?:AS24)?(\d{2})([A-HJ-NP-Z2-9]{6})$/);
  if (current) out.add(`AS24-${current[1]}-${current[2]}`);
  /* Legacy: the year and the counter need a separator, or "2026 42" and "AS24-26-…" blur. */
  const legacy = raw.match(/^(?:A\s*S\s*-?\s*24\W*)?(20\d{2})\W+(\d{1,5})$/);
  if (legacy) out.add(`AS24-${legacy[1]}-${legacy[2].padStart(5, '0')}`);
  if (/^[A-Z0-9-]{3,40}$/.test(raw.replace(/\s+/g, ''))) out.add(raw.replace(/\s+/g, ''));
  return [...out];
}

export const normEmail = (value: unknown): string | null => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
};

/** Dutch (1404HT) or Belgian (1000) postcode; the shop's checkout accepts both. */
export const normPostcode = (value: unknown): string | null => {
  const v = typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : '';
  return /^[1-9]\d{3}([A-Z]{2})?$/.test(v) ? v : null;
};

/* ── the order as the agent may see it ───────────────────────────────── */

export interface OrderRow {
  order_number: string;
  status: string;
  email: string | null;
  postcode: string | null;
  items: unknown;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  refunded_at: string | null;
  carrier: string | null;
  tracking_code: string | null;
  return_requested_at: string | null;
  needs_technician: boolean | null;
}

/**
 * Is the person asking the one who ordered? The order number plus the e-mail
 * or the postcode on the order. Either one is enough; neither is a no, and the
 * caller gets the same answer as for a number that does not exist, so the tool
 * cannot be used to find out which order numbers are real.
 */
export function ownsOrder(order: Pick<OrderRow, 'email' | 'postcode'>, input: { email?: unknown; postcode?: unknown }): boolean {
  const email = normEmail(input.email);
  const postcode = normPostcode(input.postcode);
  if (email && normEmail(order.email) === email) return true;
  if (postcode && normPostcode(order.postcode) === postcode) return true;
  return false;
}

/**
 * Made to order: a line bought with a service (frezen, inleren, overzetten…)
 * instead of 'product_only' (shop checkout, items[].service). No withdrawal
 * right applies to those (BW 6:230p), so a return of such an order is always
 * for a person to judge. Older orders have no service field: plain product.
 */
export function madeToOrder(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((item) => {
    const service = item && typeof item === 'object' ? (item as Record<string, unknown>).service : undefined;
    return typeof service === 'string' && service !== '' && service !== 'product_only';
  });
}

/** Item names and quantities, nothing else from the line (no cost, no supplier code). */
export function orderItems(items: unknown): { title: string; quantity: number }[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? row.name ?? '').trim();
    const quantity = Math.max(1, Math.round(Number(row.quantity ?? 1)) || 1);
    return title ? [{ title: title.slice(0, 120), quantity }] : [];
  });
}

/** A Dutch date the agent can read out: "dinsdag 3 november". */
export function dutchDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' }).format(d);
}

/**
 * PostNL's link carries the postcode. Only the one the caller gave is used: a
 * caller who proved ownership with the e-mail address must not learn the
 * delivery postcode from the link.
 */
export function trackingUrl(carrier: string | null, code: string | null, postcode: string | null): string | null {
  if (!code) return null;
  const c = (carrier ?? '').toLowerCase();
  const pc = normPostcode(postcode);
  if (c.includes('postnl')) return `https://jouw.postnl.nl/track-and-trace/${encodeURIComponent(code)}-NL${pc ? `-${pc}` : ''}`;
  if (c.includes('dhl')) return `https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id=${encodeURIComponent(code)}`;
  if (c.includes('dpd')) return `https://tracking.dpd.de/status/nl_NL/parcel/${encodeURIComponent(code)}`;
  return null;
}

/* ── return window ───────────────────────────────────────────────────── */

/** Herroepingsrecht: fourteen days, and the clock starts at delivery (0009_webshop_orders.sql). */
export const RETURN_DAYS = 14;
/**
 * delivered_at is only stamped when the office sets "delivered" by hand, so
 * most orders never get one. For those the delivery is assumed to be at most
 * this many days after shipping; later than that a person decides.
 */
export const TRANSIT_DAYS = 7;

/** YYYY-MM-DD of an instant in Amsterdam. */
export function amsterdamDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' }).format(d);
}
function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type ReturnWindow =
  | { state: 'open'; until: string | null }      // within 14 days of delivery (or of the latest likely delivery)
  | { state: 'closed'; until: string }           // past that
  | { state: 'not_shipped' }                     // paid, still with us: that is a cancellation
  | { state: 'not_applicable' };                 // unpaid, cancelled or already refunded

export function returnWindow(order: Pick<OrderRow, 'status' | 'shipped_at' | 'delivered_at'>, now = new Date()): ReturnWindow {
  if (['pending', 'cancelled', 'refunded'].includes(order.status)) return { state: 'not_applicable' };
  if (order.status === 'paid' || order.status === 'processing') return { state: 'not_shipped' };
  const from = order.delivered_at ?? order.shipped_at;
  /* Shipped with no date at all: nothing to count from, a person decides if it is late. */
  if (!from || Number.isNaN(new Date(from).getTime())) return { state: 'open', until: null };
  /*
   * Calendar days in Amsterdam, and the last day counts in full: delivered on
   * the 9th, the period runs to the end of the 23rd. Day arithmetic on the
   * date, not on milliseconds, so a DST change cannot move it.
   */
  const days = RETURN_DAYS + (order.delivered_at ? 0 : TRANSIT_DAYS);
  const lastDay = addDays(amsterdamDate(new Date(from)), days);
  const until = `${lastDay}T12:00:00Z`; // noon UTC: the same calendar day in Amsterdam, for dutchDate
  return amsterdamDate(now) <= lastDay ? { state: 'open', until } : { state: 'closed', until };
}

/* ── what the agent says about an order ──────────────────────────────── */

export function statusSentence(order: OrderRow): string {
  const shipped = dutchDate(order.shipped_at);
  const delivered = dutchDate(order.delivered_at);
  switch (order.status) {
    case 'pending':
      return 'Deze bestelling is nog niet betaald, en wordt pas verwerkt als de betaling binnen is.';
    case 'paid':
    case 'processing':
      return 'De bestelling is betaald en wordt klaargemaakt voor verzending.';
    case 'shipped':
      return order.tracking_code
        ? `De bestelling is verzonden${shipped ? ` op ${shipped}` : ''}. Met de track-en-tracecode kunt u het pakket volgen.`
        : `De bestelling is verzonden${shipped ? ` op ${shipped}` : ''}.`;
    case 'delivered':
      return `De bestelling is bezorgd${delivered ? ` op ${delivered}` : ''}.`;
    case 'cancelled':
      return 'Deze bestelling is geannuleerd.';
    case 'refunded':
      return `Het bedrag van deze bestelling is terugbetaald${order.refunded_at ? ` op ${dutchDate(order.refunded_at)}` : ''}.`;
    default:
      return 'Ik zie de bestelling, maar niet in welke fase hij is. Een collega kijkt ernaar.';
  }
}

/** Everything the order tool returns. No address, no phone, no amounts per line. */
export function orderView(order: OrderRow, now = new Date(), callerPostcode: unknown = null) {
  const window = returnWindow(order, now);
  return {
    found: true as const,
    order_number: order.order_number,
    status: order.status,
    say: statusSentence(order),
    ordered_on: dutchDate(order.created_at),
    items: orderItems(order.items),
    shipped_on: dutchDate(order.shipped_at),
    delivered_on: dutchDate(order.delivered_at),
    carrier: order.carrier,
    tracking_code: order.tracking_code,
    tracking_url: trackingUrl(order.carrier, order.tracking_code, normPostcode(callerPostcode)),
    includes_technician_visit: order.needs_technician === true,
    return: {
      window: window.state,
      until: 'until' in window ? dutchDate(window.until) : null,
      already_requested: Boolean(order.return_requested_at),
    },
  };
}

export const NOT_FOUND = {
  found: false as const,
  say: 'Ik kan geen bestelling vinden met dit nummer en dit e-mailadres of deze postcode. Het bestelnummer staat in de bevestigingsmail en ziet eruit als AS24-26-K7Q2XM. Wilt u het nog eens noemen?',
};

/* ── return requests ─────────────────────────────────────────────────── */

/**
 * The item's state, as one of three words the agent picks (an enum in the tool
 * schema, not free text: "niet geopend" must never read as "geopend").
 *   ongebruikt  not used; unpacked and looked at, as in a shop, still counts
 *   bewerkt     used beyond that by the customer: cut, programmed or tried
 *               elsewhere, housing opened, worn
 *   defect      does not work
 */
export const CONDITIONS = ['ongebruikt', 'bewerkt', 'defect'] as const;
export type Condition = (typeof CONDITIONS)[number];

export function asCondition(value: unknown): Condition | null {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return (CONDITIONS as readonly string[]).includes(text) ? (text as Condition) : null;
}

/*
 * EU/NL consumer law (Directive 2011/83/EU, BW 6:230o-230s), as the owner
 * asked the agent to follow it:
 *   - 14 days from receipt; opening and inspecting "as in a shop" is allowed;
 *   - used beyond that: the right to withdraw REMAINS, the trader may charge
 *     the loss in value (art. 14(2), BW 6:230s) — never "no return";
 *   - cut, programmed or transferred BY US on the order: made to order
 *     (art. 16(c), BW 6:230p) — normally no withdrawal right, a person confirms;
 *   - defect: the legal guarantee (BW 7:17-7:23), not withdrawal;
 *   - a clear statement in the chat is a valid withdrawal (art. 11(1)); it is
 *     registered and confirmed by e-mail, the office only judges exceptions.
 * Outside the period, B2B and anything unclear: a person.
 */
export type ReturnKind = 'retour' | 'waardevermindering' | 'maatwerk' | 'garantie' | 'beoordeling';

export type ReturnDecision =
  | { register: true; kind: ReturnKind; say: string }
  | { register: false; outcome: 'al_aangevraagd' | 'nog_niet_verzonden' | 'niet_van_toepassing'; say: string };

const SAY: Record<ReturnKind, string> = {
  retour: 'Ik heb uw herroeping geregistreerd. Stuur het artikel binnen 14 dagen terug, compleet en in de originele verpakking; het retouradres staat op de pagina Verzending en retour en de retourkosten zijn voor uw rekening. Wij betalen het aankoopbedrag en de standaard verzendkosten binnen 14 dagen terug, zodra wij het artikel of uw verzendbewijs hebben.',
  waardevermindering: 'U mag het artikel nog steeds retourneren, en ik heb uw herroeping geregistreerd. Omdat het verder is gebruikt dan nodig om het te bekijken, kunnen wij de waardevermindering in rekening brengen. Een collega beoordeelt dat en laat u het bedrag weten. Stuur het artikel binnen 14 dagen terug; het retouradres staat op de pagina Verzending en retour.',
  maatwerk: 'Deze bestelling is op uw verzoek voor uw auto gefreesd, ingeleerd of overgezet, en is daarmee op maat gemaakt; daarvoor geldt de bedenktijd in principe niet. Ik heb uw verzoek wel doorgezet en een collega neemt contact met u op. Stuurt u nog niets terug voordat u van ons hoort.',
  garantie: 'Bij een defect heeft u recht op een product dat goed werkt; dat is de wettelijke garantie, los van onze eigen garantie. Ik heb uw melding geregistreerd en een collega kijkt of herstel of vervanging mogelijk is. Stuurt u nog niets terug voordat u van ons hoort.',
  beoordeling: 'Ik heb uw verzoek geregistreerd. Volgens onze gegevens is de bedenktijd van 14 dagen mogelijk voorbij; een collega kijkt ernaar en neemt contact met u op. Stuurt u nog niets terug voordat u van ons hoort.',
};

/** Register or not, and in which drawer. The agent never refuses; only the office can. */
export function decideReturn(order: OrderRow, condition: Condition | null, now = new Date()): ReturnDecision {
  /* A defect can surface long after an earlier return request: it is never "already requested". */
  if (order.return_requested_at && condition !== 'defect') {
    return { register: false, outcome: 'al_aangevraagd', say: 'Voor deze bestelling is al een retourverzoek ingediend. Een collega neemt daarover contact met u op; u hoeft niets opnieuw aan te vragen.' };
  }
  const window = returnWindow(order, now);
  if (window.state === 'not_applicable') {
    return { register: false, outcome: 'niet_van_toepassing', say: statusSentence(order) + ' Een retour is daarom niet nodig. Heeft u toch een vraag, dan geef ik die door aan een collega.' };
  }
  if (window.state === 'not_shipped') {
    return { register: false, outcome: 'nog_niet_verzonden', say: 'Deze bestelling is nog niet verzonden, dus terugsturen is niet nodig. Wilt u hem annuleren? Dan geef ik dat door aan een collega.' };
  }
  const kind: ReturnKind =
    condition === 'defect' ? 'garantie'
    : madeToOrder(order.items) ? 'maatwerk'
    : window.state === 'closed' ? 'beoordeling'
    : condition === 'bewerkt' ? 'waardevermindering'
    : 'retour';
  return { register: true, kind, say: SAY[kind] };
}

export const RETURN_LABEL: Record<ReturnKind, string> = {
  retour: '↩️ Herroeping webshop (ongebruikt, binnen termijn)',
  waardevermindering: '↩️ Herroeping met mogelijke waardevermindering (gebruikt)',
  maatwerk: '⚖️ Retourverzoek maatwerk (door ons gefreesd/ingeleerd) — beslissen',
  garantie: '🛠️ Garantiemelding webshop (defect)',
  beoordeling: '⚖️ Retourverzoek mogelijk buiten de termijn — beslissen',
};

/** Confirmation on a durable medium (art. 11(3) CRD): what we received, and when. */
export function returnConfirmationMail(orderNumber: string, kind: ReturnKind, at: Date): { subject: string; text: string } {
  const when = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(at);
  const withdrawal = kind === 'retour' || kind === 'waardevermindering';
  return {
    subject: `${withdrawal ? 'Bevestiging herroeping' : 'Uw verzoek ontvangen'} — bestelling ${orderNumber}`,
    text: [
      'Beste klant,',
      '',
      `Op ${when} hebben wij via de chat uw ${withdrawal ? 'herroeping' : kind === 'garantie' ? 'garantiemelding' : 'retourverzoek'} ontvangen voor bestelling ${orderNumber}.`,
      '',
      SAY[kind],
      '',
      'Heeft u vragen, beantwoord dan deze e-mail.',
      '',
      'Met vriendelijke groet,',
      'Autosleutel24',
    ].join('\n'),
  };
}

/* ── routing: who takes over ─────────────────────────────────────────── */

/**
 * The webshop agent's handover reasons, and what each means for the office.
 * Decided here, not by the agent: none of these rings a phone at night. A
 * webshop question is never an emergency; someone standing next to a locked
 * car is a service caller and gets the service number. No transfer_to_agent
 * to the phone agent: the widget is public and that agent's tools (book,
 * escalate) ring the office; a webshop visitor must never reach them.
 */
export const ROUTES = {
  bestelling: { label: '📦 Probleem met bestelling (niet ontvangen, beschadigd, verkeerd artikel)', subject: 'Bestelling', say: 'Ik heb dit doorgegeven aan een collega van de webshop. U krijgt zo snel mogelijk antwoord.' },
  annuleren: { label: '✋ Annuleringsverzoek (nog niet verzonden)', subject: 'Annuleren', say: 'Ik heb uw annuleringsverzoek doorgegeven. Een collega houdt de bestelling tegen als die nog niet verzonden is en bevestigt dat per e-mail.' },
  adres: { label: '🏠 Adres wijzigen', subject: 'Adreswijziging', say: 'Ik heb de adreswijziging doorgegeven. Een collega bevestigt per e-mail of het nog lukt voordat het pakket verzonden wordt.' },
  product_advies: { label: '🔑 Productadvies: welke sleutel past', subject: 'Productadvies', say: 'Een collega zoekt uit welke sleutel op uw auto past en neemt contact met u op.' },
  monteur: { label: '🚐 Wil een monteur (service, niet webshop)', subject: 'Service via webshop', say: 'Voor een monteur belt u het snelst 06 11 75 12 31, dag en nacht. Ik heb ook doorgegeven dat een collega van de service u terugbelt.' },
  zakelijk: { label: '🏢 Zakelijke klant via webshop', subject: 'Zakelijk', say: 'Ik heb uw vraag doorgegeven aan een collega voor zakelijke klanten. U hoort zo snel mogelijk van ons.' },
  klacht: { label: '😠 Klacht via webshop', subject: 'Klacht', say: 'Het spijt me dat het zo gelopen is. Ik heb uw klacht doorgegeven; klachten beantwoorden we binnen twee werkdagen.' },
  mens: { label: '🙋 Webshopklant vraagt om een mens', subject: 'Wil een medewerker', say: 'Ik heb een collega gevraagd contact met u op te nemen.' },
  overig: { label: '💬 Webshopvraag zonder antwoord', subject: 'Webshopvraag', say: 'Dat weet ik niet zeker, dus ik heb uw vraag doorgegeven aan een collega. U hoort van ons.' },
} as const;

export type Route = keyof typeof ROUTES;
export const isRoute = (value: unknown): value is Route => typeof value === 'string' && Object.hasOwn(ROUTES, value);

/** What the agent may promise, by what actually happened. */
export function handoverSay(route: Route, reached: boolean, hasContact: boolean): string {
  if (!hasContact) return 'Om u terug te kunnen bereiken heb ik uw e-mailadres of telefoonnummer nodig. Wilt u dat geven?';
  if (!reached) return 'Ik kan op dit moment geen collega bereiken. Mailt u ons op info@autosleutel24.nl, dan helpt iemand u zo snel mogelijk.';
  return ROUTES[route].say;
}
