/**
 * Reading a technician's photo caption as an expense.
 *
 * A monteur standing at a pump types "35,20 benzine", not a form. This turns
 * that into the three columns `expenses` cannot be inserted without: a
 * category, an amount and a description. It guesses nothing it cannot see —
 * an unreadable caption comes back with `amount: null`, and the bot asks.
 *
 * Dutch, Turkish and English words all map to the same category: the words
 * the monteurs actually use, not the words the enum uses.
 */

/** id -> Dutch label, the enum in 0050_erp_finance_job_costing.sql. */
export const EXPENSE_CATEGORIES: Record<string, string> = {
  fuel: 'Brandstof',
  parking: 'Parkeren',
  toll: 'Tol',
  meals: 'Eten & Drinken',
  vehicle_maintenance: 'Voertuig Onderhoud',
  tool_subscription: 'Gereedschap Abonnement',
  phone: 'Telefonie',
  advertising: 'Advertenties',
  supplier: 'Leverancier',
  office: 'Kantoor',
  insurance: 'Verzekeringen',
  rent: 'Huur',
  training: 'Training',
  other: 'Overig',
};

/*
 * First match wins, so the order is the order of likelihood. Deliberately no
 * bare brand words like "bp" or "total": "total" is printed on every invoice
 * ever written, and a wrong category costs more to unpick than 'other' does.
 */
const CATEGORY_WORDS: Array<[RegExp, string]> = [
  [/benzine|benzin|diesel|tanken|brandstof|yak[iı]t|shell|esso/i, 'fuel'],
  [/parkeer|parkeren|parking|otopark|garage/i, 'parking'],
  [/\btol\b|toll|ge[cç]i[sş]/i, 'toll'],
  [/eten|drinken|lunch|koffie|yemek|kahve|food/i, 'meals'],
  [/onderhoud|reparatie|\bapk\b|banden|olie|servis|reparasyon|lastik/i, 'vehicle_maintenance'],
  [/abonnement|licentie|autel|obdstar|xhorse|lisans/i, 'tool_subscription'],
  [/telefoon|simkaart|telefon|\bsim\b/i, 'phone'],
  [/advertentie|reclame|reklam|\bads\b/i, 'advertising'],
  [/factuur|faktura|fatura|inkoop|leverancier|a-?key|tedarik/i, 'supplier'],
  [/kantoor|printer|papier|ofis/i, 'office'],
  [/verzeker|sigorta/i, 'insurance'],
  [/\bhuur\b|kira/i, 'rent'],
  [/cursus|training|opleiding|kurs|e[gğ]itim/i, 'training'],
];

/** Said of a company card: then it is a cost, not something to pay back. */
const COMPANY_PAID = /zakelijk|bedrijfspas|firmakaart|firma kaart|company|[sş]irket/i;

/*
 * Money as a phone types it: "35", "35,20", "€35.20", "35 euro".
 *
 * Capped at five digits so an invoice number or a date cannot be read as an
 * amount — no receipt a monteur photographs is €20.260.927 — and fenced off
 * from letters on both sides, so the "10" in an article code like "a10" is
 * never mistaken for a price.
 */
const MONEY = /(€\s*)?(?<![\p{L}\d.,])(\d{1,5}(?:[.,]\d{1,2})?)(?![\p{L}\d])(\s*(?:€|eur|euro))?/giu;

const MAX_AMOUNT = 9999.99;

/**
 * The amount and the exact text it was read from, or null.
 *
 * A number written with a currency marker beats one without — "factuur 2026
 * bedrag €45" is €45. Failing that the last candidate wins, because that is
 * where a total sits on both a receipt and in a sentence.
 */
function findAmount(text: string): { value: number; raw: string } | null {
  const marked: Array<{ value: number; raw: string }> = [];
  const plain: Array<{ value: number; raw: string }> = [];

  for (const match of String(text ?? '').matchAll(MONEY)) {
    const value = Number(match[2]!.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || value > MAX_AMOUNT) continue;
    (match[1] || match[3] ? marked : plain).push({ value, raw: match[0] });
  }

  const pool = marked.length ? marked : plain;
  return pool.length ? pool[pool.length - 1]! : null;
}

export function readAmount(text: string): number | null {
  return findAmount(text)?.value ?? null;
}

export function readCategory(text: string): string {
  const found = CATEGORY_WORDS.find(([pattern]) => pattern.test(String(text ?? '')));
  return found ? found[1] : 'other';
}

export interface ParsedCaption {
  category: string;
  amount: number | null;
  description: string;
  isReimbursable: boolean;
}

/**
 * `description` is NOT NULL, so it always gets something: what was typed with
 * the amount taken out, or the category's own name when nothing was typed at
 * all. A bare photo is still a filed expense — it just waits for a number.
 */
export function parseExpenseCaption(caption: string | null | undefined): ParsedCaption {
  const text = String(caption ?? '').trim();
  const category = readCategory(text);
  const found = findAmount(text);

  /*
   * Only the amount that was actually used comes out of the description —
   * blanking every number would turn "shell a10" into "shell a".
   */
  const words = (found ? text.replace(found.raw, ' ') : text).replace(/\s+/g, ' ').trim();

  return {
    category,
    amount: found?.value ?? null,
    description: words || EXPENSE_CATEGORIES[category]!,
    // A monteur photographing a receipt has normally paid it themselves; the
    // company card is the case they have to say out loud.
    isReimbursable: !COMPANY_PAID.test(text),
  };
}
