// The webshop agent's decisions (src/lib/shopAgent.ts). Pure: no database, no Next.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderNumberCandidates, ownsOrder, returnWindow, decideReturn, asCondition, orderView, trackingUrl, handoverSay, isRoute,
  madeToOrder, ROUTES,
} from '../../src/lib/shopAgent.ts';

const NOW = new Date('2026-11-23T12:00:00Z');
const order = (over = {}) => ({
  order_number: 'AS24-26-K7Q2XM', status: 'delivered', email: 'Klant@Example.nl', postcode: '1404 HT',
  items: [{ title: 'Sleutelbehuizing VW 3 knoppen', quantity: 1, unitPrice: 12.5, service: 'product_only' }],
  created_at: '2026-11-10T09:00:00Z', paid_at: '2026-11-10T09:01:00Z', shipped_at: '2026-11-11T15:00:00Z',
  delivered_at: '2026-11-13T10:00:00Z', refunded_at: null, carrier: 'postnl', tracking_code: '3SABCD123',
  return_requested_at: null, needs_technician: false, ...over,
});

test('the shop\'s order numbers, however they are said or typed', () => {
  for (const said of ['AS24-26-K7Q2XM', 'as24 26 k7q2xm', 'AS2426K7Q2XM', 'AS 24 - 26 - K7Q2XM', '26-K7Q2XM', '26 K7Q2XM', '#AS24-26-K7Q2XM']) {
    assert.ok(orderNumberCandidates(said).includes('AS24-26-K7Q2XM'), said);
  }
  // The pre-random shape still resolves for old orders.
  assert.ok(orderNumberCandidates('AS24-2026-00042').includes('AS24-2026-00042'));
  assert.ok(orderNumberCandidates('2026 42').includes('AS24-2026-00042'));
  // I, O, 0 and 1 are not in the alphabet: no AS24-YY-XXXXXX candidate.
  assert.ok(!orderNumberCandidates('AS2426K7Q2X0').includes('AS24-26-K7Q2X0'));
  assert.deepEqual(orderNumberCandidates(''), []);
  assert.deepEqual(orderNumberCandidates(null), []);
});

test('the order is shown only with its own e-mail or postcode', () => {
  assert.equal(ownsOrder(order(), { email: ' klant@example.nl ' }), true);
  assert.equal(ownsOrder(order(), { postcode: '1404ht' }), true);
  assert.equal(ownsOrder(order(), { email: 'ander@example.nl' }), false);
  assert.equal(ownsOrder(order(), { postcode: '1000AA' }), false);
  assert.equal(ownsOrder(order(), {}), false);
});

test('fourteen days from delivery; without a delivery date, from shipping plus transit', () => {
  assert.equal(returnWindow(order(), NOW).state, 'open');
  assert.equal(returnWindow(order({ delivered_at: '2026-11-01T10:00:00Z' }), NOW).state, 'closed');
  // shipped 11 Nov + 7 transit + 14 = 2 Dec: still open on 23 Nov
  assert.equal(returnWindow(order({ status: 'shipped', delivered_at: null }), NOW).state, 'open');
  // shipped in September, never marked delivered: no longer open
  assert.equal(returnWindow(order({ status: 'shipped', delivered_at: null, shipped_at: '2026-09-01T10:00:00Z' }), NOW).state, 'closed');
  assert.deepEqual(returnWindow(order({ status: 'shipped', delivered_at: null, shipped_at: null }), NOW), { state: 'open', until: null });
  assert.equal(returnWindow(order({ status: 'paid', shipped_at: null, delivered_at: null }), NOW).state, 'not_shipped');
  for (const status of ['pending', 'cancelled', 'refunded']) assert.equal(returnWindow(order({ status }), NOW).state, 'not_applicable');
});

