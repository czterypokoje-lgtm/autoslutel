/**
 * A blank price list a technician fills in offline, in the exact shape of
 * `technician_coverage` (see src/lib/capability.ts + supabase/migrations/
 * 0038_technician_pricing.sql) — the same table /admin/mijn-vak's PriceTree
 * writes to. Filling this in on paper/Excel does not feed the CRM by
 * itself; someone still has to key it into /admin/mijn-vak (or a future
 * importer) afterwards. Use that page directly if the technician can log
 * in — this is for the ones who, for now, can't or won't.
 *
 *   npm i --no-save exceljs && node scripts/export-tarieven-excel.mjs [monteur-naam]
 *   -> exports/Tarieven-<naam>.xlsx
 *
 * Model lists are pulled live from src/lib/carCatalogExtra.ts's EXTRA_MODELS
 * — the exact list PriceTree's model dropdown offers — instead of being
 * retyped here, so the two can never drift apart.
 */

import ExcelJS from 'exceljs';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';

const technicianName = process.argv[2] ?? 'monteur';
const OUT = path.join(process.cwd(), `exports/Tarieven-${technicianName.replace(/\s+/g, '-')}.xlsx`);

/* ── real data, pulled from the CRM's own source files ───────────────── */

const extraSrc = readFileSync(path.join(process.cwd(), 'src/lib/carCatalogExtra.ts'), 'utf8');
const extraMatch = extraSrc.match(/export const EXTRA_MODELS[^=]*=\s*(\{[\s\S]*?\n\});/);
if (!extraMatch) throw new Error('Could not find EXTRA_MODELS in carCatalogExtra.ts — did it move?');
/** make-key (lowercase) -> real model names, straight from the CRM's own picker list. */
const EXTRA_MODELS = new Function('return ' + extraMatch[1])();

// Mirrors src/lib/topBrands.ts TOP_BRANDS — the makes shown first because
// they are what actually turns up in real jobs and leads.
const TOP_BRANDS = [
  'Volkswagen', 'BMW', 'Kia', 'Mercedes-Benz', 'Peugeot', 'Opel', 'Fiat', 'Toyota',
  'Ford', 'Renault', 'Nissan', 'Hyundai', 'Citroen', 'Seat', 'Chevrolet', 'Volvo',
  'Audi', 'Mini', 'Mitsubishi', 'Mazda',
];

// Mirrors src/lib/scenarios.ts SCENARIO_INFO labels exactly — the four
// dropdown options PriceTree offers.
const SCENARIO_LABELS = {
  bijmaken: 'Sleutel bijmaken (2e sleutel)',
  alle_sleutels_kwijt: 'Alle sleutels kwijt (AKL)',
  reparatie: 'Sleutel repareren',
  slot: 'Slot of cilinder',
};

function displayName(key) {
  const top = TOP_BRANDS.find((b) => b.toLowerCase() === key);
  if (top) return top;
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}

const makeKeys = Object.keys(EXTRA_MODELS);
const orderedKeys = [
  ...TOP_BRANDS.map((b) => b.toLowerCase()).filter((k) => makeKeys.includes(k)),
  ...makeKeys.filter((k) => !TOP_BRANDS.some((b) => b.toLowerCase() === k)).sort(),
];

/* ── workbook ─────────────────────────────────────────────────────────── */

const INK = 'FF0F172A';
const RUST = 'FFB93C20';
const BRAND_BG = 'FFEFEBE3';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Autosleutel24';
workbook.created = new Date();

/* ── sheet 1: instructions ───────────────────────────────────────────── */

