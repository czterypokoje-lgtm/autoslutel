/**
 * Moving-average cost (migration 0137) on the offline PGlite harness.
 * Every stock move goes through the real RPCs (kfc_receive_po_line, kfc_book_move,
 * kfc_transfer, kfc_count_bin, kfc_assemble); only master data is inserted directly.
 *
 *   node --test tests/pglite/avg-cost.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { freshDb, seedBasics } from './harness.mjs';

const MIGRATION = fileURLToPath(new URL('../../supabase/migrations/0137_kfc_avg_cost.sql', import.meta.url));
const TODAY = `(now() at time zone 'Europe/Amsterdam')::date`;
const num = (v) => (v === null || v === undefined ? null : Number(v));
let seq = 0;
const key = (label) => `avg-${label}-${++seq}`;

async function setup() {
  const db = await freshDb({ plus: ['0137_kfc_avg_cost.sql'] });
  const seed = await seedBasics(db);
  return { db, seed, A: seed.articles[0].code, B: seed.articles[1].code, L1: seed.locations[0].id, L2: seed.locations[1].id };
}

/** A purchase order line (status ordered) for one article; returns the line id. */
async function poLine(db, supplier, article, quantity, unitCost) {
  const [po] = await db.sql(`insert into public.kfc_purchase_orders (supplier, status, ordered_at) values ($1, 'ordered', now()) returning id`, [supplier]);
  const [line] = await db.sql(`insert into public.kfc_purchase_order_lines (po_id, article_code, quantity, unit_cost_cents) values ($1, $2, $3, $4) returning id`,
    [po.id, article, quantity, unitCost]);
  return line.id;
}

/** Receive `quantity` at `unitCost` through a purchase order; returns the move. */
async function receive(ctx, article, quantity, unitCost, location = ctx.L1) {
  const line = await poLine(ctx.db, ctx.seed.supplier.name, article, quantity, unitCost);
  const k = key('rcv');
  await ctx.db.rpc('kfc_receive_po_line', { p_line: line, p_quantity: quantity, p_location: location, p_key: k });
  return move(ctx.db, k);
}

async function book(ctx, article, delta, reason, unitCost = null, location = ctx.L1) {
  const k = key(reason);
  await ctx.db.rpc('kfc_book_move', { p_article: article, p_location: location, p_delta: delta, p_reason: reason, p_key: k, p_unit_cost_cents: unitCost });
  return move(ctx.db, k);
}

async function move(db, k) {
  const [m] = await db.sql(`select id, delta, reason, unit_cost_cents, avg_cost_after_cents from public.kfc_stock_moves where idempotency_key = $1`, [k]);
  assert.ok(m, `move ${k} was booked`);
  return { ...m, unit_cost_cents: num(m.unit_cost_cents), avg_cost_after_cents: num(m.avg_cost_after_cents) };
}

async function article(db, code) {
  const [a] = await db.sql(`select avg_cost_cents, purchase_price_cents from public.kfc_articles where code = $1`, [code]);
  return { avg: num(a.avg_cost_cents), purchase: num(a.purchase_price_cents) };
}
const avg = async (db, code) => (await article(db, code)).avg;

test('receipts average, a sale is stamped at the average and leaves it alone', async () => {
  const ctx = await setup();
  try {
    const { db, A } = ctx;
    // Seeded after 0137, so no backfill: the average is unknown until the first priced receipt.
    assert.equal(await avg(db, A), null);

    const r1 = await receive(ctx, A, 10, 500);
    assert.equal(r1.unit_cost_cents, 500);
    assert.equal(await avg(db, A), 500, 'first receipt onto zero stock takes its own cost');

    await receive(ctx, A, 10, 700);
    assert.equal(await avg(db, A), 600, '(10 × 5,00 + 10 × 7,00) / 20 = 6,00');

    const sale = await book(ctx, A, -5, 'sale');
    assert.equal(sale.unit_cost_cents, 600, 'sale without cost is stamped with the average');
    assert.equal(sale.avg_cost_after_cents, 600);
    assert.equal(await avg(db, A), 600, 'a sale never changes the average');

    await receive(ctx, A, 5, 900);
    assert.equal(await avg(db, A), 675, '(15 × 6,00 + 5 × 9,00) / 20 = 6,75');
    assert.equal((await article(db, A)).purchase, 900, 'purchase_price_cents stays the last purchase price');

    // The margin of the old sale does not move when the purchase price changes.
    await db.sql(`update public.kfc_articles set purchase_price_cents = 2500 where code = $1`, [A]);
    const [line] = await db.sql(`select cost_cents, cost_estimated, cost_source from public.kfc_sales_lines where move_id = $1`, [sale.id]);
    assert.equal(num(line.cost_cents), 3000);
    assert.equal(line.cost_estimated, false);
    assert.equal(line.cost_source, 'boeking');
  } finally { await ctx.db.close(); }
});

