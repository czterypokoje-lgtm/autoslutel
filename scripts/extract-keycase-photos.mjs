/**
 * Match our key housings to the AccessFobs key-case photos we already hold.
 *
 *   node scripts/extract-keycase-photos.mjs
 *   -> src/data/keycase-photos.json
 *
 * Why: every A-Key photo carries their watermark across the middle of the
 * product. The earlier AccessFobs scrape — the "brother's webshop backup",
 * still in git at efdc229 — brought 124 key-case photos that are clean, and
 * the files are already in public/images/products as key-cases_*.jpg.
 *
 * The two catalogues describe the same physical parts, so a match has to be
 * made on what the part *is*, never on the wording of a title. Three things
 * decide it, in this order:
 *
 *   blade profile   HU101, VA2, SIP22 — the strongest signal by far. Two
 *                   housings with the same blade take the same key.
 *   make            Ford, Opel, Volkswagen …
 *   button count    3-knops is not 2-knops.
 *
 * A photo is only swapped when the blade matches and either the make or the
 * button count agrees as well. Showing the wrong housing is worse than
 * showing a watermarked one: a customer orders on the picture.
 *
 * Run scripts/build-catalog.mjs afterwards — it reads the map this writes.
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';

const OUT = path.join(process.cwd(), 'src/data/keycase-photos.json');
const CATALOG = path.join(process.cwd(), 'src/lib/catalog.json');

/** The AccessFobs scrape, read straight out of the commit that carried it. */
function readAccessFobs() {
  const raw = execFileSync('git', ['show', 'efdc229:src/lib/scraped_products.json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

const stripTags = (html) =>
  (html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Blade profiles as both catalogues write them: HU101, VA2, SIP22, TOY43. */
const BLADE = /\b(HU\s?\d{2,3}[A-Z]?|VA\d[A-Z]?|VAC\d{1,3}[A-Z]?|SIP\s?\d{2}|TOY\s?\d{2}[A-Z]?|NSN\d{2}|GT\d{2}|YM\d{2}[A-Z]?|KIA\d[A-Z]?|HY\d{2}[A-Z]?|CY\d{2}|FO\d{2}[A-Z]?|MAZ\d{2}|SX\d|B111|DAT\d{2}|HON\d{2}|NE\d{2}|SSY\d{2})\b/gi;

const normBlade = (value) => (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const MAKES = [
  ['Volkswagen', /\b(volkswagen|vw)\b/i], ['Audi', /\baudi\b/i], ['Seat', /\bseat\b/i],
  ['Škoda', /\b(skoda|škoda)\b/i], ['Ford', /\bford\b/i], ['Opel', /\b(opel|vauxhall)\b/i],
  ['Renault', /\brenault\b/i], ['Dacia', /\bdacia\b/i], ['Peugeot', /\bpeugeot\b/i],
  ['Citroën', /\b(citroen|citroën)\b/i], ['Fiat', /\bfiat\b/i], ['BMW', /\bbmw\b/i],
  ['Mini', /\bmini\b/i], ['Mercedes-Benz', /\b(mercedes|benz)\b/i], ['Toyota', /\btoyota\b/i],
  ['Lexus', /\blexus\b/i], ['Honda', /\bhonda\b/i], ['Hyundai', /\bhyundai\b/i],
  ['Kia', /\bkia\b/i], ['Nissan', /\bnissan\b/i], ['Mazda', /\bmazda\b/i],
  ['Suzuki', /\bsuzuki\b/i], ['Mitsubishi', /\bmitsubishi\b/i], ['Volvo', /\bvolvo\b/i],
  ['Jeep', /\bjeep\b/i], ['Land Rover', /\b(land\s?rover|range\s?rover)\b/i],
  ['Jaguar', /\bjaguar\b/i], ['Porsche', /\bporsche\b/i], ['Alfa Romeo', /\balfa\b/i],
  ['Chevrolet', /\bchevrolet\b/i], ['Smart', /\bsmart\b/i], ['Subaru', /\bsubaru\b/i],
  ['SsangYong', /\bssangyong\b/i], ['Saab', /\bsaab\b/i], ['Chrysler', /\bchrysler\b/i],
];

const readMakes = (text) => MAKES.filter(([, re]) => re.test(text)).map(([m]) => m);

/** "3 button", "2-knops", "3 Tasten". */
function readButtons(text) {
  const hit = text.match(/\b([1-6])\s*[-\s]?\s*(?:button|buttons|knops|knop|tasten)\b/i);
  return hit ? Number(hit[1]) : null;
}

/** A flip key is not a fixed one, whatever else matches. */
function readShape(text) {
  if (/\bflip|klapp?|klap\b/i.test(text)) return 'flip';
  if (/\bsmart\s?key|keyless|proximity\b/i.test(text)) return 'smart';
  if (/\bcard|karte\b/i.test(text)) return 'card';
  return 'fixed';
}

/* ── the AccessFobs side ─────────────────────────────────────────────── */

const cases = readAccessFobs()
  .filter((p) => String(p.imageLocalPath ?? '').includes('key-cases_'))
  .map((p) => {
    const text = `${p.title} ${stripTags(p.description)}`;
    return {
      title: p.title,
      image: p.imageLocalPath,
      blades: [...new Set((text.match(BLADE) ?? []).map(normBlade))],
      makes: readMakes(text),
      buttons: readButtons(text),
      shape: readShape(text),
    };
  })
  // A photo we no longer hold is no use to anyone.
  .filter((c) => existsSync(path.join(process.cwd(), 'public', c.image)));

console.log(`${cases.length} AccessFobs key cases, photos present on disk`);
console.log(`  with a blade profile: ${cases.filter((c) => c.blades.length).length}`);
console.log(`  with a make:          ${cases.filter((c) => c.makes.length).length}`);

/* ── our side ────────────────────────────────────────────────────────── */

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const housings = catalog.products.filter((p) => p.category === 'behuizingen');

console.log(`\n${housings.length} housings in the catalogue`);

function score(housing, candidate) {
  const text = `${housing.title} ${housing.titleNl} ${housing.descriptionNl}`;
  const ourBlades = [
    ...new Set([
      ...(housing.blade ? [normBlade(housing.blade)] : []),
      ...((text.match(BLADE) ?? []).map(normBlade)),
    ]),
  ];

  // Blade agreement is the whole basis; without it there is no match.
  const bladeMatch = ourBlades.some((b) => candidate.blades.includes(b));
  if (!bladeMatch) return null;

  const makeMatch = candidate.makes.some((m) => housing.makes.includes(m));
  const ourButtons = housing.buttons ?? readButtons(text);
  const buttonMatch =
    ourButtons != null && candidate.buttons != null && ourButtons === candidate.buttons;

  /*
   * Shape has to agree where it is visible. A flip housing photographed as a
   * fixed key is the wrong picture, and a proximity smart case looks nothing
   * like a blade key — our German titles rarely name the shape, so the guard
   * rejects rather than assumes.
   */
  const ourShape = readShape(text);
  if (candidate.shape !== ourShape && candidate.shape !== 'fixed') return null;

  /*
   * The make has to agree, always.
   *
   * Blade plus button count alone crossed brands: a Citroën housing was
   * matched to a Renault Trafic case because both take an NE73 and both are
   * two-button. The blade says the key fits the lock, not that the housing is
   * the same shape.
   */
  if (!makeMatch) return null;

  return {
    points: 10 + (makeMatch ? 5 : 0) + (buttonMatch ? 3 : 0),
    reason: [
      `blade ${ourBlades.find((b) => candidate.blades.includes(b))}`,
      makeMatch ? 'make' : null,
      buttonMatch ? `${ourButtons} buttons` : null,
    ].filter(Boolean).join(' + '),
  };
}

const map = {};
let matched = 0;

for (const housing of housings) {
  let best = null;

  for (const candidate of cases) {
    const result = score(housing, candidate);
    if (result && (!best || result.points > best.points)) {
      best = { ...result, candidate };
    }
  }

  // Blade alone is not enough; the scorer already requires make or buttons.
  if (!best || best.points < 15) continue;

  map[housing.slug] = {
    image: best.candidate.image,
    from: best.candidate.title,
    matchedOn: best.reason,
    confidence: best.points >= 18 ? 'high' : 'medium',
  };
  matched++;
}

writeFileSync(OUT, `${JSON.stringify(map, null, 1)}\n`);

const high = Object.values(map).filter((m) => m.confidence === 'high').length;
console.log(`\n${matched} housings matched to a clean photo (${high} high confidence)`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
console.log('\nSample:');
for (const [slug, m] of Object.entries(map).slice(0, 8)) {
  console.log(`  ${slug.slice(0, 46).padEnd(48)} ${m.matchedOn.padEnd(28)} ${m.from.slice(0, 40)}`);
}
