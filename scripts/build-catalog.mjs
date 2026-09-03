/**
 * Turns the raw supplier export into a structured, filterable catalogue.
 *
 *   node scripts/build-catalog.mjs
 *   src/lib/scraped_products.json  ->  src/lib/catalog.json
 *
 * The raw export has one usable text field per product and a `brand` column
 * that is not a car brand at all but the supplier's collection name — which is
 * why the brand filter on the site was showing audio brands from a template.
 * Everything the UI filters on is derived here, once, at build time, so the
 * pages never parse strings at request time.
 *
 * Two decisions worth knowing about:
 *
 *  - `audience`. Lock picks, decoders and key-programming devices are not
 *    consumer goods: in the Netherlands they sit close to inbrekerswerktuig,
 *    and a locksmith selling car-key programmers to the public undercuts its
 *    own trade. Those products are marked `trade` and are meant to sit behind
 *    a verified-business login, out of the public catalogue and out of any
 *    Merchant Center feed.
 *
 *  - Attribute coverage is deliberately partial. Only ~240 products have a
 *    button count because most of the catalogue is blades, tools and
 *    batteries, which have no buttons. Facets must therefore be contextual:
 *    show a filter only when the current result set actually varies on it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src/lib/scraped_products.json');
const OUT = join(root, 'src/lib/catalog.json');

/* ── vocabularies ─────────────────────────────────────────────────────── */

// Longest first, so "Land Rover" wins over a bare "Rover" inside it.
const CAR_MAKES = [
  ['Mercedes-Benz', /\bmercedes(-|\s)?benz\b|\bmercedes\b/i],
  ['Land Rover', /\bland[\s-]?rover\b|\brange[\s-]?rover\b/i],
  ['Alfa Romeo', /\balfa[\s-]?romeo\b/i],
  ['Volkswagen', /\bvolkswagen\b|\bvw\b/i],
  ['Opel', /\bopel\b|\bvauxhall\b/i], // same cars, NL name is Opel
  ['Citroën', /\bcitroe?n\b/i],
  ['BMW', /\bbmw\b/i],
  ['Audi', /\baudi\b/i],
  ['Ford', /\bford\b/i],
  ['Peugeot', /\bpeugeot\b/i],
  ['Renault', /\brenault\b/i],
  ['Toyota', /\btoyota\b/i],
  ['Nissan', /\bnissan\b/i],
  ['Honda', /\bhonda\b/i],
  ['Hyundai', /\bhyundai\b/i],
  ['Kia', /\bkia\b/i],
  ['Volvo', /\bvolvo\b/i],
  ['Seat', /\bseat\b/i],
  ['Škoda', /\bskoda\b|\bškoda\b/i],
  ['Fiat', /\bfiat\b/i],
  ['Mazda', /\bmazda\b/i],
  ['Mitsubishi', /\bmitsubishi\b/i],
  ['Suzuki', /\bsuzuki\b/i],
  ['Jaguar', /\bjaguar\b/i],
  ['Porsche', /\bporsche\b/i],
  ['Mini', /\bmini\b/i],
  ['Dacia', /\bdacia\b/i],
  ['Chevrolet', /\bchevrolet\b|\bdaewoo\b/i],
  ['Jeep', /\bjeep\b/i],
  ['Lexus', /\blexus\b/i],
  ['Subaru', /\bsubaru\b/i],
  ['Tesla', /\btesla\b/i],
  ['Chrysler', /\bchrysler\b/i],
  ['Dodge', /\bdodge\b/i],
  ['Iveco', /\biveco\b/i],
  ['Smart', /\bsmart\s?(fortwo|forfour|car)\b/i],
];

// The company that made the part, as opposed to the car it fits.
/**
 * Who made the part.
 *
 * Distinct from the car make: a customer looking for a Xhorse blank filters on
 * this, a customer with a Renault filters on that. The A-Key fallback at the
 * end matters — without it 296 of 389 products had no brand at all and the
 * filter was mostly empty.
 */
