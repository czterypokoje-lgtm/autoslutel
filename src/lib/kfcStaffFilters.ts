/*
 * Staff assistant: read filters out of an English or Dutch question.
 *
 * Deterministic on purpose. The local model may pick a report, but the period,
 * store, order status, channel, category and SKU always come from this parser,
 * so the model never shapes a database query. Each value is either a fixed enum
 * or a plain string that the report code matches against CRM data before use.
 *
 * Dates are calendar days in Europe/Amsterdam, inclusive, as YYYY-MM-DD.
 * Kept free of path aliases so scripts/check-kfc-staff-filters.mts can import it.
 */

export type StaffTopic = 'orders' | 'stock' | 'finance' | 'customers' | 'conversations';
export type StaffFulfilment = 'open' | 'picked' | 'shipped' | 'cancelled' | 'external';
export type StaffChannel = 'phone' | 'whatsapp' | 'email' | 'web';
/** Every shop name the assistant may be asked about: the two WooCommerce shops (KeyForCars) and our own webshop (Autosleutel24). A name the install does not sell through simply matches no orders. */
export const STAFF_SHOPS = ['keyforcars.nl', 'klapsleutels.nl', 'autosleutel24.nl'] as const;
export type StaffShop = typeof STAFF_SHOPS[number];
export interface StaffPeriod { from: string; to: string }
/** year: a month or quarter without a year. unclear: period words we cannot pin down. invalid: an impossible date. */
export type StaffPeriodIssue = 'year' | 'unclear' | 'invalid';

export interface StaffQuery {
  topics: StaffTopic[];
  reportCue: boolean;
  period?: StaffPeriod;
  periodIssue?: StaffPeriodIssue;
  /** For periodIssue 'year': the words that need a year, e.g. "November" or "Q3". */
  periodWords?: string;
  fulfilment?: StaffFulfilment[];
  shop?: StaffShop;
  channel?: StaffChannel;
  category?: string;
  sku?: string;
}

