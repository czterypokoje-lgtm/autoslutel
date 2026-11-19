/**
 * The catalogue as a workbook the office can actually work in.
 *
 *   npm i --no-save exceljs && node scripts/export-excel.mjs
 *   -> exports/Autosleutel24-producten.xlsx
 *
 * The CSV next to this (export-catalogue.mjs) is for machines; this one is
 * for a person: frozen header, a filter on every column, money formatted as
 * money, and the rows that need attention coloured so they cannot be missed.
 *
 * Three sheets:
 *   Producten     every article, with cost, sell price and margin
 *   Aandacht      the ones that cannot be sold as they stand
 *   Per categorie counts and stock value per category
 *
 * exceljs is installed with --no-save on purpose: an export run twice a month
 * does not belong in the application's dependencies.
 */

import ExcelJS from 'exceljs';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'exports/Autosleutel24-producten.xlsx');
const SITE = process.env.SITE_URL ?? 'https://www.autosleutel24.nl';

const catalog = JSON.parse(readFileSync(path.join(process.cwd(), 'src/lib/catalog.json'), 'utf8'));

/* The shop's own pricing rule, so the workbook cannot disagree with the site. */
const VAT_RATE = 0.21;
const MARGIN_TIERS = [
  { upTo: 5, multiplier: 3.0 },
  { upTo: 20, multiplier: 2.2 },
  { upTo: 50, multiplier: 1.8 },
  { upTo: 150, multiplier: 1.55 },
  { upTo: Infinity, multiplier: 1.35 },
];

function shelfPrice(cost) {
  if (cost == null || !Number.isFinite(cost)) return null;
  const tier = MARGIN_TIERS.find((t) => cost < t.upTo) ?? MARGIN_TIERS.at(-1);
  return Math.max(2.95, Math.round((Math.floor(cost * tier.multiplier * (1 + VAT_RATE)) + 0.95) * 100) / 100);
}

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

const models = (p) =>
  (p.fitment ?? [])
    // "vanaf 2014", never "2014-nu": A-Key states a start year, not that the
    // part still fits a car built this year.
    .map((f) => {
      const years = f.from > 1950 ? (f.to && f.to < 9000 ? ` ${f.from}-${f.to}` : ` vanaf ${f.from}`) : '';
      return `${f.make} ${f.model}${years}`;
    })
    .join(' | ');

const INK = 'FF0F172A';
const RUST = 'FFB93C20';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Autosleutel24';
workbook.created = new Date();

/* ── sheet 1: every product ──────────────────────────────────────────── */

const sheet = workbook.addWorksheet('Producten', {
  views: [{ state: 'frozen', ySplit: 1 }],
});

sheet.columns = [
  { header: 'Artikelcode', key: 'code', width: 20 },
  { header: 'Titel', key: 'title', width: 52 },
  { header: 'Categorie', key: 'category', width: 24 },
  { header: 'Subcategorie', key: 'subcategory', width: 22 },
  { header: 'Automerken', key: 'makes', width: 26 },
  { header: 'Past op modellen', key: 'models', width: 46 },
  { header: 'Sleutelbaard', key: 'blade', width: 13 },
  { header: 'Frequentie', key: 'frequency', width: 12 },
  { header: 'Transponder', key: 'chip', width: 15 },
  { header: 'Knoppen', key: 'buttons', width: 9 },
  { header: 'Fabrikant', key: 'manufacturer', width: 14 },
  { header: 'Leverancier', key: 'supplier', width: 13 },
  { header: 'Inkoop', key: 'cost', width: 11 },
  { header: 'Verkoop incl. btw', key: 'sell', width: 16 },
  { header: 'Marge per stuk', key: 'margin', width: 14 },
  { header: 'Voorraad', key: 'stock', width: 10 },
  { header: 'Status', key: 'status', width: 18 },
  { header: 'Foto', key: 'photo', width: 16 },
  { header: 'Webshop', key: 'url', width: 16 },
];

for (const product of catalog.products) {
  const sell = shelfPrice(product.costPrice);
  const row = sheet.addRow({
    code: product.articleCode ?? product.id,
    title: product.titleNl,
    category: CATEGORY_NAMES[product.category] ?? product.category ?? '',
    subcategory: product.subcategory ?? '',
    makes: (product.makes ?? []).join(', '),
    models: models(product),
    blade: product.blade ?? '',
    frequency: product.frequency ?? '',
    chip: product.chip ?? '',
    buttons: product.buttons ?? '',
    manufacturer: product.manufacturer ?? '',
    supplier: product.supplier ?? '',
    cost: product.costPrice ?? null,
    sell: sell ?? null,
    margin: sell != null && product.costPrice != null ? sell / (1 + VAT_RATE) - product.costPrice : null,
    // Left empty on purpose: the CRM tracks stock for almost nothing, and a
    // number invented here becomes an oversell on eBay.
    stock: null,
    status:
      product.costPrice == null
        ? 'prijs ontbreekt'
        : product.audience === 'trade'
          ? 'alleen vakhandel'
          : 'actief',
  });

  // Links rather than long URLs in a cell.
  if (product.image && !product.image.includes('placeholder')) {
    row.getCell('photo').value = { text: 'foto', hyperlink: `${SITE}${product.image}` };
    row.getCell('photo').font = { color: { argb: RUST }, underline: true };
  }
  row.getCell('url').value = {
    text: 'openen',
    hyperlink: `${SITE}/webshop/product/${product.slug}`,
  };
  row.getCell('url').font = { color: { argb: RUST }, underline: true };

  if (product.costPrice == null) {
    // The rows that cannot be sold as they stand.
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF3E7' } };
    });
    row.getCell('status').font = { bold: true, color: { argb: 'FF9A6B00' } };
  }
}

