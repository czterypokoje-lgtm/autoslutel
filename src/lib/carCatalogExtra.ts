import type { CatalogMake, CatalogModel } from './carCatalog';

/**
 * Real model lineups for the makes that actually matter (the same real-
 * demand ranking from technician_coverage's own derivation: Volkswagen, BMW,
 * Kia, Mercedes-Benz, Peugeot, Fiat, Opel, Toyota, Ford, Renault, Nissan,
 * Hyundai, Citroen, Volvo, Audi — every real production model, not just
 * whichever ones the webshop happens to stock a retail key blank for.
 *
 * Coverage is a different question from retail stock: a technician can cut
 * and program a key for a BMW i5 whether or not the webshop separately
 * sells a "BMW i5 key" product. carCatalog.ts's own list was scoped to the
 * webshop's parts catalogue, which is right for a product page and wrong
 * for "which cars can this technician service" — this file is the second,
 * broader source that gets merged in for that purpose only.
 *
 * keyless/nonKeyless are set from when each model line actually shipped a
 * push-button start (real, public knowledge, not invented): most modern
 * makes offer both across a long enough run, so both flags are usually true
 * rather than guessing a hard cutover year per model.
 */
const BOTH = { keyless: true, nonKeyless: true };

export const EXTRA_MODELS: Record<string, string[]> = {
  bmw: [
    '1 Serie', '2 Serie', '3 Serie', '4 Serie', '5 Serie', '6 Serie', '7 Serie', '8 Serie',
    'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
    'Z3', 'Z4',
    'M2', 'M3', 'M4', 'M5', 'M6', 'M8',
    'i3', 'i4', 'i5', 'i7', 'i8', 'iX', 'iX1', 'iX2', 'iX3',
  ],
  ford: [
    'B-Max', 'C-Max', 'Grand C-Max', 'Cougar', 'Courier', 'EcoSport', 'Edge', 'Escape',
    'Escort', 'Explorer', 'F-150', 'Fiesta', 'Focus', 'Fusion', 'Galaxy',
    'KA', 'KA+', 'Kuga', 'Mondeo', 'Mustang', 'Mustang Mach-E', 'Puma',
    'Ranger', 'S-Max', 'Tourneo', 'Transit', 'Transit Connect', 'Transit Courier', 'Transit Custom',
  ],
  volkswagen: [
    'Up!', 'Polo', 'Golf', 'Golf Sportsvan', 'Jetta', 'Passat', 'Passat CC', 'Arteon',
    'T-Cross', 'T-Roc', 'Taigo', 'Tiguan', 'Touran', 'Touareg', 'Sharan',
    'Caddy', 'Transporter', 'Crafter', 'Amarok', 'Beetle', 'Scirocco', 'Fox', 'Lupo',
    'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID. Buzz',
  ],
  kia: [
    'Picanto', 'Rio', 'Stonic', 'Ceed', 'ProCeed', 'XCeed', 'Niro', 'Soul',
    'Sportage', 'Sorento', 'Carens', 'Venga', 'Optima', 'Stinger', 'Cee\'d',
    'EV6', 'EV9', 'Picanto X-Line',
  ],
  'mercedes-benz': [
    'A-Klasse', 'B-Klasse', 'C-Klasse', 'CLA', 'CLS', 'E-Klasse', 'S-Klasse',
    'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasse',
    'CLK', 'SLK', 'SL', 'SLC', 'Vito', 'Sprinter', 'Citan', 'V-Klasse',
    'EQA', 'EQB', 'EQC', 'EQE', 'EQS',
  ],
  peugeot: [
    '106', '107', '108', '206', '207', '208', '2008', '301', '306', '307', '308',
    '3008', '406', '407', '408', '5008', '508', 'Bipper', 'Boxer', 'Expert', 'Partner', 'RCZ', 'Rifter', 'Traveller',
  ],
  fiat: [
    'Panda', '500', '500L', '500X', 'Punto', 'Punto Evo', 'Tipo', 'Bravo', 'Doblo',
    'Ducato', 'Scudo', 'Talento', 'Qubo', 'Croma', 'Idea', 'Sedici', 'Freemont', '124 Spider',
  ],
  opel: [
    'Adam', 'Agila', 'Astra', 'Astra GTC', 'Combo', 'Corsa', 'Crossland', 'Grandland',
    'Insignia', 'Meriva', 'Mokka', 'Movano', 'Vectra', 'Vivaro', 'Zafira', 'Karl', 'Antara', 'Ampera',
  ],
  toyota: [
    'Aygo', 'Yaris', 'Yaris Cross', 'Corolla', 'Corolla Verso', 'Auris', 'Avensis',
    'Camry', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Prius', 'Prius+',
    'Proace', 'Proace City', 'Hilux', 'Verso', 'Verso-S', 'Supra', 'GT86', 'bZ4X',
  ],
  renault: [
    'Twingo', 'Clio', 'Captur', 'Megane', 'Megane E-Tech', 'Scenic', 'Grand Scenic',
    'Talisman', 'Laguna', 'Espace', 'Kadjar', 'Koleos', 'Arkana', 'Austral', 'Zoe',
    'Kangoo', 'Trafic', 'Master', 'Wind',
  ],
  nissan: [
    'Micra', 'Note', 'Leaf', 'Juke', 'Qashqai', 'X-Trail', 'Ariya',
    'Almera', 'Primera', 'Pulsar', 'Navara', 'NV200', 'NV300', 'Interstar', 'Pathfinder', '370Z', 'GT-R',
  ],
  hyundai: [
    'i10', 'i20', 'i30', 'i40', 'ix20', 'ix35', 'Kona', 'Tucson', 'Santa Fe',
    'Bayon', 'Getz', 'Accent', 'Elantra', 'Matrix', 'Terracan', 'Ioniq', 'Ioniq 5', 'Ioniq 6',
  ],
  citroen: [
    'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Cactus', 'C4 Picasso',
    'C4 Spacetourer', 'C5', 'C5 Aircross', 'C6', 'C8', 'Berlingo', 'Jumper', 'Jumpy', 'Nemo', 'DS3', 'DS4', 'DS5',
  ],
  volvo: [
    'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90',
    'XC40', 'XC60', 'XC70', 'XC90', 'C30', 'C70',
  ],
  audi: [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron',
    'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'e-tron GT',
  ],
  seat: [
    'Mii', 'Ibiza', 'Leon', 'Toledo', 'Arona', 'Ateca', 'Tarraco', 'Alhambra',
    'Altea', 'Altea XL', 'Exeo', 'Cordoba', 'Inca',
  ],
  chevrolet: [
    'Spark', 'Aveo', 'Kalos', 'Cruze', 'Lacetti', 'Matiz', 'Nubira', 'Orlando',
    'Captiva', 'Trax', 'Epica', 'Evanda', 'Tacuma', 'Camaro', 'Corvette',
  ],
  mini: [
    'One', 'Cooper', 'Cooper S', 'Clubman', 'Countryman', 'Paceman',
    'Cabrio', 'Coupé', 'Roadster', 'Electric',
  ],
  mitsubishi: [
    'Colt', 'Space Star', 'Lancer', 'Outlander', 'ASX', 'Eclipse Cross',
    'Pajero', 'Pajero Pinin', 'L200', 'Grandis', 'Carisma', 'i-MiEV',
  ],
  mazda: [
    '2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-9',
    'MX-5', 'MX-30', 'RX-8', 'Premacy', 'Tribute', 'BT-50',
  ],

  /* ── the rest of the catalogue's makes, so none falls back to the feed ── */

  abarth: ['500', '595', '695', '124 Spider', 'Grande Punto', 'Punto Evo'],
  'alfa romeo': [
    '147', '156', '159', '166', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV',
    'Mito', 'Spider', 'Stelvio', 'Tonale', '4C', '8C',
  ],
  'aston martin': ['DB7', 'DB9', 'DB11', 'DBS', 'DBX', 'Rapide', 'Vanquish', 'Vantage'],
  dacia: ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Sandero', 'Spring'],
  daewoo: ['Espero', 'Kalos', 'Lanos', 'Leganza', 'Matiz', 'Nexia', 'Nubira', 'Tacuma'],
  honda: [
    'Accord', 'City', 'Civic', 'CR-V', 'CR-Z', 'e', 'FR-V', 'HR-V', 'Insight',
    'Jazz', 'Legend', 'Prelude', 'S2000', 'Stream', 'ZR-V',
  ],
  infiniti: ['EX', 'FX', 'G37', 'M', 'Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX70'],
  isuzu: ['D-Max', 'N-Series', 'Rodeo', 'Trooper'],
  iveco: ['Daily', 'Eurocargo', 'S-Way', 'Stralis'],
  jaguar: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'],
  jeep: [
    'Avenger', 'Cherokee', 'Commander', 'Compass', 'Grand Cherokee', 'Patriot',
    'Renegade', 'Wrangler',
  ],
  lancia: ['Delta', 'Flavia', 'Musa', 'Phedra', 'Thesis', 'Voyager', 'Ypsilon'],
  'land rover': [
    'Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover',
    'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar',
  ],
  lexus: ['CT', 'ES', 'GS', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'RZ', 'UX'],
  maserati: ['GranCabrio', 'GranTurismo', 'Grecale', 'Ghibli', 'Levante', 'MC20', 'Quattroporte'],
  porsche: [
    '911', '718 Boxster', '718 Cayman', 'Boxster', 'Cayenne', 'Cayman',
    'Macan', 'Panamera', 'Taycan',
  ],
  saab: ['900', '9000', '9-3', '9-5', '9-7X'],
  smart: ['Forfour', 'Fortwo', 'Roadster', '#1', '#3'],
  subaru: [
    'BRZ', 'Forester', 'Impreza', 'Justy', 'Legacy', 'Levorg', 'Outback',
    'Solterra', 'Tribeca', 'XV',
  ],
  suzuki: [
    'Across', 'Alto', 'Baleno', 'Celerio', 'Grand Vitara', 'Ignis', 'Jimny',
    'S-Cross', 'Splash', 'Swift', 'SX4', 'Vitara', 'Wagon R',
  ],
  skoda: [
    'Citigo', 'Enyaq', 'Fabia', 'Felicia', 'Kamiq', 'Karoq', 'Kodiaq',
    'Octavia', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti',
  ],
};

