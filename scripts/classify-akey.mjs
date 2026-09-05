/**
 * Files every A-Key article, and refuses to guess.
 *
 *   node scripts/classify-akey.mjs
 *   -> src/data/akey-classified.json
 *
 * Reads src/data/akey-catalog-raw.json (scripts/scrape-akey-catalog.mjs) and
 * decides, for each article, which of our categories it belongs in — together
 * with the evidence for that decision, so any filing can be traced back to the
 * line on their page that produced it.
 *
 * Four things come out of it:
 *
 *   filed     the article, its category, its make(s), and why
 *   review    articles the rules could not settle — held back, not guessed
 *   conflicts articles where two signals disagreed, listed loudly
 *   unmapped  shelves of theirs we have never mapped, which fails the run
 *
 * The last one matters most. A-Key adds categories; when they do, this stops
 * with the new path printed rather than quietly filing forty articles under
 * whatever the fallback happened to be.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { CATEGORIES, AKEY_PATHS, normalisePath, MAKE_CRUMB } from './taxonomy.mjs';

const IN = path.join(process.cwd(), 'src/data/akey-catalog-raw.json');
const SECTIONS = path.join(process.cwd(), 'src/data/akey-sections.json');
const OUT = path.join(process.cwd(), 'src/data/akey-classified.json');

if (!existsSync(IN)) {
  console.error('Run scripts/scrape-akey-catalog.mjs first.');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(IN, 'utf8'));
/* Their sitemap lists the category pages too; those are not articles. */
const products = Object.values(raw.products).filter((p) => p.isProduct);
const listings = Object.values(raw.products).length - products.length;

/* ── makes ───────────────────────────────────────────────────────────── */

/**
 * The makes we recognise, and how A-Key spells them.
 *
 * Spelling is not cosmetic here: their pages carry "Mercedes Benz", "MERCEDES
 * BENZ", "Mercedes-Benz" and "MB", and treating those as four makes is what
 * produced a brand menu with the same manufacturer in it four times.
 */
const MAKES = {
  'Alfa Romeo': ['alfa romeo', 'alfa'],
  Audi: ['audi'],
  Bentley: ['bentley'],
  BMW: ['bmw'],
  Buick: ['buick'],
  Cadillac: ['cadillac'],
  Chevrolet: ['chevrolet', 'chevy'],
  Chrysler: ['chrysler'],
  Citroën: ['citroen', 'citroën'],
  Dacia: ['dacia'],
  Daewoo: ['daewoo'],
  Dodge: ['dodge'],
  Ferrari: ['ferrari'],
  Fiat: ['fiat'],
  Ford: ['ford'],
  GM: ['gm', 'general motors'],
  Honda: ['honda'],
  Hyundai: ['hyundai'],
  Isuzu: ['isuzu'],
  Iveco: ['iveco'],
  Jaguar: ['jaguar'],
  Jeep: ['jeep'],
  Kia: ['kia'],
  'Land Rover': ['land rover', 'landrover', 'range rover'],
  Lancia: ['lancia'],
  Lexus: ['lexus'],
  Maserati: ['maserati'],
  Mazda: ['mazda'],
  'Mercedes-Benz': ['mercedes benz', 'mercedes-benz', 'mercedes'],
  Mini: ['mini'],
  Mitsubishi: ['mitsubishi'],
  Nissan: ['nissan'],
  Opel: ['opel', 'vauxhall'],
  Peugeot: ['peugeot'],
  Porsche: ['porsche'],
  Renault: ['renault'],
  Rover: ['rover'],
  Saab: ['saab'],
  Seat: ['seat'],
  Škoda: ['skoda', 'škoda'],
  Smart: ['smart'],
  SsangYong: ['ssangyong'],
  Subaru: ['subaru'],
  Suzuki: ['suzuki'],
  Tesla: ['tesla'],
  Toyota: ['toyota'],
  /* Motorcycle makes — A-Key files scooter and bike keys by brand too. */
  Yamaha: ['yamaha'],
  Kawasaki: ['kawasaki'],
  Ducati: ['ducati'],
  KTM: ['ktm'],
  Aprilia: ['aprilia'],
  Piaggio: ['piaggio', 'vespa'],
  Triumph: ['triumph'],
  'Harley-Davidson': ['harley', 'harley-davidson'],
  Kymco: ['kymco'],
  SYM: ['sym'],
  Volkswagen: ['volkswagen', 'vw'],
  Volvo: ['volvo'],
};

const MAKE_BY_SPELLING = new Map();
for (const [make, spellings] of Object.entries(MAKES)) {
  for (const spelling of spellings) MAKE_BY_SPELLING.set(spelling, make);
}

