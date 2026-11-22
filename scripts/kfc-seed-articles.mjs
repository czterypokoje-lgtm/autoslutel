/**
 * Loads the KeyForCars article master into kfc_articles (migration 0090).
 *
 *   node scripts/kfc-seed-articles.mjs            # upsert all 1,704 cards
 *
 * Source: src/data/keyforcars-stock.json (the shops' public catalogue) and
 * src/data/keyforcars-prices.json (sale prices in cents, by SKU). Purchase
 * prices are not in either file and stay null until a purchase order is
 * received or a supplier invoice is confirmed. Idempotent: re-running updates
 * name, image, category and sale price, never stock or purchase price.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment (set -a; . ./.env.local; set +a).
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const catalog = JSON.parse(readFileSync(new URL('../src/data/keyforcars-stock.json', import.meta.url), 'utf8'));
const prices = JSON.parse(readFileSync(new URL('../src/data/keyforcars-prices.json', import.meta.url), 'utf8'));

const rows = catalog.map((article) => ({
  code: article.id,
  name: article.name,
  sku: article.sku ?? '',
  image: article.image ?? '',
  category: article.category ?? '',
  sale_price_cents: Number.isInteger(prices[article.sku]) ? prices[article.sku] : null,
  updated_at: new Date().toISOString(),
}));

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