const MANUFACTURERS = [
  ['Xhorse', /\bxhorse\b|\bvvdi\b|\bx[knsez][a-z]{2}\d/i],
  ['KeyDIY', /\bkeydiy\b|\bkey ?diy\b|\bkd-?x?\d|\bnb\d{2}\b|\bb\d{2}-\d\b|\btb\d{2}-\d\b/i],
  ['Lonsdor', /\blonsdor\b/i],
  ['Autel', /\bautel\b|\bikey\w+/i],
  ['Silca', /\bsilca\b/i],
  ['JMA', /\bjma\b/i],
  ['Keyline', /\bkeyline\b/i],
  ['Lishi', /\blishi\b|\bmr\.?\s?li\b/i],
  ['KLOM', /\bklom\b/i],
  ['JMD', /\bjmd\b/i],
  ['USPRO', /\buspro\b/i],
  ['NXP', /\bnxp\b/i],
];

/* ── classification ───────────────────────────────────────────────────── */

/**
 * Trade-only. Deliberately broad: a false positive costs a public listing,
 * a false negative puts a lock pick in a consumer basket.
 */
const TRADE_ONLY = new RegExp(
  [
    'lock ?pick', 'picking', 'decoder', 'bump ?key', 'tension tool', 'slim ?jim',
    'opening tool', 'tryout', 'jiggl', 'programmer', 'programming device',
    'emulator', 'bypass cable', 'key cutting machine', 'diagnostic tool',
    /*
     * Brand names alone used to sit here — 'xhorse', 'keydiy', 'vvdi' — which
     * gated all 78 of their products as trade-only. Both brands make universal
     * remotes and PCB boards for consumers as well as programmers for the
     * trade, so the brand says nothing about who may buy it. The tool words on
     * either side of this line still do.
     */
    'vvdi (prog|key tool|mini|max)', 'xhorse (condor|dolphin|key tool|prog)',
    'kd-?x2', 'keydiy kd', 'abrites', 'yanhua', 'autel im', 'course',
    'training', 'lishi', 'mr\\.? ?li', 'klom', 'obdstar', 'immo', 'akl cable',
    'adapter full kit', 'ecu', 'cluster', 'simulator',
  ].join('|'),
  'i'
);

/**
 * What A-Key says the article is.
 *
 * Their descriptions carry a "Produkttyp:" field and their category paths carry
 * a type for part of the range. Both beat guessing from a title: the title of a
 * PCB board and of the remote it goes into differ by one word.
 */
const SUPPLIER_TYPE = [
  ['printplaten', 'printplaat', /\bplatine\b|\bpcb\b|printplaat|leiterplatte|boards? f(ue|ü)r/i],
  ['behuizingen', 'sleutelbehuizing', /schl(ue|ü)sselgeh(ae|ä)use|funkgeh(ae|ä)use|smartkeygeh(ae|ä)use|sleutelbehuizing|sleutelhuis/i],
  ['smart-keys', 'smart key', /smartkey|smart key|keyless ?go/i],
  ['noodsleutels', 'noodsleutel', /notschl(ue|ü)ssel|noodsleutel/i],
  ['sleutelbaarden', 'sleutelbaard', /schl(ue|ü)sselblatt|schluesselblatt/i],
  ['transponders', 'transponder', /^transponder$|transponderschl(ue|ü)ssel/i],
  ['afstandsbedieningen', 'afstandsbediening', /funkschl(ue|ü)ssel|funkfernbedienung|funkeinheit|klappschl(ue|ü)ssel|autosleutel|klapsleutel|afstandsbediening/i],
];

