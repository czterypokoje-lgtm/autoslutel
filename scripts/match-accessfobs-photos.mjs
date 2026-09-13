/**
 * Match our watermarked A-Key products to clean AccessFobs photos.
 *
 *   node scripts/match-accessfobs-photos.mjs
 *   -> src/data/accessfobs-photo-matches.json
 *
 * Generalizes extract-keycase-photos.mjs, which only ever matched 12 of 298
 * housings because it only looked at the 124-item key-cases subset already
 * extracted as separate products. The full AccessFobs scrape (still in git at
 * efdc229, "the brother's webshop backup") has 2,093 products and 1,104 with
 * a photo actually on disk — most of them remotes and fobs, not just cases.
 *
 * Same matching discipline as before, unchanged: blade profile is the
 * strongest signal, make must also agree always, shape must agree where
 * either side names one, and button count is a bonus, never a requirement on
 * its own. A wrong photo is worse than a watermarked one — a customer orders
 * on the picture.
 *
 * Also fixes a real bug: extract-keycase-photos.mjs's own output
 * (keycase-photos.json) was never read by build-catalog.mjs. Its 12 matches
 * never actually reached the live site. This script's output — and that
 * older file's — are both wired in by build-catalog.mjs now.
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';

const OUT = path.join(process.cwd(), 'src/data/accessfobs-photo-matches.json');
const CATALOG = path.join(process.cwd(), 'src/lib/catalog.json');

/*
 * "sleutelbaarden" is bare key-blade profiles (schluesselblatt) — a
 * physically different product, photographed alone, never as an assembled
 * remote. Matching it against a remote/fob photo would be exactly the
 * wrong-photo mistake this script exists to avoid, so it stays out.
 *
 * "smart-keys" also stays out of automatic matching: a QA pass caught a
 * "smart key" AccessFobs listing whose actual photo showed a mechanical flip
 * key, not a proximity fob — their own title said "smart" for a shape that
 * wasn't. "Smart" vs "flip" is the single hardest shape distinction to trust
 * from text alone, since a shared blade code (HU66 etc.) is common to both
 * across the VAG family. Left for manual review instead of guessed at.
 */
const CATEGORIES = ['behuizingen', 'afstandsbedieningen', 'universal-remotes'];

