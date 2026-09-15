/**
 * Reads the specification block off each A-Key product page.
 *
 *   node scripts/scrape-akey-specs.mjs
 *   -> src/data/akey-specs.json
 *
 * A-Key publishes what a customer needs to know before buying — the frequency,
 * the transponder type, the key blade profile, the number of buttons, and the
 * models it fits:
 *
 *   geeignet für z.B.: Megane II
 *   Produktinformationen:
 *   geeignet für Fahrzeugmarke: Renault
 *   Produkttyp: Funkschlüssel
 *   Schlüsselbart: VA2 / VA6
 *   Anzahl der Tasten: 3
 *   Funkeinheit: 433 MHz
 *   Transponder: PCF7947
 *   Farbe: schwarz
 *
 * None of this is in the CSV export, and frequency and transponder are exactly
 * what decides whether a key fits at all — a customer who cannot check them
 * either phones to ask or orders the wrong part and sends it back.
 *
 * Run scripts/scrape-akey-categories.mjs first: this uses the product slugs it
 * collected.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const BASE = 'https://a-key-gmbh.com';
const SECTIONS = path.join(process.cwd(), 'src/data/akey-categories.json');
const OUT = path.join(process.cwd(), 'src/data/akey-specs.json');

if (!existsSync(SECTIONS)) {
  console.error('Run scripts/scrape-akey-categories.mjs first.');
  process.exit(1);
}

const slugs = Object.keys(JSON.parse(readFileSync(SECTIONS, 'utf8')).products ?? {});
console.log(`${slugs.length} product pages to read`);

/**
 * The page as lines of text.
 *
 * A-Key writes the specification block two ways: `Produkttyp: Funkschlüssel`
 * in one text node, or the label in its own tag with the value in the next.
 * Stripping tags to newlines turns the second form into two lines, so any line
 * that ends in a colon is joined to the one after it.
 */
function linesOf(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß').replace(/&euro;/g, '€')
    .replace(/[ \t]+/g, ' ');

  const raw = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of raw) {
    if (out.length && out.at(-1).endsWith(':')) out[out.length - 1] += ` ${line}`;
    else out.push(line);
  }
  return out;
}

/** A dash is A-Key's way of writing "not applicable", not a value. */
const usable = (v) => {
  const t = (v ?? '').trim().replace(/\s+/g, ' ');
  return t && !/^[-–—.]+$/.test(t) && t.length <= 120 ? t : null;
};

/** `Funkeinheit: 433 MHz` -> `433 MHz`. */
function field(lines, label) {
  const re = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'i');
  for (const line of lines) {
    const hit = line.match(re);
    if (hit) return usable(hit[1]);
  }
  return null;
}

/** `Artikelnummer` on its own line, the value on the next. */
function labelled(lines, label) {
  const i = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase());
  return i >= 0 && i + 1 < lines.length ? usable(lines[i + 1]) : null;
}

/**
 * Everything A-Key writes about the product itself.
 *
 * Not just the block under a "Beschreibung" heading: on a good half of their
 * pages there is no such heading, and the line that matters most —
 *
 *   geeignet für folgende Fahrzeuge: FIAT NEW DOBLO - FIORINO - GRANDE PUNTO
 *   - MITO - PEUGEOT BIPPER - TEPE - CITROEN NEMO - OPEL COMBO - FORD KA
 *
 * — sits outside it. That list is the whole question a customer has: does this
 * key fit my car. Reading only the make ("Fiat") throws away eight of the nine
 * cars it fits, and puts the key on the wrong pages.
 *
 * So: everything from the product heading down to the cross-sell block, which
 * is where this product stops and other products begin.
 */
const BLOCK_END = /^(Kunden kauften|Frage zum Artikel|Kontaktdaten|Bewertungen|Ähnliche Artikel|Zuletzt angesehen|Diesen Artikel|Newsletter)/i;

function productBlock(lines) {
  /*
   * Every page prints "Artikelnummer / <nr> / Kategorie / <category>" directly
   * above the article's own text, so that is the reliable anchor. Looking for
   * the heading text instead landed in the newsletter dialog on half the
   * pages, and the description came back as "Additional contact mail (leave
   * blank)".
   */
  const marker = lines.findIndex((l) => /^Kategorie$/i.test(l));
  const start = marker >= 0 ? marker + 2 : lines.findIndex((l) => /^Beschreibung$/i.test(l));
  if (start < 1) return [];

  const body = [];
  for (const line of lines.slice(start)) {
    if (BLOCK_END.test(line)) break;
    if (/^\d+[.,]\d\d\s*€/.test(line)) break; // the price ends the text
    if (line.startsWith('#') || line.includes('display: none')) continue;
    if (/^(Beschreibung|Produktinformationen:?)$/i.test(line)) continue;
    body.push(line);
    if (body.length >= 60) break;
  }
  return body;
}

/**
 * The cars the part fits.
 *
 * A-Key writes the list three ways — "geeignet für folgende Fahrzeuge:",
 * "geeignet für z.B.:" and "passend für folgende Fahrzeuge:" — and separates
 * the entries with hyphens, commas or slashes.
 */
