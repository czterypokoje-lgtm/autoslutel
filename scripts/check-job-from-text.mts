/**
 * The check behind /nieuw: `node scripts/check-job-from-text.mts`
 *
 * Every case is a line the office might realistically type while a customer
 * is still on the phone. The ones that matter most are the refusals — a
 * misparsed postcode sends a van to the wrong town, which costs more than
 * making somebody retype a line.
 */
import assert from 'node:assert/strict';
import { parseJobLine } from '../src/lib/jobFromText.ts';

const at = (line: string) => parseJobLine(line);

// The full line.
const full = at('/nieuw Jan de Vries | 0612345678 | Peugeot 107 2010 | 1012AB Amsterdam | bijmaken | 150')!;
assert.equal(full.customer_name, 'Jan de Vries');
assert.equal(full.customer_phone, '0612345678');
assert.equal(full.car_make, 'Peugeot');
assert.equal(full.car_model, '107');
assert.equal(full.car_year, 2010);
assert.equal(full.postcode, '1012AB');
assert.equal(full.city, 'Amsterdam');
assert.equal(full.scenario, 'bijmaken');
assert.equal(full.quoted_price, 150);

// A multi-word model keeps its words; the year still comes off the end.
const golf = at('/nieuw | | Volkswagen Golf Sportsvan 2018 | 3500 Utrecht | alle sleutels kwijt |')!;
assert.equal(golf.car_model, 'Golf Sportsvan');
assert.equal(golf.car_year, 2018);
assert.equal(golf.scenario, 'alle_sleutels_kwijt');
assert.equal(golf.customer_name, null);
assert.equal(golf.quoted_price, null);

// Four digits that are not a year stay part of the model.
assert.equal(at('/nieuw | | Volkswagen Golf 1600 | Utrecht | |')!.car_model, 'Golf 1600');

// Postcode with a space, and in lower case.
const place = at('/nieuw | | Opel Corsa | 1012 ab amsterdam | |')!;
assert.equal(place.postcode, '1012AB');
assert.equal(place.city, 'amsterdam');

// A town with no postcode is still a place.
assert.equal(at('/nieuw | | Ford Focus | Bussum | |')!.city, 'Bussum');
assert.equal(at('/nieuw | | Ford Focus | Bussum | |')!.postcode, null);

// Price written the way people write it.
assert.equal(at('/nieuw | | Kia | Almere | | € 249,50')!.quoted_price, 249.5);

// Refusals: nothing to drive to and nothing to open.
assert.equal(at('/nieuw'), null);
assert.equal(at('/nieuw Jan de Vries | 0612345678 | | | |'), null);

// An unknown service is kept as text but claims no scenario — guessing one
// would price the job out of the wrong row of a technician's list.
const vague = at('/nieuw | | Seat Ibiza | Amsterdam | contactslot reparatie | 200')!;
assert.equal(vague.service_type, 'contactslot reparatie');
assert.equal(vague.scenario, null);

console.log('jobFromText: all checks passed');
