/**
 * 0138: kfc_ship_order ships only fully reserved, picked orders, books nothing when it refuses,
 * replays the first result, keeps the old treatment of unmapped and zero-quantity lines, and never
 * drives a bin below zero. Run: node --test tests/pglite/ship-rule.test.mjs
 *
 * Orders are written the way the order import writes them (one order row, then its lines); stock moves only through the real RPCs
 * (kfc_count_bin, kfc_allocate via its triggers, kfc_pick_line, kfc_ship_order).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { freshDb, seedBasics } from './harness.mjs';

const RULE = ['0138_kfc_ship_rule.sql'];
let wooId = 5000;

async function setup(plus = RULE) {
  const db = plus ? await freshDb({ plus }) : await freshDb();
  const seed = await seedBasics(db);
  const [a, b] = seed.articles.map((x) => x.code);
  const [shelf1, shelf2] = seed.locations.map((x) => x.id);
  // A known starting point whatever the fixture holds: both articles at 0 on both shelves.
  for (const article of [a, b]) for (const location of [shelf1, shelf2]) await count(db, article, location, 0);
  return { db, a, b, shelf1, shelf2 };
}

const count = (db, article, location, quantity) =>
  db.rpc('kfc_count_bin', { p_article: article, p_location: location, p_counted: quantity, p_minimum: 0, p_key: `count-${randomUUID()}` });

/** Like the order import: one order row, then its lines (the line trigger runs the allocator). */
async function order(db, lines) {
  const now = new Date().toISOString();
  const id = ++wooId;
  const [row] = await db.sql(
    `insert into public.kfc_shop_orders (shop, woo_order_id, number, status, created_at, modified_at, paid_at, currency, country,
       customer_email_hash, total_incl_cents, tax_cents, total_excl_cents, shipping_incl_cents, fulfilment, raw, imported_at)
     values ('keyforcars.nl', $1, $2, 'processing', $3, $3, $3, 'EUR', 'NL', null, 12100, 2100, 10000, 0, 'open', $4, $3)
     returning id`, [id, String(id), now, { id, source: 'pglite-test' }]);
  const ids = [];
  for (const [i, line] of lines.entries()) {
    const [l] = await db.sql(
      `insert into public.kfc_shop_order_lines (order_id, woo_line_id, sku, name, article_code, quantity, unit_incl_cents, total_excl_cents)
       values ($1, $2, $3, $4, $5, $6, 1210, $7) returning id`,
      [row.id, id * 10 + i, line.sku ?? line.article ?? 'UNMAPPED-SKU', line.name ?? `Regel ${i + 1}`, line.article ?? null, line.quantity, 1000 * line.quantity]);
    ids.push(l.id);
  }
  return { id: row.id, lines: ids };
}

const pick = (db, line) => db.rpc('kfc_pick_line', { p_line: line, p_picked: true });
const ship = (db, id, key = randomUUID()) => db.rpc('kfc_ship_order', { p_order: id, p_key: key });
const level = async (db, article, location) =>
  (await db.sql('select quantity from public.kfc_stock_levels where article_code = $1 and location_id = $2', [article, location]))[0]?.quantity ?? 0;
const totals = async (db) => (await db.sql(
  `select (select count(*)::int from public.kfc_stock_moves) as moves,
          (select count(*)::int from public.kfc_stock_moves where reason = 'sale') as sales,
          (select count(*)::int from public.kfc_reservations) as reservations,
          (select coalesce(min(quantity), 0)::int from public.kfc_stock_levels) as lowest`))[0];
const orderRow = async (db, id) => (await db.sql('select fulfilment from public.kfc_shop_orders where id = $1', [id]))[0];
const lineRows = async (db, id) => db.sql(
  `select l.name, l.article_code is not null as mapped, l.quantity, l.reserved, l.picked, l.state,
          (select coalesce(sum(m.delta), 0)::int from public.kfc_stock_moves m where m.order_line_id = l.id and m.reason = 'sale') as sold
     from public.kfc_shop_order_lines l where l.order_id = $1 order by l.woo_line_id`, [id]);

async function refused(promise, code) {
  await assert.rejects(promise, (e) => { assert.match(e.message, new RegExp(code)); return true; });
}

test('a fully picked order ships and stock drops by the ordered quantity', async () => {
  const { db, a, shelf1 } = await setup();
  try {
    await count(db, a, shelf1, 5);
    const o = await order(db, [{ article: a, quantity: 2 }]);
    await pick(db, o.lines[0]);
    await ship(db, o.id);
    assert.equal(await level(db, a, shelf1), 3);
    assert.equal((await orderRow(db, o.id)).fulfilment, 'shipped');
    const [line] = await lineRows(db, o.id);
    assert.deepEqual([line.state, line.reserved, line.sold], ['shipped', 0, -2]);
  } finally { await db.close(); }
});

test('one unpicked line: KFC_NOT_PICKED and nothing is booked', async () => {
  const { db, a, b, shelf1 } = await setup();
  try {
    await count(db, a, shelf1, 3);
    await count(db, b, shelf1, 3);
    const o = await order(db, [{ article: a, quantity: 1 }, { article: b, quantity: 1 }]);
    await pick(db, o.lines[0]); // the second line is reserved but not picked
    const before = await totals(db);
    await refused(ship(db, o.id), 'KFC_NOT_PICKED');
    assert.deepEqual(await totals(db), before, 'no move, no reservation row');
    assert.equal(await level(db, a, shelf1), 3);
    assert.equal(await level(db, b, shelf1), 3);
    assert.notEqual((await orderRow(db, o.id)).fulfilment, 'shipped');
    // Picking the last line makes the same order shippable.
    await pick(db, o.lines[1]);
    await ship(db, o.id);
    assert.equal(await level(db, a, shelf1), 2);
    assert.equal(await level(db, b, shelf1), 2);
  } finally { await db.close(); }
});

