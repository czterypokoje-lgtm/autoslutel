/**
 * Dutch titles and descriptions, written from the facts A-Key states.
 *
 * Not translated German — generated Dutch. The difference matters: their page
 * for a Toyota remote says "Funkschlüssel kompatibel für Toyota" and nothing
 * else, and a translation of that is a product page that answers none of the
 * four questions a customer actually has:
 *
 *   does it fit my car · is it the whole key or a part · does it need
 *   programming · what do I get for the money
 *
 * So the copy is composed from the specification block, the fitment lines and
 * the category — every sentence traceable to something they publish. Where a
 * fact is missing the sentence is left out; there is no filler that would read
 * as a promise. "Past op" is only ever printed for cars actually named on
 * their page.
 */

import { translateDescription } from './accessory-copy.mjs';

/* ── the makes, and how they are spelled here ────────────────────────── */

export const MAKE_SPELLING = {
  vw: 'Volkswagen', volkswagen: 'Volkswagen', skoda: 'Škoda', 'škoda': 'Škoda',
  'mercedes benz': 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz', mercedes: 'Mercedes-Benz',
  citroen: 'Citroën', 'citroën': 'Citroën', 'land rover': 'Land Rover', landrover: 'Land Rover',
  'range rover': 'Land Rover', vauxhall: 'Opel', opel: 'Opel', 'alfa romeo': 'Alfa Romeo',
  alfa: 'Alfa Romeo', ssangyong: 'SsangYong', 'harley-davidson': 'Harley-Davidson',
};

/** Every make we recognise in a fitment line, longest spelling first. */
const MAKE_WORDS = [
  'alfa romeo', 'land rover', 'range rover', 'mercedes benz', 'mercedes-benz', 'harley-davidson',
  'aston martin', 'great wall', 'general motors',
  'abarth', 'alfa', 'aprilia', 'audi', 'bentley', 'bmw', 'buick', 'cadillac', 'chevrolet',
  'chrysler', 'citroen', 'citroën', 'dacia', 'daewoo', 'daihatsu', 'dodge', 'ducati', 'ferrari',
  'fiat', 'ford', 'geely', 'honda', 'hyundai', 'infiniti', 'isuzu', 'iveco', 'jaguar', 'jeep',
  'kawasaki', 'kia', 'ktm', 'lada', 'lamborghini', 'lancia', 'landrover', 'lexus', 'lincoln',
  'maserati', 'mazda', 'mercedes', 'mg', 'mini', 'mitsubishi', 'nissan', 'opel', 'peugeot',
  'piaggio', 'porsche', 'renault', 'rover', 'saab', 'seat', 'skoda', 'škoda', 'smart',
  'ssangyong', 'subaru', 'suzuki', 'tesla', 'toyota', 'triumph', 'vauxhall', 'volkswagen',
  'volvo', 'vw', 'yamaha',
];

/**
 * Two makes are also ordinary words in this trade, and both produced nonsense:
 * "Smart Key" is a kind of car key, not a Smart; "Mini Prog" is an Xhorse
 * programmer, not a Mini. Neither may match when the next word says so.
 */
const MAKE_GUARDS = {
  smart: /^\s*-?\s*(key|keys|remote|card|entry|go|start|öffnen|schließen|programm)/i,
  mini: /^\s*-?\s*(prog|key\s?tool|usb|adapter|programmer|programmier)/i,
};

const MAKE_RE = new RegExp(`\\b(${MAKE_WORDS.join('|')})\\b`, 'gi');

/** Whether a match of MAKE_RE at this position really names the make. */
const isMake = (word, rest) => {
  const guard = MAKE_GUARDS[word.toLowerCase()];
  return !guard || !guard.test(rest);
};

/** Makes that are written as an acronym, not as a word. */
const ACRONYM_MAKES = { bmw: 'BMW', ktm: 'KTM', mg: 'MG', sym: 'SYM', gm: 'GM' };

export const spellMake = (raw) => {
  const key = String(raw ?? '').trim().toLowerCase();
  return (
    MAKE_SPELLING[key] ??
    ACRONYM_MAKES[key] ??
    key.replace(/\b[a-zà-ÿ]/g, (c) => c.toUpperCase())
  );
};

/* ── which cars ──────────────────────────────────────────────────────── */

/**
 * "AUDI Various Models 2015-> SKODA Fabia 2014-> VW Golf Sportsvan 2014->"
 *
 * A make name is the separator: everything between one make and the next
 * belongs to the first. That is the whole trick, and it is why the make has to
 * be matched on a word boundary — "Smart" the make against "Smart Key" the
 * product, "Mini" the make against "Mini-USB" the cable.
 */
function splitByMake(text) {
  const source = String(text ?? '');
  const hits = [...source.matchAll(MAKE_RE)].filter((hit) =>
    isMake(hit[0], source.slice(hit.index + hit[0].length))
  );
  if (!hits.length) return [];

  /*
   * Consecutive makes with nothing between them share the models that follow.
   * "geeignet für Toyota Lexus, Cruiser, Prado" is a Cruiser and a Prado sold
   * under both marques — reading it left to right made a "Lexus Cruiser",
   * which is not a car anyone can buy.
   */
  const groups = [];
  let pending = [];
  for (const [i, hit] of hits.entries()) {
    const from = hit.index + hit[0].length;
    const to = i + 1 < hits.length ? hits[i + 1].index : source.length;
    const tail = source.slice(from, to).trim();
    pending.push(spellMake(hit[0]));

    // Nothing but punctuation between this make and the next one.
    if (/^[\s,;/&+·-]*$/.test(tail) && i + 1 < hits.length) continue;

    groups.push({ makes: [...new Set(pending)], tail });
    pending = [];
  }
  if (pending.length) groups.push({ makes: [...new Set(pending)], tail: '' });
  return groups;
}