export function mergeExtraModels(catalog: CatalogMake[]): CatalogMake[] {
  const byMake = new Map(catalog.map((m) => [m.make.toLowerCase(), m]));

  for (const make of catalog) {
    const extra = EXTRA_MODELS[makeKey(make.make)];
    if (!extra) continue;
    const existingModels = new Set(make.models.map((m) => m.model.toLowerCase()));
    const added: CatalogModel[] = extra
      .filter((name) => !existingModels.has(name.toLowerCase()))
      .map((name) => ({ model: name, fromYear: null, toYear: null, ...BOTH }));
    if (added.length) {
      make.models = [...make.models, ...added].sort((a, b) => a.model.localeCompare(b.model, 'nl'));
    }
  }

  // A make with a real extra list but zero webshop products at all yet —
  // still worth offering for coverage even with nothing sold for it.
  for (const [key, models] of Object.entries(EXTRA_MODELS)) {
    if (byMake.has(key)) continue;
    const label = models.length ? key : key;
    catalog.push({
      make: label.replace(/\b\w/g, (c) => c.toUpperCase()),
      models: models.map((name) => ({ model: name, fromYear: null, toYear: null, ...BOTH })),
    });
  }

  return catalog.sort((a, b) => a.make.localeCompare(b.make, 'nl'));
}