test('transfer (both legs) and count differences are stamped at the average and do not change it', async () => {
  const ctx = await setup();
  try {
    const { db, A, L1, L2 } = ctx;
    await receive(ctx, A, 10, 500);
    await receive(ctx, A, 10, 700);
    assert.equal(await avg(db, A), 600);

    const k = key('trf');
    await db.rpc('kfc_transfer', { p_article: A, p_from: L1, p_to: L2, p_quantity: 4, p_key: k });
    const out = await move(db, `${k}:out`), inn = await move(db, `${k}:in`);
    assert.deepEqual([out.delta, out.unit_cost_cents, inn.delta, inn.unit_cost_cents], [-4, 600, 4, 600]);
    assert.equal(await avg(db, A), 600);

    // L1 holds 16; count 13 (−3) and L2 holds 4; count 6 (+2).
    const c1 = key('cnt'), c2 = key('cnt');
    await db.rpc('kfc_count_bin', { p_article: A, p_location: L1, p_counted: 13, p_minimum: 0, p_key: c1 });
    await db.rpc('kfc_count_bin', { p_article: A, p_location: L2, p_counted: 6, p_minimum: 0, p_key: c2 });
    const m1 = await move(db, c1), m2 = await move(db, c2);
    assert.deepEqual([m1.delta, m1.unit_cost_cents, m2.delta, m2.unit_cost_cents], [-3, 600, 2, 600]);
    assert.equal(await avg(db, A), 600);

    // The next receipt sees the counted quantity (19) as on hand.
    await receive(ctx, A, 1, 2500);
    assert.equal(await avg(db, A), 695, '(19 × 6,00 + 1 × 25,00) / 20 = 6,95');
  } finally { await ctx.db.close(); }
});

test('a receipt onto zero or negative stock takes the receipt cost', async () => {
  const ctx = await setup();
  try {
    const { db, B } = ctx;
    await receive(ctx, B, 3, 500);
    await book(ctx, B, -3, 'sale');
    await receive(ctx, B, 2, 900);
    assert.equal(await avg(db, B), 900, 'on hand 0 before the receipt');

    await book(ctx, B, -5, 'sale'); // the till may sell below zero: on hand −3
    await receive(ctx, B, 4, 300);
    assert.equal(await avg(db, B), 300, 'on hand −3 before the receipt');
  } finally { await ctx.db.close(); }
});

test('an article with no known cost keeps null costs instead of zero', async () => {
  const ctx = await setup();
  try {
    const { db, L1 } = ctx;
    const code = 'TEST-NOCOST';
    await db.sql(`insert into public.kfc_articles (code, name, sale_price_cents) values ($1, 'Test zonder kostprijs', 1000)`, [code]);
    const c = key('cnt');
    await db.rpc('kfc_count_bin', { p_article: code, p_location: L1, p_counted: 5, p_minimum: 0, p_key: c });
    assert.equal((await move(db, c)).unit_cost_cents, null);

    const unpriced = await receive(ctx, code, 2, null);
    assert.equal(unpriced.unit_cost_cents, null, 'a receipt without a price stays without a price');
    const sale = await book(ctx, code, -1, 'sale');
    assert.equal(sale.unit_cost_cents, null);
    assert.equal(await avg(db, code), null);

    const [line] = await db.sql(`select cost_cents, cost_estimated, cost_source from public.kfc_sales_lines where move_id = $1`, [sale.id]);
    assert.equal(line.cost_estimated, true);
    assert.equal(line.cost_source, null);
    const [o] = await db.sql(`select unpriced, value_estimated, avg_cost_cents from public.kfc_article_overview where code = $1`, [code]);
    assert.deepEqual([o.unpriced, o.value_estimated, o.avg_cost_cents], [true, true, null]);
  } finally { await ctx.db.close(); }
});