test('a partly reserved line is refused even when it is picked', async () => {
  const { db, a, shelf1 } = await setup();
  try {
    await count(db, a, shelf1, 1);
    const o = await order(db, [{ article: a, quantity: 3 }]);
    await pick(db, o.lines[0]); // kfc_pick_line accepts a short line: picked = reserved = 1
    const [line] = await lineRows(db, o.id);
    assert.deepEqual([line.reserved, line.picked, line.state], [1, 1, 'picked']);
    const before = await totals(db);
    await refused(ship(db, o.id), 'KFC_NOT_PICKED');
    assert.deepEqual(await totals(db), before);
    assert.equal(await level(db, a, shelf1), 1);
  } finally { await db.close(); }
});

test('before 0138 the same partly reserved order shipped and drove the bin negative', async () => {
  const { db, a, shelf1 } = await setup(null);
  try {
    await count(db, a, shelf1, 1);
    const o = await order(db, [{ article: a, quantity: 3 }]);
    await pick(db, o.lines[0]);
    await ship(db, o.id);
    assert.equal(await level(db, a, shelf1), -2, 'the defect this migration closes');
  } finally { await db.close(); }
});

test('shipping twice returns the first result and books once', async () => {
  const { db, a, shelf1 } = await setup();
  try {
    await count(db, a, shelf1, 4);
    const o = await order(db, [{ article: a, quantity: 2 }]);
    await pick(db, o.lines[0]);
    const key = randomUUID();
    await ship(db, o.id, key);
    const after = await totals(db);
    await ship(db, o.id, key); // same key: a retried request
    await ship(db, o.id); // new key: a second tab
    assert.deepEqual(await totals(db), after);
    assert.equal(await level(db, a, shelf1), 2);
    // A shipped order whose lines no longer pass the rule still replays without the new error.
    await db.sql(`update public.kfc_shop_order_lines set state = 'reserved' where id = $1`, [o.lines[0]]);
    await ship(db, o.id);
    assert.deepEqual(await totals(db), after);
  } finally { await db.close(); }
});

test('unmapped and zero-quantity lines behave exactly as before 0138', async () => {
  async function scenario(plus) {
    const { db, a, b, shelf1 } = await setup(plus);
    try {
      await count(db, a, shelf1, 2);
      await count(db, b, shelf1, 2);
      const o = await order(db, [
        { article: a, quantity: 1, name: 'mapped' },
        { sku: 'NOT-IN-MASTER', quantity: 2, name: 'unmapped' },
        { article: b, quantity: 0, name: 'zero' },
      ]);
      await pick(db, o.lines[0]);
      let error = null;
      try { await ship(db, o.id); } catch (e) { error = e.message; }
      return { error, fulfilment: (await orderRow(db, o.id)).fulfilment, lines: await lineRows(db, o.id), a: await level(db, a, shelf1), b: await level(db, b, shelf1) };
    } finally { await db.close(); }
  }
  const before = await scenario(null);
  const after = await scenario(RULE);
  // What "before" is, established on the base schema:
  assert.equal(before.error, null, 'an unmapped line never blocked shipping');
  assert.equal(before.fulfilment, 'shipped');
  assert.deepEqual(before.lines.map((l) => [l.name, l.state, l.sold]), [['mapped', 'shipped', -1], ['unmapped', 'shipped', 0], ['zero', 'open', 0]]);
  // And 0138 does the same on that point.
  assert.deepEqual(after, before);
});

test('stock never goes negative through shipping', async () => {
  const { db, a, b, shelf1, shelf2 } = await setup();
  try {
    // Split over two bins: taken from both, never more than a bin holds.
    await count(db, a, shelf1, 1);
    await count(db, a, shelf2, 1);
    const split = await order(db, [{ article: a, quantity: 2 }]);
    await pick(db, split.lines[0]);
    await ship(db, split.id);
    assert.equal(await level(db, a, shelf1), 0);
    assert.equal(await level(db, a, shelf2), 0);
    assert.equal((await lineRows(db, split.id))[0].sold, -2);

    // Reserved and picked, then a recount finds the bin empty: refused, nothing booked.
    await count(db, b, shelf1, 2);
    const o = await order(db, [{ article: b, quantity: 2 }]);
    await pick(db, o.lines[0]);
    await count(db, b, shelf1, 1);
    const before = await totals(db);
    await refused(ship(db, o.id), 'KFC_CENTRAL_STOCK_REQUIRED');
    assert.deepEqual(await totals(db), before);
    assert.equal(await level(db, b, shelf1), 1);
    assert.ok((await totals(db)).lowest >= 0, 'no bin below zero');
  } finally { await db.close(); }
});

test('before 0138 a two-bin order was booked on one bin and drove it negative', async () => {
  const { db, a, shelf1, shelf2 } = await setup(null);
  try {
    await count(db, a, shelf1, 1);
    await count(db, a, shelf2, 1);
    const o = await order(db, [{ article: a, quantity: 2 }]);
    await pick(db, o.lines[0]);
    await ship(db, o.id);
    assert.equal((await totals(db)).lowest, -1, 'the defect this migration closes');
  } finally { await db.close(); }
});