/** Exact match on a whole string, never a substring: "Smart" is a make, "Smart Key" is not. */
const makeOf = (text) => MAKE_BY_SPELLING.get(String(text ?? '').trim().toLowerCase()) ?? null;

/**
 * The makes named inside a sentence.
 *
 * "Smart" and "Mini" are also words in this trade — a Smart Key is a kind of
 * key, a Mini Prog is a programmer — so both only count when the next word
 * does not say otherwise.
 */
const NOT_REALLY = {
  smart: /^\s*-?\s*(key|keys|remote|card|entry|go|start|prog)/i,
  mini: /^\s*-?\s*(prog|key\s?tool|usb|adapter|programmer)/i,
};

const MAKE_IN_TEXT = new RegExp(`\\b(${[...MAKE_BY_SPELLING.keys()].join('|')})\\b`, 'gi');

function makesIn(text) {
  const source = String(text ?? '');
  const found = [];
  for (const hit of source.matchAll(MAKE_IN_TEXT)) {
    const guard = NOT_REALLY[hit[0].toLowerCase()];
    if (guard && guard.test(source.slice(hit.index + hit[0].length))) continue;
    const make = makeOf(hit[0]);
    if (make && !found.includes(make)) found.push(make);
  }
  return found;
}

/* ── which shelves an article actually stands on ─────────────────────────
 *
 * A breadcrumb names one shelf. An article can stand on several, and which
 * one the breadcrumb shows is not something we control: their PCB shelf holds
 * 32 boards, and only 22 of them have a breadcrumb that says so — the other
 * ten show "geeignet für Audi", the make shelf they are also on.
 *
 * So section membership is read as a second opinion. Where the two agree,
 * the filing is certain. Where they disagree, it is a conflict and a person
 * looks at it.
 * ─────────────────────────────────────────────────────────────────────── */

let sectionCategory = new Map();
let sectionMake = new Map();
let sectionsOf = new Map();

if (existsSync(SECTIONS)) {
  const data = JSON.parse(readFileSync(SECTIONS, 'utf8')).sections;

  /* A section maps to a category when its name is the leaf of exactly one
   * mapped path. "Zubehör" is the leaf of two of theirs, so it maps to
   * neither and contributes no evidence. */
  const byLeaf = new Map();
  for (const [pathName, value] of Object.entries(AKEY_PATHS)) {
    if (!value.category) continue;
    const leaf = pathName.split(' > ').at(-1);
    byLeaf.set(leaf, byLeaf.has(leaf) ? null : value);
  }

  for (const [slug, section] of Object.entries(data)) {
    const mapped = byLeaf.get(section.name);
    if (mapped) sectionCategory.set(slug, { ...mapped, name: section.name });

    /*
     * "geeignet für Opel" is a shelf of everything they say fits an Opel.
     * That is the make stated by the supplier, not a make read out of a
     * sentence — and it covers hundreds of articles whose own page never
     * names a make at all.
     */
    const make = makeOf(section.name.match(MAKE_CRUMB)?.[1] ?? '');
    if (make) sectionMake.set(slug, make);

    for (const member of section.slugs) {
      if (!sectionsOf.has(member)) sectionsOf.set(member, []);
      sectionsOf.get(member).push(slug);
    }
  }
}

/** The categories the shelves this article stands on imply, deduplicated. */
function shelvesOf(slug) {
  const found = new Map();
  for (const section of sectionsOf.get(slug) ?? []) {
    const mapped = sectionCategory.get(section);
    if (mapped) found.set(mapped.category, mapped);
  }
  return found;
}


/* ── narrowing, within the shelf the breadcrumb already fixed ────────── */

/**
 * A smart key is a remote key you never take out of your pocket, and A-Key
 * files it on the same shelf as an ordinary remote. These are the words they
 * use for it, and they are specific enough that nothing else matches: a
 * "Funkschlüssel" that says Keyless Go is a smart key.
 */
const SMART_KEY = /\b(smart[\s-]?key|keyless[\s-]?(go|entry|system)?|proximity|kessy)\b/i;
/**
 * A-Key files a handful of car-key blanks under "Schlüssel", their shelf for
 * house and furniture keys — CHU5 and AX9CP sit between safe keys and cabinet
 * keys. Their own title calls them a Fahrzeugschlüssel, so that is what they
 * are: a mechanical car key for a car without an immobiliser.
 */
const VEHICLE_KEY = /\b(fahrzeugschl[üu]ssel|autoschl[üu]ssel|z[üu]ndschl[üu]ssel)\b/i;

