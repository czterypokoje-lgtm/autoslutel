/**
 * Three exports: one for the office, one for eBay, one for Amazon.
 *
 *   node scripts/export-catalogue.mjs
 *   -> exports/voorraad-en-producten.csv   the full list, for Excel
 *   -> exports/ebay-file-exchange.csv      eBay File Exchange
 *   -> exports/amazon-flat-file.txt        Amazon flat file (tab separated)
 *
 * All three are built from src/lib/catalog.json, so the numbers are the same
 * ones the shop shows. Semicolons and a byte-order mark on the Dutch file,
 * because that is what Excel opens without a wizard; the marketplace files
 * keep the delimiters those platforms require.
 *
 * What is deliberately left out, and why it matters before you upload:
 *
 *   • products without a price — 191 of them, and a marketplace listing with
 *     no price is a listing you cannot make
 *   • products without a photo — both platforms refuse them
 *   • trade-only lines, which are not for a public marketplace
 *
 * What you still have to supply yourself:
 *
 *   • EAN/GTIN. Neither A-Key nor we hold barcodes, and both platforms want
 *     one per listing. Amazon can waive it (GTIN exemption per brand), eBay
 *     accepts "Does not apply" for parts without one. Inventing numbers is
 *     not an option: an EAN belongs to whoever registered it.
 *   • real stock. Almost nothing is stock-tracked in the CRM, so the quantity
 *     column is what the CRM knows and blank where it knows nothing —
 *     never a number this script made up.
 *   • a public image URL. The columns point at IMAGE_BASE below; until the
 *     shop is deployed there, neither platform can fetch the photos.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'exports');

/** Where the photos will be publicly reachable. Override with SITE_URL=… */
const IMAGE_BASE = process.env.SITE_URL ?? 'https://www.autosleutel24.nl';

const catalog = JSON.parse(readFileSync(path.join(process.cwd(), 'src/lib/catalog.json'), 'utf8'));

/* ── pricing, the same rule the shop applies ─────────────────────────── */

const VAT_RATE = 0.21;
const MARGIN_TIERS = [
  { upTo: 5, multiplier: 3.0 },
  { upTo: 20, multiplier: 2.2 },
  { upTo: 50, multiplier: 1.8 },
  { upTo: 150, multiplier: 1.55 },
  { upTo: Infinity, multiplier: 1.35 },
];
const MIN_PRICE = 2.95;

function shelfPrice(cost) {
  if (cost == null || !Number.isFinite(cost)) return null;
  const tier = MARGIN_TIERS.find((t) => cost < t.upTo) ?? MARGIN_TIERS.at(-1);
  const gross = cost * tier.multiplier * (1 + VAT_RATE);
  return Math.max(MIN_PRICE, Math.round((Math.floor(gross) + 0.95) * 100) / 100);
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const CATEGORY_NAMES = {
  afstandsbedieningen: 'Afstandsbedieningen',
  behuizingen: 'Sleutelbehuizingen',
  printplaten: 'Printplaten (PCB)',
  transponders: 'Transponders',
  batterijen: 'Batterijen',
  sleutelbaarden: 'Sleutelbaarden',
  noodsleutels: 'Noodsleutels',
  'universal-remotes': 'Universele sleutels',
  'overige-sleutels': 'Overige sleutels',
  accessoires: 'Accessoires & gereedschap',
  gereedschap: 'Gereedschap',
  diensten: 'Diensten',
};

const clean = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/** One CSV field, quoted only when it has to be. */
const field = (value, delimiter) => {
  const text = clean(value);
  return new RegExp(`["\n\r${delimiter === '\t' ? '\\t' : delimiter}]`).test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
};

function toCsv(rows, headers, delimiter = ';', bom = false) {
  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(headers.map((h) => field(row[h], delimiter)).join(delimiter));
  }
  return (bom ? '﻿' : '') + lines.join('\r\n') + '\r\n';
}

