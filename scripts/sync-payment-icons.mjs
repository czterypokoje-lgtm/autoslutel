/**
 * Downloads the payment icons for the methods enabled on our Mollie account.
 *
 *   MOLLIE_API_KEY=live_… node scripts/sync-payment-icons.mjs
 *   -> public/images/payment/<method>.svg
 *
 * The shop shows the methods a customer will actually be offered, which means
 * the list has to come from Mollie rather than from a designer's row of card
 * logos. Switch a method on or off there and run this again; the component
 * only renders an icon that exists on disk, so a removed file removes the
 * method from the page.
 *
 * Mollie publishes these icons for merchants to display in their checkout.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public/images/payment');
/*
 * A manifest as well as the files: the strip is rendered inside the client
 * layout on some pages, where reading the filesystem is not possible. The
 * component imports this list instead.
 */
const MANIFEST = path.join(process.cwd(), 'src/lib/paymentIcons.json');

/** Reads MOLLIE_API_KEY from the environment, or from .env.local. */
function apiKey() {
  if (process.env.MOLLIE_API_KEY) return process.env.MOLLIE_API_KEY;

  const envFile = path.join(process.cwd(), '.env.local');
  if (!existsSync(envFile)) return null;

  const line = readFileSync(envFile, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('MOLLIE_API_KEY='));
  const value = line?.slice('MOLLIE_API_KEY='.length).trim();
  return value || null;
}

const key = apiKey();
if (!key) {
  console.error('No MOLLIE_API_KEY — set it in the environment or in .env.local');
  process.exit(1);
}

const res = await fetch('https://api.mollie.com/v2/methods', {
  headers: { Authorization: `Bearer ${key}` },
});

if (!res.ok) {
  console.error(`Mollie refused the request: HTTP ${res.status}`);
  process.exit(1);
}

const { _embedded: embedded } = await res.json();
const methods = embedded?.methods ?? [];

mkdirSync(OUT_DIR, { recursive: true });

let saved = 0;
const manifest = [];

for (const method of methods) {
  const url = method.image?.svg ?? method.image?.size2x;
  if (!url) {
    console.warn(`  ${method.id}: no icon published`);
    continue;
  }

  const ext = url.endsWith('.svg') ? 'svg' : 'png';
  const file = path.join(OUT_DIR, `${method.id}.${ext}`);

  try {
    const icon = await fetch(url);
    if (!icon.ok) throw new Error(`HTTP ${icon.status}`);
    writeFileSync(file, Buffer.from(await icon.arrayBuffer()));
    manifest.push({ id: method.id, file: `/images/payment/${method.id}.${ext}` });
    console.log(`  ${method.id.padEnd(14)} ${method.description}`);
    saved++;
  } catch (error) {
    console.error(`  ${method.id}: ${error.message}`);
  }
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);

console.log(`\n${saved} of ${methods.length} icons saved to ${path.relative(process.cwd(), OUT_DIR)}`);
console.log(`manifest written to ${path.relative(process.cwd(), MANIFEST)}`);
console.log('Methods listed in src/components/webshop/PaymentMethods.tsx are shown in that order.');
