/**
 * The check behind /api/ops/plate: `node scripts/check-rdw-plate.mts`
 *
 * Recorded fixtures only, no network. The fixtures are the same files as in
 * claw-server/tests/fixtures, so the CRM and Claw must agree on every value.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lookupPlate, normalizePlate, PlateError, plateHash } from '../src/lib/rdwPlate.ts';

const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/rdw/${name}.json`, import.meta.url), 'utf8')) as { vehicle: unknown[]; fuel: unknown[] };

let calls = 0;
const serve = (name: string) => async (url: string) => {
  calls += 1;
  const data = fixture(name);
  const rows = url.includes('8ys7-d773') ? data.fuel : data.vehicle;
  return new Response(JSON.stringify(rows), { status: 200 });
};
const failWith = (status: number) => async () => new Response('x', { status });

// Plate forms, sidecodes 1-11.
const forms: [string, string, string, number][] = [
  ['ab-12-34', 'AB1234', 'AB-12-34', 1], ['12 34 ab', '1234AB', '12-34-AB', 2], ['12-ab-34', '12AB34', '12-AB-34', 3],
  ['ab-12-cd', 'AB12CD', 'AB-12-CD', 4], ['ab-cd-12', 'ABCD12', 'AB-CD-12', 5], ['12-ab-cd', '12ABCD', '12-AB-CD', 6],
  ['12-abc-3', '12ABC3', '12-ABC-3', 7], ['1-abc-23', '1ABC23', '1-ABC-23', 8], ['ab-123-c', 'AB123C', 'AB-123-C', 9],
  ['a-123-bc', 'A123BC', 'A-123-BC', 10], ['abc-12-d', 'ABC12D', 'ABC-12-D', 11],
];
for (const [input, plate, display, sidecode] of forms) {
  assert.deepEqual(normalizePlate(input), { plate, display, sidecode }, input);
}
assert.equal(normalizePlate(' ab123c ').plate, 'AB123C');
for (const bad of ['', 'AB12', 'AB-123-CD', 'ABCDEF', '123456', null]) {
  assert.throws(() => normalizePlate(bad), PlateError, String(bad));
}

// Values from the recorded diesel taxi.
const d = await lookupPlate('zz-999-z', { fetchImpl: serve('plate-diesel-taxi'), useCache: false });
assert.equal(d.status, 'ok');
assert.equal(d.summary, 'Mercedes-Benz C 250 CDI 2012');
const v = d.vehicle!;
assert.deepEqual([v.first_registration, v.year, v.last_owner_change, v.apk_expiry], ['2012-01-28', 2012, '2026-11-02', '2026-11-21']);
assert.deepEqual([v.catalogue_price, v.colour, v.colour_second], [63412, 'ZWART', null]);
assert.deepEqual([v.taxi, v.export, v.open_recall], [true, false, false]);
assert.deepEqual(v.fuel, ['Diesel']);
assert.deepEqual([v.version.type, v.version.variant, v.version.uitvoering], ['204 K', 'H2S3M0', 'NZAAA542']);
assert.equal(v.key_hint, null, 'no key hint is invented for a diesel');

// Hybrid, export, missing price.
const h = (await lookupPlate('ZY888Y', { fetchImpl: serve('plate-hybrid-export'), useCache: false })).vehicle!;
assert.deepEqual(h.fuel, ['Benzine', 'Elektriciteit']);
assert.equal(h.catalogue_price, null);
assert.deepEqual([h.export, h.taxi, h.colour_second], [true, false, 'WIT']);
assert.match(h.key_hint!, /^hybride:.*indicatie/);

// Not found.
const none = await lookupPlate('ZZ999Z', { fetchImpl: serve('plate-empty'), useCache: false });
assert.deepEqual([none.status, none.vehicle], ['not_found', null]);

// Cache: second call free, 24 h then refresh; not found only 1 h.
let clock = 1_800_000_000_000;
const now = () => clock;
calls = 0;
const a = await lookupPlate('ZX777X', { fetchImpl: serve('plate-diesel-taxi'), now });
const b = await lookupPlate('zx-777-x', { fetchImpl: serve('plate-diesel-taxi'), now });
assert.deepEqual([calls, a.cached, b.cached], [2, false, true]);
clock += 23 * 3600_000;
await lookupPlate('ZX777X', { fetchImpl: serve('plate-diesel-taxi'), now });
assert.equal(calls, 2, 'fresh after 23 h');
clock += 2 * 3600_000;
await lookupPlate('ZX777X', { fetchImpl: serve('plate-diesel-taxi'), now });
assert.equal(calls, 4, 'refreshed after 25 h');
calls = 0;
await lookupPlate('ZW666W', { fetchImpl: serve('plate-empty'), now });
await lookupPlate('ZW666W', { fetchImpl: serve('plate-empty'), now });
assert.equal(calls, 1, 'not found cached once');
clock += 2 * 3600_000;
await lookupPlate('ZW666W', { fetchImpl: serve('plate-empty'), now });
assert.equal(calls, 2, 'not found retried after 2 h');

// RDW failures give clear, typed errors.
const err = async (fetchImpl: (url: string) => Promise<Response>) => {
  try { await lookupPlate('ZZ999Z', { fetchImpl, useCache: false }); } catch (e) { return e as PlateError; }
  throw new Error('expected an error');
};
const timeout = await err(async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; });
assert.deepEqual([timeout.message, timeout.retry, timeout.httpStatus], ['RDW did not answer in time', true, 504]);
const down = await err(async () => { throw new TypeError('fetch failed'); });
assert.deepEqual([down.message, down.retry, down.httpStatus], ['could not reach RDW', true, 502]);
assert.deepEqual([(await err(failWith(503))).retry, (await err(failWith(429))).retry, (await err(failWith(404))).retry], [true, true, false]);
const odd = await err(async () => new Response('{"a":1}', { status: 200 }));
assert.equal(odd.message, 'RDW answer has an unexpected shape');

// The audit hash is short, stable and not the plate.
assert.match(plateHash('AB123C'), /^[0-9a-f]{12}$/);
assert.notEqual(plateHash('AB123C'), 'AB123C');

console.log('rdwPlate: all checks passed');