test('the agent never refuses a return; the office decides', () => {
  assert.equal(decideReturn(order(), 'ongebruikt', NOW).kind, 'retour');
  assert.equal(decideReturn(order(), 'defect', NOW).kind, 'garantie');
  assert.equal(decideReturn(order(), 'bewerkt', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(order({ delivered_at: '2026-10-01T10:00:00Z' }), 'ongebruikt', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(order({ delivered_at: '2026-10-01T10:00:00Z' }), 'defect', NOW).kind, 'garantie');
  assert.equal(decideReturn(order({ return_requested_at: '2026-11-20T10:00:00Z' }), 'ongebruikt', NOW).outcome, 'al_aangevraagd');
  assert.equal(decideReturn(order({ status: 'processing', shipped_at: null, delivered_at: null }), 'ongebruikt', NOW).outcome, 'nog_niet_verzonden');
  assert.equal(decideReturn(order({ status: 'refunded' }), 'ongebruikt', NOW).outcome, 'niet_van_toepassing');
});

test('made to order (a service on any line) is always for a person', () => {
  const cut = order({ items: [{ title: 'Klapsleutel', quantity: 1, service: 'frezen' }] });
  assert.equal(madeToOrder(cut.items), true);
  assert.equal(madeToOrder(order().items), false);
  assert.equal(madeToOrder([{ title: 'oud', quantity: 1 }]), false);
  assert.equal(decideReturn(cut, 'ongebruikt', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(cut, 'defect', NOW).kind, 'garantie');
});

test('the item\'s state is one of three exact words, never guessed from a sentence', () => {
  assert.equal(asCondition('ongebruikt'), 'ongebruikt');
  assert.equal(asCondition(' Bewerkt '), 'bewerkt');
  assert.equal(asCondition('defect'), 'defect');
  for (const loose of ['niet geopend', 'ongeopend', 'geopend', 'nog ongebruikt in de verpakking', '', null]) {
    assert.equal(asCondition(loose), null, String(loose));
  }
});

test('the plain return repeats the published page and promises no refund', () => {
  const say = decideReturn(order(), 'ongebruikt', NOW).say;
  assert.match(say, /binnen 14 dagen/);
  assert.match(say, /retourkosten zijn voor uw rekening/);
  assert.doesNotMatch(say, /terugbetaal|geld terug|terugstort/i);
});

test('the order view leaks no address, phone, prices or postcode', () => {
  const view = orderView(order(), NOW, null);
  const text = JSON.stringify(view);
  assert.equal(view.found, true);
  assert.equal(view.return.window, 'open');
  assert.deepEqual(view.items, [{ title: 'Sleutelbehuizing VW 3 knoppen', quantity: 1 }]);
  // Verified by e-mail: the link must not carry the delivery postcode.
  assert.equal(view.tracking_url, 'https://jouw.postnl.nl/track-and-trace/3SABCD123-NL');
  for (const secret of ['Klant@Example.nl', 'klant@example.nl', '12.5', 'unitPrice', '1404', 'product_only']) assert.ok(!text.includes(secret), secret);
  // Verified by postcode: the caller already knows it.
  assert.ok(orderView(order(), NOW, '1404 ht').tracking_url.endsWith('-NL-1404HT'));
});

test('tracking links only for carriers we know', () => {
  assert.equal(trackingUrl('eigen', 'X1', null), null);
  assert.equal(trackingUrl('postnl', null, '1404HT'), null);
  assert.ok(trackingUrl('dhl', 'JVGL123', null).includes('JVGL123'));
});

test('handover routes are own keys only, and promise only what happened', () => {
  for (const proto of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'retour']) assert.equal(isRoute(proto), false, proto);
  assert.equal(isRoute('bestelling'), true);
  assert.match(handoverSay('bestelling', true, false), /e-mailadres of telefoonnummer/);
  assert.match(handoverSay('bestelling', false, true), /geen collega bereiken/);
  assert.match(handoverSay('klacht', true, true), /twee werkdagen/);
  assert.match(ROUTES.monteur.say, /06 11 75 12 31/);
});
