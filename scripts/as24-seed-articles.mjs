/**
 * Loads the Autosleutel24 article master into kfc_articles (migration 0090).
 *
 *   node scripts/as24-seed-articles.mjs --dry-run   # print, write nothing
 *   node scripts/as24-seed-articles.mjs             # upsert all cards
 *
 * The twin of scripts/kfc-seed-articles.mjs, reading this install's own files:
 * src/data/autosleutel24-stock.json (built by scripts/build-as24-stock.mjs from
 * the key catalogue) and src/data/autosleutel24-prices.json (sale prices in
 * cents, by SKU). Purchase prices are in neither and stay null until a purchase
 * order is received or a supplier invoice is confirmed. Idempotent: re-running
 * updates name, image, category and sale price, never stock or purchase price.
 *
 * Point it at the right database. Autosleutel24's articles belong in
 * Autosleutel24's Supabase project only — a .env.local left over from the
 * KeyForCars demo would happily take them. --dry-run needs no environment at
 * all, so check the output first.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (set -a; . ./.env.local; set +a).
 */
import { readFileSync } from 'node:fs';

const dryRun = process.argv.includes('--dry-run');

const catalog = JSON.parse(readFileSync(new URL('../src/data/autosleutel24-stock.json', import.meta.url), 'utf8'));
const prices = JSON.parse(readFileSync(new URL('../src/data/autosleutel24-prices.json', import.meta.url), 'utf8'));

const rows = catalog.map((article) => ({
  code: article.id,
  name: article.name,
  sku: article.sku ?? '',
  image: article.image ?? '',
  category: article.category ?? '',
  sale_price_cents: Number.isInteger(prices[article.sku]) ? prices[article.sku] : null,
  updated_at: new Date().toISOString(),
}));

if (dryRun) {
  console.log(`Dry run: ${rows.length} rows for kfc_articles, nothing written.`);
  console.log(`With a sale price: ${rows.filter((row) => row.sale_price_cents !== null).length}; without: ${rows.filter((row) => row.sale_price_cents === null).length}.`);
  console.log(`Categories: ${new Set(rows.map((row) => row.category)).size}; duplicate codes: ${rows.length - new Set(rows.map((row) => row.code)).size}; duplicate SKUs: ${rows.length - new Set(rows.map((row) => row.sku)).size}.`);
  console.log('First rows:');
  for (const row of rows.slice(0, 5)) console.log(row);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let done = 0;
for (let i = 0; i < rows.length; i += 200) {
  const { error } = await supabase.from('kfc_articles').upsert(rows.slice(i, i + 200), { onConflict: 'code' });
  if (error) {
    console.error(`Upsert failed at ${i}:`, error.message);
    process.exit(1);
  }
  done += Math.min(200, rows.length - i);
}
const { count } = await supabase.from('kfc_articles').select('code', { count: 'exact', head: true });
console.log(`Upserted ${done} articles; kfc_articles now holds ${count}.`);