test('a receipt without a price leaves a known average alone', async () => {
  const ctx = await setup();
  try {
    const { db, A } = ctx;
    await receive(ctx, A, 10, 400);
    const r = await receive(ctx, A, 10, null);
    assert.equal(r.unit_cost_cents, null);
    assert.equal(await avg(db, A), 400);
  } finally { await ctx.db.close(); }
});

test('customer return at its original cost and assembly output move the average; parts keep their given cost', async () => {
  const ctx = await setup();
  try {
    const { db, A, B, L1, L2 } = ctx;
    await receive(ctx, A, 8, 600);
    await book(ctx, A, -2, 'sale');                       // 6 left at 6,00
    const ret = await book(ctx, A, 2, 'return', 1000);    // returned at the original sale's cost (as kfc_return_line does)
    assert.equal(ret.unit_cost_cents, 1000);
    assert.equal(await avg(db, A), 700, '(6 × 6,00 + 2 × 10,00) / 8 = 7,00');

    const screenReturn = await book(ctx, A, 1, 'return'); // stock screen return: no cost given
    assert.equal(screenReturn.unit_cost_cents, 700);
    assert.equal(await avg(db, A), 700);

    // Assembly: 2 × A (purchase price 600 is what kfc_assemble charges the parts) + labour 500 → 1 × B at 1700.
    await receive(ctx, B, 1, 1000, L2);
    const k = key('asm');
    await db.rpc('kfc_assemble', {
      p_output: B, p_output_location: L2, p_quantity: 1,
      p_components: JSON.stringify([{ article: A, location: L1, quantity: 2 }]), p_labour_cents: 500, p_key: k,
    });
    const part = await move(db, `${k}:in:1`), output = await move(db, `${k}:out`);
    assert.equal(part.unit_cost_cents, 600, 'a part keeps the cost kfc_assemble gives it');
    assert.equal(await avg(db, A), 700, 'consuming parts does not change their average');
    assert.equal(output.unit_cost_cents, 1700);
    assert.equal(await avg(db, B), 1350, '(1 × 10,00 + 1 × 17,00) / 2 = 13,50');
  } finally { await ctx.db.close(); }
});

test('a replayed key books nothing and does not touch the average', async () => {
  const ctx = await setup();
  try {
    const { db, A, L1 } = ctx;
    const line = await poLine(db, ctx.seed.supplier.name, A, 20, 500);
    await db.rpc('kfc_receive_po_line', { p_line: line, p_quantity: 10, p_location: L1, p_key: 'replay-1' });
    await receive(ctx, A, 10, 900);
    assert.equal(await avg(db, A), 700);
    await db.rpc('kfc_receive_po_line', { p_line: line, p_quantity: 10, p_location: L1, p_key: 'replay-1' });
    await db.rpc('kfc_book_move', { p_article: A, p_location: L1, p_delta: 10, p_reason: 'received', p_key: 'replay-1', p_unit_cost_cents: 100 });
    assert.equal(await avg(db, A), 700);
    const [{ n }] = await db.sql(`select count(*)::int as n from public.kfc_stock_moves where idempotency_key = 'replay-1'`);
    assert.equal(n, 1);
  } finally { await ctx.db.close(); }
});