/** A-Key's own category paths, where they name a type rather than a car make. */
const SUPPLIER_PATHS = {
  'boards fuer funkschluessel pcb': ['printplaten', 'printplaat'],
  'notschluessel': ['noodsleutels', 'noodsleutel'],
  'transponder': ['transponders', 'transponder'],
  'transponderschluessel': ['transponders', 'transpondersleutel'],
  'autoschluesselblatt spitze': ['sleutelbaarden', 'sleutelbaard'],
  'autoschluessel ohne wegfahrsperre': ['afstandsbedieningen', 'sleutel zonder chip'],
  'autoschluessel': ['afstandsbedieningen', 'afstandsbediening'],
  'autoschluessel funkschluessel': ['afstandsbedieningen', 'afstandsbediening'],
  'motorradschluessel': ['motorsleutels', 'motorsleutel'],
  'zubehoer werkzeug': ['gereedschap', 'handgereedschap'],
  'batterien': ['batterijen', 'batterij'],
  // Not car keys at all: building, furniture and safe keys. Grouped so they can
  // be shown or hidden as one decision instead of leaking in among the remotes.
  'anlageschluessel': ['overige-sleutels', 'anlagesleutel'],
  'universal anlageschluessel': ['overige-sleutels', 'anlagesleutel'],
  'zylinderschluessel': ['overige-sleutels', 'cilindersleutel'],
  'moebelschluessel': ['overige-sleutels', 'meubelsleutel'],
  'tresorschluessel': ['overige-sleutels', 'kluissleutel'],
  'bahnenschluessel': ['overige-sleutels', 'baansleutel'],
  'bohrmuldenschluessel': ['overige-sleutels', 'boormuldensleutel'],
  'buntbartschluessel': ['overige-sleutels', 'baardsleutel'],
  'keilbartschluessel': ['overige-sleutels', 'baardsleutel'],
  'kreuzbartschluessel': ['overige-sleutels', 'kruissleutel'],
  'dornschluessel neubautenschluessel': ['overige-sleutels', 'bouwsleutel'],
  'stahlschluessel vollbart': ['overige-sleutels', 'staalsleutel'],
};