const models = (p) =>
  (p.fitment ?? [])
    // "vanaf 2014", never "2014-nu": A-Key states a start year, not that the
    // part still fits a car built this year.
    .map((f) => {
      const years = f.from > 1950 ? (f.to && f.to < 9000 ? ` ${f.from}-${f.to}` : ` vanaf ${f.from}`) : '';
      return `${f.make} ${f.model}${years}`;
    })
    .join(' | ');

const imageUrl = (p) =>
  p.image && !p.image.includes('placeholder') ? `${IMAGE_BASE}${p.image}` : '';

/** What the CRM knows about stock — blank when it tracks nothing. */
const stockOf = () => '';

mkdirSync(OUT_DIR, { recursive: true });

/* ── 1. the office list ──────────────────────────────────────────────── */

const OFFICE_HEADERS = [
  'Artikelcode', 'Titel', 'Categorie', 'Subcategorie', 'Automerken', 'Past op modellen',
  'Sleutelbaard', 'Frequentie', 'Transponder', 'Knoppen', 'Fabrikant', 'Leverancier',
  'Inkoop (€)', 'Verkoop incl. btw (€)', 'Marge (€)', 'Voorraad', 'Foto', 'Webshop-URL', 'Status',
];

const officeRows = catalog.products.map((p) => {
  const sell = shelfPrice(p.costPrice);
  return {
    Artikelcode: p.articleCode ?? p.id,
    Titel: p.titleNl,
    Categorie: CATEGORY_NAMES[p.category] ?? p.category ?? '',
    Subcategorie: p.subcategory ?? '',
    Automerken: (p.makes ?? []).join(', '),
    'Past op modellen': models(p),
    Sleutelbaard: p.blade ?? '',
    Frequentie: p.frequency ?? '',
    Transponder: p.chip ?? '',
    Knoppen: p.buttons ?? '',
    Fabrikant: p.manufacturer ?? '',
    Leverancier: p.supplier ?? '',
    'Inkoop (€)': p.costPrice != null ? p.costPrice.toFixed(2).replace('.', ',') : '',
    'Verkoop incl. btw (€)': sell != null ? sell.toFixed(2).replace('.', ',') : '',
    'Marge (€)': sell != null && p.costPrice != null
      ? (sell / (1 + VAT_RATE) - p.costPrice).toFixed(2).replace('.', ',')
      : '',
    Voorraad: stockOf(p),
    Foto: imageUrl(p),
    'Webshop-URL': `${IMAGE_BASE}/webshop/product/${p.slug}`,
    Status: p.costPrice == null ? 'PRIJS ONTBREEKT' : p.audience === 'trade' ? 'alleen vakhandel' : 'actief',
  };
});

writeFileSync(
  path.join(OUT_DIR, 'voorraad-en-producten.csv'),
  toCsv(officeRows, OFFICE_HEADERS, ';', true)
);

/* ── what may go to a marketplace ────────────────────────────────────── */

const sellable = catalog.products.filter(
  (p) => p.audience === 'public' && p.costPrice != null && imageUrl(p)
);

/* ── 2. eBay File Exchange ───────────────────────────────────────────── */

const EBAY_HEADERS = [
  '*Action(SiteID=Netherlands|Country=NL|Currency=EUR|Version=1193)',
  'CustomLabel', '*Category', '*Title', 'Subtitle', '*Description', 'PicURL',
  '*Quantity', '*StartPrice', '*ConditionID', '*Format', '*Duration',
  '*Location', 'ShippingType', 'ShippingService-1:Option', 'ShippingService-1:Cost',
  'C:Brand', 'C:Manufacturer Part Number', 'C:Type', 'Product:EAN',
];

