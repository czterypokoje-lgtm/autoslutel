// node --experimental-strip-types scripts/test-ops-bids.mjs
import assert from 'node:assert/strict';
import { customerPrice, customerPriceInclVat, summarizeBids } from '../src/lib/opsBids.ts';

assert.equal(customerPrice(200), 250);
assert.equal(customerPrice(199), 249);
assert.equal(customerPrice(101), 127);
assert.equal(customerPrice(19.99), 25);
assert.equal(customerPriceInclVat(200), 302.5);
assert.equal(customerPriceInclVat(199), 301.29);

const job = { id: 'j', status: 'gepland', city: 'Utrecht', car_make: 'VW', car_model: 'Golf', car_year: 2015, service_type: 'bijmaken' };
const bid = { id: 'o', job_id: 'j', bid_price: '200.00', bid_date: '2026-11-07', bid_start: '10:00', bid_end: '12:00', technicians: { name: 'Ali' } };

const [row] = summarizeBids([bid], [job]);
assert.equal(row.car, 'VW Golf 2015');
assert.equal(row.customerPrice, 250);
assert.equal(row.technician, 'Ali');

// Finished, cancelled or unknown jobs drop out.
assert.equal(summarizeBids([bid], [{ ...job, status: 'afgerond' }]).length, 0);
assert.equal(summarizeBids([bid], [{ ...job, status: 'geannuleerd' }]).length, 0);
assert.equal(summarizeBids([bid], []).length, 0);

// Nothing about the customer can leave.
assert.ok(!/phone|customer_name|email|street/i.test(Object.keys(row).join()));

console.log('ops bids: all passed');