/**
 * A bare circuit board. A-Key sells these on the same shelf as complete keys,
 * and a customer who orders one expecting a key gets an unusable part in an
 * envelope — this is the mix-up the whole rewrite exists to stop.
 */
const BARE_BOARD = /\b(PCB|Platine|Platinen|Remote\s?Board|Board)\b/i;

/**
 * The words A-Key uses for a kind of article, and what each one means.
 *
 * Used for one job only: breaking a tie when an article stands on two of
 * their shelves that map to different categories. An Xhorse remote board is
 * genuinely on both the universal-remote shelf and the board shelf, and their
 * own title — "4 Tasten Platine" — says which of the two a customer is
 * buying. It is never used to file an article that has no shelf at all.
 */
const TYPE_WORDS = [
  // German builds compounds, so these deliberately match inside a word:
  // "Fernbedienungsplatinen" and "Schlüsselgehäuse" are the usual spelling,
  // and an anchored \b would miss both.
  [/(PCB|platinen?|remote\s?board|board)\b/i, 'printplaten'],
  [/geh[äa]use\b/i, 'behuizingen'],
  [/^transponder\b/i, 'transponders'],
  [/smart[\s-]?key\b/i, 'smart-keys'],
  [/notschl[üu]ssel\b/i, 'noodsleutels'],
  [/(schl[üu]sselblatt|spitze)\b/i, 'sleutelbaarden'],
  [/batterie\b/i, 'batterijen'],
  [/(motorrad|motorroller)/i, 'motorsleutels'],
];

const REFINEMENTS = [
  {
    from: 'afstandsbedieningen',
    to: 'printplaten',
    sub: 'printplaat',
    when: (p) => BARE_BOARD.test(p.title),
    why: 'their own title calls it a board / PCB',
  },
  {
    from: 'behuizingen',
    to: 'printplaten',
    sub: 'printplaat',
    when: (p) => BARE_BOARD.test(p.title),
    why: 'their own title calls it a board / PCB',
  },
  {
    from: 'afstandsbedieningen',
    to: 'smart-keys',
    sub: 'smart key',
    when: (p, text) => SMART_KEY.test(text),
    why: 'the article text says smart key / keyless',
  },
  {
    from: 'woningsleutels',
    to: 'sleutels-zonder-chip',
    sub: 'sleutel zonder startonderbreker',
    when: (p) => VEHICLE_KEY.test(p.title),
    why: 'their own title calls it a Fahrzeugschlüssel',
  },
];

/**
 * The words that place an article they file nowhere.
 *
 * Order matters: "Fräser für Schlüsselmaschine" is a cutter, not a machine.
 */
const LAST_RESORT = [
  [/fr[äa]ser|fraeser/i, 'frezen-en-tasters', 'frees'],
  [/\btaster\b/i, 'frezen-en-tasters', 'taster'],
  [/programmierger[äa]t|programmer\b|\bOBD\b|diagnose/i, 'programmeerapparatuur', 'programmeerapparaat'],
  [/schl[üu]sselmaschine|replicator|condor|graviermaschine/i, 'sleutelmachines', 'sleutelmachine'],
  [/batterie|knopfzelle/i, 'batterijen', 'batterij'],
  [/geh[äa]use|deckel|cover\b/i, 'behuizingen', 'sleutelbehuizing'],
  [/transponder/i, 'transponders', 'transponder'],
  [/zylinder|schlie[ßs]zylinder|vorhangschlo[ßs]|schloss\b/i, 'sloten', 'cilinder'],
  [/[öo]ffner|pick|dietrich|luftkeil|hebelwerkzeug|t[üu]r[\s-]?hebel|aufsperr/i, 'gereedschap', 'opengereedschap'],
  [/zange|schraubendreher|pinzette|l[öo]tkolben|werkzeug/i, 'gereedschap', 'handgereedschap'],
  [/adapter|kabel|emulator|klemm|halter|steckverbinder/i, 'accessoires', 'adapter & kabel'],
  [/schl[üu]sselanh[äa]nger|beutel|karton|verpackung|aufkleber|etikett/i, 'accessoires', 'toebehoren'],
  [/klebstoff|kleber|sekundenkleber/i, 'accessoires', 'lijm & hulpmiddelen'],
];

/* ── one article ─────────────────────────────────────────────────────── */

/** Every word A-Key writes about the article, for the pattern checks. */
const textOf = (p) =>
  [p.title, p.productType, p.ldDescription, ...(p.description ?? [])].filter(Boolean).join(' ');

