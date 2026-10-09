/**
 * What the car finder answers, for cars people actually drive.
 *
 * Run it after touching src/lib/finder.ts or scripts/taxonomy.mjs:
 *
 *   npx tsx scripts/check-finder.mts
 *
 * The number that matters is not `exact` — it is that no row is empty across
 * all three groups. A strict make→model→year filter on this catalogue returned
 * 0 articles for a Mercedes C-Klasse and 1 for a Yaris, which is why
 * finder.ts ranks on model instead of filtering on it. If a row here ever goes
 * to 0/0/0, a visitor with that car sees an empty shop.
 */
import {
  findForCar,
  shopMakes,
  shopModels,
  shopYears,
  fitClass,
  isSellable,
} from '../src/lib/finder';

const makes = shopMakes();
console.log(`${makes.length} makes have a consumer shelf\n`);
console.log(
  makes
    .slice(0, 14)
    .map((m) => `${m.make} ${m.count}(${m.sellable})`)
    .join('  ')
);

/*
 * A make with articles but nothing sellable is service-only. Worth printing:
 * the finder must not offer those makes a shop shelf it cannot fill, and a
 * make appearing here unexpectedly means a taxonomy change moved its parts.
 */
const serviceOnly = makes.filter((m) => m.sellable === 0);
console.log(
  `\nservice-only makes (nothing a customer can fit): ${
    serviceOnly.map((m) => m.make).join(', ') || 'none'
  }`
);

const CARS: [string, string | undefined, number | undefined][] = [
  ['Mercedes-Benz', 'C-Klasse', 2016],
  ['Mercedes-Benz', undefined, undefined],
  ['Toyota', 'Yaris', 2015],
  ['Volkswagen', 'Golf', 2012],
  ['Volkswagen', 'Golf', 1998],
  ['Volkswagen', 'Transporter', 2019],
  ['Kia', 'Ceed', 2014],
  ['Renault', 'Clio', 2008],
  ['Ford', 'Fiesta', 2011],
  ['Audi', 'A3', 2009],
  ['Opel', 'Astra', 2010],
  ['Peugeot', '308', 2013],
];

console.log('\ncar                              exact  same-make  service  model unknown');
let empty = 0;
for (const [make, model, year] of CARS) {
  const r = findForCar({ make, model, year });
  const total = r.exact.length + r.sameMake.length + r.service.length;
  if (total === 0) empty += 1;
  const label = `${make} ${model ?? '(geen model)'} ${year ?? ''}`.trim();
  console.log(
    label.padEnd(32),
    String(r.exact.length).padStart(5),
    String(r.sameMake.length).padStart(10),
    String(r.service.length).padStart(8),
    '  ',
    r.modelUnknown ? 'ja' : 'nee'
  );
}

const golf = findForCar({ make: 'Volkswagen', model: 'Golf', year: 2012 });
console.log('\nGolf 2012, the exact group:');
for (const m of golf.exact.slice(0, 8)) {
  console.log(
    '  ',
    fitClass(m.product).padEnd(14),
    (m.product.category ?? '').padEnd(18),
    m.product.titleNl.slice(0, 48)
  );
}

const years = shopYears('Volkswagen', 'Golf');
console.log(
  `\nVolkswagen: ${shopModels('Volkswagen').length} models offered · Golf years ${
    years.length ? `${years.at(-1)}–${years[0]}` : 'none stated'
  }`
);

console.log(
  `\n${empty === 0 ? 'No empty shelves.' : `FAILURE: ${empty} car(s) return nothing at all.`}`
);
if (empty > 0) process.exit(1);
