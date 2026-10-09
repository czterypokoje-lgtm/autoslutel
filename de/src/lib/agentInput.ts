/**
 * Repairing what the agent heard.
 *
 * A voice agent's biggest source of error is not reasoning, it is transcription.
 * A Dutch caller says "Peugeot" and speech-to-text writes "Pesjot"; "Citroën"
 * arrives as "Citroen", "Sitroen" or "Citroën" with a stray accent; "Škoda"
 * loses its háček; a postcode dictated as "zes vijf een een A B" arrives as
 * words. None of that is fixable by asking the model nicely in a prompt.
 *
 * So it is fixed here, against the makes we actually stock, and the corrected
 * value is handed back to the agent — which then says *our* spelling out loud.
 * The caller hears "Peugeot 208" confirmed back and knows they were understood,
 * and the row we store matches the catalogue rather than a phonetic guess.
 *
 * Three rules this follows:
 *
 *   correct, do not guess  a near-miss is repaired; something unrecognisable
 *                          comes back as null so the agent asks again
 *   echo the correction    the answer carries what we understood, so the
 *                          conversation converges instead of drifting
 *   never silently widen   "Golf" must not become "Polo" because both are VW
 */

import brands from './brands.json';

const MAKES: string[] = (brands as { make: string }[]).map((b) => b.make);

/** Strip accents and punctuation: "Citroën" and "citroen" are one word. */
const flatten = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * What Dutch speech-to-text actually produces for these makes.
 *
 * Collected from how the names are pronounced rather than spelled — a caller
 * says "vee-double-u", "pesjot", "hyoondai", and the transcriber writes it
 * phonetically. Edit distance alone does not rescue "pesjot" → "peugeot"
 * (five edits on a seven-letter word), so the common ones are listed.
 */
const HEARD_AS: Record<string, string> = {
  vw: 'Volkswagen', 'v w': 'Volkswagen', volkswage: 'Volkswagen', folkswagen: 'Volkswagen',
  wolkswagen: 'Volkswagen', 'volks wagen': 'Volkswagen',
  pesjot: 'Peugeot', peugot: 'Peugeot', peugeot: 'Peugeot', puzjo: 'Peugeot', peujot: 'Peugeot',
  sitroen: 'Citroën', citroen: 'Citroën', sitroën: 'Citroën', citroe: 'Citroën',
  skoda: 'Škoda', schoda: 'Škoda', sjkoda: 'Škoda', skodda: 'Škoda',
  hyoendai: 'Hyundai', hyundai: 'Hyundai', hiundai: 'Hyundai', hyondai: 'Hyundai',
  mercedes: 'Mercedes-Benz', benz: 'Mercedes-Benz', 'mercedes benz': 'Mercedes-Benz',
  merc: 'Mercedes-Benz', mercides: 'Mercedes-Benz',
  'be em we': 'BMW', bmw: 'BMW', 'bee em double u': 'BMW',
  renoo: 'Renault', reno: 'Renault', renault: 'Renault', renolt: 'Renault',
  'alfa': 'Alfa Romeo', 'alfa romeo': 'Alfa Romeo', alpharomeo: 'Alfa Romeo',
  'land rover': 'Land Rover', landrover: 'Land Rover', 'range rover': 'Land Rover',
  sjevrolet: 'Chevrolet', chevrolet: 'Chevrolet',
  opel: 'Opel', ope: 'Opel',
  sjitroen: 'Citroën',
  'sanjong': 'SsangYong', ssangyong: 'SsangYong',
  daewoo: 'Daewoo', 'dae woo': 'Daewoo',
  seat: 'Seat', siat: 'Seat', 'se at': 'Seat',
  dacha: 'Dacia', dacia: 'Dacia', datsja: 'Dacia',
};

/** Levenshtein, capped — a distance beyond the cap is "not this word". */
function distance(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      best = Math.min(best, row[j]);
    }
    if (best > cap) return cap + 1;
    previous = row;
  }
  return previous[b.length];
}

export interface Repaired<T> {
  value: T | null;
  /** True when we changed what was sent, so the agent can say it back. */
  corrected: boolean;
  /** What arrived, kept for the transcript when it could not be read. */
  heard: string | null;
}