function classify(p) {
  const evidence = [];
  /** Filed, but worth a human glance — shown as a flag in the CRM. */
  let needsCheck = null;
  const crumbs = p.breadcrumb.map((c) => c.name);

  /* The make, when their deepest crumb is "geeignet für Toyota". */
  const makes = new Set();
  let shelfCrumbs = crumbs;
  const last = crumbs.at(-1) ?? '';
  // Two shapes: "geeignet für Toyota" under the remote keys, and a bare
  // "BMW" under the motorcycle keys. Both name a make, neither is a shelf.
  const crumbMake = makeOf(last.match(MAKE_CRUMB)?.[1] ?? '') ?? (crumbs.length > 1 ? makeOf(last) : null);
  if (crumbMake) {
    makes.add(crumbMake);
    evidence.push(`make from breadcrumb: ${crumbMake}`);
    shelfCrumbs = crumbs.slice(0, -1);
  }

  /* Every make shelf they list the article on. */
  for (const section of sectionsOf.get(p.slug) ?? []) {
    const make = sectionMake.get(section);
    if (make && !makes.has(make)) {
      makes.add(make);
      evidence.push(`listed under "geeignet für ${make}"`);
    }
  }

  /* The make they print as a field — sometimes two: "Toyota / Lexus". */
  const fieldMakes = makesIn(p.make);
  for (const fieldMake of fieldMakes) {
    if (!makes.has(fieldMake)) {
      makes.add(fieldMake);
      evidence.push(`make from "Fahrzeugmarke: ${p.make}"`);
    }
  }

  /*
   * The make in the article's own name wins over the shelf it stands on.
   *
   * XZMZD8EN is called "4 Tasten Platine geeignet für Mazda", says
   * "ausschließlich für Mazda-Fahrzeuge" in its text, and stands on their
   * Hyundai and Kia shelves. Their shelving is wrong there, and a title that
   * names a make is the most specific thing the supplier says about the part.
   */
  const titleMakes = makesIn(p.title);
  if (titleMakes.length) {
    /*
     * The title corrects the shelf, never the specification block. A key whose
     * "Fahrzeugmarke" says "Toyota / Lexus" and whose title says Toyota fits
     * both — dropping Lexus there cost 39 articles a make they are sold for.
     */
    const keep = new Set([...titleMakes, ...fieldMakes]);
    const shelved = [...makes].filter((m) => !keep.has(m));
    if (shelved.length) {
      needsCheck = `hun plank zegt ook ${shelved.join(', ')} — titel zegt ${titleMakes.join(', ')}`;
      evidence.push(`title names ${titleMakes.join(', ')}; shelves also said ${shelved.join(', ')}`);
    }
    makes.clear();
    for (const make of keep) makes.add(make);
  }

  /* ── the shelf ── */
  const lookupPath = normalisePath(shelfCrumbs);
  const shelf = AKEY_PATHS[lookupPath];

  if (shelfCrumbs.length && !shelf) {
    return { status: 'unmapped', path: lookupPath, makes: [...makes], evidence };
  }

  let category = shelf?.category ?? null;
  let subcategory = shelf?.sub ?? null;
  if (category) evidence.push(`shelf: ${lookupPath}`);

  /* ── the second opinion ── */
  const standsOn = shelvesOf(p.slug);
  if (category && standsOn.size && !standsOn.has(category)) {
    if (standsOn.size === 1) {
      // One shelf, and it is not the one the breadcrumb showed. Theirs wins:
      // a listing page is a deliberate placement, a breadcrumb is whichever
      // path the page happened to render.
      const [only] = standsOn.values();
      evidence.push(`breadcrumb said ${category}, but they list it under "${only.name}"`);
      category = only.category;
      subcategory = only.sub;
    } else {
      // Two shelves, neither of them the breadcrumb's. Their own title
      // decides, if it names one of the two outright.
      const named = TYPE_WORDS.find(([re, cat]) => standsOn.has(cat) && re.test(p.title));
      if (named) {
        const chosen = standsOn.get(named[1]);
        evidence.push(`on ${standsOn.size} of their shelves; the title says ${named[1]}`);
        category = chosen.category;
        subcategory = chosen.sub;
      } else {
        /*
         * Their breadcrumb and their category pages disagree, and the title
         * settles nothing. The breadcrumb stays — it is their primary filing
         * of the article — but the article is flagged, so the office sees it
         * in the CRM instead of it passing silently.
         */
        needsCheck = `staat ook op hun ${[...standsOn.keys()].join(' en ')}-plank`;
        evidence.push(`also on their ${[...standsOn.keys()].join(' / ')} shelves`);
      }
    }
  } else if (category && standsOn.has(category)) {
    evidence.push('their own category page lists it here too');
  }

  /* No breadcrumb, but they do list it somewhere. */
  if (!category && standsOn.size === 1) {
    const [only] = standsOn.values();
    category = only.category;
    subcategory = only.sub;
    evidence.push(`listed on their "${only.name}" shelf`);
  }

  /*
   * No usable breadcrumb — a manufacturer landing page, the clearance shelf,
   * or no crumb at all. Their "Kategorie" field is the same taxonomy written
   * out, so try that before giving up.
   */
  if (!category && p.categoryField) {
    const byField = Object.entries(AKEY_PATHS).find(
      ([key, value]) => value.category && key.split(' > ').at(-1) === p.categoryField
    );
    if (byField) {
      category = byField[1].category;
      subcategory = byField[1].sub;
      evidence.push(`Kategorie field: ${p.categoryField}`);
    }
  }

  /*
   * Last resort, and only for an article they file nowhere at all: 76 of them,
   * mostly locksmith tools that hang off no category page. The words below are
   * unambiguous in this trade — a Fräser is a cutter and nothing else — but a
   * word is still weaker evidence than a shelf, so everything filed this way
   * is flagged for the office rather than passing silently.
   */
  if (!category) {
    const guess = LAST_RESORT.find(([re]) => re.test(p.title));
    if (guess) {
      category = guess[1];
      subcategory = guess[2];
      needsCheck = 'categorie afgeleid uit de titel — controleren';
      evidence.push(`no shelf; the title says ${guess[1]}`);
    }
  }

  if (!category) {
    return {
      status: 'review',
      reason: shelfCrumbs.length ? `shelf "${lookupPath}" holds mixed goods` : 'no category on their page',
      path: lookupPath,
      makes: [...makes],
      evidence,
    };
  }

  /* ── narrowing ── */
  const text = textOf(p);
  for (const rule of REFINEMENTS) {
    if (rule.from === category && rule.when(p, text)) {
      category = rule.to;
      subcategory = rule.sub;
      evidence.push(rule.why);
      break;
    }
  }

  /*
   * The check that stops a board landing among the transponders: if the
   * article's own text says it is something this category explicitly is not,
   * the filing is wrong however confident the breadcrumb was.
   */
  const forbidden = (CATEGORIES[category].isNot ?? []).find((re) => re.test(p.title));
  if (forbidden) {
    return {
      status: 'conflict',
      category,
      subcategory,
      makes: [...makes],
      reason: `filed under ${category}, but the title matches ${forbidden}`,
      path: lookupPath,
      evidence,
    };
  }

  return { status: 'filed', category, subcategory, makes: [...makes], evidence, needsCheck };
}

