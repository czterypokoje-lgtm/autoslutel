/**
 * The one check behind job routing: `node scripts/check-dispatch.mts`.
 *
 * Both cases here are bugs that were live. Each is the same mistake: absent
 * data taking the most favourable branch, which is invisible in review because
 * nothing errors — the wrong technician simply gets the job.
 */
import assert from 'node:assert/strict';
import { planDispatch, openAt, type Candidate } from '../src/lib/dispatch.ts';
import { getClientIp } from '../src/lib/rateLimit.ts';

const tech = (over: Partial<Candidate> & { id: string }): Candidate => ({
  name: over.id, werkgebied: [], base_lat: null, base_lng: null, online: false,
  tier: 'starter', coverage: [{ technician_id: over.id, make: 'Volkswagen', model: null,
    scenario: 'bijmaken', from_year: null, to_year: null, excluded: false, keyless: null } as never],
  vanStock: [], busyInSlot: 0, acceptRate: null, ...over,
});

const job = { car: { make: 'Volkswagen', model: 'Golf', year: 2018 }, scenario: 'bijmaken',
  postcode: '1011AB', lat: null, lng: null, articleCode: null, keyless: null } as never;

// A declared area that does not cover the job is rejected, as it always was.
const far = tech({ id: 'far', werkgebied: ['6000-6999'] });
const near = tech({ id: 'near', werkgebied: ['1000-1099'] });
let plan = await planDispatch([far, near], job);
assert.deepEqual(plan.offers.map((o) => o.technicianId), ['near']);
assert.deepEqual(plan.rejected.map((r) => r.gate), ['buiten_gebied']);

// REGRESSION 1: an empty werkgebied used to SKIP the geography gate, so a
// technician who declared no area at all was offered every job in the country.
// They must not beat someone who actually covers the postcode.
const undeclared = tech({ id: 'undeclared' });
plan = await planDispatch([undeclared, near], job);
assert.deepEqual(plan.offers.map((o) => o.technicianId), ['near'],
  'an undeclared area must never outrank a declared one that covers the job');
assert.ok(plan.rejected.some((r) => r.id === 'undeclared'));

// ...but they are the fallback rather than a dead end, so a roster that has not
// been filled in yet still dispatches instead of silently offering nothing.
plan = await planDispatch([undeclared], job);
assert.deepEqual(plan.offers.map((o) => o.technicianId), ['undeclared']);
assert.equal(plan.empty, false);

// Nobody at all is still nobody.
assert.equal((await planDispatch([far], job)).empty, true);

// REGRESSION 2: with no base coordinates the drive-time origin used to fall
// back to the JOB's own location — a zero-second drive and full marks. With no
// job coordinates no Maps call happens at all, so both score off postcode and
// the one whose area actually contains 1011 must win.
const placedFar = tech({ id: 'placedFar', werkgebied: ['1000-1099'], base_lat: 50.85, base_lng: 5.69 });
const unplacedNear = tech({ id: 'unplacedNear', werkgebied: ['1000-1099'] });
plan = await planDispatch([unplacedNear, placedFar], job);
assert.equal(plan.offers.length, 2, 'both cover the area, both get offered');
assert.ok(plan.offers.every((o) => !/binnen half uur/.test(o.reason)),
  'no drive time was measured, so nothing may claim one');

// Tier waves: premium opens first and the next wave starts before it expires.
const prem = tech({ id: 'p', werkgebied: ['1000-1099'], tier: 'premium' });
const start = tech({ id: 's', werkgebied: ['1000-1099'], tier: 'starter' });
plan = await planDispatch([start, prem], job);
const byId = Object.fromEntries(plan.offers.map((o) => [o.technicianId, o]));
assert.equal(byId.p.opensAfter, 0);
assert.ok(byId.s.opensAfter > 0, 'starter waits for the premium head start');
assert.ok(byId.s.opensAfter < byId.p.expiresAfter, 'no gap where nobody can accept');
assert.deepEqual(openAt(plan, 0).map((o) => o.technicianId), ['p']);

// REGRESSION 3: the rate limiter keyed on the FIRST x-forwarded-for entry,
// which the caller writes. Rotating it gave a fresh bucket every request.
const ip = (h: Record<string, string>) => getClientIp(new Request('https://x/', { headers: h }));
assert.equal(ip({ 'x-forwarded-for': '9.9.9.9, 203.0.113.7' }), '203.0.113.7',
  'the proxy-observed address is last, not first');
assert.equal(ip({ 'x-vercel-forwarded-for': '203.0.113.7', 'x-forwarded-for': '9.9.9.9' }), '203.0.113.7',
  'the platform header wins over anything the client sent');
assert.equal(ip({ 'x-real-ip': '203.0.113.7' }), '203.0.113.7');
assert.equal(ip({}), 'unknown');

console.log('check-dispatch: all assertions passed');