const VEHICLE_LINE = /^(?:geeignet|passend)\s+f[üu]r\s*(?:folgende\s+)?(?:Fahrzeuge|Modelle|z\.?\s?B\.?)\s*:?\s*(.+)$/i;

function vehicleList(lines) {
  for (const line of lines) {
    const hit = line.match(VEHICLE_LINE);
    if (hit) {
      const value = hit[1].trim();
      // Not the make line, which is its own field.
      if (/^Fahrzeugmarke/i.test(value)) continue;
      if (value.length > 2) return value;
    }
  }
  return null;
}

/*
 * The other way A-Key states fitment — one line per car, without a label:
 *
 *   geeignet für Hyundai IX25 2017-2018
 *
 * Their left-hand menu is 150 lines of the same shape ("geeignet für Opel"),
 * so everything is collected here and the catalogue build drops the entries
 * that are nothing but a make name.
 */
const FIT_LINE = /^(?:geeignet|passend)\s+f[üu]r\s+(.{3,160})$/i;

function fitmentLines(lines) {
  const found = [];
  for (const line of lines) {
    const hit = line.match(FIT_LINE);
    if (!hit) continue;
    const value = hit[1].trim().replace(/\s+/g, ' ');
    if (/^Fahrzeugmarke/i.test(value)) continue;
    if (!found.includes(value)) found.push(value);
  }
  return found;
}

/** "(Kann durch FIR134 ersetzt werden)" — the article that supersedes this one. */
const REPLACED_BY = /\(?\s*Kann durch\s+([A-Z0-9][A-Z0-9 .\/+-]{1,24}?)\s+ersetzt werden\s*\)?/i;

const FREQ = /\b(3\d\d|4\d\d|8\d\d|9\d\d)(?:[.,]\d+)?\s*MHz\b/i;
const CHIP = /\b(PCF\s?\d{4}[A-Z]*|HITAG\s?[0-9AP]+|MEGAMOS\s?\w*|TIRIS|4D-?\d{2}|ID\s?\d{2}[A-Z]?|8A|4A|47|46)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keep whatever a previous run collected: a re-run should only fill gaps.
const specs = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};

let read = 0;
let failed = 0;

for (const [i, slug] of slugs.entries()) {
  if (specs[slug]) continue;

  try {
    const res = await fetch(`${BASE}/${slug}`, {
      headers: { 'User-Agent': 'autosleutel24-catalog/1.0 (reseller spec sync)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const lines = linesOf(await res.text());
    const prose = productBlock(lines);
    const proseText = prose.join(' ');

    // Only fall back to the prose for the two fields it reliably states.
    const frequency =
      field(lines, 'Funkeinheit') ?? usable(proseText.match(FREQ)?.[0] ?? '');
    const transponder =
      field(lines, 'Transponder') ?? usable(proseText.match(CHIP)?.[0] ?? '');
    // Which of the two came from a sentence rather than a field, so the
    // catalogue build can tell a stated specification from a read-off one.
    const inferred = [
      !field(lines, 'Funkeinheit') && frequency ? 'frequency' : null,
      !field(lines, 'Transponder') && transponder ? 'transponder' : null,
    ].filter(Boolean);

    specs[slug] = {
      productType: field(lines, 'Produkttyp'),
      blade: field(lines, 'Schlüsselbart'),
      buttons: field(lines, 'Anzahl der Tasten'),
      frequency,
      transponder,
      colour: field(lines, 'Farbe'),
      material: field(lines, 'Material'),
      // Both wordings occur: "geeignet für Fahrzeugmarke" and "passend für".
      // The label is written three ways and is often glued to the line above
      // it ("Produktinformationen: geeignet für Fahrzeugmarke: Fiat").
      make: usable(
        lines
          .map((l) => l.match(/f[üu]r\s+Fahrzeugmarke\s*:\s*([^\n]{2,40})/i)?.[1])
          .find(Boolean) ?? ''
      ),
      /** The models, verbatim, as A-Key lists them. */
      vehicles: vehicleList(prose) ?? vehicleList(lines),
      /** Every "geeignet für …" line on the page, menu entries included. */
      fitmentLines: fitmentLines(lines),
      blank: field(lines, 'Schlüsselrohling'),
      articleNumber: labelled(lines, 'Artikelnummer'),
      akeyCategory: labelled(lines, 'Kategorie'),
      replacedBy: usable(proseText.match(REPLACED_BY)?.[1] ?? ''),
      description: prose.length ? prose : null,
      inferred: inferred.length ? inferred : null,
    };
    read++;
  } catch (error) {
    failed++;
    if (failed <= 5) console.error(`  failed: ${slug} — ${error.message}`);
  }

  if ((i + 1) % 100 === 0) {
    console.log(`  ${i + 1}/${slugs.length} — ${read} read, ${failed} failed`);
    // Checkpoint, so a long run is never lost to one bad response.
    writeFileSync(OUT, JSON.stringify(specs, null, 1));
  }
  await sleep(150);
}

writeFileSync(OUT, JSON.stringify(specs, null, 1));

const filled = Object.values(specs).filter((s) => s.frequency || s.transponder || s.buttons).length;
console.log(`\ndone — ${Object.keys(specs).length} pages, ${filled} with usable specs, ${failed} failed`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
