#!/usr/bin/env node
/**
 * Builds src/data/keyforcars-profiles.json: one product profile per SKU across
 * remkeys.com, keyforcars.nl and klapsleutels.nl.
 *
 *   node scripts/build-profiles.mjs [path/to/woocommerce-export.csv]
 *
 * remkeys.com is the source for specs and the vehicle list; the Dutch name and
 * shop links come from the other two. The optional CSV is a WooCommerce
 * product export (Products → Export); its SKU and GTIN/EAN columns give the
 * 13-digit numbers printed on the drawer labels.
 *
 * Only the public Store API is read: no keys, nothing written to the shops.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOPS = ['remkeys.com', 'keyforcars.nl', 'klapsleutels.nl'];
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'keyforcars-profiles.json');
const SPEC_NAMES = [
  'Brands', 'Product Type', 'Remote Key Type', 'Remote Style', 'Transponder Key Style', 'Buttons', 'Frequency',
  'Transponder', 'Key Profile (SILCA)', 'Keyless Go', 'Battery', 'Panic', 'Color', 'Condition', 'Manufacturer',
];
/** remkeys abbreviates some makes in its vehicle lists. */
const MAKES = { REN: 'Renault', DAC: 'Dacia', VW: 'Volkswagen', MB: 'Mercedes-Benz', MERC: 'Mercedes-Benz' };

const text = (html = '') => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#8211;|&ndash;/g, '–').replace(/&#8217;/g, '’').replace(/&amp;/g, '&').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/\s+/g, ' ').trim();

