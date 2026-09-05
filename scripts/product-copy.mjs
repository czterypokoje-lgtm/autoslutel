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

  const groups = [];
  for (const [i, hit] of hits.entries()) {
    const from = hit.index + hit[0].length;
    const to = i + 1 < hits.length ? hits[i + 1].index : source.length;
    groups.push({ make: spellMake(hit[0]), tail: source.slice(from, to).trim() });
  }
  return groups;
}

const YEARS = /\b((?:19|20)\d{2})\s*(?:->|-|–|—|bis|tot|t\/m)?\s*((?:19|20)\d{2})?\s*(->)?/;

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
  /[:;()]|\b(und|oder|nicht|jedoch|f[üu]r|mit|ohne|kann|je nach|sowie|bzw|usw|z\.?\s?b\.?|material|produkttyp|anzahl|transponder|frequenz|funkeinheit|farbe|schl[üu]sselbart|ger[äa]te|lesen|schreiben|anwendung|version|abweichen|enthalten|original|um|zu|programmieren|passwort|berechnung|schneller|lizenz|aktivierung|adapter|immobox|immo|baujahr|\bab\b|software|update|unterst[üu]tzt|funktion|einstellbar|erforderlich|all key lost|key lost|kopieren|hinzuf[üu]gen|tasten?|stil|teilenummer|platine|geh[äa]use|fernbedienung|plattform|chassis|schl[üu]ssel|simulator|emulator|serie|series (?!\d))\b/i;

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
 * Their separators are inconsistent — hyphens, commas, slashes and plain
 * spaces all occur in the same list — so the split is on the punctuation only,
 * and a chunk that carries no letters is dropped rather than guessed at.
 */
function modelsIn(tail) {
  const out = [];
  for (const chunk of tail.split(/\s*[,;|]\s*|\s+-\s+|\s*\/\s*/)) {
    const text = chunk.replace(/\s+/g, ' ').trim();
    if (!text) continue;

    const years = text.match(YEARS);
    const name = text
      .replace(YEARS, ' ')
      // "Hyundai i30 ->" and "Nissan Interstar ab" leave a dangling token
      // where the year range used to be.
      .replace(/\s*(->|→|\+|ab|bis|from|onwards)\s*$/i, '')
      .replace(/^[-–—:.\s]+|[-–—:.\s]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!name || name.length < 2) {
      // A bare year range after a make ("Toyota 2015-2019") still says
      // something; keep it as a model-less entry rather than losing the years.
      if (years) out.push({ model: null, from: Number(years[1]), to: years[2] ? Number(years[2]) : 9999 });
      continue;
    }
    if (NOT_A_MODEL.test(name)) {
      out.push({ model: null, from: years ? Number(years[1]) : 0, to: years?.[2] ? Number(years[2]) : 9999 });
      continue;
    }
    if (/^[\d\s.,-]+$/.test(name)) continue;
    // "Toyota TOYR120L" — an article number standing where a model should be.
    // Their pages repeat the part number inside the fitment sentence, and a
    // customer scanning "past op" for their own car must not read a part
    // number as one.
    if (PART_NUMBER.test(name)) continue;
    if (!looksLikeModel(name)) continue;

    out.push({
      model: titleCase(name),
      from: years ? Number(years[1]) : 0,
      to: years?.[2] ? Number(years[2]) : 9999,
    });
  }
  return out;
}

/** The line that introduces a fitment list, in the three shapes they use. */
const FIT_INTRO =
  /^(?:geeignet|passend)\s+f[üu]r\s*(?:z\.?\s?B\.?\s*)?(?:folgende\s+)?(?:Fahrzeuge|Modelle)?\s*:?\s*/i;

/**
 * Every car the page names, as structured entries.
 *
 * `make` is the make A-Key states in the specification block; it is used as
 * the make for a line that names a model without repeating the make
 * ("geeignet für z.B.: Megane II" on a page whose Fahrzeugmarke is Renault).
 */
/**
 * Whether a line is part of the fitment list.
 *
 * A-Key breaks a long list over several lines, and only the first carries the
 * "geeignet für folgende Fahrzeuge:" label:
 *
 *   geeignet für z.B. folgende Fahrzeuge: AUDI Various Models 2015->
 *   SKODA Fabia 2014-> SKODA Various Models 2014->
 *   VW Golf Sportsvan 2014-> VW Polo 2014-> VW Touran 2015->
 *
 * Reading only the labelled line lost five of the six makes. A continuation is
 * recognised by its shape rather than by position: makes and models and years,
 * and none of the words that make a sentence.
 */
