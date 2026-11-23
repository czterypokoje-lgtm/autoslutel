// The webshop agent's decisions (src/lib/shopAgent.ts). Pure: no database, no Next.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  orderNumberCandidates, ownsOrder, returnWindow, decideReturn, asCondition, orderView, trackingUrl, handoverSay, isRoute,
} from '../../src/lib/shopAgent.ts';

const NOW = new Date('2026-11-23T12:00:00Z');
const order = (over = {}) => ({
  order_number: 'AS24-2026-00042', status: 'delivered', email: 'Klant@Example.nl', postcode: '1404 HT',
  items: [{ title: 'Sleutelbehuizing VW 3 knoppen', quantity: 1, unitPrice: 12.5 }],
  created_at: '2026-11-10T09:00:00Z', paid_at: '2026-11-10T09:01:00Z', shipped_at: '2026-11-11T15:00:00Z',
  delivered_at: '2026-11-13T10:00:00Z', refunded_at: null, carrier: 'postnl', tracking_code: '3SABCD123',
  return_requested_at: null, needs_technician: false, ...over,
});

test('spoken order numbers become the stored format', () => {
  for (const spoken of ['AS24-2026-00042', 'as24 2026 42', 'AS 24 / 2026 / 00042', '2026-42', '#AS24-2026-00042']) {
    assert.ok(orderNumberCandidates(spoken).includes('AS24-2026-00042'), spoken);
  }
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

test('fourteen days from delivery; not started before delivery', () => {
  assert.equal(returnWindow(order(), NOW).state, 'open');
  assert.equal(returnWindow(order({ delivered_at: '2026-11-01T10:00:00Z' }), NOW).state, 'closed');
  assert.deepEqual(returnWindow(order({ status: 'shipped', delivered_at: null }), NOW), { state: 'open', until: null });
  assert.equal(returnWindow(order({ status: 'paid', shipped_at: null, delivered_at: null }), NOW).state, 'not_shipped');
  for (const status of ['pending', 'cancelled', 'refunded']) assert.equal(returnWindow(order({ status }), NOW).state, 'not_applicable');
});

test('the agent never refuses a return; the office decides', () => {
  assert.equal(decideReturn(order(), 'ongebruikt', NOW).kind, 'retour');
  assert.equal(decideReturn(order(), 'defect', NOW).kind, 'garantie');
  assert.equal(decideReturn(order(), 'bewerkt', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(order(), 'geopend', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(order({ delivered_at: '2026-10-01T10:00:00Z' }), 'ongebruikt', NOW).kind, 'beoordeling');
  assert.equal(decideReturn(order({ delivered_at: '2026-10-01T10:00:00Z' }), 'defect', NOW).kind, 'garantie');
  assert.equal(decideReturn(order({ return_requested_at: '2026-11-20T10:00:00Z' }), 'ongebruikt', NOW).outcome, 'al_aangevraagd');
  assert.equal(decideReturn(order({ status: 'processing', shipped_at: null, delivered_at: null }), 'ongebruikt', NOW).outcome, 'nog_niet_verzonden');
  assert.equal(decideReturn(order({ status: 'refunded' }), 'ongebruikt', NOW).outcome, 'niet_van_toepassing');
});

test('what the customer says about the item', () => {
  assert.equal(asCondition('nog ongebruikt in de doos'), 'ongebruikt');
  assert.equal(asCondition('hij is al gefreesd'), 'bewerkt');
  assert.equal(asCondition('de knop werkt niet'), 'defect');
  assert.equal(asCondition('ik heb de verpakking opengemaakt'), 'geopend');
  assert.equal(asCondition(''), null);
  assert.equal(asCondition('weet ik niet'), null);
});

test('the order view leaks no address, phone or prices', () => {
  const view = orderView(order(), NOW);
  const text = JSON.stringify(view);
  assert.equal(view.found, true);
  assert.equal(view.return.window, 'open');
  assert.deepEqual(view.items, [{ title: 'Sleutelbehuizing VW 3 knoppen', quantity: 1 }]);
  assert.ok(view.tracking_url.startsWith('https://jouw.postnl.nl/track-and-trace/3SABCD123-NL-1404HT'));
  for (const secret of ['Klant@Example.nl', 'klant@example.nl', '12.5', 'unitPrice']) assert.ok(!text.includes(secret), secret);
});

test('tracking links only for carriers we know', () => {
  assert.equal(trackingUrl('eigen', 'X1', null), null);
  assert.equal(trackingUrl('postnl', null, '1404HT'), null);
  assert.ok(trackingUrl('dhl', 'JVGL123', null).includes('JVGL123'));
});

test('handover promises only what happened', () => {
  assert.equal(isRoute('retour'), false); // returns go through request_return, not handover
  assert.equal(isRoute('bestelling'), true);
  assert.match(handoverSay('bestelling', true, false), /e-mailadres of telefoonnummer/);
  assert.match(handoverSay('bestelling', false, true), /geen collega bereiken/);
  assert.match(handoverSay('klacht', true, true), /twee werkdagen/);
});