function readAccessFobs() {
  const raw = execFileSync('git', ['show', 'efdc229:src/lib/scraped_products.json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

const stripTags = (html) =>
  (html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

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

function readButtons(text) {
  const hit = text.match(/\b([1-6])\s*[-\s]?\s*(?:button|buttons|knops|knop|tasten)\b/i);
  return hit ? Number(hit[1]) : null;
}

function readShape(text) {
  if (/\bflip|klapp?|klap\b/i.test(text)) return 'flip';
  if (/\bsmart\s?key|keyless|proximity|card|karte\b/i.test(text)) return 'smart';
  return 'fixed';
}

/*
 * Only an assembled key/remote/fob/case photographs as one — a bare blade, a
 * pick set, a decoder or a diagnostic tool can mention the same blade code in
 * its compatibility text without being a picture of the same kind of thing.
 * The first match run before this filter swapped a lock-pick set's photo
 * onto an Opel housing because both mentioned "HU43" — exactly the wrong-
 * photo mistake this whole approach exists to avoid.
 */
const NOT_A_KEY_PHOTO = /\b(pick\s?set|decoder|programmer|tool|machine|cutter|blank\s?stock|lock\s?barrel|ignition\s?lock|cylinder)\b/i;
const IS_A_KEY_PHOTO = /\b(remote|fob|key|shell|case|housing)\b/i;

function looksLikeKeyPhoto(title) {
  // A bare uncut blade — "Blade for …", "175 x Key Blades for …" — is not a
  // photo of an assembled remote/fob/case, even when the title says "Key".
  if (/^blade\b/i.test(title.trim())) return false;
  if (/\bkey\s*blades?\b/i.test(title)) return false;
  if (NOT_A_KEY_PHOTO.test(title)) return false;
  return IS_A_KEY_PHOTO.test(title);
}

/* ── the AccessFobs side: every item with a photo actually on disk ─────── */

const candidates = readAccessFobs()
  .filter((p) => p.imageLocalPath && existsSync(path.join(process.cwd(), 'public', p.imageLocalPath.replace(/^\//, ''))))
  .filter((p) => looksLikeKeyPhoto(p.title ?? ''))
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
  .filter((c) => c.blades.length && c.makes.length); // useless as a match source otherwise

console.log(`${candidates.length} AccessFobs photos usable as match candidates`);

/* ── our side ────────────────────────────────────────────────────────── */

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const targets = catalog.products.filter(
  // Already-clean AccessFobs-sourced products (the 124-item extraction) need
  // nothing swapped — matching them against another AccessFobs photo would
  // only risk replacing a correct photo with a different, unverified one.
  (p) => CATEGORIES.includes(p.category) && p.manufacturer !== 'AccessFobs'
);
console.log(`${targets.length} products in the affected categories`);

function score(product, candidate) {
  const text = `${product.title} ${product.titleNl} ${product.descriptionNl}`;
  const ourBlades = [
    ...new Set([
      ...(product.blade ? [normBlade(product.blade)] : []),
      ...((text.match(BLADE) ?? []).map(normBlade)),
    ]),
  ];
  if (!ourBlades.length) return null;

  const bladeMatch = ourBlades.some((b) => candidate.blades.includes(b));
  if (!bladeMatch) return null;

  const ourMakes = product.makes?.length ? product.makes : readMakes(text);
  const makeMatch = candidate.makes.some((m) => ourMakes.includes(m));
  if (!makeMatch) return null;

  /*
   * A visual QA pass (every "high confidence" match opened and eyeballed
   * side by side) found the same failure repeated across several makes:
   * blade and make both agree, but one photo is a flip key and the other a
   * smart/proximity fob. It hit VW/Audi (HU66, HU100, HU162), Ford/Land
   * Rover (HU101), BMW (HU92R), Honda (HON66) and Toyota (TOY48) — a blade
   * code shared between a manufacturer's flip and smart product lines, which
   * neither catalogue's text reliably distinguishes. A CV-based "does this
   * photo show a visible blade" detector was tried and tuned through several
   * rounds (silver vs. brass blades, glare rings inflating the shape) and
   * still both missed real mismatches and flagged good ones — not reliable
   * enough to trust unattended. These codes are excluded outright instead of
   * guessed at; every other code visually checked out clean across the
   * sample and stays eligible.
   */
  const AMBIGUOUS_BLADES = new Set(['HU66', 'HU100', 'HU162', 'HU101', 'HON66', 'TOY48']);
  const matchedBlade = ourBlades.find((b) => candidate.blades.includes(b));
  if (AMBIGUOUS_BLADES.has(matchedBlade)) return null;

  /*
   * BMW hit this same flip-vs-smart mismatch on three separate blade codes
   * (HU92R, HU92, HU58) during QA — not one bad code, a systemic pattern for
   * this make. Excluded outright rather than enumerating every BMW code one
   * mismatch at a time.
   */
  if (ourMakes.includes('BMW')) return null;

  const ourShape = readShape(text);
  if (candidate.shape !== ourShape && candidate.shape !== 'fixed' && ourShape !== 'fixed') return null;

  const ourButtons = product.buttons ?? readButtons(text);
  const buttonMatch = ourButtons != null && candidate.buttons != null && ourButtons === candidate.buttons;

  return {
    points: 10 + 5 /* make, always required */ + (buttonMatch ? 3 : 0),
    reason: [
      `blade ${ourBlades.find((b) => candidate.blades.includes(b))}`,
      'make',
      buttonMatch ? `${ourButtons} buttons` : null,
    ].filter(Boolean).join(' + '),
  };
}

const map = {};
let matched = 0;

for (const product of targets) {
  let best = null;
  for (const candidate of candidates) {
    const result = score(product, candidate);
    if (result && (!best || result.points > best.points)) best = { ...result, candidate };
  }
  if (!best || best.points < 15) continue;

  map[product.slug] = {
    image: best.candidate.image,
    from: best.candidate.title,
    matchedOn: best.reason,
    confidence: best.points >= 18 ? 'high' : 'medium',
  };
  matched++;
}

writeFileSync(OUT, `${JSON.stringify(map, null, 1)}\n`);

const high = Object.values(map).filter((m) => m.confidence === 'high').length;
console.log(`\n${matched} products matched to a clean photo (${high} high confidence)`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
console.log('\nSample:');
for (const [slug, m] of Object.entries(map).slice(0, 15)) {
  console.log(`  ${slug.slice(0, 46).padEnd(48)} ${m.matchedOn.padEnd(28)} ${m.from.slice(0, 45)}`);
}