const header = sheet.getRow(1);
header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
header.height = 22;
header.alignment = { vertical: 'middle' };
header.eachCell((cell) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
});

sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columns.length } };
for (const key of ['cost', 'sell', 'margin']) {
  sheet.getColumn(key).numFmt = '€ #,##0.00';
  sheet.getColumn(key).alignment = { horizontal: 'right' };
}
sheet.getColumn('buttons').alignment = { horizontal: 'center' };
sheet.getColumn('stock').numFmt = '0';

/* ── sheet 2: what needs attention ───────────────────────────────────── */

const attention = workbook.addWorksheet('Aandacht', { views: [{ state: 'frozen', ySplit: 1 }] });
attention.columns = [
  { header: 'Wat', key: 'what', width: 30 },
  { header: 'Artikelcode', key: 'code', width: 22 },
  { header: 'Titel', key: 'title', width: 60 },
  { header: 'Categorie', key: 'category', width: 24 },
  { header: 'Actie', key: 'action', width: 52 },
];

for (const product of catalog.products) {
  const problems = [];
  if (product.costPrice == null) {
    problems.push(['Geen prijs', 'Prijs invullen in de CRM, anders niet te koop']);
  }
  if (!product.image || product.image.includes('placeholder')) {
    problems.push(['Geen foto', 'Foto toevoegen — eBay en Amazon weigeren het artikel']);
  }
  for (const [what, action] of problems) {
    attention.addRow({
      what,
      code: product.articleCode ?? product.id,
      title: product.titleNl,
      category: CATEGORY_NAMES[product.category] ?? product.category ?? '',
      action,
    });
  }
}

const attentionHeader = attention.getRow(1);
attentionHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
attentionHeader.height = 22;
attentionHeader.eachCell((cell) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
});
attention.autoFilter = { from: 'A1', to: { row: 1, column: 5 } };

/* ── sheet 3: per category ───────────────────────────────────────────── */

const summary = workbook.addWorksheet('Per categorie');
summary.columns = [
  { header: 'Categorie', key: 'category', width: 28 },
  { header: 'Artikelen', key: 'count', width: 11 },
  { header: 'Met prijs', key: 'priced', width: 11 },
  { header: 'Zonder prijs', key: 'unpriced', width: 13 },
  { header: 'Gem. inkoop', key: 'avgCost', width: 14 },
  { header: 'Gem. verkoop', key: 'avgSell', width: 14 },
];

const groups = new Map();
for (const product of catalog.products) {
  const name = CATEGORY_NAMES[product.category] ?? product.category ?? '—';
  const g = groups.get(name) ?? { count: 0, priced: 0, cost: 0, sell: 0 };
  g.count++;
  if (product.costPrice != null) {
    g.priced++;
    g.cost += product.costPrice;
    g.sell += shelfPrice(product.costPrice) ?? 0;
  }
  groups.set(name, g);
}

for (const [category, g] of [...groups].sort((a, b) => b[1].count - a[1].count)) {
  summary.addRow({
    category,
    count: g.count,
    priced: g.priced,
    unpriced: g.count - g.priced,
    avgCost: g.priced ? g.cost / g.priced : null,
    avgSell: g.priced ? g.sell / g.priced : null,
  });
}

const summaryHeader = summary.getRow(1);
summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
summaryHeader.height = 22;
summaryHeader.eachCell((cell) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
});
summary.getColumn('avgCost').numFmt = '€ #,##0.00';
summary.getColumn('avgSell').numFmt = '€ #,##0.00';

const totals = summary.addRow({
  category: 'Totaal',
  count: catalog.products.length,
  priced: catalog.products.filter((p) => p.costPrice != null).length,
  unpriced: catalog.products.filter((p) => p.costPrice == null).length,
});
totals.font = { bold: true };

mkdirSync(path.dirname(OUT), { recursive: true });
await workbook.xlsx.writeFile(OUT);

console.log(`${catalog.products.length} products -> ${path.relative(process.cwd(), OUT)}`);
console.log(`  Aandacht: ${attention.rowCount - 1} rows need something before they can be sold`);
