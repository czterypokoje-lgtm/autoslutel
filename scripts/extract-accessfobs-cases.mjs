/**
 * The AccessFobs key cases, as products of their own.
 *
 *   node scripts/extract-accessfobs-cases.mjs
 *   -> src/data/accessfobs-key-cases.json
 *
 * We hold two ranges of key housings: A-Key's, whose photos carry their
 * watermark, and these 124 from the AccessFobs scrape — clean photos, English
 * descriptions that name the cars, the blade and the button count, and the
 * files already on disk as public/images/products/key-cases_*.jpg.
 *
 * scripts/extract-keycase-photos.mjs could only lend a photo to 12 of A-Key's
 * 298 housings, because a photo may only be moved when the part is provably
 * the same. Listing them as their own products has no such limit: both ranges
 * stand side by side, each with its own photo and its own description, and it
 * is visible which is which.
 *
 * Read out of the commit that carried the scrape rather than re-downloaded —
 * the data has not changed and their server does not need the traffic.
 */

import { writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';

const SOURCE_COMMIT = 'efdc229';
const OUT = path.join(process.cwd(), 'src/data/accessfobs-key-cases.json');

const raw = execFileSync('git', ['show', `${SOURCE_COMMIT}:src/lib/scraped_products.json`], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

const stripTags = (html) =>
  (html ?? '')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/(p|div|ul|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const BLADE =
  /\b(HU\s?\d{2,3}[A-Z]?|VA\d[A-Z]?|VAC\d{1,3}[A-Z]?|SIP\s?\d{2}|TOY\s?\d{2}[A-Z]?|NSN\d{2}|GT\d{2}|YM\d{2}[A-Z]?|KIA\d[A-Z]?|HY\d{2}[A-Z]?|CY\d{2}|FO\d{2}[A-Z]?|MAZ\d{2}|SX\d|B111|HON\d{2}|NE\d{2}|SSY\d{2})\b/i;

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

/** "Ford Transit 2014-2020" — the models the description lists, verbatim. */
function readVehicles(lines) {
  const out = [];
  for (const line of lines) {
    const text = line.replace(/^•\s*/, '').trim();
    // A model line names a make and usually a year range; a sales sentence
    // does not.
    const make = MAKES.find(([, re]) => re.test(text));
    if (!make) continue;
    if (text.length > 60) continue;
    if (/compatible with|designed to|comes complete|please note/i.test(text)) continue;

    const model = text.replace(make[1], '').replace(/\s{2,}/g, ' ').trim();
    const years = model.match(/\b((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})?/);
    const name = model.replace(/\b(19|20)\d{2}\s*-?\s*((19|20)\d{2})?/g, '').trim();

    if (!name || name.length < 2) continue;
    out.push({
      make: make[0],
      model: name.replace(/[,;]+$/, ''),
      from: years ? Number(years[1]) : 0,
      to: years?.[2] ? Number(years[2]) : 9999,
    });
  }

  const seen = new Set();
  return out.filter((v) => {
    const key = `${v.make}|${v.model}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const products = JSON.parse(raw)
  .filter((p) => String(p.imageLocalPath ?? '').includes('key-cases_'))
  .filter((p) => existsSync(path.join(process.cwd(), 'public', p.imageLocalPath)))
  .map((p) => {
    const lines = stripTags(p.description);
    const text = `${p.title} ${lines.join(' ')}`;

    return {
      id: p.id,
      title: p.title,
      /** AccessFobs prices are in pounds — see the note in build-catalog. */
      priceGbp: Number(p.price) || null,
      image: p.imageLocalPath,
      blade: text.match(BLADE)?.[0]?.toUpperCase().replace(/\s+/g, '') ?? null,
      buttons: Number(text.match(/\b([1-6])\s*[-\s]?\s*button/i)?.[1]) || null,
      makes: MAKES.filter(([, re]) => re.test(text)).map(([m]) => m),
      vehicles: readVehicles(lines),
      /** The sales blurb is the same on all 124; only the facts are kept. */
      notes: lines.filter(
        (l) =>
          !/give your car key a fresh look|high-quality key cases|repair or replace the appearance/i.test(l)
      ),
    };
  });

writeFileSync(OUT, `${JSON.stringify({ source: 'accessfobs.co.uk/collections/key-cases', commit: SOURCE_COMMIT, products }, null, 1)}\n`);

console.log(`${products.length} AccessFobs key cases`);
console.log(`  with a blade:    ${products.filter((p) => p.blade).length}`);
console.log(`  with a make:     ${products.filter((p) => p.makes.length).length}`);
console.log(`  with models:     ${products.filter((p) => p.vehicles.length).length}`);
console.log(`  with buttons:    ${products.filter((p) => p.buttons).length}`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