const YEARS = /\b((?:19|20)\d{2})\s*(?:->|-|–|—|bis|tot|t\/m)?\s*((?:19|20)\d{2})?\s*(->)?/;

/** A line that is nothing but a year range: it belongs to the line above it. */
const YEAR_LINE = /^\(?\s*((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})?\s*\)?$/;

/** Words that are a note about the car, not the name of one. */
const NOT_A_MODEL =
  /^(various models?|alle modelle|diverse|modelle|models|und|and|usw|etc|z\.?\s?b\.?|siehe|u\.a\.?)$/i;

/** TOYR120L, MARC103, XKHO00EN — an article code, not a car. */
const PART_NUMBER = /^[A-Z]{2,6}[0-9]{2,5}[A-Z]{0,3}$/;

/**
 * A model name is short and has no grammar in it.
 *
 * Without this the "past op" list filled with sentence fragments — "Volvo
 * Silber Material: Hochwertiger Kunststoff", "Honda nicht jedoch für andere
 * Fahrzeugmarken" — which is worse than an empty list: it reads as a promise
 * that the part fits a car with that name.
 */
const PROSE =
  /[:;()]|\b(und|oder|nicht|jedoch|f[üu]r|mit|ohne|kann|je nach|sowie|bzw|usw|z\.?\s?b\.?|material|produkttyp|anzahl|transponder|frequenz|funkeinheit|farbe|schl[üu]sselbart|ger[äa]te|lesen|schreiben|anwendung|version|abweichen|enthalten|original|um|zu|programmieren|passwort|berechnung|schneller|lizenz|aktivierung|adapter|immobox|immo|baujahr|\bab\b|software|update|unterst[üu]tzt|funktion|einstellbar|erforderlich|all key lost|key lost|kopieren|hinzuf[üu]gen|platine|geh[äa]use|fernbedienung|plattform|chassis|schl[üu]ssel|simulator|emulator|serie|series (?!\d)|tasten?|stil|teilenummer|funkfernbedienung|klappschl[üu]ssel)\b/i;

/** The tools we sell, which are named in the same sentences as the cars. */
const TOOL_BRAND =
  /^(cgdi|autel|xhorse|vvdi|keydiy|lonsdor|obdstar|zed[\s-]?full|abrites|avdi|launch|tango|silca|keyline|jma|kesa|condor|mini prog|key tool)\b/i;

const looksLikeModel = (name) =>
  name.length <= 32 && name.split(/\s+/).length <= 5 && !PROSE.test(name) && !TOOL_BRAND.test(name);

