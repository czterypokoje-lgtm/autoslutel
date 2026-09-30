#!/usr/bin/env node
/*
 * Crawl every URL in a sitemap and check that the pages agree with each other.
 *
 *   node scripts/audit-site.mjs http://localhost:3000        (after `npm run build && npm start`)
 *   node scripts/audit-site.mjs https://www.autosleutel24.nl
 *
 * It checks the things that drifted before:
 *   - the business is described in full once per page, under one @id
 *   - no other LocalBusiness/Locksmith node lacks that @id
 *   - every page except the homepage has a BreadcrumbList
 *   - every page has one H1, a self-referencing canonical, a title of at most 60
 *     characters and a description of 100-160
 *   - one phone number everywhere
 *   - no price in a title or description
 *   - "vanaf EUR x" prices on the page are among the ones in SITE_CONFIG.prices
 *   - no stale rating or review count (4.9 / 247) survives
 *
 * It prints a summary and the offending URLs. Exit code 1 when something fails, so it
 * can run in CI.
 */
import fs from 'node:fs';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const cfg = fs.readFileSync(new URL('../src/config/site.config.ts', import.meta.url), 'utf8');
const pick = (re) => (cfg.match(re) || [])[1];
const DOMAIN = pick(/domain: '([^']+)'/);
const PHONE_TEL = pick(/phoneTel: '([^']+)'/);
const PHONE = pick(/phone: '([^']+)'/);
const priceBlock = cfg.slice(cfg.indexOf('prices: {'), cfg.indexOf('},', cfg.indexOf('prices: {')));
const PRICES = new Set([...priceBlock.matchAll(/'(\d+)'/g)].map((m) => m[1]));
// Ranges and fixed prices the service pages quote on purpose (battery, repair FAQ, old-key quotes).
['15', '20', '49', '85', '35', '350'].forEach((p) => PRICES.add(p));
const BIZ_ID = `${DOMAIN}/#localbusiness`;

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(DOMAIN, base))
  .filter((u) => !/\.(png|jpe?g|webp)$/i.test(u));

const problems = {};
const add = (k, u, extra = '') => ((problems[k] ||= []).push(extra ? `${u} (${extra})` : u));

async function audit(url) {
  const res = await fetch(url, { redirect: 'manual' });
  if (res.status !== 200) return add('not 200', url, String(res.status));
  const html = await res.text();
  const path = url.replace(base, '') || '/';
  const isHome = path === '/';

  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const nodes = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === 'object') {
      nodes.push(n);
      Object.values(n).forEach(walk);
    }
  };
  for (const b of blocks) {
    try {
      walk(JSON.parse(b));
    } catch {
      add('invalid JSON-LD', path);
    }
  }
  const types = (n) => [].concat(n['@type'] || []);
  const isBiz = (n) => types(n).some((t) => ['LocalBusiness', 'Locksmith', 'AutomotiveBusiness'].includes(t));
  const full = nodes.filter((n) => isBiz(n) && n.telephone && n.address);
  if (full.length !== 1) add('business described in full != 1 time', path, String(full.length));
  if (full[0] && full[0]['@id'] !== BIZ_ID) add('full business node has the wrong @id', path);
  nodes.filter((n) => isBiz(n) && !n['@id']).forEach(() => add('business node without @id', path));
  if (!isHome && !nodes.some((n) => types(n).includes('BreadcrumbList'))) add('no BreadcrumbList', path);

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) add('H1 count != 1', path, String(h1s));
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = decode((html.match(/name="description" content="([^"]*)"/) || [])[1] || '');
  if (title.length > 60) add('title over 60', path, String(title.length));
  if (desc.length < 100 || desc.length > 160) add('description outside 100-160', path, String(desc.length));
  // Prices stay out of titles and descriptions: the arrival time converts better there, the prices live on the page.
  if (title.includes('€') || desc.includes('€')) add('price in title or description', path);
  const canon = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1];
  if (!canon) add('no canonical', path);
  else if (canon.replace(DOMAIN, '').replace(/\/$/, '') !== path.replace(/\/$/, '').replace(/#.*/, '')) add('canonical is not the page', path, canon);

  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  for (const m of html.matchAll(/href="tel:([^"]+)"/g)) if (m[1] !== PHONE_TEL) add('other phone number', path, m[1]);
  for (const m of text.matchAll(/vanaf\s*€\s?(\d{2,3})/gi)) if (!PRICES.has(m[1])) add(`price not in config: ${m[1]}`, path);
  if (/\b4[.,]9\b.{0,40}(uit 5|sterren)|247\+?\s*(geverifieerde|reviews)/i.test(text)) add('stale rating / review count', path);
}

const queue = [...urls];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) await audit(queue.shift()).catch((e) => add('fetch error', 'unknown', String(e)));
  }),
);

console.log(`Audited ${urls.length} pages on ${base}  (phone ${PHONE}, prices in config: ${[...PRICES].sort((a, b) => a - b).join(', ')})\n`);
const keys = Object.keys(problems);
if (!keys.length) console.log('No problems found.');
for (const k of keys.sort()) {
  console.log(`${k}: ${problems[k].length}`);
  problems[k].slice(0, 6).forEach((x) => console.log(`   ${x}`));
  if (problems[k].length > 6) console.log(`   … and ${problems[k].length - 6} more`);
}
process.exit(keys.length ? 1 : 0);
