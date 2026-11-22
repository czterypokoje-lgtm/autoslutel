/**
 * The mapping behind the Autosleutel24 order import:
 * `node --experimental-strip-types scripts/check-own-shop-import.mts`.
 * Plain node, no database — mapOwnOrder is pure on purpose.
 *
 * What it guards: money stays in cents and never picks up a float cent, the
 * ledger gets WooCommerce's status words (the allocator, the pick list and
 * kfc_ship_order all key on 'processing'), and a cancelled order is never
 * handed to the warehouse as pickable.
 */
import assert from 'node:assert/strict';
import { mapOwnOrder, ownOrderKey, OWN_SHOP, type OwnOrderRow } from '../src/lib/kfcOwnShop.ts';

const paid: OwnOrderRow = {
  id: '11111111-1111-1111-1111-111111111111',
  order_number: 'AS24-2026-00042',
  status: 'paid',
  email: ' Klant@Example.NL ',
  name: 'J. de Vries',
  phone: '+31 6 12345678',
  street: 'Dorpsstraat 1',
  postcode: '1234 AB',
  city: 'Utrecht',
  country: 'NL',
  items: [
    { slug: 'sleutelbehuizing-vw', sku: 'KH-VW-3B', title: 'Sleutelbehuizing VW 3 knoppen', quantity: 2, unitPrice: 24.95, surcharge: 0, lineTotal: 49.9 },
    // A technician line: the surcharge is part of what the customer paid, so it is part of the line.
    { slug: 'autosleutel-bijmaken', sku: 'KEY-PROG', title: 'Sleutel bijmaken', quantity: 1, unitPrice: 139, surcharge: 45, lineTotal: 184 },
  ],
  shipping_cost: 4.95,
  total_inc: 238.85,
  total_ex_vat: 197.4,
  total_vat: 41.45,
  currency: 'EUR',
  paid_at: '2026-11-18T10:00:00.000Z',
  created_at: '2026-11-18T09:58:00.000Z',
  updated_at: '2026-11-18T10:00:05.000Z',
};

const first = mapOwnOrder(paid);

// Identity and keying.
assert.equal(first.order.shop, OWN_SHOP);
assert.equal(first.order.number, 'AS24-2026-00042');
assert.equal(first.order.woo_order_id, ownOrderKey('AS24-2026-00042'));
assert.ok(Number.isSafeInteger(first.order.woo_order_id) && first.order.woo_order_id > 0);
assert.notEqual(ownOrderKey('AS24-2026-00042'), ownOrderKey('AS24-2026-00043'));

// Money: cents, integers, and the order's own VAT split — never recomputed from a rate.
assert.deepEqual(
  { incl: first.order.total_incl_cents, excl: first.order.total_excl_cents, tax: first.order.tax_cents, ship: first.order.shipping_incl_cents },
  { incl: 23885, excl: 19740, tax: 4145, ship: 495 },
);
for (const value of Object.values(first.order)) {
  if (typeof value === 'number') assert.ok(Number.isInteger(value), `not an integer: ${value}`);
}

// Lines: the shop's sku, line numbers from 1, unit price VAT included, line total without 21%.
assert.equal(first.lines.length, 2);
assert.deepEqual(first.lines[0], {
  woo_line_id: 1, sku: 'KH-VW-3B', name: 'Sleutelbehuizing VW 3 knoppen',
  quantity: 2, unit_incl_cents: 2495, total_excl_cents: Math.round(4990 / 1.21),
});
assert.deepEqual(first.lines[1], {
  woo_line_id: 2, sku: 'KEY-PROG', name: 'Sleutel bijmaken',
  quantity: 1, unit_incl_cents: 18400, total_excl_cents: Math.round(18400 / 1.21),
});

// Address for the label, e-mail hashed rather than stored.
assert.equal(first.order.ship_name, 'J. de Vries');
assert.equal(first.order.ship_street, 'Dorpsstraat 1');
assert.equal(first.order.ship_postcode, '1234 AB');
assert.equal(first.order.ship_city, 'Utrecht');
assert.equal(first.order.ship_email, 'klant@example.nl');
assert.equal(first.order.customer_email_hash?.length, 64);
assert.ok(!first.order.customer_email_hash?.includes('klant'));

// Paid and open: the pick list asks for exactly this pair.
assert.deepEqual({ status: first.order.status, fulfilment: first.order.fulfilment }, { status: 'processing', fulfilment: 'open' });
assert.equal(first.order.modified_at, paid.updated_at);

// A refund, older-style items (name/price, no lineTotal), no phone, missing country.
const refunded: OwnOrderRow = {
  id: '22222222-2222-2222-2222-222222222222',
  order_number: 'AS24-2026-00007',
  status: 'refunded',
  email: 'ander@example.nl',
  name: 'M. Jansen',
  street: 'Kerkweg 9',
  postcode: '5678 CD',
  city: 'Breda',
  items: [{ slug: 'remsleutel', name: 'Remsleutel', quantity: 3, price: 10 }],
  shipping_cost: 0,
  total_inc: 30,
  total_ex_vat: 24.79,
  total_vat: 5.21,
  paid_at: '2026-10-01T08:00:00.000Z',
  created_at: '2026-10-01T07:59:00.000Z',
  updated_at: null,
};
const second = mapOwnOrder(refunded);
assert.deepEqual({ status: second.order.status, fulfilment: second.order.fulfilment }, { status: 'refunded', fulfilment: 'cancelled' });
// No sku on the item: the slug is the next best thing to match an article on.
assert.deepEqual(second.lines[0], { woo_line_id: 1, sku: 'remsleutel', name: 'Remsleutel', quantity: 3, unit_incl_cents: 1000, total_excl_cents: Math.round(3000 / 1.21) });
assert.equal(second.order.ship_phone, null);
assert.equal(second.order.country, 'NL'); // the shop ships NL only
assert.equal(second.order.modified_at, refunded.created_at); // no updated_at: the creation time, never null
assert.equal(second.order.currency, 'EUR');

// The whole status table, because the warehouse acts on fulfilment.
const fulfilmentFor = (status: string) => {
  const mapped = mapOwnOrder({ ...paid, status });
  return `${mapped.order.status}/${mapped.order.fulfilment}`;
};
assert.equal(fulfilmentFor('paid'), 'processing/open');
assert.equal(fulfilmentFor('processing'), 'processing/open');
assert.equal(fulfilmentFor('shipped'), 'completed/external');
assert.equal(fulfilmentFor('delivered'), 'completed/external');
assert.equal(fulfilmentFor('cancelled'), 'cancelled/cancelled');
assert.equal(fulfilmentFor('refunded'), 'refunded/cancelled');
assert.equal(fulfilmentFor('pending'), 'on-hold/open'); // never imported; if it ever is, it cannot be picked
assert.equal(fulfilmentFor('something-new'), 'cancelled/cancelled'); // an unknown word must not become pickable

// An order with no lines at all must still map, not throw.
assert.deepEqual(mapOwnOrder({ ...paid, items: null }).lines, []);

console.log('check-own-shop-import: ok');