export function isFitmentLine(line) {
  if (FIT_INTRO.test(line)) return true;
  if (PROSE.test(line)) return false;
  if (line.length > 200) return false;
  return splitByMake(line).length > 0;
}

export function fitmentOf(product, statedMake) {
  /*
   * Only lines that say they are about fitment.
   *
   * Scanning every line that merely contains a make name is how "Mercedes-Benz
   * Baureihe: 163 Bj" and "Volvo Silber Material: Hochwertiger Kunststoff"
   * became models a customer could pick their car from. A shorter, true list
   * beats a long one with prose in it.
   */
  const sources = [];
  if (product.vehicles) sources.push(product.vehicles);
  for (const line of product.description ?? []) {
    if (isFitmentLine(line)) sources.push(line.replace(FIT_INTRO, ''));
  }
  for (const line of product.fitmentLines ?? []) sources.push(line);

  const found = [];
  for (const source of sources) {
    const groups = splitByMake(source);

    if (!groups.length) {
      // No make in the line — only usable when the page states one itself.
      if (!statedMake) continue;
      for (const model of modelsIn(source)) {
        if (model.model) found.push({ make: statedMake, ...model });
      }
      continue;
    }

    for (const group of groups) {
      const models = modelsIn(group.tail);
      if (!models.length) {
        found.push({ make: group.make, model: null, from: 0, to: 9999 });
        continue;
      }
      for (const model of models) found.push({ make: group.make, ...model });
    }
  }

  /* One entry per make+model; the widest year range wins. */
  const byKey = new Map();
  for (const entry of found) {
    const key = `${entry.make}|${entry.model ?? ''}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) byKey.set(key, entry);
    else {
      existing.from = Math.min(existing.from || 9999, entry.from || 9999) || 0;
      existing.to = Math.max(existing.to, entry.to);
    }
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

export const tidyFrequency = (value) => {
  if (!value) return null;
  const cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (/^(keine|kein|nein|-)$/i.test(cleaned)) return null;
  const shaped = cleaned.match(FREQUENCY_SHAPE);
  if (!shaped) return null;
  // "315/433MHz" and "433.58 / 434.42 MHz." both occur; one spelling here.
  return shaped[0].replace(/\s*\/\s*/g, ' / ').replace(/\s*MHz/i, ' MHz').replace(/\s+/g, ' ').trim();
};

/**
 * A transponder type, or nothing.
 *
 * Same problem, same answer: "PCF7936 (wird mit Superchip geliefert)" is a
 * chip number with a German aside glued to it, and "ohne (nicht im
 * Lieferumfang)" is not a chip at all.
 */
const CHIP_SHAPE =
  /^(PCF\s?\d{4}[A-Z]*|HITAG\s?[0-9A-Z]+|MEGAMOS\s?\w*|TIRIS|TEXAS\s?\w*|4[A-D]-?\d{0,2}|ID\s?\d{2}[A-Z]?|\d{2}[A-Z]?|8A|4A|7936|7935|7947|7952|7953|XT27[A-Z0-9]*|46|47|48|60|63|70|80)$/i;

export const tidyChip = (value) => {
  if (!value) return null;
  let cleaned = String(value).replace(/\s+/g, ' ').trim();
  if (/^(kein|keine|nein|ohne|-)/i.test(cleaned)) return null;
  // Drop the aside: "PCF7936 (wird mit Superchip geliefert)" -> "PCF7936".
  cleaned = cleaned.replace(/\s*[（(].*$/, '').replace(/\s+(und|oder|bzw)\s.*$/i, '').trim();
  if (!cleaned || cleaned.length > 20) return null;
  // Several chips separated by a slash is a real answer; prose is not.
  const parts = cleaned.split(/\s*\/\s*/);
  return parts.every((part) => CHIP_SHAPE.test(part)) ? cleaned : null;
};

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
  const text = String(value).trim();
  if (/^(ohne|kein|keine|mit|-)$/i.test(text)) return null;
  if (/^notschl[üu]ssel$/i.test(text)) return 'met noodsleutel';
  if (/^w[äa]hlbar$/i.test(text)) return 'naar keuze';
  return text;
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

/** "Golf Sportsvan 2014 t/m nu" */
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

  if (fitment.length) {
    const shown = fitment.slice(0, 40);
    parts.push(
      `<h4>Past op</h4><ul>${shown.map((f) => `<li>${escape(fitmentLabel(f))}</li>`).join('')}</ul>` +
        (fitment.length > shown.length
          ? `<p>En ${fitment.length - shown.length} andere modellen — twijfelt u? Stuur ons uw kenteken.</p>`
          : '')
    );
  } else if (makes.length) {
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
