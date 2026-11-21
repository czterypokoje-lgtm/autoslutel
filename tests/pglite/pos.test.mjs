/**
 * Kassa: returns, cash in/out, closing per method and the stored Z-report (migration 0136).
 * Run: node --test tests/pglite/pos.test.mjs
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, seedBasics } from './harness.mjs';

let db;
let seed;
let n = 0;
const key = (label) => `test-${label}-${++n}-${Date.now()}`;

before(async () => {
  db = await freshDb({ plus: ['0136_kfc_pos_returns_cash.sql'] });
  seed = await seedBasics(db);
});
after(async () => { await db?.close(); });

const A = () => seed.articles[0].code;
const B = () => seed.articles[1].code;
const SHELF1 = () => seed.locations[0].id;
const SHELF2 = () => seed.locations[1].id;

async function receive(article, location, quantity) {
  await db.rpc('kfc_book_move', { p_article: article, p_location: location, p_delta: quantity, p_reason: 'received', p_key: key('recv') });
}
async function level(article, location) {
  const rows = await db.sql('select quantity from public.kfc_stock_levels where article_code = $1 and location_id = $2', [article, location]);
  return rows[0]?.quantity ?? 0;
}
async function openTill(float = 10000) {
  // One open session per register: close whatever is still open first.
  const open = await db.sql(`select id from public.kfc_pos_sessions where register = 'winkel' and closed_at is null`);
  for (const s of open) await closeTill(s.id, 0, 0);
  return (await db.rpc('kfc_pos_open', { p_register: 'winkel', p_float_cents: float, p_opened_by: null }))[0];
}
async function closeTill(session, cash, pin, note = '') {
  return (await db.rpc('kfc_pos_close', {
    p_session: session, p_counted_cents: cash, p_counted_pin_cents: pin, p_note: note, p_closed_by: null,
  }))[0];
}
async function sell(session, lines, payments, saleKey = key('sale')) {
  const rows = await db.rpc('kfc_pos_sale', {
    p_session: session, p_key: saleKey, p_lines: JSON.stringify(lines), p_payments: JSON.stringify(payments),
    p_customer: null, p_client_name: '', p_biller: { name: 'Testwinkel' }, p_created_by: null,
  });
  return rows[0].kfc_pos_sale;
}
async function giveBack(session, invoice, lines, method, location, returnKey = key('ret')) {
  const rows = await db.rpc('kfc_pos_return', {
    p_session: session, p_key: returnKey, p_invoice: invoice, p_lines: JSON.stringify(lines),
    p_method: method, p_location: location, p_reason: 'test', p_created_by: null,
  });
  return rows[0].kfc_pos_return;
}
async function invoiceLines(invoice) {
  return db.sql('select id, line_no, quantity from public.sales_invoice_lines where invoice_id = $1 order by line_no', [invoice]);
}
async function expected(session) {
  return (await db.sql('select * from public.kfc_pos_expected($1)', [session]))[0];
}

test('sale, partial return, over-return refused, rest returned: stock and refunds add up', async () => {
  await receive(A(), SHELF1(), 10);
  const s = await openTill(10000);
  const before1 = await level(A(), SHELF1());
  const inv = await sell(s.id, [{ article: A(), quantity: 3, unit_price_cents: 1995, discount_cents: 0, vat_rate: 21 }],
    [{ method: 'cash', tendered_cents: 6000 }]);
  assert.equal(await level(A(), SHELF1()), before1 - 3);

  // Give the sale move a known cost: the return must come back at that cost.
  await db.sql(`update public.kfc_stock_moves set unit_cost_cents = 700 where sales_invoice_id = $1 and reason = 'sale'`, [inv]);

  const [line] = await invoiceLines(inv);
  const credit1 = await giveBack(s.id, inv, [{ line_id: line.id, quantity: 2 }], 'cash', SHELF2());
  const shelf2After1 = await level(A(), SHELF2());
  assert.equal(shelf2After1, 2);

  await assert.rejects(giveBack(s.id, inv, [{ line_id: line.id, quantity: 2 }], 'cash', SHELF2()), /KFC_POS_RETURN_EXCEEDS/);
  assert.equal(await level(A(), SHELF2()), 2, 'refused return booked no stock');

  const credit2 = await giveBack(s.id, inv, [{ line_id: line.id, quantity: 1 }], 'pin', SHELF2());
  assert.equal(await level(A(), SHELF2()), 3);
  await assert.rejects(giveBack(s.id, inv, [{ line_id: line.id, quantity: 1 }], 'cash', SHELF2()), /KFC_POS_RETURN_EXCEEDS/);

  const credits = await db.sql(
    `select id, total, credit_of_invoice_id from public.sales_invoices where id = any($1::uuid[]) order by created_at`, [[credit1, credit2]]);
  assert.deepEqual(credits.map((c) => Number(c.total)), [-39.9, -19.95]);
  assert.ok(credits.every((c) => c.credit_of_invoice_id === inv));

  const refunds = await db.sql(
    `select method, amount_cents, kind from public.kfc_pos_payments where sales_invoice_id = any($1::uuid[]) order by id`, [[credit1, credit2]]);
  assert.deepEqual(refunds.map((r) => [r.method, r.amount_cents, r.kind]), [['cash', -3990, 'refund'], ['pin', -1995, 'refund']]);

  const moves = await db.sql(`select delta, unit_cost_cents, location_id from public.kfc_stock_moves
                               where reason = 'return' and sales_invoice_id = any($1::uuid[]) order by id`, [[credit1, credit2]]);
  assert.deepEqual(moves.map((m) => [m.delta, m.unit_cost_cents, m.location_id]), [[2, 700, SHELF2()], [1, 700, SHELF2()]]);

  const e = await expected(s.id);
  assert.equal(e.expected_cash_cents, 10000 + 5985 - 3990);
  assert.equal(e.expected_pin_cents, -1995);
});

test('the same key twice books a sale and a return only once', async () => {
  await receive(A(), SHELF1(), 5);
  const s = await openTill(5000);
  const start = await level(A(), SHELF1());
  const saleKey = key('replay-sale');
  const lines = [{ article: A(), quantity: 2, unit_price_cents: 1000, discount_cents: 0, vat_rate: 21 }];
  const inv1 = await sell(s.id, lines, [{ method: 'pin', tendered_cents: 2000 }], saleKey);
  const inv2 = await sell(s.id, lines, [{ method: 'pin', tendered_cents: 2000 }], saleKey);
  assert.equal(inv1, inv2);
  assert.equal(await level(A(), SHELF1()), start - 2);

  const [line] = await invoiceLines(inv1);
  const retKey = key('replay-ret');
  const c1 = await giveBack(s.id, inv1, [{ line_id: line.id, quantity: 1 }], 'pin', SHELF1(), retKey);
  const c2 = await giveBack(s.id, inv1, [{ line_id: line.id, quantity: 1 }], 'pin', SHELF1(), retKey);
  assert.equal(c1, c2);
  assert.equal(await level(A(), SHELF1()), start - 1);
  const pays = await db.sql(`select count(*)::int as n, sum(amount_cents)::int as cents from public.kfc_pos_payments where sales_invoice_id = $1`, [c1]);
  assert.deepEqual(pays[0], { n: 1, cents: -1000 });

  const mvKey = key('replay-cash');
  await db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: mvKey, p_direction: 'in', p_amount_cents: 500, p_reason: 'wisselgeld', p_created_by: null });
  await db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: mvKey, p_direction: 'in', p_amount_cents: 500, p_reason: 'wisselgeld', p_created_by: null });
  assert.equal((await expected(s.id)).expected_cash_cents, 5500);
});

test('cash in and out change the expected cash; reason and drawer are checked', async () => {
  const s = await openTill(2000);
  await db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('in'), p_direction: 'in', p_amount_cents: 1500, p_reason: 'Wisselgeld van de bank', p_created_by: null });
  await db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('out'), p_direction: 'out', p_amount_cents: 700, p_reason: 'Koffie en melk', p_created_by: null });
  assert.equal((await expected(s.id)).expected_cash_cents, 2000 + 1500 - 700);

  await assert.rejects(db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('noreason'), p_direction: 'out', p_amount_cents: 100, p_reason: '  ', p_created_by: null }), /KFC_POS_REASON_REQUIRED/);
  await assert.rejects(db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('toomuch'), p_direction: 'out', p_amount_cents: 999999, p_reason: 'Naar de bank', p_created_by: null }), /KFC_POS_CASH_SHORT/);
  await assert.rejects(db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('zero'), p_direction: 'in', p_amount_cents: 0, p_reason: 'Niets', p_created_by: null }), /KFC_POS_BAD_CASH_MOVE/);
});

test('close stores expected, counted and difference per method and a Z-number that goes up by one', async () => {
  await receive(A(), SHELF1(), 10);
  const s1 = await openTill(10000);
  await sell(s1.id, [{ article: A(), quantity: 1, unit_price_cents: 2420, discount_cents: 0, vat_rate: 21 }], [{ method: 'cash', tendered_cents: 3000 }]);
  await sell(s1.id, [{ article: A(), quantity: 2, unit_price_cents: 1090, discount_cents: 0, vat_rate: 9 }], [{ method: 'pin', tendered_cents: 2180 }]);
  await db.rpc('kfc_pos_cash_move', { p_session: s1.id, p_key: key('in'), p_direction: 'in', p_amount_cents: 1000, p_reason: 'Extra wisselgeld', p_created_by: null });
  await db.rpc('kfc_pos_cash_move', { p_session: s1.id, p_key: key('out'), p_direction: 'out', p_amount_cents: 300, p_reason: 'Postzegels', p_created_by: null });

  // cash: 10000 + 2420 + 1000 − 300 = 13120; pin: 2180
  await assert.rejects(db.rpc('kfc_pos_close', { p_session: s1.id, p_counted_cents: 13100, p_counted_pin_cents: null, p_note: '', p_closed_by: null }), /KFC_POS_BAD_PIN_COUNT/);
  const c1 = await closeTill(s1.id, 13100, 2180, 'twintig cent kwijt');
  assert.equal(c1.expected_cash_cents, 13120);
  assert.equal(c1.counted_cash_cents, 13100);
  assert.equal(c1.cash_difference_cents, -20);
  assert.equal(c1.expected_pin_cents, 2180);
  assert.equal(c1.counted_pin_cents, 2180);
  assert.equal(c1.pin_difference_cents, 0);
  assert.ok(Number.isInteger(c1.z_number) && c1.z_number >= 1);

  const z = typeof c1.z_report === 'string' ? JSON.parse(c1.z_report) : c1.z_report;
  assert.equal(z.z_number, c1.z_number);
  assert.equal(z.sales_count, 2);
  assert.equal(z.sales_total_cents, 2420 + 2180);
  assert.deepEqual(z.sales_by_method, { cash: 2420, pin: 2180, other: 0 });
  assert.equal(z.cash_in_cents, 1000);
  assert.equal(z.cash_out_cents, 300);
  assert.deepEqual(z.cash, { expected_cents: 13120, counted_cents: 13100, difference_cents: -20 });
  const vat = Object.fromEntries(z.vat.map((v) => [Number(v.rate), v]));
  assert.equal(vat[21].incl_cents, 2420);
  assert.equal(vat[21].vat_cents, 420);
  assert.equal(vat[9].incl_cents, 2180);
  assert.equal(vat[9].vat_cents, 180);

  // A second close of the same session changes nothing (no second number).
  const again = await closeTill(s1.id, 0, 0);
  assert.equal(again.z_number, c1.z_number);
  assert.equal(again.counted_cash_cents, 13100);

  const s2 = await openTill(5000);
  const c2 = await closeTill(s2.id, 5000, 0);
  assert.equal(c2.z_number, c1.z_number + 1);
  assert.equal(c2.cash_difference_cents, 0);
});

test('a sale cannot take stock from a non-shelf location', async () => {
  // Article B lies only in quarantine.
  await receive(B(), seed.quarantine, 4);
  const s = await openTill(1000);
  await assert.rejects(
    sell(s.id, [{ article: B(), quantity: 1, unit_price_cents: 500, discount_cents: 0, vat_rate: 21 }], [{ method: 'cash', tendered_cents: 500 }]),
    /KFC_POS_NOT_SELLABLE/);
  await assert.rejects(
    sell(s.id, [{ article: A(), quantity: 1, unit_price_cents: 500, discount_cents: 0, vat_rate: 21, location: seed.quarantine }], [{ method: 'cash', tendered_cents: 500 }]),
    /KFC_POS_NOT_SELLABLE/);
  assert.equal(await level(B(), seed.quarantine), 4);

  // Once it is on a shelf it sells from the shelf, never from quarantine.
  await receive(B(), SHELF2(), 1);
  await sell(s.id, [{ article: B(), quantity: 1, unit_price_cents: 500, discount_cents: 0, vat_rate: 21 }], [{ method: 'cash', tendered_cents: 500 }]);
  assert.equal(await level(B(), SHELF2()), 0);
  assert.equal(await level(B(), seed.quarantine), 4);
});

test('a return without an open session is refused', async () => {
  await receive(A(), SHELF1(), 2);
  const s = await openTill(1000);
  const inv = await sell(s.id, [{ article: A(), quantity: 1, unit_price_cents: 1500, discount_cents: 0, vat_rate: 21 }], [{ method: 'pin', tendered_cents: 1500 }]);
  const [line] = await invoiceLines(inv);
  await closeTill(s.id, 1000, 1500);
  await assert.rejects(giveBack(s.id, inv, [{ line_id: line.id, quantity: 1 }], 'pin', SHELF1()), /KFC_POS_CLOSED/);
  await assert.rejects(
    db.rpc('kfc_pos_cash_move', { p_session: s.id, p_key: key('closed'), p_direction: 'in', p_amount_cents: 100, p_reason: 'Te laat', p_created_by: null }),
    /KFC_POS_CLOSED/);
});

test('a cash refund larger than the drawer is refused and books nothing', async () => {
  await receive(A(), SHELF1(), 2);
  const s = await openTill(0);
  const inv = await sell(s.id, [{ article: A(), quantity: 1, unit_price_cents: 5000, discount_cents: 0, vat_rate: 21 }], [{ method: 'pin', tendered_cents: 5000 }]);
  const [line] = await invoiceLines(inv);
  const shelf = await level(A(), SHELF1());
  await assert.rejects(giveBack(s.id, inv, [{ line_id: line.id, quantity: 1 }], 'cash', SHELF1()), /KFC_POS_CASH_SHORT/);
  assert.equal(await level(A(), SHELF1()), shelf);
  const credits = await db.sql('select count(*)::int as n from public.sales_invoices where credit_of_invoice_id = $1', [inv]);
  assert.equal(credits[0].n, 0);
  // By PIN it is fine.
  await giveBack(s.id, inv, [{ line_id: line.id, quantity: 1 }], 'pin', SHELF1());
  assert.equal(await level(A(), SHELF1()), shelf + 1);
});