/**
 * The make, as we spell it.
 *
 * Exact first, then the phonetic list, then edit distance against the 61 makes
 * we actually stock — and only within one or two edits, because "Mini" and
 * "MG" are both real and three edits apart from plenty of noise.
 */
export function repairMake(input: unknown): Repaired<string> {
  const heard = typeof input === 'string' ? input.trim() : null;
  if (!heard) return { value: null, corrected: false, heard: null };

  const flat = flatten(heard);
  if (!flat) return { value: null, corrected: false, heard };

  const exact = MAKES.find((make) => flatten(make) === flat);
  if (exact) return { value: exact, corrected: exact !== heard, heard };

  const phonetic = HEARD_AS[flat];
  if (phonetic) return { value: phonetic, corrected: true, heard };

  /* Longer names tolerate one more edit; "MG" tolerates none. */
  const cap = flat.length <= 4 ? 1 : 2;
  let best: { make: string; d: number } | null = null;
  for (const make of MAKES) {
    const d = distance(flat, flatten(make), cap);
    if (d <= cap && (!best || d < best.d)) best = { make, d };
  }

  return best
    ? { value: best.make, corrected: true, heard }
    : { value: null, corrected: false, heard };
}

/**
 * The model, tidied but never invented.
 *
 * No fuzzy matching here on purpose. Model names are short, numerous and close
 * together — a "Golf" repaired into a "Polo" is a wrong key on a van, and the
 * catalogue's own matching already tolerates spelling. All this does is strip
 * the make when the caller repeats it ("een Volkswagen Golf") and drop filler.
 */
