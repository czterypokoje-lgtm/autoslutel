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
};

export function mergeExtraModels(catalog: CatalogMake[]): CatalogMake[] {
  const byMake = new Map(catalog.map((m) => [m.make.toLowerCase(), m]));

  for (const make of catalog) {
    const extra = EXTRA_MODELS[make.make.toLowerCase()];
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
