/**
 * The one check behind the city-page technician lookup:
 * `node scripts/check-city-technician.mts`.
 *
 * What it is guarding: before this lookup existed every city page named the
 * same person, including cities 200 km from his base. The failure this test
 * exists to catch is a silent return to that — a fallback that picks the
 * first technician in the array rather than the nearest one looks fine in
 * review and puts a Bussum name back on the Maastricht page.
 */
import assert from 'node:assert/strict';
import { CITIES } from '../src/config/cities.ts';
import { parseWerkgebied, coversPostcode } from '../src/lib/crmJobs.ts';
import {
  findCityTechnician,
  arrivalWindow,
  haversineKm,
  type PublicTechnician,
} from '../src/lib/cityTechnician.ts';

const tech = (over: Partial<PublicTechnician> & { id: string; name: string }): PublicTechnician => ({
  active: true, werkgebied: [], base_lat: null, base_lng: null, base_city: null,
  photo_url: null, certifications: null, gbp_url: null, ...over,
});

const city = (slug: string) => {
  const c = CITIES.find((x) => x.slug === slug);
  assert.ok(c, `city ${slug} missing from CITIES`);
  return c;
};

// Every city carries a usable four-digit postcode — the whole lookup rests on it.
assert.equal(CITIES.length, 62);
for (const c of CITIES) {
  assert.match(c.postcode, /^\d{4}$/, `${c.slug} has a bad postcode: ${c.postcode}`);
}

// Bussum base, Limburg partner. Both placed, both active.
const berkan = tech({ id: 'b', name: 'Berkan', werkgebied: ['1400-1499', '3500-3599'], base_lat: 52.274, base_lng: 5.1611, base_city: 'Bussum' });
const limburg = tech({ id: 'l', name: 'Limburg partner', werkgebied: ['6000-6999'], base_lat: 50.8514, base_lng: 5.691, base_city: 'Maastricht' });
const roster = [berkan, limburg];

// A city inside a werkgebied resolves to the partner who covers it.
assert.equal(findCityTechnician(city('maastricht'), roster)!.technician.id, 'l');
assert.equal(findCityTechnician(city('maastricht'), roster)!.covered, true);
assert.equal(findCityTechnician(city('bussum'), roster)!.technician.id, 'b');
assert.equal(findCityTechnician(city('utrecht'), roster)!.technician.id, 'b');

// Heerlen (6411) and Roermond (6041) are the partner's too — the range, not the name, decides.
assert.equal(findCityTechnician(city('heerlen'), roster)!.technician.id, 'l');
assert.equal(findCityTechnician(city('roermond'), roster)!.technician.id, 'l');

// THE REGRESSION THIS FILE EXISTS FOR: a city nobody covers falls back to the
// geographically nearest, not to the first in the array. Venlo is uncovered
// here and must still not resolve to Bussum.
const uncovered = [tech({ ...berkan, werkgebied: [] }), tech({ ...limburg, werkgebied: [] })];
const venlo = findCityTechnician(city('venlo'), uncovered)!;
assert.equal(venlo.technician.id, 'l', 'uncovered city must fall back to nearest, not first');
assert.equal(venlo.covered, false, 'a fallback must not claim to be covered');

// Coverage beats proximity: a covering technician wins even when further away.
const farButCovering = tech({ id: 'f', name: 'Far', werkgebied: ['5900-5999'], base_lat: 53.2194, base_lng: 6.5665 });
assert.equal(findCityTechnician(city('venlo'), [limburg, farButCovering])!.technician.id, 'f');

// An inactive technician is never shown, and an empty roster returns null.
assert.equal(findCityTechnician(city('maastricht'), [tech({ ...limburg, active: false })]), null);
assert.equal(findCityTechnician(city('maastricht'), []), null);

// A technician with no base coordinates sorts last — unknown is not near.
const placed = tech({ id: 'p', name: 'Placed', base_lat: 52.09, base_lng: 5.12 });
const unplaced = tech({ id: 'u', name: 'Unplaced' });
assert.equal(findCityTechnician(city('utrecht'), [unplaced, placed])!.technician.id, 'p');

// Distance is real: Bussum->Maastricht is far further than Bussum->Utrecht.
const toMaastricht = haversineKm(52.274, 5.1611, 50.8514, 5.691);
const toUtrecht = haversineKm(52.274, 5.1611, 52.0907, 5.1214);
assert.ok(toMaastricht > 150, `Bussum->Maastricht should be >150km, got ${toMaastricht}`);
assert.ok(toUtrecht < 30, `Bussum->Utrecht should be <30km, got ${toUtrecht}`);

// And the arrival window follows the distance rather than a fixed string.
const near = arrivalWindow(toUtrecht)!;
const far = arrivalWindow(toMaastricht)!;
const low = (s: string) => Number(s.split('-')[0]);
assert.ok(low(far) > low(near), `far window (${far}) must exceed near (${near})`);
assert.ok(low(far) > 60, `a 200km drive cannot start with "30-60 min", got ${far}`);
assert.equal(arrivalWindow(null), null, 'unknown distance must promise nothing');

// THE OTHER REGRESSION THIS FILE EXISTS FOR: a roster of technicians that
// carry no werkgebied and no base coordinates — which is exactly what the CRM
// held when this was written, 56 of 66 rows named "[TEST] ..." — must name
// NOBODY. Returning the first row would publish a test account on 62 pages.
const unplaceable = [
  tech({ id: 't1', name: '[TEST] NL-01' }),
  tech({ id: 't2', name: '[TEST] DE-07' }),
  tech({ id: 't3', name: 'Onze Yusuf Utrecht' }),
];
assert.equal(
  findCityTechnician(city('utrecht'), unplaceable),
  null,
  'technicians with no werkgebied and no base must never be published',
);

// One placeable technician among unplaceable ones wins regardless of order.
const placeable = tech({ id: 'ok', name: 'Echte monteur', werkgebied: ['3500-3599'], base_lat: 52.09, base_lng: 5.12 });
assert.equal(findCityTechnician(city('utrecht'), [...unplaceable, placeable])!.technician.id, 'ok');
assert.equal(findCityTechnician(city('utrecht'), [placeable, ...unplaceable])!.technician.id, 'ok');

// THE CHAIN THE ADMIN SCREEN DEPENDS ON: the office ticks towns, and what
// gets stored must be a werkgebied that dispatch and the city pages actually
// match against. Ticking Maastricht and finding it uncovered would be
// invisible in the UI — it saves, it just never takes effect.
const ticked = ['maastricht', 'venlo', 'heerlen'];
const derived = [...new Set(CITIES.filter((c) => ticked.includes(c.slug)).map((c) => c.postcode))].sort();
const stored = parseWerkgebied(derived.join(', '));
assert.deepEqual(stored, derived, 'parseWerkgebied must keep every bare four-digit prefix');

for (const slug of ticked) {
  const c = city(slug);
  assert.ok(stored.some((r) => coversPostcode(r, c.postcode)), `${slug} must be covered by what was saved`);
}
assert.ok(
  !stored.some((r) => coversPostcode(r, city('utrecht').postcode)),
  'a town nobody ticked must not end up covered',
);

const limburgPartner = tech({ id: 'lp', name: 'Limburg partner', werkgebied: stored, base_lat: 50.85, base_lng: 5.69 });
const resolved = findCityTechnician(city('maastricht'), [limburgPartner])!;
assert.equal(resolved.technician.id, 'lp');
assert.equal(resolved.covered, true, 'a ticked town must report as covered, not as a nearest-fallback');

console.log('check-city-technician: all assertions passed');
