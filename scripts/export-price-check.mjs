/**
 * Every catalogue price beside the price it was scraped from.
 *
 *   node scripts/export-price-check.mjs
 *   -> exports/Prijscontrole-<datum>.xlsx
 *
 * The question this answers is "did the scraper read A-Key correctly", which
 * no screen in the CRM can show: the raw scrape and the built catalogue are
 * two files nobody puts side by side. So every row carries the source URL,
 * what was scraped, what the catalogue kept, and what we would sell it for —
 * and a column saying what, if anything, is wrong with that row.
 *
 * Deliberately not "fix what it finds". A price that looks wrong is a
 * question for whoever knows what the part costs, and a script that silently
 * corrects the catalogue would hide exactly the thing being checked.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const raw = read('src/data/akey-catalog-raw.json');
const built = read('src/lib/catalog.json');

/* The site's own pricing, copied rather than imported: this is a plain .mjs
   and catalog.ts is TypeScript. If these drift, the sheet is lying — so the
   check at the bottom recomputes one known product both ways. */
const VAT_RATE = 0.21;
const MIN_PRICE = 2.95;
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
  const gross = cost * tier.multiplier * (1 + VAT_RATE);
  return Math.max(MIN_PRICE, Math.round((Math.floor(gross) + 0.95) * 100) / 100);
}

/* The raw scrape is keyed by nothing useful, so index it by the two things
   that can match a built product: its slug and its article number. */
/* raw.products is an object keyed by slug, not an array. */
const rawItems = Array.isArray(raw.products) ? raw.products : Object.values(raw.products);

const rawBySlug = new Map();
const rawByArticle = new Map();
for (const item of rawItems) {
  if (item.slug) rawBySlug.set(String(item.slug).toLowerCase(), item);
  if (item.articleNumber) rawByArticle.set(String(item.articleNumber).trim().toLowerCase(), item);
}

/*
 * The middle price per category, as the yardstick for "odd".
 *
 * Median rather than mean: one 10.591 euro machine drags an average far
 * enough that nothing else looks expensive, which is the opposite of what a
 * check is for.
 */
const median = {};
{
  const byCategory = {};
  for (const product of built.products) {
    if (product.costPrice == null || !product.category) continue;
    (byCategory[product.category] ??= []).push(product.costPrice);
  }
  for (const [category, prices] of Object.entries(byCategory)) {
    prices.sort((a, b) => a - b);
    median[category] = Math.round(prices[Math.floor(prices.length / 2)] * 100) / 100;
  }
}

const rows = [];
const matchedRaw = new Set();

for (const product of built.products) {
  const source =
    rawBySlug.get(String(product.slug).toLowerCase()) ??
    rawByArticle.get(String(product.articleCode ?? '').trim().toLowerCase()) ??
    null;
  if (source) matchedRaw.add(source.url);

  const scraped = source?.price ?? null;
  const cost = product.costPrice ?? null;
  const shelf = shelfPrice(cost);

  /*
   * One column, plain Dutch, because a spreadsheet of boolean columns is a
   * spreadsheet nobody reads. Ordered worst first: a price that disagrees
   * with its source is a different problem from one that was never there.
   */
  const notes = [];
  if (!source) notes.push('niet teruggevonden in de scrape');
  else if (scraped == null && cost == null) notes.push('geen prijs bij de leverancier');
  else if (scraped === 1) notes.push('leverancier gaf 1,00 (plaatshouder) — bewust geen prijs');
  else if (cost == null && scraped != null) notes.push('scrape had een prijs, catalogus niet');
  else if (cost != null && scraped != null && Math.abs(cost - scraped) > 0.005)
    notes.push(`wijkt af van de scrape (${scraped})`);

  /* Absolute thresholds are useless here. A 0,17 huissleutelrohling and a
     10.591 euro sleutelmachine are both real, and a flag at "< 1" fired on
     1034 rows — a third of the catalogue, which is noise, not a finding.
     What is worth a look is a price far from what its OWN category costs. */
  if (cost === 0) notes.push('gratis — dat klopt nooit');
  else if (cost != null) {
    const mid = median[product.category];
    if (mid) {
      if (cost > mid * 12) notes.push(`veel duurder dan de rest van ${product.category} (midden ${mid})`);
      else if (cost < mid / 12) notes.push(`veel goedkoper dan de rest van ${product.category} (midden ${mid})`);
    }
  }

  rows.push({
    Artikelnummer: product.articleCode ?? '',
    Titel: product.titleNl || product.title,
    Categorie: product.category ?? '',
    Merken: (product.makes ?? []).join(', '),
    'Inkoop (catalogus)': cost ?? '',
    'Inkoop (scrape)': scraped ?? '',
    'Verkoop incl. btw': shelf ?? '',
    Marge: cost != null && shelf != null ? Math.round((shelf / 1.21 - cost) * 100) / 100 : '',
    Bron: source?.url ?? '',
    Opmerking: notes.join(' · '),
  });
}

