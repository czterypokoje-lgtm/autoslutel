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
import {
  findCityTechnician,
  arrivalWindow,
  haversineKm,
  type PublicTechnician,
} from '../src/lib/cityTechnician.ts';

const tech = (over: Partial<PublicTechnician> & { id: string; name: string }): PublicTechnician => ({
  active: true, werkgebied: [], base_lat: null, base_lng: null, base_city: null,
  photo_url: null, certifications: null, gbp_url: null, phone: null, ...over,
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

console.log('check-city-technician: all assertions passed');