export function repairModel(input: unknown, make: string | null): Repaired<string> {
  const heard = typeof input === 'string' ? input.trim() : null;
  if (!heard) return { value: null, corrected: false, heard: null };

  // The article first: "een Volkswagen Golf" starts with "een", so an anchored
  // make pattern never matched and the make stayed in the model.
  let text = heard.replace(/\s+/g, ' ').replace(/^(een|de|het|mijn|m'n)\s+/i, '').trim();
  if (make) {
    const pattern = new RegExp(`^${flatten(make).replace(/ /g, '[^a-z0-9]*')}\\b`, 'i');
    text = text.replace(pattern, '').trim();
  }
  text = text.replace(/[.,]$/, '').trim();

  if (!text || text.length > 40) return { value: null, corrected: false, heard };
  return { value: text, corrected: text !== heard, heard };
}

/** Dutch number words, for a year or a postcode dictated digit by digit. */
const DIGIT_WORDS: Record<string, string> = {
  nul: '0', een: '1', één: '1', twee: '2', drie: '3', vier: '4',
  vijf: '5', zes: '6', zeven: '7', acht: '8', negen: '9',
};

/** The teens, for a year said as "twintig veertien". */
const TEEN_WORDS: Record<string, number> = {
  tien: 10, elf: 11, twaalf: 12, dertien: 13, veertien: 14, vijftien: 15,
  zestien: 16, zeventien: 17, achttien: 18, negentien: 19, twintig: 20,
  eenentwintig: 21, tweeentwintig: 22, drieentwintig: 23, vierentwintig: 24,
  vijfentwintig: 25, zesentwintig: 26,
};

/**
 * A bouwjaar, however it was said.
 *
 * "2010", "twintig tien", "'10" and "tweeduizend tien" all arrive. Anything
 * outside living memory for a car with a key we sell is refused rather than
 * stored — a 1934 in the year column is a typo somebody will later trust.
 */
export function repairYear(input: unknown): Repaired<number> {
  const heard = input == null ? null : String(input).trim();
  if (!heard) return { value: null, corrected: false, heard: null };

  const now = new Date().getFullYear();
  let text = heard.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();

  /*
   * "twintig tien" and "tweeduizend acht" are both 2010 and 2008 to a Dutch
   * ear and neither survives a digit-by-digit substitution. Handled as whole
   * phrases first, before anything else touches the string.
   */
  const spoken = text.match(/^(tweeduizend|twintig)\s*(.*)$/);
  if (spoken) {
    const tail = spoken[2].replace(/\s+/g, '');
    const teen = TEEN_WORDS[tail];
    const unit = DIGIT_WORDS[tail];
    if (teen !== undefined) return { value: 2000 + teen, corrected: true, heard };
    if (unit !== undefined) return { value: 2000 + Number(unit), corrected: true, heard };
    if (/^\d{1,2}$/.test(tail)) return { value: 2000 + Number(tail), corrected: true, heard };
    if (!tail) return { value: 2000, corrected: true, heard };
  }

  for (const [word, digit] of Object.entries(DIGIT_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }
  text = text.replace(/\s+/g, '');

  const four = text.match(/\b(19|20)\d{2}\b/);
  if (four) {
    const year = Number(four[0]);
    if (year >= 1980 && year <= now + 1) {
      return { value: year, corrected: String(year) !== heard, heard };
    }
    return { value: null, corrected: false, heard };
  }

  /* "'08" or "08" — this century unless that would be in the future. */
  const two = text.match(/\b(\d{2})\b/);
  if (two) {
    const guess = 2000 + Number(two[1]);
    const year = guess <= now + 1 ? guess : 1900 + Number(two[1]);
    if (year >= 1980 && year <= now + 1) return { value: year, corrected: true, heard };
  }

  return { value: null, corrected: false, heard };
}

/** `6511 AB`, from digits, words, or "6511ab". */
export function repairPostcode(input: unknown): Repaired<string> {
  const heard = input == null ? null : String(input).trim();
  if (!heard) return { value: null, corrected: false, heard: null };

  let text = heard.toLowerCase();
  for (const [word, digit] of Object.entries(DIGIT_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }
  text = text.toUpperCase().replace(/[^0-9A-Z]/g, '');

  const match = text.match(/^(\d{4})([A-Z]{2})?/);
  if (!match) return { value: null, corrected: false, heard };

  const value = match[2] ? `${match[1]} ${match[2]}` : match[1];
  return { value, corrected: value.replace(' ', '') !== heard.replace(/\s/g, '').toUpperCase(), heard };
}

/**
 * A Dutch telephone number.
 *
 * The one field where a mistake is unrecoverable: a wrong car can be corrected
 * on the doorstep, a wrong number means nobody can reach the customer at all.
 * Anything that is not a plausible Dutch number is refused so the agent asks
 * again rather than booking a job we cannot follow up.
 */
export function repairPhone(input: unknown): Repaired<string> {
  const heard = input == null ? null : String(input).trim();
  if (!heard) return { value: null, corrected: false, heard: null };

  let text = heard.toLowerCase();
  for (const [word, digit] of Object.entries(DIGIT_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }

  let digits = text.replace(/\D/g, '');
  if (digits.startsWith('0031')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('31') && digits.length >= 11) digits = `0${digits.slice(2)}`;

  /* 06xxxxxxxx mobile, or 0xx(x)xxxxxxx landline: ten digits starting with 0. */
  if (!/^0\d{9}$/.test(digits)) return { value: null, corrected: false, heard };

  const pretty = digits.startsWith('06')
    ? `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
    : `${digits.slice(0, 3)} ${digits.slice(3)}`;

  return { value: pretty, corrected: pretty !== heard, heard };
}

/**
 * The sentence the agent reads back before booking.
 *
 * Built here rather than left to the model, so what the customer confirms is
 * exactly what we are about to store. If the caller corrects something, the
 * agent asks again and this is rebuilt — the read-back and the row cannot drift
 * apart, because they come from the same values.
 */
export function readBack(fields: {
  make: string | null;
  model: string | null;
  year: number | null;
  scenarioLabel: string;
  postcode: string | null;
  city?: string | null;
  date: string;
  slot: string;
  total: number;
  phone: string | null;
}): string {
  const car = [fields.make, fields.model, fields.year].filter(Boolean).join(' ');
  const where = [fields.postcode, fields.city].filter(Boolean).join(' ');
  const money = fields.total.toFixed(2).replace('.', ',');

  return (
    `Ik zet het even op een rij: een ${car}, ${fields.scenarioLabel.toLowerCase()}, ` +
    `in ${where}, op ${fields.date} tussen ${fields.slot}, voor € ${money}. ` +
    `Ik bel u op ${fields.phone ?? 'dit nummer'}. Klopt dat zo?`
  );
}