/** Reads A-Key's own type for a product, or null when they did not give one. */
function supplierCategory(p) {
  const tag = (p.tags || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (tag && !/geeignet fuer/.test(tag) && SUPPLIER_PATHS[tag]) return SUPPLIER_PATHS[tag];

  /*
   * Stop at the next field label. The description runs the fields together —
   * "Produkttyp: Funkschlüssel Schlüsselbart: SIP22 Anzahl der Tasten: 4" —
   * and reading 60 characters swept up the blade spec of every remote key, so
   * 136 complete keys were filed as loose blades.
   */
  const typed = (p.description || '').match(
    /produc?ttyp[e]?\s*:?\s*(.*?)(?=\s*(?:schl(?:ue|ü)ssel(?:bart|rohling|blad)|sleutelbla|anzahl|aantal|funkeinheit|frequentie|transponder|farbe|kleur|material|<|\n|$))/i
  );
  if (typed) {
    const value = typed[1];
    const hit = SUPPLIER_TYPE.find(([, , re]) => re.test(value));
    if (hit) return hit.slice(0, 2);
  }
  return null;
}

/** Category, then a narrower subcategory. Order matters — first match wins. */
const CATEGORIES = [
  /*
   * Support tickets and training are not shippable goods and must never reach
   * a consumer basket. They are listed first so nothing else can claim them.
   */
  ['diensten', 'support', /support ?ticket|technischer support|hilfestellung|masterclass|schulung|cursus/i],
  // Tools first — they are gated anyway and their wording is unambiguous.
  /*
   * Devices, by what they are. This used to match on 'xhorse|keydiy|vvdi', so
   * every universal remote from those brands was filed as programming
   * equipment — and then hidden behind the trade gate.
   */
  ['gereedschap', 'programmeerapparatuur', /programmer|programming device|emulator|bypass cable|diagnostic|abrites|yanhua|autel im|kd-?x2|key tool (max|mini|plus)|condor|dolphin/i],
  ['gereedschap', 'sleutelmachine', /cutting machine|key machine/i],
  ['gereedschap', 'handgereedschap', /werkzeug|gereedschap|splintstift/i],
  ['gereedschap', 'opengereedschap', /lock ?pick|picking|decoder|tension|slim ?jim|opening tool|jiggl|klom|lishi|mr\.? ?li/i],
  // Then the consumer types, narrowest first.
  ['smart-keys', 'smart key', /smart ?key|keyless|proximity|prox key/i],
  /*
   * Universal keys get their own category: a blank that is programmed to the
   * car is a different purchase from a remote made for one model, and the shop
   * navigation already points here.
   */
  ['universal-remotes', 'universele afstandsbediening', /universal (remote|key)|\buniversal\b|\bxk[a-z]{2}\d|\bxn[a-z]{2}\d|\bb\d{2}-\d\b|\bnb\d{2}\b|\btb\d{2}-\d\b/i],
  ['afstandsbedieningen', 'afstandsbediening', /\bremote\b|afstandsbediening|key ?fob\b|\bfob\b|flip key/i],
  ['behuizingen', 'sleutelbehuizing', /\bshell\b|\bcase\b|housing|behuizing|\bcover\b|casing|geh.use/i],
  ['noodsleutels', 'noodsleutel', /notschl.ssel|emergency key/i],
  ['printplaten', 'printplaat', /\bpcb\b|platine|printplaat|printplatine|\bboard\b|knoppenfeld|knoppengummi|tastenfeld|tastengummi/i],
  ['transponders', 'transponder', /transponder|\bid4[68]\b|\bhitag\b|\bpcf7\d+/i],
  ['batterijen', 'batterij', /\bbatter|\bcr\d{4}\b/i],
  ['sloten', 'slot & cilinder', /\block\b|\bcylinder\b|ignition|contactslot|barrel|\block set\b/i],
  ['accessoires', 'accessoire', /keyring|sleutelhanger|pouch|faraday|etui|sticker|\bcable\b/i],
  // Blades last: "blade" appears in a great many descriptions as a component,
  // so matching it early swallowed a third of the catalogue.
  ['sleutelbaarden', 'sleutelbaard', /\bblades?\b|sleutelbaard|key blank|\bblank\b/i],
];


const CONDITIONS = [
  ['genuine', /\bgenuine\b|\boriginal\b|\bofficial\b/i],
  ['oem', /\boem\b/i],
  ['aftermarket', /after ?market|\bcompatible\b|\breplacement\b/i],
];

/* ── helpers ──────────────────────────────────────────────────────────── */

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const firstMatch = (pairs, hay) => {
  for (const [value, re] of pairs) if (re.test(hay)) return value;
  return null;
};

/** Strips supplier HTML down to plain text so we can search and measure it. */
const plain = (html) =>
  (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
              .replace(/\s+/g, ' ').trim();

/**
 * Pulls "Hyundai i20 2008-2012" style rows out of the description. Partial by
 * nature — roughly 60% of products carry a year range at all — so anything
 * built on this has to tolerate an empty list.
 */
function extractFitment(text, productMakes) {
  const out = [];
  const push = (make, model, from, to) => {
    if (!make) return;
    const key = `${make}|${model}|${from}|${to}`;
    if (out.some((x) => `${x.make}|${x.model}|${x.from}|${x.to}` === key)) return;
    if (out.length < 40) out.push({ make, model: model.trim().slice(0, 28), from, to });
  };

  // "Hyundai i20 2008-2012" — make named right before the model.
  const withMake = /\b([A-Z][a-zA-Z-]{2,})\s+([A-Za-z0-9][\w '.-]{0,18}?)\s+((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})/g;
  let m;
  while ((m = withMake.exec(text)) !== null) {
    push(firstMatch(CAR_MAKES, m[1]), m[2], +m[3], +m[4]);
  }

  // "Fiesta 2009-2017" with no make on the line. Common once the description
  // has already named the brand in a heading; inherit it from the product.
  if (productMakes.length === 1) {
    const noMake = /\b([A-Z][\w '.-]{1,20}?)\s+((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})/g;
    while ((m = noMake.exec(text)) !== null) {
      const model = m[1].trim();
      // Skip when the captured word is the make itself or an obvious non-model.
      if (firstMatch(CAR_MAKES, model)) continue;
      if (/^(from|for|the|and|with|models?|years?|compatible|fits)$/i.test(model)) continue;
      push(productMakes[0], model, +m[2], +m[3]);
    }
  }

  // "Astra 2004 onwards" / "Golf 2015 >" — open-ended range.
  if (productMakes.length === 1) {
    const openEnded = /\b([A-Z][\w '.-]{1,20}?)\s+((?:19|20)\d{2})\s*(?:onwards?|\+|>|and later)/gi;
    while ((m = openEnded.exec(text)) !== null) {
      const model = m[1].trim();
      if (firstMatch(CAR_MAKES, model)) continue;
      push(productMakes[0], model, +m[2], new Date().getFullYear());
    }
  }

  return out;
}

/* ── Dutch copy ───────────────────────────────────────────────────────── */

const TYPE_COPY = {
  /*
   * The categories the supplier's own data produced. Without an entry here a
   * product falls back to "Accessoire", so a PCB board was titled
   * "Accessoire · Audi · XSMA41EN …" on every listing.
   */
  printplaten: {
    noun: 'printplaat',
    what: 'Losse printplaat voor in een bestaande sleutelbehuizing. De sleutel moet daarna op uw auto worden ingeleerd.',
    programming: true,
  },
  noodsleutels: {
    noun: 'noodsleutel',
    what: 'Mechanische noodsleutel — opent het portier als de batterij of de elektronica het laat afweten.',
    programming: false,
  },
  'universal-remotes': {
    noun: 'universele autosleutel',
    what: 'Universele sleutel die op uw auto wordt geprogrammeerd. Werkt voor veel merken en modellen.',
    programming: true,
  },
  'overige-sleutels': {
    noun: 'sleutel',
    what: 'Sleutel voor woning, meubel of kluis — geen autosleutel.',
    programming: false,
  },
  motorsleutels: {
    noun: 'motorsleutel',
    what: 'Sleutel voor motorfietsen.',
    programming: true,
  },
  diensten: {
    noun: 'dienst',
    what: 'Technische ondersteuning, geen fysiek artikel.',
    programming: false,
  },
  behuizingen: {
    noun: 'sleutelbehuizing',
    what: 'Vervang de versleten of gebarsten kast van uw autosleutel en zet de bestaande elektronica eenvoudig over.',
    programming: false,
  },
  sleutelbaarden: {
    noun: 'sleutelbaard',
    what: 'Ongeslepen sleutelbaard om uw bestaande sleutel te vervangen of aan te vullen. Wij slijpen hem passend op uw slot.',
    programming: false,
  },
  afstandsbedieningen: {
    noun: 'afstandsbediening',
    what: 'Afstandsbediening voor het openen en sluiten van uw auto op afstand.',
    programming: true,
  },
  'smart-keys': {
    noun: 'smart key',
    what: 'Keyless-entry sleutel: de auto herkent de sleutel in uw zak, u hoeft hem niet in het contact te steken.',
    programming: true,
  },
  transponders: {
    noun: 'transponderchip',
    what: 'De chip die met de startonderbreker van uw auto communiceert. Zonder een correct ingeleerde transponder start de auto niet.',
    programming: true,
  },
  batterijen: {
    noun: 'batterij',
    what: 'Vervangingsbatterij voor uw autosleutel. Merkt u dat het bereik kleiner wordt, dan is de batterij meestal de oorzaak.',
    programming: false,
  },
  sloten: {
    noun: 'slotonderdeel',
    what: 'Vervangend slot of cilinder. Klemt uw sleutel of draait het contact zwaar, dan zijn de lamellen meestal versleten.',
    programming: false,
  },
  accessoires: {
    noun: 'accessoire',
    what: 'Accessoire voor uw autosleutel.',
    programming: false,
  },
  gereedschap: {
    noun: 'gereedschap',
    what: 'Professioneel gereedschap voor autosleutelspecialisten.',
    programming: false,
  },
};

/** Groups fitment rows per make so the sentence reads naturally. */
function fitmentSentence(fitment) {
  if (!fitment.length) return null;
  const byMake = new Map();
  for (const f of fitment) {
    if (!byMake.has(f.make)) byMake.set(f.make, []);
    byMake.get(f.make).push(`${f.model} ${f.from}–${f.to}`);
  }
  const parts = [...byMake.entries()].map(
    ([make, models]) => `${make} ${models.slice(0, 6).join(', ')}`
  );
  return parts.join(' · ');
}

/**
 * Writes the Dutch product copy from the structured attributes.
 *
 * The supplier's own text is English and, with permission or not, identical to
 * the text on their site — Google picks one source for duplicate copy and it
 * is rarely the newer shop. Generating from attributes gives every product
 * distinct Dutch prose and keeps it consistent with the filters, because both
 * read the same fields.
 */
function dutchCopy(p) {
  const t = TYPE_COPY[p.category] ?? TYPE_COPY.accessoires;
  const makes = p.makes.slice(0, 3).join(', ');
  const noun = cap(t.noun);

  // The generated part alone is not unique — 1,058 of 1,112 products would end
  // up sharing a title, which is the duplicate-title problem all over again.
  // The supplier title carries what actually distinguishes them: part codes
  // (NSN14, HU101, IKEYVW003AL) and chassis names (E46, Golf 7). Strip the
  // English filler and the make names, keep the rest as the distinguishing tail.
  const rawTail = p.title
    .replace(/\b(for|with|compatible|replacement|aftermarket|genuine|oem|new|brand|button|buttons|key|keys|remote|shell|case|blade|fob|smart|universal|style|and|the|of)\b/gi, ' ')
    .replace(new RegExp(`\\b(${p.makes.map((m) => m.split(/[\s-]/)[0]).join('|') || 'zzzz'})\\b`, 'gi'), ' ')
    .replace(/[,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  /*
   * The supplier's article code — JPR105E, CPR119, HU101 — is the single most
   * searchable thing about a key: it is what is printed on the old one and what
   * a customer types into the search box.
   *
   * Cutting the tail at 42 characters used to slice straight through it, so 50
   * of 389 products lost their code from the Dutch title. It was then invisible
   * on the page and unfindable in search. Cut on a word boundary instead, and
   * put the code back if the cut dropped it.
   */
  const articleCode = (p.title.match(/\b([A-Z]{2,6}\d{2,4}[A-Z0-9+]*)\b/) ?? [])[1] ?? null;

  let tail = rawTail;
  if (tail.length > 42) {
    const cut = tail.slice(0, 42);
    const boundary = cut.lastIndexOf(' ');
    tail = (boundary > 20 ? cut.slice(0, boundary) : cut).trim();
  }
  if (articleCode && !tail.includes(articleCode)) {
    tail = tail ? `${tail} ${articleCode}` : articleCode;
  }

  const titleNl = [
    noun,
    makes || null,
    p.buttons ? `${p.buttons} knoppen` : null,
    tail && tail.length > 1 ? tail : null,
  ].filter(Boolean).join(' · ');

  const specs = [];
  if (p.buttons) specs.push(`${p.buttons} knoppen`);
  if (p.frequency) specs.push(p.frequency);
  if (p.chip) specs.push(`chip ${p.chip}`);
  if (p.condition === 'genuine') specs.push('origineel onderdeel');
  else if (p.condition === 'oem') specs.push('OEM-kwaliteit');

  const fits = fitmentSentence(p.fitment);

  const note = t.programming
    ? 'Let op: deze sleutel moet nog op uw auto worden ingeleerd. Zonder programmering opent hij wel, maar start de auto niet — onze monteur regelt dat op locatie of u stuurt de sleutel naar ons op.'
    : 'Programmeren is niet nodig — u kunt dit onderdeel zelf monteren, of het door onze monteur laten doen.';

  // The opening sentence names the product; `what` explains it. Repeating the
  // noun in both reads like filler, so the opening leads with the fitment.
  const opening = makes
    ? `Deze ${t.noun} is geschikt voor ${makes}.`
    : `Deze ${t.noun} past op meerdere modellen.`;

  const descriptionNl = [
    opening,
    t.what,
    specs.length ? `Uitvoering: ${specs.join(', ')}.` : null,
    fits ? `Past op: ${fits}.` : null,
    note,
  ].filter(Boolean).join(' ');

  // Two or three sentences that answer the question on their own — what LLMs
  // and Google featured snippets quote, and what the English blurb never did.
  const directAnswer = [
    `${noun}${makes ? ` voor ${makes}` : ''}${p.buttons ? ` met ${p.buttons} knoppen` : ''}.`,
    specs.length ? `Uitvoering: ${specs.join(', ')}.` : null,
    p.fitment.length ? `Past op ${p.fitment.length} model${p.fitment.length === 1 ? '' : 'len'}.` : null,
    t.programming
      ? 'Inleren op uw auto is vereist; dat doen wij op locatie.'
      : 'U kunt dit onderdeel zelf monteren.',
  ].filter(Boolean).join(' ');

  // Aim for 120–155 characters: long enough to earn the click, short enough
  // that Google does not cut the end off.
  // Naming the leading model keeps otherwise near-identical descriptions
  // distinct, and it is the phrase people actually search for.
  const leadModel = p.fitment[0]
    ? `${p.fitment[0].make} ${p.fitment[0].model} ${p.fitment[0].from}-${p.fitment[0].to}`
    : null;

  let meta = [
    makes ? `${noun} voor ${makes}` : noun,
    p.buttons ? `${p.buttons} knoppen` : null,
    leadModel ? `o.a. ${leadModel}` : null,
    p.fitment.length > 1 ? `+${p.fitment.length - 1} modellen` : null,
  ].filter(Boolean).join(', ');
  meta += t.programming
    ? '. Inclusief inleren op locatie mogelijk. 12 maanden garantie.'
    : '. Zelf monteren of door ons laten doen. 12 maanden garantie.';

  return {
    articleCode,
    titleNl: titleNl.slice(0, 110),
    descriptionNl,
    directAnswer,
    metaDescriptionNl: meta.length > 155 ? `${meta.slice(0, 152).replace(/[ ,.]$/, '')}…` : meta,
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── build ────────────────────────────────────────────────────────────── */

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const seen = new Set();
const products = [];
const stats = { trade: 0, public: 0, noCategory: 0, withButtons: 0, withFitment: 0 };

for (const p of raw) {
  const title = (p.title || '').trim();
  if (!title) continue;

  const body = plain(p.description);
  const hay = `${title} ${p.tags || ''} ${body.slice(0, 600)}`;

  let slug = slugify(title);
  if (seen.has(slug)) slug = `${slug}-${p.id}`;
  seen.add(slug);

  // Title first: it names the product. The description mentions components
  // ("includes an uncut blade") that otherwise hijack the classification.
  const [category, subcategory] =
    // Services first: a support ticket is not a product, whatever the rest of
    // the text looks like.
    (/support ?ticket|technischer support|hilfestellung|masterclass|schulung|cursus/i.test(title)
      ? ['diensten', 'support']
      : null) ??
    supplierCategory(p) ??
    (CATEGORIES.find(([, , re]) => re.test(title)) ??
     CATEGORIES.find(([, , re]) => re.test(hay)))?.slice(0, 2) ??
    /*
     * Last resort, and only after both passes have failed.
     *
     * The supplier titles every key "Autosleutel …" or "Funkschlüssel …", so
     * this cannot live in the ordered list above: there it would match on the
     * title before a transponder or smart-key rule got a chance at the
     * description, and it swallowed 147 transponders when it did.
     */
    (/^(autosleutel|funkschl.ssel|\d?-?knops autosleutel|[a-z]{2,6}\d{2,4})/i.test(title)
      ? ['afstandsbedieningen', 'afstandsbediening']
      : [null, null]);
  if (!category) stats.noCategory++;

  /*
   * Judged on the title, not the description.
   *
   * A supplier's description says which programmer a key works with — "werkt
   * met VVDI Key Tool", "KeyDIY KD900" — and matching that gated ordinary
   * remotes and PCB boards as trade-only. What a product *is* appears in its
   * title; what it is compatible with appears in its description.
   */
  const audience =
    TRADE_ONLY.test(title) || category === 'diensten' ? 'trade' : 'public';
  stats[audience]++;

  const makes = CAR_MAKES.filter(([, re]) => re.test(hay)).map(([name]) => name);

  const buttonsMatch = title.match(/(\d)\s*[- ]?(?:button|knop|btn)\b/i);
  const buttons = buttonsMatch ? +buttonsMatch[1] : null;
  if (buttons) stats.withButtons++;

  const freqMatch = hay.match(/\b(\d{3}(?:\.\d+)?)\s*MHz\b/i);
  const chipMatch = hay.match(/\b(ID\s?\d{2}|PCF\s?\d{4}|Hitag\s?\d?|4D-?\d{2}|46|48)\b/i);

  const fitment = extractFitment(body, makes);
  if (fitment.length) stats.withFitment++;

  const priceRaw = parseFloat(String(p.price ?? '').replace(',', '.'));

  products.push({
    id: String(p.id),
    slug,
    title,
    category,
    subcategory,
    audience,
    makes,
    // Everything in this feed is supplied by A-Key; a recognised brand name
    // only means they resell that brand's part.
    manufacturer: firstMatch(MANUFACTURERS, hay) ?? 'A-Key',
    condition: firstMatch(CONDITIONS, hay) ?? 'aftermarket',
    buttons,
    frequency: freqMatch ? `${freqMatch[1]} MHz` : null,
    chip: chipMatch ? chipMatch[1].replace(/\s+/g, '') : null,
    // Supplier cost, not a shop price. Pricing is applied downstream so the
    // margin, VAT and rounding rules live in one place.
    costPrice: Number.isFinite(priceRaw) ? priceRaw : null,
    image: p.imageLocalPath || null,
    images: p.images || (p.imageLocalPath ? [p.imageLocalPath] : []),
    fitment,
    excerpt: body.slice(0, 260),
  });

  // Dutch copy is derived last so it can read every attribute above.
  const last = products[products.length - 1];
  Object.assign(last, dutchCopy(last));
}

/* ── deduplicate ──────────────────────────────────────────────────────────
   The supplier feed lists the same part several times — one group had the
   identical part number 1K0905851B six times over, differing only in cost and
   in how much fitment text each listing carried. Shipping those as separate
   pages would recreate the duplicate-title problem the site was just cleaned
   of, and split any ranking between near-identical URLs.

   Records are grouped on the part number when the title carries one, else on
   a normalised title. The surviving record keeps the richest fitment, the
   lowest cost, and the union of every group member's fitment rows.
   ─────────────────────────────────────────────────────────────────────── */

function dedupeKey(p) {
  // Manufacturer part numbers: 1K0905851B, IKEYVW003AL, 5K0837202AD…
  const part = p.title.match(/\b[0-9A-Z]{2,}[0-9]{3,}[0-9A-Z]*\b/);
  if (part) return `part:${part[0].toUpperCase()}`;
  return `title:${p.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}`;
}

function dedupe(list) {
  const groups = new Map();
  for (const p of list) {
    const k = dedupeKey(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }

  const merged = [];
  let removed = 0;
  for (const group of groups.values()) {
    if (group.length === 1) { merged.push(group[0]); continue; }
    removed += group.length - 1;

    // Keep the listing with the most fitment detail; ties go to the cheapest.
    const best = group.slice().sort((a, b) =>
      b.fitment.length - a.fitment.length ||
      (a.costPrice ?? Infinity) - (b.costPrice ?? Infinity)
    )[0];

    const seen = new Set(best.fitment.map((f) => `${f.make}|${f.model}|${f.from}|${f.to}`));
    for (const other of group) {
      if (other === best) continue;
      for (const f of other.fitment) {
        const k = `${f.make}|${f.model}|${f.from}|${f.to}`;
        if (!seen.has(k) && best.fitment.length < 40) { seen.add(k); best.fitment.push(f); }
      }
      const c = other.costPrice;
      if (c != null && (best.costPrice == null || c < best.costPrice)) best.costPrice = c;
      for (const m of other.makes) if (!best.makes.includes(m)) best.makes.push(m);
    }
    merged.push(best);
  }
  return { merged, removed };
}

const { merged: deduped, removed: duplicatesRemoved } = dedupe(products);
products.length = 0;
products.push(...deduped);

// Copy is regenerated after merging so it reflects the combined fitment.
for (const p of products) Object.assign(p, dutchCopy(p));

const facetCount = (key) => {
  const c = {};
  for (const p of products) {
    if (p.audience !== 'public') continue;
    const v = p[key];
    for (const x of Array.isArray(v) ? v : [v]) if (x) c[x] = (c[x] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(c).sort((a, b) => b[1] - a[1]));
};

const catalog = {
  generatedAt: new Date().toISOString(),
  count: products.length,
  facets: {
    category: facetCount('category'),
    subcategory: facetCount('subcategory'),
    makes: facetCount('makes'),
    manufacturer: facetCount('manufacturer'),
    condition: facetCount('condition'),
    buttons: facetCount('buttons'),
    frequency: facetCount('frequency'),
  },
  products,
};

writeFileSync(OUT, JSON.stringify(catalog));
console.log(`catalog.json written — ${products.length} products (${duplicatesRemoved} duplicates merged)`);
const pub = products.filter((p) => p.audience === 'public').length;
console.log(`  public ${pub} · trade ${products.length - pub} (gated)`);
console.log(`  with fitment ${products.filter((p) => p.fitment.length).length} · with buttons ${products.filter((p) => p.buttons).length}`);
console.log('  car makes:', Object.keys(catalog.facets.makes).length);
console.log('  categories:', Object.keys(catalog.facets.category).join(', '));