test('valuation, overview, ageing and ledger value stock at quantity × average', async () => {
  const ctx = await setup();
  try {
    const { db, A, L1, L2 } = ctx;
    await receive(ctx, A, 1, 100);
    await receive(ctx, A, 2, 101);                         // average 100,6667 ct
    const k = key('trf');
    await db.rpc('kfc_transfer', { p_article: A, p_from: L1, p_to: L2, p_quantity: 1, p_key: k });
    assert.equal(await avg(db, A), 100.6667);

    const rows = await db.sql(`select quantity, unit_cost_cents, value_cents, cost_estimated from public.kfc_stock_valuation(${TODAY}) where article_code = $1`, [A]);
    assert.equal(rows.length, 2);
    assert.equal(rows.reduce((s, r) => s + num(r.quantity), 0), 3);
    for (const r of rows) {
      assert.equal(r.unit_cost_cents, 101);
      assert.equal(r.cost_estimated, false);
      assert.equal(num(r.value_cents), Math.round(num(r.quantity) * 100.6667));
    }

    const [o] = await db.sql(`select stock_value_cents, avg_cost_cents, value_estimated, purchase_price_cents from public.kfc_article_overview where code = $1`, [A]);
    assert.equal(num(o.stock_value_cents), 302, 'round(3 × 100,6667)');
    assert.equal(num(o.avg_cost_cents), 100.6667);
    assert.equal(o.value_estimated, false);
    assert.equal(num(o.purchase_price_cents), 101);

    const [age] = await db.sql(`select unit_cost_cents, value_cents from public.kfc_stock_ageing() where code = $1`, [A]);
    assert.deepEqual([age.unit_cost_cents, num(age.value_cents)], [101, 302]);

    const [{ l }] = await db.sql(`select public.kfc_stock_ledger(${TODAY}, ${TODAY}, $1) as l`, [A]);
    const ledger = typeof l === 'string' ? JSON.parse(l) : l;
    const out = ledger.rows.find((r) => r.reason === 'transfer' && r.delta < 0);
    assert.equal(num(out.value_cents), -101, 'a transfer leg is valued at its stamped cost');

    // A valuation date before any move shows nothing.
    const before = await db.sql(`select * from public.kfc_stock_valuation(${TODAY} - 1) where article_code = $1`, [A]);
    assert.equal(before.length, 0);
  } finally { await ctx.db.close(); }
});

test('rounding does not drift over many small receipts and sales', async () => {
  const ctx = await setup();
  try {
    const { db, A } = ctx;
    let qty = 0, exact = null;   // exact moving average in floating point (error ~1e-12)
    for (let i = 1; i <= 150; i++) {
      const units = 1 + (i % 3), cost = 97 + ((i * 37) % 211);
      exact = qty <= 0 || exact === null ? cost : (qty * exact + units * cost) / (qty + units);
      qty += units;
      await receive(ctx, A, units, cost);
      if (i % 10 === 0) {
        const s = await book(ctx, A, -3, 'sale');
        assert.ok(Math.abs(s.unit_cost_cents - exact) <= 0.5001, `sale stamped ${s.unit_cost_cents}, exact average ${exact}`);
        qty -= 3;
      }
    }
    const stored = await avg(db, A);
    assert.ok(Math.abs(stored - exact) < 0.01, `average ${stored} vs exact ${exact}`);
    const [o] = await db.sql(`select physical, stock_value_cents from public.kfc_article_overview where code = $1`, [A]);
    assert.equal(num(o.physical), qty);
    assert.ok(Math.abs(num(o.stock_value_cents) - qty * exact) <= 1, `value ${o.stock_value_cents} vs exact ${qty * exact}`);
  } finally { await ctx.db.close(); }
});

test('backfill runs once from the purchase price; re-running the migration changes nothing', async () => {
  const db = await freshDb();
  try {
    const seed = await seedBasics(db);
    const [A] = seed.articles;
    const sqlText = readFileSync(MIGRATION, 'utf8');
    await db.pg.exec(`reset role; ${sqlText}; set role service_role;`);
    assert.equal(await avg(db, A.code), A.purchase_price_cents, 'average starts at the purchase price');

    const ctx = { db, seed, L1: seed.locations[0].id };
    await receive(ctx, A.code, 4, 1000);                    // on hand 0 → 10,00
    assert.equal(await avg(db, A.code), 1000);
    await db.pg.exec(`reset role; ${sqlText}; set role service_role;`);
    assert.equal(await avg(db, A.code), 1000, 'a second run does not backfill again');
    const [{ n }] = await db.sql(`select count(*)::int as n from pg_trigger where tgname = 'kfc_stock_moves_avg_cost'`);
    assert.equal(n, 1);
  } finally { await db.close(); }
});
