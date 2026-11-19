/**
 * The never-rules, in one place: no phone number, email address, licence plate
 * or secret crosses between parties or into a view that should not show it.
 *
 * Pure strings in, a verdict out. Used when a message is proposed (guardText),
 * when a briefing is built for a technician before the award, and when
 * /admin/live shows inbound text (maskSensitive). Everything is normalised
 * first so spelling a number out, adding zero-width characters or writing
 * "naam at gmail punt com" does not get past it.
 */

export type Audience = 'customer_reply' | 'technician' | 'self_started' | 'internal';
export type Finding = 'secret' | 'iban' | 'phone' | 'email' | 'url' | 'plate' | 'payment';

const ZERO_WIDTH = new RegExp('[\\u200b-\\u200f\\u2028-\\u202e\\u2060-\\u2064\\ufeff\\u00ad\\ufe0f\\u20e3\\u034f\\u180e]', 'g');
const DASHES = new RegExp('[\\u2010-\\u2015\\u2212\\ufe58\\ufe63\\uff0d]', 'g');

/** First code point of the digit blocks NFKC leaves alone (Arabic-Indic, Devanagari, Thai ...). */
const DIGIT_ZEROS = [0x660, 0x6f0, 0x7c0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66, 0xe50, 0xed0, 0xf20, 0x1040, 0x17e0, 0x1810, 0xa620, 0xa8d0, 0xa900, 0xff10];

/** Any decimal digit of any script becomes 0-9. */
function asciiDigits(text: string): string {
  return text.replace(/\p{Nd}/gu, (c) => {
    const cp = c.codePointAt(0)!;
    const zero = DIGIT_ZEROS.find((z) => cp >= z && cp <= z + 9);
    return zero === undefined ? c : String(cp - zero);
  });
}

