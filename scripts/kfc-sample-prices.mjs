#!/usr/bin/env node
/**
 * Public shop prices for the KeyForCars preview's sample orders.
 *
 *   node scripts/kfc-sample-prices.mjs
 *
 * Reads only the public WooCommerce Store API of keyforcars.nl and
 * klapsleutels.nl (the same data any visitor sees), writes nothing to the
 * shops, and stores { SKU: price in cents incl. VAT } in
 * src/data/keyforcars-prices.json. The sample orders are invented; the
 * products and their prices are real.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOPS = ['www.keyforcars.nl', 'www.klapsleutels.nl'];
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'keyforcars-prices.json');

const prices = {};
for (const shop of SHOPS) {
  for (let page = 1; page < 100; page++) {
    const response = await fetch(`https://${shop}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (preview price list)' },
    });
    if (!response.ok) throw new Error(`${shop} page ${page}: HTTP ${response.status}`);
    const products = await response.json();
    for (const product of products) {
      const sku = String(product.sku ?? '').trim().toUpperCase();
      const minor = Number(product.prices?.currency_minor_unit ?? 2);
      const cents = Math.round(Number(product.prices?.price) * 10 ** (2 - minor));
      if (sku && Number.isFinite(cents) && cents > 0 && !(sku in prices)) prices[sku] = cents;
    }
    const pages = Number(response.headers.get('x-wp-totalpages') ?? 1);
    process.stdout.write(`${shop} ${page}/${pages}\r`);
    if (page >= pages) break;
  }
  process.stdout.write('\n');
}

writeFileSync(OUT, `${JSON.stringify(prices)}\n`);
console.log(`${Object.keys(prices).length} prices → ${OUT}`);