/* ── run ─────────────────────────────────────────────────────────────── */

const filed = {};
const review = [];
const conflicts = [];
const unmapped = new Map();

for (const p of products) {
  const result = classify(p);
  if (result.status === 'unmapped') {
    unmapped.set(result.path, (unmapped.get(result.path) ?? 0) + 1);
    review.push({ slug: p.slug, title: p.title, reason: `unmapped shelf: ${result.path}`, ...result });
    continue;
  }
  if (result.status === 'review') {
    review.push({ slug: p.slug, title: p.title, ...result });
    continue;
  }
  if (result.status === 'conflict') {
    conflicts.push({ slug: p.slug, title: p.title, ...result });
    continue;
  }
  filed[p.slug] = result;
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      classifiedAt: new Date().toISOString(),
      counts: { filed: Object.keys(filed).length, review: review.length, conflicts: conflicts.length },
      filed,
      review,
      conflicts,
    },
    null,
    1
  )}\n`
);

/* ── report ──────────────────────────────────────────────────────────── */

const byCategory = {};
for (const r of Object.values(filed)) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;

console.log(`${products.length} articles read (${listings} listing pages skipped)\n`);
for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${CATEGORIES[category].label}`);
}
console.log(`\n  filed      ${Object.keys(filed).length}`);
console.log(`  review     ${review.length}`);
console.log(`  conflicts  ${conflicts.length}`);
console.log(`  with make  ${Object.values(filed).filter((r) => r.makes.length).length}`);

if (unmapped.size) {
  console.log(`\n${unmapped.size} shelves of theirs are not in scripts/taxonomy.mjs:`);
  for (const [p, n] of [...unmapped].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${p}`);
  console.log('\nMap every one of them, then run again. Nothing is filed by guesswork.');
  process.exitCode = 1;
}

if (conflicts.length) {
  console.log(`\n${conflicts.length} conflicts — the shelf and the article disagree:`);
  conflicts.slice(0, 15).forEach((c) => console.log(`  ${c.slug}\n    ${c.reason}`));
}