/**
 * The models to offer a monteur for a make, clean.
 *
 * Where a curated lineup exists it is used on its own, and the supplier feed
 * is ignored entirely for that make. catalog.json holds parts fitment, not a
 * model list, and a part that fits several cars drags their names along with
 * it — so Fiat arrives carrying "Gilera" (a motorcycle marque) and "Maruti"
 * (an Indian make), Opel carries "Kangoo", "Ram", "Holden" and "Saturn",
 * Volkswagen carries "5k 0 959 753 Ad" and "Keylessgo", and several makes
 * carry "Oldtimerschlüssel" and "Schlüsselblatt Sx9", which are product
 * categories rather than cars. Alongside those sit plain misspellings
 * ("Tuareg", "Caravele", "Beatle") and the German supplier's "U.a" —
 * "unter anderem", meaning "among others".
 *
 * Filtering that by hand would be a blocklist with no end. The curated lists
 * cover all twenty makes that appear in real jobs, so for those the feed adds
 * nothing but noise. Makes outside the twenty still fall back to it: an
 * imperfect list beats an empty one, and the monteur can read.
 */
/**
 * Accents folded away for lookup.
 *
 * The supplier writes "Citroën" and "Škoda"; our own lists are keyed plainly.
 * Without folding, Citroën matched no curated list and fell back to the feed
 * while Citroen matched one — so the picker showed the make twice, once clean
 * and once full of junk.
 */
export function makeKey(make: string): string {
  return make
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function pickerModels(make: string, fromCatalogue: string[]): string[] {
  const curated = EXTRA_MODELS[makeKey(make)];
  const source = curated ?? fromCatalogue;

  const seen = new Map<string, string>();
  for (const model of source) {
    const name = model.trim();
    if (!name) continue;
    if (!seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'nl'));
}