/** Title case that leaves the rest of the word alone: "ÖFFNEN" is not a model. */
const titleCase = (text) =>
  text
    .split(/\s+/)
    .map((word) => (word === word.toUpperCase() && word.length > 1 ? word[0] + word.slice(1).toLowerCase() : word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * The models named after a make, as separate entries.
 *
 * `fallback` is the year range stated once for the whole list — A-Key writes
 * "geeignet für Toyota Lexus, Cruiser, Prado" on one line and "2007 -2016" on
 * the next, and without carrying it across, every one of those cars came out
 * as "vanaf 9999".
 */
function modelsIn(tail, fallback = null) {
  const out = [];
  /*
   * " - " separates two models, but it also separates the two ends of a year
   * range: "Toyota Prius   2010 - 2011". Splitting on it first cut that range
   * in half, and the Prius came out as "2010–nu" — a key sold for a two-year
   * model, offered for every Prius since.
   */
  const source = String(tail ?? '').replace(/((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})/g, '$1-$2');
  for (const chunk of source.split(/\s*[,;|]\s*|\s+-\s+|\s*\/\s*/)) {
    const text = chunk.replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const years = text.match(YEARS);
    const name = text
      .replace(YEARS, ' ')
      .replace(/\s*(->|→|\+|ab|bis|from|onwards)\s*$/i, '')
      .replace(/^[-–—:.\s]+|[-–—:.\s]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const from = years ? Number(years[1]) : fallback?.from ?? 0;
    const to = years?.[2] ? Number(years[2]) : years ? 9999 : fallback?.to ?? 9999;

    if (!name || name.length < 2) {
      if (years) out.push({ model: null, from, to });
      continue;
    }
    if (NOT_A_MODEL.test(name)) {
      out.push({ model: null, from, to });
      continue;
    }
    if (/^[\d\s.,-]+$/.test(name)) continue;
    if (PART_NUMBER.test(name)) continue;
    if (!looksLikeModel(name)) continue;

    out.push({ model: titleCase(name), from, to });
  }
  return out;
}

/**
 * Where the fitment list starts. Matched anywhere in the line, not only at the
 * start: A-Key writes "3 Tasten Funkschlüssel geeignet für VW - VVR124A", and
 * an anchored pattern read 538 such lines as prose and threw them away.
 */
const FIT_MARKER =
  /(?:geeignet|passend)\s+f[üu]r\s*(?:z\.?\s?B\.?\s*)?(?:folgende\s+)?(?:Fahrzeuge|Modelle)?\s*:?\s*/i;
const FIT_INTRO = new RegExp(`^${FIT_MARKER.source}`, 'i');

/**
 * Whether a line continues a fitment list.
 *
 * A-Key breaks a long list over several lines and only the first carries the
 * label:
 *
 *   geeignet für z.B. folgende Fahrzeuge: AUDI Various Models 2015->
 *   SKODA Fabia 2014-> SKODA Various Models 2014->
 *   VW Golf Sportsvan 2014-> VW Polo 2014-> VW Touran 2015->
 *
 * A continuation is recognised by its shape: makes, models and years, and
 * none of the words that make a sentence.
 */
export function isFitmentLine(line) {
  if (FIT_MARKER.test(line)) {
    /*
     * "geeignet für" does not always introduce a car. A-Key uses the same
     * words for what a tool fits — "geeignet für automatische
     * Schlüsselmaschinen Condor & Triton", "geeignet für Silca Futura" — and
     * treating those as fitment swallowed them: they were dropped from the
     * description as a duplicate of a car list that was never built. For a
     * cutter, which machine it fits is the whole product.
     */
    return splitByMake(line.split(FIT_MARKER).slice(1).join(' ')).length > 0;
  }
  if (PROSE.test(line)) return false;
  if (line.length > 200) return false;
  return splitByMake(line).length > 0;
}

/**
 * Every car the page names, as structured entries.
 *
 * `statedMakes` are the makes from the specification block — A-Key writes
 * "für Fahrzeugmarke: Toyota / Lexus" — and they are used for a line that
 * names a model without repeating the make.
 */
export function fitmentOf(product, statedMakes) {
  const stated = (Array.isArray(statedMakes) ? statedMakes : [statedMakes]).filter(Boolean);
  const lines = product.description ?? [];
  const sources = [];

  if (product.vehicles) sources.push({ text: product.vehicles });

  for (const [i, line] of lines.entries()) {
    if (!isFitmentLine(line)) continue;
    // Everything after the label; the label itself may sit mid-sentence.
    let text = FIT_MARKER.test(line) ? line.split(FIT_MARKER).slice(1).join(' ') : line;

    /*
     * Tool compatibility lists put the year first: "2018- TOYOTA PRIUS",
     * "Ab 2019 – LEXUS ES". Everything after a make was read as the model and
     * the year, sitting in front, was lost — 48 cars on one OBDSTAR kit came
     * out with no years at all.
     */
    const leadingYear = text.match(/^\s*(?:ab\s+)?((?:19|20)\d{2})\s*[-–—]?\s*((?:19|20)\d{2})?\s+(?=\D)/i);
    if (leadingYear) {
      sources.push({
        text: text.slice(leadingYear[0].length),
        years: { from: Number(leadingYear[1]), to: leadingYear[2] ? Number(leadingYear[2]) : 9999 },
      });
      continue;
    }

    // "2007 -2016" on the next line is this list's year range.
    const next = lines[i + 1]?.trim();
    const yearLine = next?.match(YEAR_LINE);
    if (yearLine) {
      sources.push({
        text,
        years: { from: Number(yearLine[1]), to: yearLine[2] ? Number(yearLine[2]) : 9999 },
      });
      continue;
    }
    sources.push({ text });
  }

  for (const line of product.fitmentLines ?? []) sources.push({ text: line });

  const found = [];
  for (const { text, years } of sources) {
    const groups = splitByMake(text);

    if (!groups.length) {
      // No make in the line — only usable when the page states one itself.
      for (const model of modelsIn(text, years)) {
        if (model.model) for (const make of stated) found.push({ make, ...model });
      }
      continue;
    }

    for (const group of groups) {
      const models = modelsIn(group.tail, years);
      if (!models.length) {
        for (const make of group.makes) {
          found.push({ make, model: null, from: years?.from ?? 0, to: years?.to ?? 9999 });
        }
        continue;
      }
      // A model list after two makes belongs to both: "Toyota Lexus, Cruiser,
      // Prado" is a Cruiser and a Prado sold as a Toyota and as a Lexus, not a
      // "Lexus Cruiser".
      for (const make of group.makes) for (const model of models) found.push({ make, ...model });
    }
  }

  /* One entry per make+model; the widest year range wins. */
  const byKey = new Map();
  for (const entry of found) {
    const key = `${entry.make}|${entry.model ?? ''}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...entry });
      continue;
    }
    // Both may legitimately be 0 ("no year stated"); Math.min of two 9999
    // placeholders used to leave 9999 behind, and 277 cars came out as
    // "vanaf 9999".
    const froms = [existing.from, entry.from].filter((y) => y > 1900);
    existing.from = froms.length ? Math.min(...froms) : 0;
    // 9999 means "no end year stated", not "still in production", so a real
    // end year always beats it — otherwise the same list read twice (once
    // with years, once without) widened every range back to open-ended.
    const tos = [existing.to, entry.to].filter((y) => y > 1900 && y < 9000);
    existing.to = tos.length ? Math.max(...tos) : 9999;
  }

  const all = [...byKey.values()];
  // A make with named models does not also need a bare "fits Audi" entry.
  const named = new Set(all.filter((e) => e.model).map((e) => e.make));
  return all.filter((e) => e.model || !named.has(e.make));
}

/* ── the same key under another name ─────────────────────────────────── */

/**
 * "Silca ABS3", "Börkey 1393½", "JMA AB-8I".
 *
 * Half their key-blank pages are a list of the equivalent article number at
 * every other manufacturer, and it is the most useful thing on the page: a
 * locksmith knows the Silca number, not ours. Printing it makes the article
 * findable by the number the trade actually uses.
 */
const XREF_BRANDS = [
  ['A-Key', /^a[\s-]?key\b/i], ['Silca', /^silca\b/i], ['Börkey', /^b[öo]e?rkey\b/i],
  ['Errebi', /^errebi\b/i], ['JMA', /^jma\b/i], ['Keyline', /^keyline\b/i],
  ['Ilco', /^ilco\b/i], ['Orion', /^orion\b/i], ['Futura', /^fut+ura\b/i],
  ['Triax', /^triax(?:\s?pro)?\b/i], ['Ninja Total', /^ninja\s?total\b/i],
  ['Kaba', /^kaba\b/i], ['Wilka', /^wilka\b/i], ['Tibbe', /^tibbe\b/i],
];

export function crossReferences(lines) {
  const out = [];
  for (const raw of lines ?? []) {
    const line = raw.replace(/\s+/g, ' ').trim();
    for (const [brand, re] of XREF_BRANDS) {
      if (!re.test(line)) continue;
      const code = line.replace(re, '').replace(/^[\s:.-]+/, '').trim();
      // "Silca" on its own, or a whole sentence, is not an article number.
      if (!code || code.length > 24 || /\s{2,}|[.!?]$/.test(code)) break;
      if (!out.some((x) => x.brand === brand && x.code === code)) out.push({ brand, code });
      break;
    }
  }
  return out;
}

/** "Passende Fräser: Fräser F75" / "Passende Taster: Taster T75" */
export function cuttingTools(lines) {
  const text = (lines ?? []).join(' ');
  return {
    cutter: text.match(/Passende[rn]?\s+Fr[äa]ser\s*:?\s*(?:Fr[äa]ser\s*)?([A-Z0-9][\w.-]{0,12})/i)?.[1] ?? null,
    tracer: text.match(/Passende[rn]?\s+Taster\s*:?\s*(?:Taster\s*)?([A-Z0-9][\w.-]{0,12})/i)?.[1] ?? null,
  };
}

/* ── the title ───────────────────────────────────────────────────────── */

/** The noun we call each kind of article, singular, lower case mid-sentence. */
export const CATEGORY_NOUN = {
  afstandsbedieningen: 'afstandsbediening',
  'smart-keys': 'smart key',
  transpondersleutels: 'transpondersleutel',
  'sleutels-zonder-chip': 'autosleutel zonder startonderbreker',
  noodsleutels: 'noodsleutel',
  'universal-remotes': 'universele afstandsbediening',
  motorsleutels: 'motorsleutel',
  behuizingen: 'sleutelbehuizing',
  printplaten: 'printplaat',
  transponders: 'transponder',
  sleutelbaarden: 'sleutelbaard',
  batterijen: 'batterij',
  programmeerapparatuur: 'programmeerapparaat',
  sleutelmachines: 'sleutelmachine',
  'frezen-en-tasters': 'frees',
  gereedschap: 'gereedschap',
  accessoires: 'accessoire',
  woningsleutels: 'sleutel',
  sloten: 'slot',
  diensten: 'dienst',
};

const capitalise = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text);

/**
 * A frequency, or nothing.
 *
 * Their pages put the label in one tag and the value in the next, so the
 * scraper joins the two — and on the pages where the value tag also holds the
 * paragraph after it, "Funkeinheit:" came back as "Keine Produktgröße:
 * 67.5*35*16mm Produktgewicht: 23.5g". Rather than trying to clean that, only
 * a value shaped like a frequency is kept: everything else is not a fact we
 * can print.
 */
const FREQUENCY_SHAPE = /\b\d{3}(?:[.,]\d+)?\s*(?:\/\s*\d{3}(?:[.,]\d+)?\s*)*MHz\b/i;
/** They also write it without the unit: "Funkeinheit: 433". */
const BARE_FREQUENCY = /^(\d{3}(?:[.,]\d+)?)(\s*\/\s*\d{3}(?:[.,]\d+)?)*$/;

export const tidyFrequency = (value) => {
  if (!value) return null;
  let cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (/^(keine|kein|nein|-)$/i.test(cleaned)) return null;
  if (BARE_FREQUENCY.test(cleaned)) cleaned += ' MHz';
  const shaped = cleaned.match(FREQUENCY_SHAPE);
  if (!shaped) return null;
  // "315/433MHz" and "433.58 / 434.42 MHz." both occur; one spelling here.
  return shaped[0].replace(/\s*\/\s*/g, ' / ').replace(/\s*MHz/i, ' MHz').replace(/\s+/g, ' ').trim();
};

/**
 * A transponder type, or nothing.
 *
 * A whitelist of chip shapes was the wrong instrument: it threw away
 * "DST 80Bit - Plus", "MQB48 / WFS 5C" and 506 other values A-Key states
 * outright, because a list of known chips can never keep up with a supplier
 * who sells new ones. So the test is the other way round — everything is kept
 * unless it is one of the two things that is not a chip: their word for "none",
 * or a sentence.
 */
const NOT_A_CHIP = /^(kein|keine|nein|ohne|nicht|-|n\.?v\.?)\b/i;
/** "Wird bei der Firmware-Generierung automatisch vorbereitet" is a sentence. */
const CHIP_PROSE =
  /\b(wird|werden|kann|muss|ist|sind|bei|der|die|das|dem|den|nicht|im|Lieferumfang|enthalten|geliefert|erforderlich|vorbereitet|Generierung)\b/i;

export const tidyChip = (value) => {
  if (!value) return null;
  let cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (NOT_A_CHIP.test(cleaned)) return null;
  // "PCF7936 (wird mit Superchip geliefert)" — keep the chip, drop the aside.
  cleaned = cleaned.replace(/\s*[（(].*$/, '').trim();
  // A chip value may join two types: "PCF7945A und 7953A". The fact is worth
  // keeping; the conjunction is not German we want on a Dutch page.
  cleaned = cleaned
    .replace(/\bund\b/gi, 'en')
    .replace(/\boder\b/gi, 'of')
    .replace(/\bModell f[üu]r\b/gi, 'model voor')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!cleaned || cleaned.length > 40) return null;
  return CHIP_PROSE.test(cleaned) ? null : cleaned;
};

/** Same treatment for the key blade: "mit" and "ohne" are not profiles. */
/**
 * An article number, or nothing.
 *
 * "Z46-02 für Kangoo" is what their Artikelnummer field holds on a handful of
 * pages: the number with a note after it. The number is the part a customer
 * quotes; the note is German in a Dutch title.
 */
export const tidyArticleNumber = (value) => {
  if (!value) return null;
  const cleaned = String(value)
    .replace(/\s+/g, ' ')
    .replace(/\s+(f[üu]r|for|passend|geeignet)\s.*$/i, '')
    .replace(/\s*[（(].*$/, '')
    .trim();
  return cleaned && cleaned.length <= 32 ? cleaned : null;
};

/**
 * "Schlüsselbart" in Dutch. Two of their values are words, not profiles:
 * "Notschlüssel" means the key carries an emergency blade, "ohne" means it
 * carries none — and neither belongs on a page as German.
 */
export const tidyBlade = (value) => {
  if (!value) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (/^(ohne|kein|keine|mit|-)$/i.test(text)) return null;
  if (/^notschl[üu]ssel$/i.test(text)) return 'met noodsleutel';
  if (/^w[äa]hlbar$/i.test(text)) return 'naar keuze';
  return text.length <= 40 ? text : null;
};

/** "3 + 1 Paniktaste" -> "3 + 1 paniekknop". The number alone is the facet. */
export const buttonLabel = (value) => {
  if (!value) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (/Funkeinheit|MHz/i.test(text)) return null;
  return text
    .replace(/Paniktaste/gi, 'paniekknop')
    .replace(/Alarmtaste/gi, 'alarmknop')
    .replace(/Tasten f[üu]r Schiebet[üu]ren/gi, 'knoppen voor schuifdeuren')
    .replace(/\bincl\.?\b/gi, 'incl.')
    .replace(/\bseitlich\b/gi, 'zijkant');
};

export const buttonCount = (value) => {
  const n = Number(String(value ?? '').match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 && n < 12 ? n : null;
};

/**
 * The supplier's product name in Dutch, or nothing.
 *
 * For a workshop article their heading *is* the product name — "Türöffner-Set
 * SH-60", "Kreuzpickwerkzeuge FM-04W" — and falling back to the category noun
 * turned 82 of them into "Gereedschap (SH-60)", which tells a buyer nothing.
 *
 * Word for word, from a closed list, and all or nothing: if one word is left
 * untranslated the whole name is discarded rather than shown half in German.
 */
const TOOL_WORDS = {
  türöffner: 'deuropener', tueroeffner: 'deuropener', öffner: 'opener',
  werkzeug: 'gereedschap', werkzeuge: 'gereedschap', set: 'set', kit: 'kit',
  schlüssel: 'sleutel', schlüsselset: 'sleutelset', fräser: 'frees', fräsersatz: 'freesset',
  taster: 'taster', taststift: 'tastnaald', zange: 'tang', pinzette: 'pincet',
  schraubendreher: 'schroevendraaier', hebel: 'hefboom', luftkeil: 'luchtkussen',
  pumpe: 'pomp', ventil: 'ventiel', kreuzpickwerkzeuge: 'kruispickgereedschap',
  adapter: 'adapter', kabel: 'kabel', halter: 'houder', koffer: 'koffer',
  batterie: 'batterij', gehäuse: 'behuizing', platine: 'printplaat',
  ersatz: 'reserve', tasche: 'tas', magnet: 'magneet', spiegel: 'spiegel',
  lampe: 'lamp', bohrer: 'boor', feile: 'vijl', klebstoff: 'lijm',
  spannbacke: 'spanklem', klemmadapter: 'klemadapter', emulator: 'emulator',
  simulator: 'simulator', programmiergerät: 'programmeerapparaat',
  schlüsselmaschine: 'sleutelmachine', zylinder: 'cilinder', schloss: 'slot',
  und: 'en', für: 'voor', mit: 'met', ohne: 'zonder', aus: 'van',
  /* The rest of the workshop vocabulary, from counting what actually blocked
     a translation across the 722 workshop articles. */
  geeignet: 'geschikt', passend: 'geschikt', automatische: 'automatische',
  schlüsselmaschinen: 'sleutelmachines', schlüsselanhänger: 'sleutelhanger',
  schlüsselringe: 'sleutelringen', schlüsselschilder: 'sleutellabels',
  kofferanhänger: 'kofferlabel', kennkappen: 'kenkapjes', taststifte: 'tastnaalden',
  bohrmuldenfräser: 'boormoedenfrees', lötadapter: 'soldeeradapter',
  lötfrei: 'soldeervrij', lötfreier: 'soldeervrije', autoöffner: 'auto-opener',
  überzug: 'coating', programmierer: 'programmeur', beschriften: 'beschrijfbaar',
  stück: 'stuks', satz: 'set', packung: 'verpakking', dose: 'doos',
  farbig: 'gekleurd', bunt: 'gekleurd', rund: 'rond', runde: 'ronde',
  gelb: 'geel', weiß: 'wit', weiss: 'wit', orange: 'oranje', rot: 'rood',
  blau: 'blauw', grün: 'groen', schwarz: 'zwart', grau: 'grijs', silber: 'zilver',
  flexibel: 'flexibel', flexibler: 'flexibele', klein: 'klein', groß: 'groot',
  lang: 'lang', kurz: 'kort', neu: 'nieuw', komplett: 'compleet',
  gerade: 'recht', gebogen: 'gebogen', doppelt: 'dubbel', doppelter: 'dubbele',
  einfach: 'enkel', stark: 'sterk', dünn: 'dun', breit: 'breed',
  schwarze: 'zwarte', blaue: 'blauwe', rote: 'rode', grüne: 'groene',
  braun: 'bruin', lila: 'lila', violett: 'paars', rosa: 'roze', beige: 'beige',
  türkis: 'turquoise', brombeer: 'paars', gold: 'goud', bronze: 'brons',
  transparent: 'transparant', natur: 'naturel',
};

/**
 * A token that needs no translation: an article code, a number, a unit.
 *
 * The code pattern is deliberately case-sensitive. With an /i flag it matched
 * every ordinary word as well — "Brombeer" went through untouched and the
 * title came out half German.
 */
const CODE_TOKEN = /^[A-Z0-9][A-Z0-9._/+-]*$/;
const NUMBER_TOKEN = /^[\d.,×x*-]+$/;
const UNIT_TOKEN = /^(mm|cm|g|kg|v|mhz|bit|pro|plus|mini|max)$/i;
const PASSES_THROUGH = (word) => CODE_TOKEN.test(word) || NUMBER_TOKEN.test(word) || UNIT_TOKEN.test(word);

/**
 * Words that need no translation: brands, and the handful that are spelled the
 * same in both languages. Anything else unknown makes the whole name fail —
 * without that rule "Ersatz-Luftkeilpumpe" came out as "Reserve-Luftkeilpumpe",
 * which is neither language.
 */
const SAME_IN_BOTH =
  /^(pro|plus|mini|max|smart|key|tool|cut|auto|start|stop|super|basic|standard|premium|profi|universal|universeel|multi|power|master|slim|flex|magnet|laser|akku|usb|bluetooth|wifi|led|abs|pvc|silca|keyline|xhorse|autel|obdstar|lonsdor|keydiy|kesa|jma|errebi|börkey|boerkey|condor|triton|alpha|beta|miracle|futura|ilco|orion|triax|ninja|dom|abus|kaba|wilka|iseo|mul|lock|t-lock|hu|toy|va|sip|nsn|hon|cy|kia|hy|maz|fo|ne|ssy)$/i;

export function dutchProductName(title, articleNumber) {
  /*
   * Only the article number itself is stripped, and only when it stands at
   * the end. Stripping "anything that looks like a code" turned
   * "Kreuzpickwerkzeuge FM-04W" into "Kruispickgereedschap FM".
   */
  let source = String(title ?? '').replace(/\s+/g, ' ').trim();
  const code = articleNumber ? String(articleNumber).trim() : null;
  if (code) {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    source = source.replace(new RegExp(`\\s*[—–(-]?\\s*${escaped}\\s*\\)?\\s*$`, 'i'), '').trim();
  }
  if (!source || source.length > 60) return null;
  // A name that is only a code says no more than the code alone does.
  if (!/[a-zà-ÿ]{3}/i.test(source)) return null;

  // Split on spaces, brackets and slashes; a hyphen only between two words,
  // so "FM-04W" survives while "Türöffner-Set" is translated in two halves.
  const words = source.split(/(\s+|[()/,]|(?<=[A-Za-zÀ-ÿ]{3})-(?=[A-Za-zÀ-ÿ]{3}))/).filter((w) => w !== '');
  const out = [];

  for (const word of words) {
    if (/^\s+$/.test(word) || /^[()/,-]$/.test(word)) { out.push(word); continue; }
    const bare = word.replace(/[.,:;]+$/, '');
    const punctuation = word.slice(bare.length);
    const known = TOOL_WORDS[bare.toLowerCase()];
    if (known) { out.push(known + punctuation); continue; }
    if (PASSES_THROUGH(bare)) { out.push(word); continue; }
    // A compound: "Türöffner-Set" splits above, but "Schlüsselset" does not.
    const compound = Object.entries(TOOL_WORDS).find(([de]) => bare.toLowerCase() === de);
    if (compound) { out.push(compound[1] + punctuation); continue; }
    if (SAME_IN_BOTH.test(bare)) { out.push(word); continue; }
    return null; // one unknown German word and the whole name is discarded
  }

  const name = out.join('').replace(/\s{2,}/g, ' ').trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
}

/**
 * The title, in the order a customer reads it: the car, then what the thing
 * is, then the one or two specifications that decide whether it fits, then
 * the article number they can quote back to us.
 *
 *   Toyota afstandsbediening 2 knoppen · 433 MHz · 8A (TOYR126L)
 *   Mazda sleutelbehuizing 3 knoppen (MARC103)
 *   Transponder ID46 — VVDI Super Chip (2146)
 */
export function dutchTitle(product, { category, makes }, fitment) {
  const noun = CATEGORY_NOUN[category] ?? 'artikel';
  const make = makes[0] ?? null;

  const buttons = buttonCount(product.buttons);
  const frequency = tidyFrequency(product.frequency);
  const chip = tidyChip(product.transponder);

  const specs = [];
  if (buttons) specs.push(`${buttons} knoppen`);
  if (frequency && ['afstandsbedieningen', 'smart-keys', 'printplaten', 'universal-remotes'].includes(category)) {
    specs.push(frequency);
  }
  if (chip && ['transponders', 'transpondersleutels'].includes(category)) specs.push(chip);
  if (product.blade && category === 'sleutelbaarden') specs.push(product.blade);

  /* One model, named on their page: it belongs in the title. */
  const only = fitment.filter((f) => f.model);
  const model = only.length === 1 && only[0].make === make ? only[0].model : null;

  /*
   * With no single model to name, the makes are what a customer scans for. Two
   * at most: "Sleutelbaard voor Volkswagen, Audi (HU162FH)" is a title; the
   * same line with seven makes in it is a paragraph.
   */
  /* For a workshop article their own heading is the product's name. */
  const WORKSHOP = ['gereedschap', 'accessoires', 'sleutelmachines', 'frezen-en-tasters', 'programmeerapparatuur', 'sloten'];
  if (WORKSHOP.includes(category)) {
    const name = dutchProductName(product.title, product.articleNumber);
    if (name) {
      const code = tidyArticleNumber(product.articleNumber);
      return code && !name.includes(code) ? `${name} (${code})` : name;
    }
  }

  const head = model
    ? [make, model, noun].filter(Boolean).join(' ')
    : makes.length > 1
      ? `${capitalise(noun)} voor ${makes.slice(0, 2).join(' en ')}${makes.length > 2 ? ' e.a.' : ''}`
      : [make, noun].filter(Boolean).join(' ');

  const line = [capitalise(head || noun), specs.join(' · ')].filter(Boolean).join(' ');

  const code = tidyArticleNumber(product.articleNumber);
  return code ? `${line} (${code})` : line;
}

/* ── the description ─────────────────────────────────────────────────── */

/**
 * The opening sentence: what the article is, and — the question behind every
 * return we take — whether it is the whole key or one part of it.
 */
const LEAD = {
  afstandsbedieningen: () =>
    'Complete afstandsbediening: behuizing, elektronica en sleutelbaard in één. Wordt op uw auto geprogrammeerd.',
  'smart-keys': () =>
    'Smart key voor keyless entry en keyless start — de sleutel blijft in uw zak. Wordt op uw auto geprogrammeerd.',
  transpondersleutels: () =>
    'Sleutel met transponder in de kop, zonder afstandsbediening. De chip wordt op uw auto aangeleerd.',
  'sleutels-zonder-chip': () =>
    'Mechanische autosleutel voor voertuigen zonder startonderbreker. Alleen frezen, geen programmering.',
  noodsleutels: () =>
    'Noodsleutel: het mechanische blad uit de smart key. Opent het portier — de auto start er niet mee.',
  'universal-remotes': () =>
    'Universele afstandsbediening. Wordt met een programmeerapparaat op uw auto gezet en daarna geleverd als een originele sleutel.',
  behuizingen: () =>
    'Alleen de behuizing: u zet uw eigen elektronica en sleutelbaard erin. De auto hoeft daarna niet opnieuw geprogrammeerd te worden.',
  printplaten: () =>
    'Alleen de printplaat (PCB) — de elektronica zonder behuizing. Uw eigen behuizing gebruikt u opnieuw.',
  transponders: () =>
    'Losse transponder: de chip die de startonderbreker van uw auto herkent. Wordt aangeleerd of gekopieerd van uw huidige sleutel.',
  sleutelbaarden: () =>
    'Ongefreesd sleutelblad. Wij frezen het op uw slot of op uw sleutelcode.',
  batterijen: () => 'Knoopcel voor autosleutels en afstandsbedieningen.',
  woningsleutels: () => 'Ongefreesde sleutel. Wij frezen hem op uw origineel of op code.',
  motorsleutels: () => 'Sleutel voor motorfiets of scooter. Wordt ongefreesd geleverd.',
  /*
   * The workshop ranges: no promise about fitment, because A-Key states none.
   * A sentence that says what the thing is beats an empty description tab —
   * 222 articles had one before these were added.
   */
  sloten: () => 'Slot of cilinder. Wordt geleverd met de bijbehorende sleutels.',
  programmeerapparatuur: () =>
    'Programmeerapparatuur voor de werkplaats: sleutels uitlezen, kopiëren en op het voertuig aanleren.',
  sleutelmachines: () => 'Sleutelmachine voor de werkplaats.',
  'frezen-en-tasters': () =>
    'Frees of tastnaald voor een sleutelmachine. Controleer welk model op uw machine past.',
  gereedschap: () => 'Gereedschap voor de sleutel- en slotenspecialist.',
  accessoires: () => 'Toebehoren voor sleutels, programmeerapparatuur en de werkplaats.',
  diensten: () => null,
};

/**
 * Lines that are the page furniture, not the product.
 *
 * The "notify me when available" dialog sits inside the description block on
 * every out-of-stock article, honeypot fields and all, and it was being read
 * as part of the text: "Wordt aangeleerd … Additional contact mail (leave
 * blank)* I totally agree to receive nothing*".
 */
const NOISE =
  /Benachrichtigen|Additional contact mail|leave blank|I totally agree|Datenschutzerkl|Frage abschicken|optionale Angabe|Ihre Frage|Nachname|Newsletter|display\s*:\s*none|^\s*[×x]\s*$/i;

const escape = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** "Golf Sportsvan vanaf 2014", "Prius 2010–2011" */
export const fitmentLabel = (entry) => {
  const years =
    entry.from && entry.from > 1950
      ? entry.to && entry.to < 9000
        ? ` ${entry.from}–${entry.to}`
        : ` vanaf ${entry.from}`
      : '';
  return `${entry.make}${entry.model ? ` ${entry.model}` : ''}${years}`;
};

/**
 * The description, as HTML.
 *
 * Laid out the way a parts page has to be read rather than as a paragraph: a
 * sentence saying what it is, the cars it fits as a list, the article numbers
 * it is also sold under, and the note about what still has to happen before it
 * works. Everything in it comes from their page; a section with nothing behind
 * it is not printed.
 */
export function descriptionHtml(product, classification, { fitment, xrefs, tools }) {
  const { category, makes } = classification;
  const parts = [];

  const lead = LEAD[category]?.() ?? null;
  if (lead) parts.push(`<p>${escape(lead)}</p>`);

  /*
   * Their own text, for the articles where it says something ours does not.
   *
   * Filtered before translation, not after: "geeignet für Toyota Cruiser"
   * becomes "geeignet voor Toyota Cruiser", which no longer matches a German
   * pattern, and the fitment line was printed twice — once as a sentence and
   * once as the list under "Past op".
   */
  const usableLines = (product.description ?? []).filter(
    (line) =>
      !isFitmentLine(line) &&
      !NOISE.test(line) &&
      !/^(A[- ]?KEY|Silca|B[öo]rkey|Errebi|JMA|Keyline|Ilco|Orion|Triax|Futura|Ninja)/i.test(line) &&
      // Printed already, as "te frezen met frees F75 en taster T75".
      !/^Passende[rn]?\s+(Fr[äa]ser|Taster)/i.test(line)
  );
  const { dutch } = translateDescription(usableLines);
  const own = dutch.filter((line) => line.length > 25);
  if (own.length) parts.push(`<p>${own.slice(0, 4).map(escape).join(' ')}</p>`);

  /*
   * No "Past op" list here.
   *
   * The product page already prints the fitment as its own block, with the
   * makes as headings and a link to check a number plate. Repeating it in the
   * description put the same list on the page twice, 258 times over.
   */
  if (!fitment.length && makes.length) {
    parts.push(
      `<p>Geschikt voor ${escape(makes.join(', '))}. Wij controleren de pasvorm op uw kenteken voordat wij verzenden.</p>`
    );
  }

  if (xrefs.length) {
    parts.push(
      `<h4>Ook bekend als</h4><ul>${xrefs
        .map((x) => `<li>${escape(x.brand)} ${escape(x.code)}</li>`)
        .join('')}</ul>`
    );
  }

  if (tools.cutter || tools.tracer) {
    const line = [tools.cutter ? `frees ${tools.cutter}` : null, tools.tracer ? `taster ${tools.tracer}` : null]
      .filter(Boolean)
      .join(' en ');
    parts.push(`<p>Voor de werkplaats: te frezen met ${escape(line)}.</p>`);
  }

  if (product.boardNumber) {
    parts.push(`<p>Printplaat in deze sleutel: <strong>${escape(product.boardNumber)}</strong>.</p>`);
  }

  return parts.join('\n');
}

/** The one line under the title, and the one Google shows. */
export function directAnswer(product, { category, makes }, fitment) {
  const noun = CATEGORY_NOUN[category] ?? 'artikel';
  const make = makes[0];
  const models = fitment.filter((f) => f.model);

  if (models.length === 1) return `${capitalise(noun)} voor de ${fitmentLabel(models[0])}.`;
  if (models.length > 1 && make) return `${capitalise(noun)} voor ${models.length} ${make}-modellen.`;
  if (make) return `${capitalise(noun)} voor ${make}.`;
  return capitalise(noun) + '.';
}

export function metaDescription(product, classification, fitment, price) {
  const answer = directAnswer(product, classification, fitment);
  const specs = [
    buttonCount(product.buttons) ? `${buttonCount(product.buttons)} knoppen` : null,
    tidyFrequency(product.frequency),
    tidyChip(product.transponder),
  ]
    .filter(Boolean)
    .join(', ');

  return [answer, specs ? `${specs}.` : null, price ? `Vanaf € ${price.toFixed(2).replace('.', ',')}.` : null]
    .filter(Boolean)
    .join(' ')
    .slice(0, 155);
}