/** NFKC (full-width digits, ligatures), no zero-width or soft hyphens, lower case. */
/** Cyrillic and Greek letters that look like Latin ones: "nl91 аbna" with a Cyrillic а is still an IBAN. */
const HOMOGLYPHS: Record<string, string> = {
  'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x',
  'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'ο': 'o', 'α': 'a', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ρ': 'p',
  'τ': 't', 'υ': 'u', 'χ': 'x', 'ɡ': 'g', 'ɩ': 'l', 'ӏ': 'l',
};
const HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join('')}]`, 'g');
const STOPS = new RegExp('[\\u3002\\u2024\\u2027]', 'g');

/** Capitals that look like Latin capitals (Greek capital Nu is an N; its lower case looks like a v), mapped before lower-casing. */
const HOMOGLYPHS_UPPER: Record<string, string> = {
  'А': 'a', 'В': 'b', 'Е': 'e', 'К': 'k', 'М': 'm', 'Н': 'h', 'О': 'o', 'Р': 'p', 'С': 'c', 'Т': 't', 'У': 'y', 'Х': 'x',
  'Α': 'a', 'Β': 'b', 'Ε': 'e', 'Ζ': 'z', 'Η': 'h', 'Ι': 'i', 'Κ': 'k', 'Μ': 'm', 'Ν': 'n', 'Ο': 'o', 'Ρ': 'p', 'Τ': 't', 'Υ': 'y', 'Χ': 'x',
};
const HOMOGLYPH_UP_RE = new RegExp(`[${Object.keys(HOMOGLYPHS_UPPER).join('')}]`, 'g');

export function normalize(text: string): string {
  const base = asciiDigits(
    text.normalize('NFKC').replace(ZERO_WIDTH, '').replace(DASHES, '-').replace(STOPS, '.').replace(HOMOGLYPH_UP_RE, (c) => HOMOGLYPHS_UPPER[c] ?? c)
  ).toLowerCase();
  return base.replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c] ?? c);
}

// --- digit words (nl, en, de, tr) --------------------------------------

const UNITS: Record<string, string> = {
  nul: '0', zero: '0', null: '0', oh: '0', 'sıfır': '0', sifir: '0',
  een: '1', 'eén': '1', one: '1', eins: '1', ein: '1', bir: '1',
  twee: '2', two: '2', zwei: '2', iki: '2',
  drie: '3', three: '3', drei: '3', 'üç': '3', uc: '3',
  vier: '4', four: '4', 'dört': '4', dort: '4',
  vijf: '5', five: '5', 'fünf': '5', funf: '5', fuenf: '5', 'beş': '5', bes: '5',
  zes: '6', six: '6', sechs: '6', 'altı': '6', alti: '6',
  zeven: '7', seven: '7', sieben: '7', yedi: '7',
  acht: '8', eight: '8', sekiz: '8',
  negen: '9', nine: '9', neun: '9', dokuz: '9',
};
const TENS: Record<string, string> = {
  on: '10', yirmi: '20', otuz: '30', 'kırk': '40', kirk: '40', elli: '50', 'altmış': '60', altmis: '60',
  'yetmiş': '70', yetmis: '70', seksen: '80', doksan: '90',
  elf: '11', twaalf: '12', dertien: '13', veertien: '14', vijftien: '15', zestien: '16', zeventien: '17', achttien: '18', negentien: '19',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
  'zwölf': '12', zwolf: '12', dreizehn: '13', vierzehn: '14', 'fünfzehn': '15', sechzehn: '16', siebzehn: '17', achtzehn: '18', neunzehn: '19',
  zwanzig: '20', dreissig: '30', 'dreißig': '30', vierzig: '40', 'fünfzig': '50', sechzig: '60', siebzig: '70', achtzig: '80', neunzig: '90',
  tien: '10', ten: '10', twintig: '20', twenty: '20', dertig: '30', thirty: '30',
  veertig: '40', forty: '40', vijftig: '50', fifty: '50', zestig: '60', sixty: '60',
  zeventig: '70', seventy: '70', tachtig: '80', eighty: '80', negentig: '90', ninety: '90',
};
const L = 'a-zà-ÿıİğşçöü';
const word = (alts: string) => new RegExp(`(?<![${L}])(?:${alts})(?![${L}])`, 'g');
const byLength = (words: string[]) => [...words].sort((x, y) => y.length - x.length).join('|');
const UNIT_WORDS = byLength(Object.keys(UNITS).filter((w) => UNITS[w] !== '0' && w !== 'oh'));
const TEN_WORDS = byLength(Object.keys(TENS).filter((w) => Number(TENS[w]) >= 20 && Number(TENS[w]) % 10 === 0));
/** "drieëntwintig", "vijf en veertig", "dreiundzwanzig": unit, "en"/"ën"/"und", tens (with or without spaces). */
const COMPOUND = new RegExp(`(?<![${L}])(${UNIT_WORDS})\\s?(?:en|ën|und)\\s?(${TEN_WORDS})(?![${L}])`, 'g');
const UNIT_RE = word(Object.keys(UNITS).join('|'));
const TENS_RE = word(Object.keys(TENS).join('|'));

/** Digit words become digits, so "nul zes twaalf" style numbers show up as numbers. */
export function withDigitWords(normalized: string): string {
  return normalized
    .replace(COMPOUND, (_m, u: string, t: string) => ` ${TENS[t][0]}${UNITS[u]} `)
    .replace(TENS_RE, (m) => ` ${TENS[m]} `)
    .replace(UNIT_RE, (m) => ` ${UNITS[m]} `);
}

// --- phone ---------------------------------------------------------------

const DATE_OR_TIME = [
  // Only a date that stands alone: "06/12/34/56/78" is a phone number, not a date plus leftovers.
  /(?<![\d/.-])\d{4}-\d{2}-\d{2}(?![\d]|[-/.]\d)/g,
  /(?<![\d/.-])\d{1,2}[-/.]\d{1,2}[-/.](?:\d{4}|\d{2})(?![\d]|[-/.]\d)/g,
  /\b\d{1,2}:\d{2}(?::\d{2})?\b/g,
];
const PHONE_RUN = /\+?\d(?:[\s().\-/,_·]*\d){8,}/g;

const stripDates = (t: string) => DATE_OR_TIME.reduce((s, re) => s.replace(re, ' '), t);
const digitCount = (s: string) => s.replace(/\D/g, '').length;

/** Nine digits or more in one run, whatever separates them. Dates and times do not count. */
function hasPhone(normalized: string): boolean {
  const t = stripDates(withDigitWords(normalized));
  return (t.match(PHONE_RUN) ?? []).some((m) => digitCount(m) >= 9);
}

// --- email -----------------------------------------------------------------

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/;

function hasEmail(normalized: string): boolean {
  if (EMAIL.test(normalized)) return true;
  // "naam at gmail punt com", "naam (at) gmail [dot] com"
  const spelled = normalized
    .replace(/[([{]\s*(?:at|ät)\s*[)\]}]|(?<![a-z])(?:at|ät|apenstaartje)(?![a-z])/g, '@')
    .replace(/[([{]\s*(?:dot|punt)\s*[)\]}]|(?<![a-z])(?:dot|punt)(?![a-z])/g, '.')
    .replace(/\s*([@.])\s*/g, '$1');
  return EMAIL.test(spelled);
}

// --- licence plate -----------------------------------------------------------

/**
 * The Dutch sidecodes (RDW kenteken series 1 to 14), X = letter, 9 = digit.
 * Everything below is derived from this list, so a new series is one line.
 */
export const PLATE_FORMATS = [
  'XX-99-99', '99-99-XX', '99-XX-99', 'XX-99-XX', 'XX-XX-99', '99-XX-XX', '99-XXX-9',
  '9-XXX-99', 'XX-999-X', 'X-999-XX', 'XXX-99-X', 'X-99-XXX', '9-XX-999', '999-XX-9',
] as const;
const formatRegex = (f: string) =>
  new RegExp(`^${f.replace(/-/g, '').replace(/X/g, '[a-z]').replace(/9/g, '\\d')}$`);
const PLATES = PLATE_FORMATS.map(formatRegex);
/** Group sizes of the layouts when written with separators: XX-99-99 is "222", X-99-XXX is "123" ... */
const GROUPINGS = new Set(PLATE_FORMATS.map((f) => f.split('-').map((g) => g.length).join('')));

/** Small words that appear between numbers in ordinary sentences ("08 om 10"); a plate window never spans one. */
const STOP = new Set(['om', 'op', 'en', 'of', 'in', 'de', 'het', 'uur', 'tot', 'met', 'bij', 'at', 'to', 'on', 'um', 'am', 've', 'is', 'na', 'te', 'van', 'tm', 'ca',
  // units and price words: "25 eur 2 sleutels", "21 btw 9" are quotes, not plates
  'eur', 'euro', 'btw', 'stuks', 'stuk', 'st', 'km', 'min', 'minuten', 'minuut', 'dag', 'dagen', 'week', 'weken', 'keer', 'maal', 'x', 'per', 'procent', 'korting', 'ex', 'incl', 'excl', 'sleutel', 'sleutels', 'pk', 'kw', 'cm', 'mm', 'jaar', 'maanden']);

const isPlate = (compact: string) =>
  compact.length === 6 && /\d/.test(compact) && /[a-z]/.test(compact) && PLATES.some((p) => p.test(compact));

/**
 * Plates with or without separators, any case: one 6-character chunk, or three
 * neighbouring chunks of a real layout's sizes joined by single separators.
 * Needs letters AND digits, so a date never matches, and the group sizes keep
 * "50 voor" from looking like 99-XX-XX.
 */
const PLATE_WORDS = /kenteken|nummerbord|nummerplaat|plaat\b|license|licence|plate|\bkent\b/;
const POSTCODE_SHAPE = /^\d{4}[a-z]{2}$/;

/**
 * `strict` (texts for a technician) treats a postcode-shaped chunk like 1234AB as a plate too.
 * Otherwise it is let through only when it reads as a postcode: no plate word within 40 characters,
 * and followed by a house number or a place name.
 */
function postcodeLooksLikePlate(normalized: string, chunk: { text: string; start: number; end: number }, next: { text: string } | undefined, strict: boolean): boolean {
  if (strict) return true;
  const near = normalized.slice(Math.max(0, chunk.start - 40), chunk.end + 40);
  if (PLATE_WORDS.test(near)) return true;
  const gap = next ? normalized.slice(chunk.end, normalized.indexOf(next.text, chunk.end)) : '';
  const followed = next && /^[\s,]+$/.test(gap) && (/^\d{1,4}[a-z]?$/.test(next.text) || (/^[a-z]{4,}$/.test(next.text) && !STOP.has(next.text)));
  return !followed;
}

function hasPlate(normalized: string, strict = false): boolean {
  const chunks = [...normalized.matchAll(/[a-z0-9]+/g)].map((m) => ({ text: m[0], start: m.index!, end: m.index! + m[0].length }));
  for (let i = 0; i < chunks.length; i++) {
    // Written without separators. "3511AB" is the same shape as sidecode 2 (99-99-XX) and every quote
    // carries postcodes, so that one layout counts as a plate only when it is written with separators.
    if (isPlate(chunks[i].text) && (!POSTCODE_SHAPE.test(chunks[i].text) || postcodeLooksLikePlate(normalized, chunks[i], chunks[i + 1], strict))) return true;
    // "AB-12CD": two chunks, hyphen only (a space would make "50 voor" look like 99-XX-XX)
    if (i + 1 < chunks.length && normalized.slice(chunks[i].end, chunks[i + 1].start) === '-' && !STOP.has(chunks[i].text) && !STOP.has(chunks[i + 1].text)) {
      if (isPlate(chunks[i].text + chunks[i + 1].text)) return true;
    }
    // written as three groups: XX-99-99, 99-XX-99, XX-999-X ... separators single, groups the right size
    if (i + 2 >= chunks.length) continue;
    const win = [chunks[i], chunks[i + 1], chunks[i + 2]];
    const gapsOk = [0, 1].every((k) => /^[-\s·_.]$/.test(normalized.slice(win[k].end, win[k + 1].start)));
    if (!gapsOk || win.some((c) => STOP.has(c.text))) continue;
    if (GROUPINGS.has(win.map((c) => c.text.length).join('')) && isPlate(win.map((c) => c.text).join(''))) return true;
  }
  return false;
}

// --- secrets -----------------------------------------------------------------

const SECRET_PATTERNS = [
  /sk-[a-z0-9_-]{16,}/, /sk-ant-/, /sb_secret_/, /sbp_[a-z0-9]{20,}/,
  /-----begin [a-z ]*private key-----/,
  /\b\d{8,10}:[a-z0-9_-]{35}\b/, // Telegram bot token
  /xox[abprs]-[a-z0-9-]{10,}/, /xapp-[a-z0-9-]{10,}/,
  /eyj[a-z0-9_-]{15,}\.[a-z0-9_-]{5,}/, // JWT
  /\b(?:ghp|gho|ghs|github_pat)_[a-z0-9_]{20,}/, /\bakia[0-9a-z]{16}\b/,
];

function entropy(s: string): number {
  const counts = new Map<string, number>();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) h -= (n / s.length) * Math.log2(n / s.length);
  return h;
}

const isKeyLike = (t: string) => /\d/.test(t) && /[A-Za-z]/.test(t) && entropy(t) >= 4;

/** A long, mixed, random-looking token is treated as a key even if it matches no known format. */
function hasHighEntropyToken(original: string): boolean {
  return (original.match(/[A-Za-z0-9+/_=-]{32,}/g) ?? []).some(isKeyLike);
}

function hasSecret(original: string, normalized: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(normalized)) || hasHighEntropyToken(original.normalize('NFKC').replace(ZERO_WIDTH, ''));
}

// --- IBAN, links and payment requests ------------------------------------------

/** ISO 7064 mod 97 check: an IBAN, however it is spaced. */
function ibanValid(compact: string): boolean {
  if (compact.length < 15 || compact.length > 34) return false;
  const moved = compact.slice(4) + compact.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 87);
    for (const d of v) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

function hasIban(normalized: string): boolean {
  if (/(?<![a-z])iban(?![a-z])/.test(normalized)) return true;
  return (normalized.match(/[a-z]{2}\d{2}(?:[^a-z0-9]{0,3}[a-z0-9]){11,30}/g) ?? []).some((m) => {
    const compact = m.replace(/[^a-z0-9]/g, '');
    for (let n = Math.min(compact.length, 34); n >= 15; n--) if (ibanValid(compact.slice(0, n))) return true;
    return false;
  });
}

const COMMON_TLD = 'com|nl|de|net|org|tk|ml|ga|cf|gq|xyz|top|info|biz|io|me|co|eu|be|app|link|click|online|site|shop|store|live|icu|ru|cn|pw|cc|ws|to|ly|gl|tr|uk|fr|es|it|pl|dev|ai|gg|pro|at|ch|vip|cloud';
/** Real words that are also a TLD: spelled out ("op dit punt de monteur") they are ordinary Dutch, so they only count in written form. */
const SPELLED_SKIP = new Set(['de', 'it', 'be', 'at', 'to', 'es', 'in', 'me', 'co', 'pl', 'tr', 'top', 'live', 'site', 'shop', 'store', 'online', 'link', 'pro', 'app', 'dev']);
const SPELLED_TLD = new Set(COMMON_TLD.split('|').filter((t) => !SPELLED_SKIP.has(t)));
/** Written domain, 3+ letter TLDs: only these. "incl.btw", "Klaar.Bel" are not domains. */
const GENERIC_TLD = COMMON_TLD + '|club|work|fun|bid|win|loan|men|party|stream|download|review|trade|date|racing|science|accountant|faith|cricket|zip|mov|lol|space|tech|email|support|help|services|solutions|today|world|life|rest|buzz|monster|cyou|sbs|cfd|mom|website|page|digital|network|group|agency|company|center|city|money|bank|finance|loans|cash|credit|win|bet|casino|game|games|xxx|porn|sex|adult|best|ink|icu|one|run|zone|host|press|plus|bio|name|mobi|asia|tel|jobs|travel|museum|aero|coop';
const SCHEME = '(?:https?:|ftp:)?//[^\\s]+';
const WWW = '(?<![a-z0-9@.-])www\\.';
/** Abbreviations that precede a full stop in quotes and notes: never the left half of a domain. */
const LEFT_SKIP = new Set(['excl', 'incl', 'ex', 'bijv', 'ca', 'nr', 'tel', 'o', 'a', 'dr', 'mr', 'ir', 'ing', 'drs', 'prof', 'dhr', 'mevr', 'mw', 'enz', 'etc', 'evt', 'max', 'min', 'resp', 'vs', 'zgn', 'tav', 'mbt', 'dwz', 'zsm', 'btw', 'eur', 'st', 'ned', 'adr', 'art', 'bv', 'nv', 'afd']);
const LEFT_WORDS = new Set(['dit', 'dat', 'deze', 'die', 'het', 'de', 'een', 'op', 'in', 'op', 'er', 'we', 'wij', 'u', 'uw', 'ons', 'onze', 'je', 'jij', 'ik', 'mijn', 'dan', 'nu', 'zo', 'ook', 'maar', 'nog', 'dus', 'van', 'voor', 'met', 'naar', 'bij', 'tot', 'om', 'is', 'zijn', 'was', 'dank', 'tot']);
const WRITTEN = new RegExp(`(?<![a-z0-9@.-])([a-z0-9][a-z0-9-]*)\\.([a-z]{2,})(?![a-z0-9])`, 'g');
const ccTLD = /^[a-z]{2}$/;
const GENERIC = new Set(GENERIC_TLD.split('|'));

function hasUrl(normalized: string): boolean {
  const flat = normalized.replace(/·/g, '.');
  if (new RegExp(`${SCHEME}|${WWW}`).test(flat)) return true;
  // label.tld: a 2-letter TLD (country code) or a known longer TLD; a left half that is an abbreviation is skipped
  for (const m of flat.matchAll(WRITTEN)) {
    const [, left, tld] = m;
    if (LEFT_SKIP.has(left) || /^\d+$/.test(left)) continue;
    if (ccTLD.test(tld) || GENERIC.has(tld)) return true;
  }
  // spelled out ("evil punt tk"): only a left half that is not an ordinary word, and a TLD that is not an ordinary word
  const SPELL = /(?<![a-z0-9@.-])([a-z0-9][a-z0-9-]*)\s*(?:[([{]\s*(?:dot|punt|\.)\s*[)\]}]|(?<![a-z])(?:dot|punt)(?![a-z]))\s*([a-z]{2,})(?![a-z0-9])/g;
  for (const m of flat.matchAll(SPELL)) {
    const [, left, tld] = m;
    if (LEFT_WORDS.has(left) || LEFT_SKIP.has(left)) continue;
    if (SPELLED_TLD.has(tld)) return true;
  }
  return false;
}

const PAYMENT = /betaal|betalen|overmaken|overboeken|stort |storten|tikkie|payconiq|pay now|pay at|payment|betaallink|bitcoin|crypto|gift ?card|cadeaubon|western union|wire transfer|rekeningnummer|bankrekening|bank account|zahlen|zahlung|[uü]berweis|\bode\b|[oö]deme|[oö]deyin|havale|contant|afrekenen|overschrijv|\bpaypal\b|\bidea?l\b/;

// --- verdicts ------------------------------------------------------------------

const ORDER: Finding[] = ['secret', 'iban', 'phone', 'email', 'plate', 'url', 'payment'];

/** The first rule a text breaks (among `kinds`, default all), or null. */
export function findSensitive(text: string, kinds: readonly Finding[] = ORDER, opts: { strictPlate?: boolean } = {}): Finding | null {
  const n = normalize(text);
  const test: Record<Finding, () => boolean> = {
    secret: () => hasSecret(text, n),
    iban: () => hasIban(n),
    phone: () => hasPhone(n),
    email: () => hasEmail(n),
    url: () => hasUrl(n),
    plate: () => hasPlate(n, opts.strictPlate === true),
    payment: () => PAYMENT.test(n),
  };
  return ORDER.find((k) => kinds.includes(k) && test[k]()) ?? null;
}

/**
 * At the moment a row is proposed. A key-like string is refused for everyone.
 * `internal` (text for an approver, never for a customer or technician) may
 * hold contact details, but a payment link, a bank number request or a
 * payment demand is refused there too, so it cannot be used to launder one.
 * `allow` lets server-built texts (the invoice message) say "betalen".
 */
export function guardText(text: string, audience: Audience, allow: readonly Finding[] = []): string | null {
  const kinds = (audience === 'internal' ? ['secret', 'url', 'payment'] : ORDER).filter((k) => !allow.includes(k as Finding)) as Finding[];
  return findSensitive(text, kinds, { strictPlate: audience === 'technician' });
}

/** Shows only the last 4 digits of a phone-like run. Dates and times stay. */
export function maskPhones(text: string): string {
  return text.replace(PHONE_RUN, (m) => (digitCount(stripDates(m)) >= 9 ? `••••${m.replace(/\D/g, '').slice(-4)}` : m));
}

const REASON_NL: Partial<Record<Finding, string>> = {
  secret: 'een sleutel',
  iban: 'een bankrekening',
  phone: 'een telefoonnummer',
  email: 'een e-mailadres',
  plate: 'een kenteken',
};
const MASKED_KINDS: Finding[] = ['secret', 'iban', 'phone', 'email', 'plate'];

/** Hides secrets in place, whatever the surrounding text. Used before a body is stored. */
export function maskSecrets(text: string): string {
  let out = text.normalize('NFKC').replace(ZERO_WIDTH, '');
  out = out.replace(/[A-Za-z0-9+/_=-]{32,}/g, (t) => (isKeyLike(t) ? '[sleutel]' : t));
  for (const p of SECRET_PATTERNS) out = out.replace(new RegExp(p.source, 'gi'), '[sleutel]');
  return out;
}

/**
 * For screens: mask what can be masked in place, and if a secret, bank number,
 * phone, email or plate is still detectable afterwards (a number spelled out,
 * an address written with "punt"), hide the whole text rather than guess where.
 * Links and payment words are not hidden on screen: they are for the approver to see.
 */
export function maskSensitive(text: string): string {
  let out = maskSecrets(text);
  out = out.replace(new RegExp(EMAIL.source, 'gi'), '[e-mail]');
  out = maskPhones(out);
  const left = findSensitive(out.replace(/••••\d{4}|\[sleutel\]|\[e-mail\]/g, ' '), MASKED_KINDS);
  return left ? `[tekst verborgen: bevat ${REASON_NL[left]}]` : out;
}