async function products(shop) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const response = await fetch(`https://${shop}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'KeyForCars-Inventory profile builder' },
    });
    if (!response.ok) throw new Error(`${shop} page ${page}: HTTP ${response.status}`);
    const batch = await response.json();
    all.push(...batch);
    const pages = Number(response.headers.get('x-wp-totalpages') ?? 1);
    process.stdout.write(`\r${shop}: page ${page}/${pages}`);
    if (page >= pages || !batch.length) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  process.stdout.write('\n');
  return all;
}

/**
 * The vehicle list is free text after "Suitable for ...". Each line keeps its
 * original wording; the first and second year on it become a range so a search
 * for "punto 2001" can match "Fiat Punto 1995-2003". An open end ("2005- ")
 * stays open. Lines without a year (key code ranges, notes) are kept as text.
 */
export function parseFits(html) {
  const start = html.search(/suitable for|geschikt voor/i);
  if (start < 0) return [];
  const tail = html.slice(start);
  const end = tail.search(/<strong>\s*(?:⚠️\s*)?(?:note|let op|opmerking)|product code:|productcode:|disclaimer|if you would like/i);
  const lines = (end > 0 ? tail.slice(0, end) : tail)
    .split(/<br\s*\/?>|<\/p>|<\/li>/i)
    .map(text)
    .filter((line) => line && !/^(?:suitable for|geschikt voor)/i.test(line) && !/^:/.test(line));
  return lines.slice(0, 200).map((line) => {
    const years = [...line.matchAll(/(?:\d{1,2}\.)?(?:\d{1,2}\.)?((?:19|20)\d\d)/g)].map((match) => Number(match[1]));
    const cut = line.search(/\(?\s*(?:\d{1,2}\.)?(?:\d{1,2}\.)?(?:19|20)\d\d/);
    let vehicle = (cut > 0 ? line.slice(0, cut) : line).replace(/[(\s–-]+$/, '').trim();
    const [first, ...rest] = vehicle.split(' ');
    if (MAKES[first?.toUpperCase()]) vehicle = [MAKES[first.toUpperCase()], ...rest].join(' ');
    const open = /(?:19|20)\d\d\s*[-–]\s*\)?\s*$/.test(line);
    return { text: line, vehicle, from: years[0] ?? null, to: years[1] ?? (open ? null : years[0] ?? null) };
  });
}

const CHIP = /\b(ID\s?\d{2}[A-Z]?|PCF\s?79\d{2}[A-Z]*|HITAG\s?(?:2|3|AES|PRO)|MEGAMOS(?:\s(?:CRYPTO|AES))?|4D[\s-]?\d{2}|DST\s?(?:80|AES)|TEXAS\sCRYPTO|(?:H|8A)[\s-]chip)\b/gi;
const BLADE = /(?:keyblade|sleutelbaard|baard|blade|silca(?:\sreferen(?:ce|tie))?|profiel|profile)\s*(?:\([^)]*\))?\s*:\s*([A-Z]{2,5}\d{1,3}[A-Z0-9]{0,4})\b/gi;
const NO_BLADE = new Set(['None', 'Unknown', 'Emergency Keyblade']);
const unique = (values) => [...new Set(values.filter(Boolean))];

/**
 * The facts a warehouse hand checks first: what kind of part, which chip,
 * frequency, key blade and buttons. Taken from remkeys attributes where they
 * exist and otherwise from the product names and descriptions of all shops.
 * A housing lists the chip and blade it takes, not ones it contains.
 */
function facts(entry) {
  const specs = new Map(entry.specs ?? []);
  const all = entry.texts.join(' \n ');
  const name = `${entry.name ?? ''} ${entry.nameNl ?? ''}`;
  const chips = unique([...all.matchAll(CHIP)].map((match) => match[1].toUpperCase().replace(/\s+/g, ' ').replace(/^(ID|PCF|DST|4D)[\s-]?/, '$1').replace(/^HITAG\s(?=[23]$)/, 'HITAG')));
  const frequency = unique([
    ...(specs.get('Frequency') ?? '').split(',').map((value) => value.trim().replace(/^(\d{3})\s?mhz$/i, '$1 MHz')),
    ...[...all.matchAll(/\b(\d{3})\s?mhz\b/gi)].map((match) => `${match[1]} MHz`),
  ]);
  const silca = specs.get('Key Profile (SILCA)');
  const blade = unique([
    ...(silca && !NO_BLADE.has(silca) ? silca.split(',').map((value) => value.trim()) : []),
    ...[...all.matchAll(BLADE)].map((match) => match[1].toUpperCase()),
  ]);
  const buttonMatch = name.match(/(\d)\s?(?:knops|knoppen|btn|buttons?|toetsen)/i);
  const buttons = specs.get('Buttons') ?? (buttonMatch ? `${buttonMatch[1]} knoppen` : '');
  const kind = /behuizing|\bcase\b|shell|cover|sleutelhuis/i.test(name) ? 'Behuizing'
    : /^\s*(?:ID\s?\d|PCF|megamos|hitag)/i.test(name) ? 'Transponderchip'
    : /transponder\s?(?:sleutel|key)/i.test(name) ? 'Transpondersleutel'
    : /afstandsbediening|remote|klapsleutel|klapsluetel|smart\s?key|keyless|sleutel/i.test(name) ? 'Sleutel / afstandsbediening'
    : '';
  return { kind, chips: chips.slice(0, 6), frequency: frequency.slice(0, 4), blade: blade.slice(0, 4), buttons };
}

function csvRows(source) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

/** SKU → EAN numbers from a WooCommerce export, whichever column holds them. */
function eansFrom(path) {
  const [head, ...rows] = csvRows(readFileSync(path, 'utf8').replace(/^﻿/, ''));
  const skuColumn = head.findIndex((name) => /^sku$/i.test(name.trim()));
  const eanColumns = head.map((name, index) => (/gtin|ean|barcode|upc/i.test(name) ? index : -1)).filter((index) => index >= 0);
  if (skuColumn < 0 || !eanColumns.length) throw new Error(`No SKU or GTIN/EAN column in ${path}. Columns: ${head.join(', ')}`);
  const map = new Map();
  for (const row of rows) {
    const sku = row[skuColumn]?.trim().toUpperCase();
    const eans = eanColumns.map((index) => row[index]?.replace(/\D/g, '')).filter((value) => value && /^\d{8,14}$/.test(value));
    if (sku && eans.length) map.set(sku, [...new Set([...(map.get(sku) ?? []), ...eans])]);
  }
  return map;
}

const bySku = new Map();
for (const shop of SHOPS) {
  for (const product of await products(shop)) {
    const sku = product.sku?.trim().toUpperCase();
    if (!sku) continue;
    const entry = bySku.get(sku) ?? { sku, links: [], texts: [], descriptions: [] };
    entry.links.push({ shop, url: product.permalink });
    entry.image ??= product.images?.[0]?.thumbnail ?? product.images?.[0]?.src ?? '';
    entry.imageLarge ??= product.images?.[0]?.src ?? '';
    entry.texts.push(`${text(product.name)} ${text(product.short_description)} ${text(product.description)}`);
    entry.descriptions.push(product.description ?? '');
    if (shop === 'remkeys.com') {
      entry.name = text(product.name);
      const specs = new Map((product.attributes ?? []).map((attribute) => [attribute.name, attribute.terms.map((term) => text(term.name)).join(', ')]));
      entry.brand = specs.get('Brands') ?? '';
      entry.specs = SPEC_NAMES.filter((name) => specs.get(name)).map((name) => [name, specs.get(name)]);
      entry.fits = parseFits(product.description ?? '');
    } else {
      entry.nameNl ??= text(product.name).replace(/\s*[–—-]\s*$/, '');
    }
    bySku.set(sku, entry);
  }
}

const eans = process.argv[2] ? eansFrom(process.argv[2]) : new Map();
const profiles = [...bySku.values()].map((entry) => ({
  sku: entry.sku,
  name: entry.name ?? entry.nameNl ?? entry.sku,
  nameNl: entry.nameNl ?? '',
  image: entry.image ?? '',
  imageLarge: entry.imageLarge ?? entry.image ?? '',
  brand: entry.brand ?? '',
  facts: facts(entry),
  specs: entry.specs ?? [],
  // remkeys first; a product only on the Dutch shops takes its "Geschikt voor" list.
  fits: entry.fits?.length ? entry.fits : entry.descriptions.map(parseFits).find((fits) => fits.length) ?? [],
  links: entry.links,
  ean: eans.get(entry.sku) ?? [],
})).sort((a, b) => a.sku.localeCompare(b.sku));

writeFileSync(OUT, `${JSON.stringify(profiles)}\n`);
const withFits = profiles.filter((profile) => profile.fits.length).length;
const withEan = profiles.filter((profile) => profile.ean.length).length;
console.log(`${profiles.length} profiles → ${OUT}`);
console.log(`with vehicle list: ${withFits} · without remkeys data: ${profiles.filter((profile) => !profile.specs.length).length} · with EAN: ${withEan}`);