const info = workbook.addWorksheet('Uitleg');
info.columns = [{ width: 100 }];
const lines = [
  ['Prijslijst — ' + technicianName, true, 14],
  ['', false],
  ['Dit is uw eigen prijslijst: wat u rekent = wat dispatch aan u aanbiedt.', true],
  ['Auto’s zonder prijs hier worden u niet aangeboden.', false],
  ['', false],
  ['Kolommen', true],
  ['Per merk staan de modellen twee keer onder elkaar: eerst het hele blok "Sleutel bijmaken",', false],
  ['dan het hele blok "Alle sleutels kwijt" — bij elkaar, niet afgewisseld per model.', false],
  ['Bouwjaar vanaf/tot — leeg = alle bouwjaren.', false],
  ['Sleuteltype — Beide / Keyless / Baard-contact. Beide = u doet ze allebei.', false],
  ['Prijs — leeg laten = dit doet u (nog) niet voor die combinatie.', false],
  ['Op locatie — Ja als u dit gewoon bij de klant doet. Nee als het (deels) naar de garage/dealer moet.', false],
  ['Uitsluiten — Ja voor een auto/bouwjaar die u juist NIET doet, ook al staat de rest van het merk op Ja.', false],
  ['Notities — bijzonderheden, bijv. bij Op locatie = Nee: waarom, en wat u wel op locatie doet.', false],
  ['', false],
  ['Voorbeeld: bijmaken op locatie, AKL alleen via de dealer', true],
  ['Volkswagen Golf, vanaf 2014, in het blok "Sleutel bijmaken": Op locatie = Ja, prijs invullen.', false],
  ['Dezelfde Golf, in het blok "Alle sleutels kwijt": Op locatie = Nee, en in Notities: "onderdeel bij', false],
  ['dealer bestellen, daarna zelf op locatie programmeren, 2-4 werkdagen". Geldt dit alleen voor', false],
  ['bepaalde bouwjaren? Gebruik de uitzonderingsrij hieronder — zie de twee voorbeelden.', false],
  ['', false],
  ['Onder elk model staat één extra rij, licht van kleur, met "↳ uitzondering" in Model.', true],
  ['Die is voor het ene geval dat net anders is dan de rest van het model. Twee echte voorbeelden:', false],
  ['', false],
  ['1) "Kan Golf 5 2005–2015, maar niet 2007"', true],
  ['Hoofdrij Golf: Bouwjaar 2005–2015, prijs invullen, Uitsluiten = Nee — dit is de regel.', false],
  ['Uitzonderingsrij: Bouwjaar 2007–2007, Uitsluiten = Ja, Notities "motorstoring, doe ik niet" —', false],
  ['dit is de uitzondering op de regel. Alleen dat jaar 2007 wordt overgeslagen, de rest van 2005–2015 blijft staan.', false],
  ['', false],
  ['2) "Kan 2014, maar alleen als hij niet keyless is"', true],
  ['Hoofdrij Golf: Bouwjaar leeg (alle jaren), Sleuteltype = Baard-contact, prijs invullen —', false],
  ['dit is wat u normaal doet. Uitzonderingsrij: Bouwjaar 2014–2014, Sleuteltype = Keyless, Uitsluiten = Ja —', false],
  ['alleen de keyless-versie van bouwjaar 2014 wordt geweigerd; een niet-keyless Golf uit 2014 mag gewoon door de hoofdrij.', false],
  ['', false],
  ['Heeft één model meer dan één uitzondering nodig? Kopieer de uitzonderingsrij een keer extra.', false],
  ['De rij die het nauwkeurigst een bouwjaar en sleuteltype noemt, wint altijd — dat regelt de CRM zelf.', false],
  ['', false],
  ['Sleutel repareren en Slot/cilinder staan bovenaan elk merk als "Heel merk" — meestal niet per model verschillend.', false],
  ['', false],
  ['Klaar? Terugsturen naar het kantoor, of zelf invoeren op autosleutel24.nl/admin/mijn-vak.', true],
];
for (const [text, bold, size] of lines) {
  const row = info.addRow([text]);
  row.getCell(1).font = { bold: !!bold, size: size ?? 11, color: bold ? { argb: INK } : undefined };
  row.getCell(1).alignment = { wrapText: true };
}

/* ── sheet 2: the price list itself ──────────────────────────────────── */

const sheet = workbook.addWorksheet('Tarieven', {
  views: [{ state: 'frozen', ySplit: 1 }],
  properties: { outlineLevelRow: 3, outlineProperties: { summaryBelow: false } },
});

sheet.columns = [
  { header: 'Merk', key: 'make', width: 16 },
  { header: 'Model', key: 'model', width: 26 },
  { header: 'Bouwjaar vanaf', key: 'fromYear', width: 13 },
  { header: 'Bouwjaar tot', key: 'toYear', width: 12 },
  { header: 'Sleuteltype', key: 'keyless', width: 15 },
  { header: 'Prijs (€)', key: 'price', width: 12 },
  { header: 'Op locatie', key: 'opLocatie', width: 12 },
  { header: 'Uitsluiten', key: 'excluded', width: 11 },
  { header: 'Notities', key: 'notes', width: 46 },
];

