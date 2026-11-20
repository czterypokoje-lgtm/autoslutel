import assert from 'node:assert/strict';
import { parseStaffQuery, amsterdamStart, periodBounds } from '../src/lib/kfcStaffFilters.ts';

// Friday 20 November 2026.
const today = '2026-11-20';
const q = (message: string) => parseStaffQuery(message, today);
const period = (message: string) => q(message).period;

// Periods: explicit, relative and Dutch.
assert.deepEqual(period('Order report for October 2026'), { from: '2026-10-01', to: '2026-10-31' });
assert.deepEqual(period('Bestellingen voor oktober 2026'), { from: '2026-10-01', to: '2026-10-31' });
assert.deepEqual(period('Orders between 2026-11-01 and 2026-11-10'), { from: '2026-11-01', to: '2026-11-10' });
assert.deepEqual(period('Bestellingen tussen 1-11-2026 en 10-11-2026'), { from: '2026-11-01', to: '2026-11-10' });
assert.deepEqual(period('orders from 3 November 2026 to 5 November 2026'), { from: '2026-11-03', to: '2026-11-05' });
assert.deepEqual(period('orders on March 3, 2026'), { from: '2026-03-03', to: '2026-03-03' });
assert.deepEqual(period('orders since 2026-11-15'), { from: '2026-11-15', to: today });
assert.deepEqual(period('orders 2026-11-10 to 2026-11-01'), { from: '2026-11-01', to: '2026-11-10' });
assert.deepEqual(period('order report Q3 2026'), { from: '2026-07-01', to: '2026-09-30' });
assert.deepEqual(period('orders in 2025'), { from: '2025-01-01', to: '2025-12-31' });
assert.deepEqual(period('orders today'), { from: today, to: today });
assert.deepEqual(period('bestellingen gisteren'), { from: '2026-11-19', to: '2026-11-19' });
assert.deepEqual(period('orders this week'), { from: '2026-11-16', to: today });
assert.deepEqual(period('bestellingen vorige week'), { from: '2026-11-09', to: '2026-11-15' });
assert.deepEqual(period('orders this month'), { from: '2026-11-01', to: today });
assert.deepEqual(period('orders last month'), { from: '2026-10-01', to: '2026-10-31' });
assert.deepEqual(period('orders last 7 days'), { from: '2026-11-14', to: today });
assert.deepEqual(period('bestellingen afgelopen 30 dagen'), { from: '2026-10-22', to: today });
assert.deepEqual(parseStaffQuery('orders last month', '2026-01-15').period, { from: '2025-12-01', to: '2025-12-31' });
assert.equal(period('Order report'), undefined);

// Ambiguity becomes a question, never a silent default.
assert.equal(q('orders in November').periodIssue, 'year');
assert.equal(q('orders in November').periodWords, 'november');
assert.equal(q('orders Q2').periodIssue, 'year');
assert.equal(q('orders since spring').periodIssue, 'unclear');
assert.equal(q('orders until 2026-11-01').periodIssue, 'unclear');
assert.equal(q('orders on 2026-02-30').periodIssue, 'invalid');
assert.equal(q('Order #2026').period, undefined);

// Topics, status, store, channel, category, SKU.
assert.deepEqual(q('Order report').topics, ['orders']);
assert.deepEqual(q('Bestelrapport').topics, ['orders']);
assert.equal(q('Bestelrapport').reportCue, true);
assert.deepEqual(q('Finance report').topics, ['finance']);
assert.deepEqual(q('How many customers').topics, ['customers']);
assert.deepEqual(q('Conversation report').topics, ['conversations']);
assert.deepEqual(q('How many WhatsApp chats this month').topics, ['conversations']);
assert.deepEqual(q('How many calls last week').topics, ['conversations']);
assert.deepEqual(q('orders and customers this month').topics, ['orders', 'customers']);
assert.deepEqual(q('How many shipped this week').topics, ['orders']);
assert.deepEqual(q('orders not shipped yet').fulfilment, ['open', 'picked']);
assert.deepEqual(q('bestellingen die wachten op verzending').fulfilment, ['open', 'picked']);
assert.deepEqual(q('orders shipped this week').fulfilment, ['shipped']);
assert.deepEqual(q('geannuleerde bestellingen').fulfilment, ['cancelled']);
assert.equal(q('open customer invoices').fulfilment, undefined);
assert.equal(q('orders klapsleutels.nl').shop, 'klapsleutels.nl');
assert.equal(q('orders from shop KeyForCars').shop, 'keyforcars.nl');
assert.equal(q('KeyForCars orders this week').shop, undefined);
assert.equal(q('conversation report via WhatsApp').channel, 'whatsapp');
assert.equal(q('telefoongesprekken deze maand').channel, 'phone');
assert.equal(q('stock report for category Alfa Romeo').category, 'Alfa Romeo');
assert.equal(q('voorraad categorie "Klapsleutels" deze week').category, 'Klapsleutels');
assert.equal(q('orders for SKU alrc02 this month').sku, 'ALRC02');

// Amsterdam midnight across both DST offsets.
assert.equal(amsterdamStart('2026-11-20').toISOString(), '2026-11-19T23:00:00.000Z');
assert.equal(amsterdamStart('2026-07-01').toISOString(), '2026-06-30T22:00:00.000Z');
assert.equal(amsterdamStart('2026-03-29').toISOString(), '2026-03-28T23:00:00.000Z');
assert.equal(amsterdamStart('2026-03-30').toISOString(), '2026-03-29T22:00:00.000Z');
assert.equal(periodBounds({ from: '2026-10-01', to: '2026-10-31' }).until.toISOString(), '2026-10-31T23:00:00.000Z');

console.log('Staff assistant filter parsing passed.');
