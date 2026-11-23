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

/** Spoken or typed order number → the numbers worth looking up. */
export function orderNumberCandidates(value: unknown): string[] {
  if (typeof value !== 'string' && typeof value !== 'number') return [];
  const raw = String(value).toUpperCase().replace(/[\s.#]+/g, ' ').trim();
  if (!raw || raw.length > 40) return [];

  const out = new Set<string>();
  /* AS24-2026-00042, "AS 24 2026 42", "as24/2026/42" */
  const full = raw.match(/^A\s*S\s*-?\s*2\s*4\D*(\d{4})\D*(\d{1,5})$/);
  /* "2026-42", "2026 00042" — the year and the counter, no prefix */
  const short = raw.match(/^(20\d{2})\D+(\d{1,5})$/);
  const parts = full ?? short;
  if (parts) out.add(`AS24-${parts[1]}-${parts[2].padStart(5, '0')}`);

  const compact = raw.replace(/\s+/g, '');
  if (/^[A-Z0-9-]{3,40}$/.test(compact)) out.add(compact);
  return [...out];
}

export const normEmail = (value: unknown): string | null => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
};

export const normPostcode = (value: unknown): string | null => {
  const v = typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : '';
  return /^\d{4}[A-Z]{2}$/.test(v) ? v : null;
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

export type ReturnWindow =
  | { state: 'open'; until: string | null }      // delivered within 14 days, or shipped and not yet delivered
  | { state: 'closed'; until: string }           // delivered more than 14 days ago
  | { state: 'not_shipped' }                     // paid, still with us: that is a cancellation
  | { state: 'not_applicable' };                 // unpaid, cancelled or already refunded

export function returnWindow(order: Pick<OrderRow, 'status' | 'shipped_at' | 'delivered_at'>, now = new Date()): ReturnWindow {
  if (['pending', 'cancelled', 'refunded'].includes(order.status)) return { state: 'not_applicable' };
  if (order.status === 'paid' || order.status === 'processing') return { state: 'not_shipped' };
  if (order.delivered_at) {
    const until = new Date(new Date(order.delivered_at).getTime() + RETURN_DAYS * 86_400_000);
    return until.getTime() >= now.getTime() ? { state: 'open', until: until.toISOString() } : { state: 'closed', until: until.toISOString() };
  }
  /* Shipped, no delivery date recorded: the period has not started yet. */
  return { state: 'open', until: null };
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
export function orderView(order: OrderRow, now = new Date()) {
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
    tracking_url: trackingUrl(order.carrier, order.tracking_code, order.postcode),
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
  say: 'Ik kan geen bestelling vinden met dit nummer en dit e-mailadres of deze postcode. Wilt u het bestelnummer uit de bevestigingsmail nog eens noemen?',
};

/* ── return requests ─────────────────────────────────────────────────── */

export const CONDITIONS = ['ongebruikt', 'geopend', 'bewerkt', 'defect'] as const;
export type Condition = (typeof CONDITIONS)[number];

/**
 * What the customer says about the item, in their words, to one of four.
 * "bewerkt" is gefreesd, geprogrammeerd or overgezet: the shop's own return
 * policy names those, and they need a person to decide.
 */
export function asCondition(value: unknown): Condition | null {
  const text = typeof value === 'string' ? value.toLowerCase() : '';
  if (!text.trim()) return null;
  if ((CONDITIONS as readonly string[]).includes(text.trim())) return text.trim() as Condition;
  if (/defect|kapot|stuk|werkt niet|doet (het )?niet|beschadigd/.test(text)) return 'defect';
  if (/gefreesd|frezen|geslepen|geprogrammeerd|programmeren|ingeleerd|overgezet|bewerkt/.test(text)) return 'bewerkt';
  if (/geopend|open(gemaakt)?|uitgepakt|verpakking/.test(text)) return 'geopend';
  if (/ongebruikt|nieuw|niet gebruikt|dicht|ongeopend/.test(text)) return 'ongebruikt';
  return null;
}

export type ReturnKind = 'retour' | 'garantie' | 'beoordeling';

export type ReturnDecision =
  | { register: true; kind: ReturnKind; say: string }
  | { register: false; outcome: 'al_aangevraagd' | 'nog_niet_verzonden' | 'niet_van_toepassing'; say: string };

/**
 * Register or not, and in which drawer. Never a refusal: anything that is not
 * a plain return inside the period becomes "beoordeling" for the office.
 */
export function decideReturn(order: OrderRow, condition: Condition | null, now = new Date()): ReturnDecision {
  if (order.return_requested_at) {
    return { register: false, outcome: 'al_aangevraagd', say: 'Voor deze bestelling is al een retourverzoek ingediend. Een collega neemt daarover contact met u op; u hoeft niets opnieuw aan te vragen.' };
  }
  const window = returnWindow(order, now);
  if (window.state === 'not_applicable') {
    return { register: false, outcome: 'niet_van_toepassing', say: statusSentence(order) + ' Een retour is daarom niet nodig. Heeft u toch een vraag, dan geef ik die door aan een collega.' };
  }
  if (window.state === 'not_shipped') {
    return { register: false, outcome: 'nog_niet_verzonden', say: 'Deze bestelling is nog niet verzonden, dus terugsturen is niet nodig. Wilt u hem annuleren? Dan geef ik dat door aan een collega.' };
  }
  if (condition === 'defect') {
    return { register: true, kind: 'garantie', say: 'Ik heb uw melding over het defecte artikel geregistreerd. Een collega neemt per e-mail contact met u op over de garantie. Stuurt u nog niets terug voordat u van ons hoort.' };
  }
  if (window.state === 'open' && condition === 'ongebruikt') {
    return { register: true, kind: 'retour', say: 'Ik heb uw retourverzoek geregistreerd. U ontvangt van ons per e-mail hoe en waarheen u het pakket terugstuurt. Stuurt u nog niets terug voordat u die e-mail heeft.' };
  }
  return { register: true, kind: 'beoordeling', say: 'Ik heb uw verzoek geregistreerd. Omdat het artikel niet meer ongebruikt is, of de bedenktijd voorbij is, beoordeelt een collega het. U hoort per e-mail van ons. Stuurt u nog niets terug voordat u van ons hoort.' };
}

export const RETURN_LABEL: Record<ReturnKind, string> = {
  retour: '↩️ Retourverzoek webshop',
  garantie: '🛠️ Garantiemelding webshop (defect)',
  beoordeling: '⚖️ Retour ter beoordeling (geopend/bewerkt of buiten termijn)',
};

/* ── routing: who takes over ─────────────────────────────────────────── */

/**
 * The webshop agent's handover reasons, and what each means for the office.
 * Decided here, not by the agent: none of these rings a phone at night. A
 * webshop question is never an emergency; someone standing next to a locked
 * car is a service caller, and the agent transfers those to the phone agent
 * (transfer_to_agent in the console) or gives them the service number.
 */
export const ROUTES = {
  bestelling: { label: '📦 Probleem met bestelling (niet ontvangen, beschadigd, verkeerd artikel)', subject: 'Bestelling', say: 'Ik heb dit doorgegeven aan een collega van de webshop. U krijgt zo snel mogelijk antwoord.' },
  annuleren: { label: '✋ Annuleringsverzoek (nog niet verzonden)', subject: 'Annuleren', say: 'Ik heb uw annuleringsverzoek doorgegeven. Een collega houdt de bestelling tegen als die nog niet verzonden is en bevestigt dat per e-mail.' },
  adres: { label: '🏠 Adres wijzigen', subject: 'Adreswijziging', say: 'Ik heb de adreswijziging doorgegeven. Een collega bevestigt per e-mail of het nog lukt voordat het pakket verzonden wordt.' },
  product_advies: { label: '🔑 Productadvies: welke sleutel past', subject: 'Productadvies', say: 'Een collega zoekt uit welke sleutel op uw auto past en neemt contact met u op.' },
  monteur: { label: '🚐 Wil een monteur (service, niet webshop)', subject: 'Service via webshop', say: 'Ik heb gevraagd of een collega van de service u terugbelt om een afspraak te maken.' },
  zakelijk: { label: '🏢 Zakelijke klant via webshop', subject: 'Zakelijk', say: 'Ik heb uw vraag doorgegeven aan een collega voor zakelijke klanten. U hoort zo snel mogelijk van ons.' },
  klacht: { label: '😠 Klacht via webshop', subject: 'Klacht', say: 'Het spijt me dat het zo gelopen is. Ik heb uw klacht doorgegeven; klachten beantwoorden we binnen twee werkdagen.' },
  mens: { label: '🙋 Webshopklant vraagt om een mens', subject: 'Wil een medewerker', say: 'Ik heb een collega gevraagd contact met u op te nemen.' },
  overig: { label: '💬 Webshopvraag zonder antwoord', subject: 'Webshopvraag', say: 'Dat weet ik niet zeker, dus ik heb uw vraag doorgegeven aan een collega. U hoort van ons.' },
} as const;

export type Route = keyof typeof ROUTES;
export const isRoute = (value: unknown): value is Route => typeof value === 'string' && value in ROUTES;

/** What the agent may promise, by what actually happened. */
export function handoverSay(route: Route, reached: boolean, hasContact: boolean): string {
  if (!hasContact) return 'Om u terug te kunnen bereiken heb ik uw e-mailadres of telefoonnummer nodig. Wilt u dat geven?';
  if (!reached) return 'Ik kan op dit moment geen collega bereiken. Mailt u ons op info@autosleutel24.nl, dan helpt iemand u zo snel mogelijk.';
  return ROUTES[route].say;
}