const header = sheet.getRow(1);
header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
header.height = 22;
header.alignment = { vertical: 'middle', wrapText: true };
header.eachCell((cell) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INK } };
});
sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columns.length } };

const KEYLESS_OPTIONS = '"Beide,Keyless,Baard-contact"';
const YESNO_OPTIONS = '"Nee,Ja"';
const SCENARIO_BG = 'FFF4F1EA';

function addRow(values, outlineLevel) {
  const row = sheet.addRow(values);
  row.outlineLevel = outlineLevel;
  row.getCell('keyless').dataValidation = { type: 'list', allowBlank: true, formulae: [KEYLESS_OPTIONS] };
  // Op locatie: kan dit bij de klant, of moet het (voor een deel) naar de
  // garage/dealer — de VW-AKL-vanaf-2014-uitzondering uit serviceLimits.ts
  // is precies dit: bijmaken gewoon op locatie, AKL alleen na dealerbestelling.
  row.getCell('opLocatie').dataValidation = { type: 'list', allowBlank: false, formulae: [YESNO_OPTIONS] };
  row.getCell('excluded').dataValidation = { type: 'list', allowBlank: false, formulae: [YESNO_OPTIONS] };
  row.getCell('price').numFmt = '€ #,##0.00';
  row.getCell('price').alignment = { horizontal: 'right' };
  return row;
}

function addBrandHeader(text) {
  const row = sheet.addRow({ make: text });
  row.font = { bold: true, color: { argb: RUST } };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BG } };
  });
  row.outlineLevel = 0;
  return row;
}

/*
 * One blank exception slot under every model row: a technician who can do
 * a Golf 2005-2015 but not the 2007 model year, or a Golf 2014 only when it
 * is not keyless, needs a second, narrower row to say so — the main row
 * stays the general rule, this one is the specific override. Real gap in
 * capability.ts: coversCar() always lets the most specific row win, so this
 * is the exact shape that logic expects, not an invented column.
 */
function addExceptionRow(make, model) {
  const row = sheet.addRow({ make, model: '↳ uitzondering (optioneel)' });
  row.font = { italic: true, color: { argb: 'FF8A8578' } };
  row.outlineLevel = 3;
  row.getCell('keyless').dataValidation = { type: 'list', allowBlank: true, formulae: [KEYLESS_OPTIONS] };
  row.getCell('opLocatie').dataValidation = { type: 'list', allowBlank: true, formulae: [YESNO_OPTIONS] };
  row.getCell('excluded').dataValidation = { type: 'list', allowBlank: true, formulae: [YESNO_OPTIONS] };
  row.getCell('price').numFmt = '€ #,##0.00';
  row.getCell('price').alignment = { horizontal: 'right' };
  return row;
}

function addScenarioHeader(text) {
  const row = sheet.addRow({ model: text });
  row.font = { bold: true, italic: true };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SCENARIO_BG } };
  });
  row.outlineLevel = 1;
  return row;
}

let modelRows = 0;
for (const key of orderedKeys) {
  const make = displayName(key);
  const models = [...new Set(EXTRA_MODELS[key])].sort((a, b) => a.localeCompare(b, 'nl'));

  addBrandHeader(`${make} (${models.length} modellen)`);

  // Whole-make flat rate: reparatie/slot are labour, not per-car
  // programming (scenarios.ts: programming === false for both), so one row
  // each covers the whole make instead of one per model.
  addScenarioHeader('Sleutel repareren / Slot of cilinder (heel merk)');
  for (const scenario of ['Sleutel repareren', 'Slot of cilinder']) {
    addRow({ make, model: scenario, keyless: 'Beide', opLocatie: 'Ja', excluded: 'Nee' }, 2);
  }

  addScenarioHeader('Sleutel bijmaken (2e sleutel)');
  for (const model of models) {
    addRow({ make, model, keyless: 'Beide', opLocatie: 'Ja', excluded: 'Nee' }, 2);
    addExceptionRow(make, model);
    modelRows++;
  }

  addScenarioHeader('Alle sleutels kwijt (AKL)');
  for (const model of models) {
    addRow({ make, model, keyless: 'Beide', opLocatie: 'Ja', excluded: 'Nee' }, 2);
    addExceptionRow(make, model);
    modelRows++;
  }
}

mkdirSync(path.dirname(OUT), { recursive: true });
await workbook.xlsx.writeFile(OUT);

console.log(`${orderedKeys.length} merken, ${modelRows} model-regels -> ${path.relative(process.cwd(), OUT)}`);