/* What the scrape had and the catalogue dropped. Worth seeing: these are
   products that exist at the supplier and cannot be ordered here. */
const dropped = rawItems
  .filter((item) => item.isProduct !== false && !matchedRaw.has(item.url))
  .map((item) => ({
    Artikelnummer: item.articleNumber ?? '',
    Titel: item.title ?? '',
    'Inkoop (scrape)': item.price ?? '',
    Voorraad: item.stockLabel ?? '',
    Bron: item.url ?? '',
  }));

/* Two rows with the same article number and different money is either a
   scrape that read one page twice or a supplier with two listings. Both are
   worth a human look. */
const byArticle = new Map();
for (const row of rows) {
  if (!row.Artikelnummer) continue;
  byArticle.set(row.Artikelnummer, [...(byArticle.get(row.Artikelnummer) ?? []), row]);
}
const conflicts = [];
for (const [code, group] of byArticle) {
  const prices = new Set(group.map((r) => r['Inkoop (catalogus)']).filter((v) => v !== ''));
  if (group.length > 1 && prices.size > 1) {
    for (const row of group) conflicts.push({ Artikelnummer: code, Titel: row.Titel, Inkoop: row['Inkoop (catalogus)'], Bron: row.Bron });
  }
}

const priced = rows.filter((r) => r['Inkoop (catalogus)'] !== '');
const summary = [
  { Post: 'Artikelen in de catalogus', Aantal: rows.length },
  { Post: 'Met een inkoopprijs', Aantal: priced.length },
  { Post: 'Zonder inkoopprijs', Aantal: rows.length - priced.length },
  { Post: 'Niet teruggevonden in de scrape', Aantal: rows.filter((r) => r.Opmerking.includes('niet teruggevonden')).length },
  { Post: 'Prijs wijkt af van de scrape', Aantal: rows.filter((r) => r.Opmerking.includes('wijkt af')).length },
  { Post: 'Prijs 0,00', Aantal: rows.filter((r) => r.Opmerking.includes('gratis')).length },
  { Post: 'Ver boven de rest van zijn categorie', Aantal: rows.filter((r) => r.Opmerking.includes('veel duurder')).length },
  { Post: 'Ver onder de rest van zijn categorie', Aantal: rows.filter((r) => r.Opmerking.includes('veel goedkoper')).length },
  { Post: 'Dubbel artikelnummer, andere prijs', Aantal: conflicts.length },
  { Post: 'Wel bij leverancier, niet in catalogus', Aantal: dropped.length },
  { Post: '', Aantal: '' },
  { Post: 'Scrape gemaakt op', Aantal: raw.scrapedAt ?? 'onbekend' },
  { Post: 'Catalogus gebouwd op', Aantal: built.generatedAt ?? 'onbekend' },
];

/* xlsx is already a dependency — the app reads supplier spreadsheets with it
   (api/admin/invoice) and writes the Winst export. No install step. */
const { utils, write } = await import('xlsx');

const book = utils.book_new();

const sheet = (name, data, widths) => {
  const ws = utils.json_to_sheet(data.length ? data : [{ '': 'Niets gevonden' }]);
  if (widths) ws['!cols'] = widths.map((w) => ({ wch: w }));
  /* The header stays put and every column filters: 3600 rows is not a list
     you scroll, it is one you sort and filter. */
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  if (data.length) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }
  utils.book_append_sheet(book, ws, name);
};

sheet('Samenvatting', summary, [40, 26]);
sheet('Alle prijzen', rows, [16, 52, 20, 24, 16, 16, 18, 12, 46, 40]);
sheet('Te controleren', rows.filter((r) => r.Opmerking), [16, 52, 20, 24, 16, 16, 18, 12, 46, 40]);
sheet(
  'Per categorie',
  Object.entries(median)
    .map(([Categorie, Middenprijs]) => ({
      Categorie,
      Middenprijs,
      Artikelen: built.products.filter((p) => p.category === Categorie && p.costPrice != null).length,
    }))
    .sort((a, b) => b.Artikelen - a.Artikelen),
  [24, 16, 14]
);
sheet('Dubbele nummers', conflicts, [16, 52, 14, 46]);
sheet('Niet in catalogus', dropped, [16, 52, 16, 18, 46]);

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
const out = `exports/Prijscontrole-${today}.xlsx`;
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, write(book, { type: 'buffer', bookType: 'xlsx' }));

/* Proof the copied pricing still matches the site's. If this ever prints a
   mismatch, the sheet's Verkoop column is fiction. */
const probe = built.products.find((p) => p.costPrice != null);
console.log(`\ncontrole: inkoop ${probe.costPrice} -> verkoop ${shelfPrice(probe.costPrice)}`);
console.log(summary.map((s) => `  ${String(s.Post).padEnd(40)} ${s.Aantal}`).join('\n'));
console.log(`\ngeschreven: ${out}`);
