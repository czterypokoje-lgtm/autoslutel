/**
 * Checks the finished catalogue against the rules it is supposed to obey.
 *
 *   node scripts/audit-catalog.mjs        (exit 1 when something is wrong)
 *
 * The classifier decides; this proves. Every check here is one that has caught
 * a real defect in this catalogue: a circuit board sold as a complete key, a
 * Mercedes key on the Dodge page, German left in a Dutch description, a price
 * of one euro on a part that costs more than that to post.
 *
 * Run it after any change to the scrape, the taxonomy or the copy — a rule
 * that is not checked is a rule that quietly stops holding.
 */

import { readFileSync } from 'fs';
import path from 'path';
import { CATEGORIES } from './taxonomy.mjs';

const catalog = JSON.parse(readFileSync(path.join(process.cwd(), 'src/lib/catalog.json'), 'utf8'));
const products = catalog.products;

const failures = [];
const warnings = [];

const fail = (product, message) => failures.push(`${product.slug}\n    ${message}`);
const warn = (product, message) => warnings.push(`${product.slug} — ${message}`);

/** German that must never reach a customer-facing field. */
const GERMAN =
  /\b(Schlüssel|Gehäuse|Funkschlüssel|Fahrzeug|geeignet für|Tasten|Batterie|nicht|und|oder|für|mit|ohne|wird|kann)\b/;

for (const product of products) {
  /* ── 1. everything is filed ── */
  if (!product.category) fail(product, 'no category');
  else if (!CATEGORIES[product.category]) fail(product, `category "${product.category}" is not in the taxonomy`);

  /* ── 2. the article is what its category says it is ── */
  const rules = CATEGORIES[product.category]?.isNot ?? [];
  for (const rule of rules) {
    if (rule.test(product.title)) {
      fail(product, `filed as ${product.category} but the supplier's title matches ${rule}`);
    }
  }

  /* ── 3. the Dutch copy is Dutch ── */
  if (GERMAN.test(product.titleNl)) fail(product, `German in titleNl: ${product.titleNl}`);
  if (GERMAN.test(product.directAnswer)) fail(product, `German in directAnswer: ${product.directAnswer}`);
  if (GERMAN.test(product.metaDescriptionNl)) {
    fail(product, `German in metaDescriptionNl: ${product.metaDescriptionNl}`);
  }

  /* ── 4. nothing is claimed that was not stated ── */
  for (const entry of product.fitment) {
    if (!entry.make || !entry.model) fail(product, `incomplete fitment entry ${JSON.stringify(entry)}`);
    if (entry.model && entry.model.length > 32) fail(product, `fitment model reads as prose: "${entry.model}"`);
    if (entry.make && !product.makes.includes(entry.make)) {
      fail(product, `fits a ${entry.make} but ${entry.make} is not in makes`);
    }
  }

  /* ── 5. it can actually be sold ── */
  if (product.costPrice === 1) fail(product, 'cost price is exactly €1 — their placeholder, not a price');
  if (product.costPrice != null && product.costPrice < 0) fail(product, 'negative cost price');
  if (product.audience === 'public' && !product.image) warn(product, 'no photo');
  if (product.audience === 'public' && product.costPrice == null) warn(product, 'no price');

  /* ── 6. the page has something to say ── */
  if (!product.descriptionNl || product.descriptionNl.length < 40) warn(product, 'description is nearly empty');
  if (!product.titleNl || product.titleNl.length < 6) fail(product, 'title is empty');
}

/* ── 7. the confusable pairs, checked by hand ── */

const NEVER = [
  ['printplaten', /geh[äa]use|behuizing/i, 'a housing filed as a circuit board'],
  ['behuizingen', /\bPCB\b|platine/i, 'a circuit board filed as a housing'],
  ['transponders', /\b[3489]\d\d\s*MHz\b/i, 'a remote filed as a transponder'],
  ['batterijen', /funkschl[üu]ssel|smart\s?key/i, 'a key filed as a battery'],
  ['woningsleutels', /funkschl[üu]ssel|transponder/i, 'a car key filed as a house key'],
];

for (const [category, pattern, what] of NEVER) {
  for (const product of products.filter((p) => p.category === category)) {
    if (pattern.test(`${product.title} ${product.excerpt}`.slice(0, 200))) {
      warn(product, `${what} — check`);
    }
  }
}

/* ── report ──────────────────────────────────────────────────────────── */

console.log(`${products.length} articles checked\n`);

if (failures.length) {
  console.log(`${failures.length} failures:\n`);
  failures.slice(0, 40).forEach((f) => console.log(`  ${f}`));
  if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
  console.log();
}

if (warnings.length) {
  const counts = new Map();
  for (const w of warnings) {
    const kind = w.split(' — ')[1] ?? w;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  console.log(`${warnings.length} warnings:`);
  for (const [kind, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${kind}`);
  }
  console.log();
}

if (!failures.length) console.log('No failures. Every article is filed, in Dutch, and claims only what A-Key states.');
process.exitCode = failures.length ? 1 : 0;