const ebayRows = sellable.map((p) => ({
  '*Action(SiteID=Netherlands|Country=NL|Currency=EUR|Version=1193)': 'Add',
  CustomLabel: p.articleCode ?? p.id,
  // eBay's own category id — theirs, not ours, and it has to be filled in per
  // range before upload. 'Autosleutels' sits under Auto-onderdelen.
  '*Category': '',
  '*Title': clean(p.titleNl).slice(0, 80),
  Subtitle: '',
  '*Description': clean(p.descriptionNl),
  PicURL: imageUrl(p),
  '*Quantity': stockOf(p),
  '*StartPrice': shelfPrice(p.costPrice)?.toFixed(2) ?? '',
  '*ConditionID': '1000', // new
  '*Format': 'FixedPrice',
  '*Duration': 'GTC',
  '*Location': 'Nederland',
  ShippingType: 'Flat',
  'ShippingService-1:Option': 'NL_PostNLStandard',
  'ShippingService-1:Cost': '5.00',
  'C:Brand': p.manufacturer ?? 'A-Key',
  'C:Manufacturer Part Number': p.articleCode ?? '',
  'C:Type': CATEGORY_NAMES[p.category] ?? '',
  // No barcode exists for these parts; eBay accepts this for such listings.
  'Product:EAN': 'Does not apply',
}));

writeFileSync(path.join(OUT_DIR, 'ebay-file-exchange.csv'), toCsv(ebayRows, EBAY_HEADERS, ','));

/* ── 3. Amazon flat file ─────────────────────────────────────────────── */

const AMAZON_HEADERS = [
  'sku', 'product-id', 'product-id-type', 'item-name', 'brand-name', 'manufacturer',
  'part-number', 'item-type', 'standard-price', 'currency', 'quantity',
  'main-image-url', 'product-description', 'bullet-point1', 'bullet-point2',
  'bullet-point3', 'condition-type', 'fulfillment-center-id',
];

const amazonRows = sellable.map((p) => {
  const bullets = [
    p.blade ? `Sleutelbaard ${p.blade}` : null,
    p.frequency ? `Frequentie ${p.frequency}` : null,
    p.chip ? `Transponder ${p.chip}` : null,
    p.buttons ? `${p.buttons} knoppen` : null,
    (p.makes ?? []).length ? `Geschikt voor ${p.makes.join(', ')}` : null,
  ].filter(Boolean);

  return {
    sku: p.articleCode ?? p.id,
    // Left blank on purpose: Amazon wants an EAN/UPC here, and neither we nor
    // A-Key hold one. Apply for a GTIN exemption per brand, or buy barcodes.
    'product-id': '',
    'product-id-type': '',
    'item-name': clean(p.titleNl).slice(0, 200),
    'brand-name': p.manufacturer ?? 'A-Key',
    manufacturer: p.manufacturer ?? 'A-Key',
    'part-number': p.articleCode ?? '',
    'item-type': CATEGORY_NAMES[p.category] ?? '',
    'standard-price': shelfPrice(p.costPrice)?.toFixed(2) ?? '',
    currency: 'EUR',
    quantity: stockOf(p),
    'main-image-url': imageUrl(p),
    'product-description': clean(p.descriptionNl),
    'bullet-point1': bullets[0] ?? '',
    'bullet-point2': bullets[1] ?? '',
    'bullet-point3': bullets[2] ?? '',
    'condition-type': 'New',
    'fulfillment-center-id': 'DEFAULT',
  };
});

writeFileSync(path.join(OUT_DIR, 'amazon-flat-file.txt'), toCsv(amazonRows, AMAZON_HEADERS, '\t'));

/* ── report ──────────────────────────────────────────────────────────── */

const noPrice = catalog.products.filter((p) => p.costPrice == null).length;
const noPhoto = catalog.products.filter((p) => !imageUrl(p)).length;

console.log(`exports/ written from ${catalog.products.length} products\n`);
console.log(`  voorraad-en-producten.csv   ${officeRows.length} rows — everything, for Excel`);
console.log(`  ebay-file-exchange.csv      ${ebayRows.length} rows`);
console.log(`  amazon-flat-file.txt        ${amazonRows.length} rows\n`);
console.log('Left out of the marketplace files:');
console.log(`  ${noPrice} without a price`);
console.log(`  ${noPhoto} without a photo`);
console.log('\nStill to fill in yourself:');
console.log('  • eBay *Category — their category id, per range');
console.log('  • quantity — the CRM tracks stock for almost nothing yet');
console.log('  • EAN/GTIN — nobody holds barcodes for these parts');
console.log(`  • photos resolve against ${IMAGE_BASE}; run with SITE_URL=… to change`);