const MONTHS: Record<string, number> = {
  january: 1, januari: 1, february: 2, februari: 2, march: 3, maart: 3, april: 4, may: 5, mei: 5,
  june: 6, juni: 6, july: 7, juli: 7, august: 8, augustus: 8, september: 9, october: 10, oktober: 10,
  november: 11, december: 12,
};
const SHORT_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, mrt: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, okt: 10, nov: 11, dec: 12,
};
const MONTH_WORD = '(' + [...Object.keys(MONTHS), ...Object.keys(SHORT_MONTHS)].sort((a, b) => b.length - a.length).join('|') + ')\\.?';
const FULL_MONTH_WORD = '(' + Object.keys(MONTHS).filter((m) => m !== 'may').join('|') + ')';
const monthNumber = (word: string) => MONTHS[word.toLowerCase()] ?? SHORT_MONTHS[word.toLowerCase().replace(/\.$/, '')];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const validDay = (y: number, m: number, d: number) => y >= 2000 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= daysIn(y, m);
export function addDays(date: string, days: number) {
  const t = new Date(date + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}
function addMonths(date: string, months: number) {
  const [y, m, d] = date.split('-').map(Number);
  const index = y * 12 + (m - 1) + months;
  const ny = Math.floor(index / 12), nm = index % 12 + 1;
  return ymd(ny, nm, Math.min(d, daysIn(ny, nm)));
}
const weekday = (date: string) => (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7; // Monday = 0
const monthPeriod = (y: number, m: number): StaffPeriod => ({ from: ymd(y, m, 1), to: ymd(y, m, daysIn(y, m)) });

type Token = { at: number; period: StaffPeriod };

function readPeriod(text: string, today: string): Pick<StaffQuery, 'period' | 'periodIssue' | 'periodWords'> {
  let rest = text;
  const tokens: Token[] = [];
  let invalid = false;
  const take = (pattern: RegExp, make: (m: RegExpExecArray) => StaffPeriod | null) => {
    rest = rest.replace(pattern, (...args) => {
      const match = args.slice(0, -2) as unknown as RegExpExecArray;
      const at = args[args.length - 2] as number;
      const period = make(match);
      if (!period) { invalid = true; return ' '.repeat(match[0].length); }
      tokens.push({ at, period });
      return ' '.repeat(match[0].length);
    });
  };
  const day = (y: number, m: number, d: number) => validDay(y, m, d) ? { from: ymd(y, m, d), to: ymd(y, m, d) } : null;

  take(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/g, (m) => day(+m[1], +m[2], +m[3]));
  take(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d\d)\b/g, (m) => day(+m[3], +m[2], +m[1]));
  take(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th|e)?\\s+${MONTH_WORD}\\s+(20\\d\\d)\\b`, 'gi'), (m) => day(+m[3], monthNumber(m[2]), +m[1]));
  take(new RegExp(`\\b${MONTH_WORD}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d\\d)\\b`, 'gi'), (m) => day(+m[3], monthNumber(m[1]), +m[2]));
  take(new RegExp(`\\b${MONTH_WORD}\\s+(20\\d\\d)\\b`, 'gi'), (m) => monthPeriod(+m[2], monthNumber(m[1])));
  take(/\b(?:q([1-4])\s*(20\d\d)|(20\d\d)\s*-?\s*q([1-4]))\b/gi, (m) => {
    const q = +(m[1] ?? m[4]), y = +(m[2] ?? m[3]);
    return { from: ymd(y, q * 3 - 2, 1), to: ymd(y, q * 3, daysIn(y, q * 3)) };
  });
  take(/(?<![-/#.\d])\b(20\d\d)\b(?![-/.]\d)/g, (m) => ({ from: ymd(+m[1], 1, 1), to: ymd(+m[1], 12, 31) }));
  if (invalid) return { periodIssue: 'invalid' };

  if (tokens.length) {
    tokens.sort((a, b) => a.at - b.at);
    let from = tokens[0].period.from;
    let to = tokens[tokens.length - 1].period.to;
    if (tokens.length === 1) {
      const before = text.slice(Math.max(0, tokens[0].at - 12), tokens[0].at).toLowerCase();
      if (/\b(since|sinds|vanaf|from|after|na)\s*$/.test(before)) to = today;
      // Not "voor": in Dutch it usually means "for" ("bestellingen voor oktober 2026").
      else if (/\b(until|till|tot|t\/m|before)\s*$/.test(before)) return { periodIssue: 'unclear' };
    }
    if (from > to) [from, to] = [tokens[tokens.length - 1].period.from, tokens[0].period.to];
    return { period: { from, to } };
  }

  const lower = rest.toLowerCase();
  const [y, m] = today.split('-').map(Number);
  const relative: [RegExp, () => StaffPeriod][] = [
    [/\b(today|vandaag)\b/, () => ({ from: today, to: today })],
    [/\b(yesterday|gisteren)\b/, () => ({ from: addDays(today, -1), to: addDays(today, -1) })],
    [/\b(this week|deze week)\b/, () => ({ from: addDays(today, -weekday(today)), to: today })],
    [/\b(last week|previous week|vorige week)\b/, () => ({ from: addDays(today, -weekday(today) - 7), to: addDays(today, -weekday(today) - 1) })],
    [/\b(this month|deze maand)\b/, () => ({ from: ymd(y, m, 1), to: today })],
    [/\b(last month|previous month|vorige maand)\b/, () => monthPeriod(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1)],
    [/\b(this year|dit jaar)\b/, () => ({ from: ymd(y, 1, 1), to: today })],
    [/\b(last year|previous year|vorig jaar)\b/, () => ({ from: ymd(y - 1, 1, 1), to: ymd(y - 1, 12, 31) })],
  ];
  const span = lower.match(/\b(?:last|past|previous|afgelopen|laatste|vorige)\s+(\d{1,4})\s+(days?|dagen|weeks?|weken|months?|maanden)\b/);
  if (span) {
    const n = Number(span[1]);
    if (n < 1 || n > 3660) return { periodIssue: 'invalid' };
    const from = /^d/.test(span[2]) ? addDays(today, -(n - 1)) : /^w/.test(span[2]) ? addDays(today, -(7 * n - 1)) : addDays(addMonths(today, -n), 1);
    return { period: { from, to: today } };
  }
  for (const [pattern, make] of relative) if (pattern.test(lower)) return { period: make() };

  const bareMonth = lower.match(new RegExp(`\\b${FULL_MONTH_WORD}\\b`)) ?? lower.match(/\bq[1-4]\b/);
  if (bareMonth) return { periodIssue: 'year', periodWords: bareMonth[0] };
  if (/\b(since|sinds|between|tussen|ago|geleden|quarter|kwartaal|season|seizoen|spring|summer|autumn|fall|winter|lente|voorjaar|zomer|herfst|najaar|weekend|recently|lately|onlangs|recent)\b/.test(lower)) {
    return { periodIssue: 'unclear' };
  }
  return {};
}

function readFulfilment(lower: string): StaffFulfilment[] | undefined {
  const found = new Set<StaffFulfilment>();
  let rest = lower;
  const negated = /\b(not (?:yet )?(?:shipped|dispatched|sent)|unshipped|(?:nog )?niet verzonden|awaiting dispatch|waiting (?:for|to be) (?:dispatch|shipped)|to be shipped|wacht(?:en|end)? op verzending|te verzenden)\b/g;
  if (negated.test(rest)) { found.add('open'); found.add('picked'); rest = rest.replace(negated, ' '); }
  if (/\b(cancell?ed|geannuleerde?)\b/.test(rest)) found.add('cancelled');
  if (/\b(completed in (?:the )?webshop|afgerond in de webshop|external(?:ly)? completed)\b/.test(rest)) found.add('external');
  if (/\b(picked|verzamelde?|gepickte?)\b/.test(rest)) found.add('picked');
  if (/\b(shipped|dispatched|verzonden)\b/.test(rest)) found.add('shipped');
  if (/\bopen (?:orders?|bestellingen?)\b|\b(?:orders?|bestellingen?) (?:that are |die )?open\b/.test(rest)) { found.add('open'); found.add('picked'); }
  return found.size ? [...found] : undefined;
}

function readShop(lower: string): StaffShop | undefined {
  if (/\bautosleutel\s?24(?:\.nl)?\b/.test(lower)) return 'autosleutel24.nl';
  if (/\bklapsleutels(?:\.nl)?\b/.test(lower)) return 'klapsleutels.nl';
  if (/\bkeyforcars\.nl\b|\b(?:shop|store|webshop|winkel|site)\s+keyforcars\b|\bkeyforcars\s+(?:shop|store|webshop|winkel|site)\b/.test(lower)) return 'keyforcars.nl';
  return undefined;
}

function readChannel(lower: string): StaffChannel | undefined {
  if (/\bwhats\s?app\b/.test(lower)) return 'whatsapp';
  if (/\b(phone|telephone|calls?|called|telefoon\w*|telefonisch|gebeld|bellers?)\b/.test(lower)) return 'phone';
  if (/\b(e-?mails?)\b/.test(lower)) return 'email';
  if (/\b(web ?chat|website chat|webchat)\b/.test(lower)) return 'web';
  return undefined;
}

function readCategory(text: string): string | undefined {
  const match = text.match(/\b(?:category|categorie|kategori|productgroep|product group)\s*[:=]?\s*["“'‘]?([^"”'’,;?!]{2,60}?)["”'’]?(?=\s+(?:with|met|for|this|deze|last|vorige|afgelopen|and|en|status|from|van|since|sinds|between|tussen|in|op|during|tijdens)\b|[,;?!]|\.\s|\.?$)/i);
  return match?.[1].trim() || undefined;
}

export function parseStaffQuery(message: string, today: string): StaffQuery {
  const text = message.normalize('NFC').replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const topics: StaffTopic[] = [];
  const fulfilment = readFulfilment(lower);
  const channel = readChannel(lower);
  if (/\b(orders?|bestelling(?:en)?|bestelrapport|shipments?|zendingen|verzendoverzicht|shipping overview|dispatch)\b/.test(lower)) topics.push('orders');
  if (/\b(stock|inventory|voorraad\w*|articles?|artikel(?:en)?)\b/.test(lower)) topics.push('stock');
  if (/\b(financ\w*|invoices?|factur\w*|factuur|expenses?|uitgaven|overdue|vervallen)\b/.test(lower)) topics.push('finance');
  if (/\b(customers?|klanten|klant(?:en)?accounts?)\b/.test(lower)) topics.push('customers');
  if (/\b(conversations?|gesprek(?:ken)?|gespreksrapport|telefoongesprek(?:ken)?|chats?)\b/.test(lower) || (channel && /\b(how many|hoeveel|aantal|count|report|overview)\b|(rapport|overzicht)\b/.test(lower) && !topics.length)) topics.push('conversations');
  if (!topics.length && fulfilment) topics.push('orders');
  const sku = text.match(/\bSKU\s*[:#]?\s*([a-z0-9_-]{2,40})\b/i)?.[1].toUpperCase();
  return {
    topics,
    reportCue: /\b(how many|hoeveel|aantal|number of|count|total|totaal|totals|report|overview|list|lijst|show|toon|geef|overdue|vervallen|outstanding|openstaande?)\b|(rapport|overzicht)\b/.test(lower),
    ...readPeriod(text, today),
    fulfilment,
    shop: readShop(lower),
    channel,
    category: readCategory(text),
    sku,
  };
}

/** Midnight at the start of a calendar day in Europe/Amsterdam, as a UTC instant. */
export function amsterdamStart(date: string): Date {
  const guess = new Date(date + 'T00:00:00Z');
  const offset = (at: Date) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Amsterdam', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at).map((p) => [p.type, p.value]));
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - at.getTime();
  };
  const first = new Date(guess.getTime() - offset(guess));
  return new Date(guess.getTime() - offset(first));
}

/** UTC bounds for a period: from (inclusive) and until (exclusive). */
export const periodBounds = (period: StaffPeriod) => ({ from: amsterdamStart(period.from), until: amsterdamStart(addDays(period.to, 1)) });
