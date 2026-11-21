// 0139: close an ordered purchase order short ("rest komt niet").
// Run: node --test tests/pglite/po-close.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { freshDb, seedBasics } from './harness.mjs';

let db;
let articleA;
let articleB;
let shelf;
let supplier;

before(async () => {
  db = await freshDb({ plus: ['0139_kfc_po_close.sql'] });
  const seed = await seedBasics(db);
  [articleA, articleB] = seed.articles.map((a) => a.code);
  shelf = seed.locations[0].id;
  supplier = seed.supplier;
});

after(async () => { await db?.close(); });

/** A purchase order with lines, straight in the tables (createPurchaseOrder does the same via PostgREST). */
async function order(status, lines) {
  const [po] = await db.sql(
    `insert into public.kfc_purchase_orders (supplier, supplier_id, status, ordered_at)
     values ($1, $2, $3, case when $3 = 'draft' then null else now() end) returning id`,
    [supplier.name, supplier.id, status],
  );
  const ids = [];
  for (const [article, quantity, cost] of lines) {
    const [line] = await db.sql(
      'insert into public.kfc_purchase_order_lines (po_id, article_code, quantity, unit_cost_cents) values ($1, $2, $3, $4) returning id',
      [po.id, article, quantity, cost ?? null],
    );
    ids.push(line.id);
  }
  return { id: po.id, lines: ids };
}

const receive = (line, quantity) =>
  db.rpc('kfc_receive_po_line', { p_line: line, p_quantity: quantity, p_location: shelf, p_key: randomUUID(), p_created_by: null });
const receiveWithPhoto = (line, quantity) =>
  db.rpc('kfc_receive_with_photo', { p_line: line, p_quantity: quantity, p_location: shelf, p_key: randomUUID(), p_created_by: null, p_photo: null, p_mime: null });
const close = (po, reason) => db.rpc('kfc_close_purchase_order', { p_po: po, p_reason: reason, p_user: null });
const po = async (id) => (await db.sql('select * from public.kfc_purchase_orders where id = $1', [id]))[0];
const position = async (code) => (await db.sql('select * from public.kfc_stock_position where article_code = $1', [code]))[0];

test('order 10, receive 6, close: closed, incoming 4 -> 0, received stays 6, on hand 6', async () => {
  const { id, lines: [line] } = await order('ordered', [[articleA, 10, 250]]);
  await receive(line, 6);
  assert.equal(Number((await position(articleA)).incoming), 4);
  assert.equal((await po(id)).status, 'ordered');

  await close(id, 'Leverancier levert de rest niet meer');

  const row = await po(id);
  assert.equal(row.status, 'closed');
  assert.equal(row.close_reason, 'Leverancier levert de rest niet meer');
  assert.ok(row.closed_at, 'closed_at is set');
  const [l] = await db.sql('select quantity, received from public.kfc_purchase_order_lines where id = $1', [line]);
  assert.deepEqual([l.quantity, l.received], [10, 6], 'line history stays true');
  const p = await position(articleA);
  assert.equal(Number(p.incoming), 0);
  assert.equal(Number(p.physical), 6);

  // The other places that show the rest: webshop position, article overview, purchase facts, supplier balance.
  const [web] = await db.sql('select incoming from public.kfc_webshop_position where article_code = $1', [articleA]);
  assert.equal(Number(web.incoming), 0);
  const [overview] = await db.sql('select incoming from public.kfc_article_overview where code = $1', [articleA]);
  assert.equal(Number(overview.incoming), 0);
  const [fact] = await db.sql('select open_quantity, quantity, received from public.kfc_purchase_line_facts where line_id = $1', [line]);
  assert.deepEqual([Number(fact.open_quantity), fact.quantity, fact.received], [0, 10, 6]);
  const [balance] = await db.sql('select open_pos, on_order_cents from public.kfc_supplier_balance where supplier_id = $1', [supplier.id]);
  assert.equal(Number(balance.open_pos), 0);
  assert.equal(Number(balance.on_order_cents), 0);
});

test('an ordered order with nothing received can be closed (supplier cancelled)', async () => {
  const { id } = await order('ordered', [[articleB, 5]]);
  assert.equal(Number((await position(articleB)).incoming), 5);
  await close(id, 'Leverancier heeft de order geannuleerd');
  assert.equal((await po(id)).status, 'closed');
  const p = await position(articleB);
  assert.equal(Number(p.incoming), 0);
  assert.equal(Number(p.physical), 0);
});

test('receiving on a closed order is refused, on both receive paths', async () => {
  const { id, lines: [line] } = await order('ordered', [[articleA, 3]]);
  await receive(line, 1);
  await close(id, 'Rest uitverkocht');
  const before = Number((await position(articleA)).physical);
  await assert.rejects(receive(line, 1), /KFC_PO_CLOSED/);
  await assert.rejects(receiveWithPhoto(line, 1), /KFC_RECEIPT_CONFLICT/);
  assert.equal(Number((await position(articleA)).physical), before, 'no stock booked');
  const [l] = await db.sql('select received from public.kfc_purchase_order_lines where id = $1', [line]);
  assert.equal(l.received, 1);
});

test('closing a draft, a cancelled or a received order is refused with KFC_PO_NOT_ORDERED', async () => {
  const draft = await order('draft', [[articleA, 2]]);
  await assert.rejects(close(draft.id, 'x'), /KFC_PO_NOT_ORDERED/);
  const cancelled = await order('cancelled', [[articleA, 2]]);
  await assert.rejects(close(cancelled.id, 'x'), /KFC_PO_NOT_ORDERED/);
  const full = await order('ordered', [[articleA, 2]]);
  await receive(full.lines[0], 2);
  assert.equal((await po(full.id)).status, 'received', 'last receipt sets received, as before');
  await assert.rejects(close(full.id, 'x'), /KFC_PO_NOT_ORDERED/);
  assert.equal((await po(draft.id)).status, 'draft');
  assert.equal((await po(cancelled.id)).status, 'cancelled');
});

test('an ordered order whose lines are all received is refused (KFC_PO_FULLY_RECEIVED)', async () => {
  const { id, lines: [line] } = await order('ordered', [[articleA, 1]]);
  await receive(line, 1);
  await db.sql("update public.kfc_purchase_orders set status = 'ordered', received_at = null where id = $1", [id]);
  await assert.rejects(close(id, 'x'), /KFC_PO_FULLY_RECEIVED/);
});

test('an empty reason is refused and the order stays ordered', async () => {
  const { id } = await order('ordered', [[articleA, 4]]);
  await assert.rejects(close(id, ''), /KFC_PO_REASON_REQUIRED/);
  await assert.rejects(close(id, '   '), /KFC_PO_REASON_REQUIRED/);
  await assert.rejects(close(id, null), /KFC_PO_REASON_REQUIRED/);
  assert.equal((await po(id)).status, 'ordered');
  await close(id, 'opruimen');
});

test('closing twice is quiet and keeps the first reason and time', async () => {
  const { id } = await order('ordered', [[articleA, 2]]);
  await close(id, 'eerste reden');
  const first = await po(id);
  await close(id, 'tweede reden');
  const second = await po(id);
  assert.equal(second.status, 'closed');
  assert.equal(second.close_reason, 'eerste reden');
  assert.equal(String(second.closed_at), String(first.closed_at));
});

test('an unknown order is refused', async () => {
  await assert.rejects(close(randomUUID(), 'x'), /KFC_PO_NOT_FOUND/);
});

test('the status check allows closed and still refuses nonsense; closed needs a reason', async () => {
  const { id } = await order('ordered', [[articleA, 1]]);
  await assert.rejects(db.sql("update public.kfc_purchase_orders set status = 'lost' where id = $1", [id]), /check constraint/);
  await assert.rejects(db.sql("update public.kfc_purchase_orders set status = 'closed' where id = $1", [id]), /kfc_purchase_orders_closed_fields/);
  await close(id, 'opruimen');
});

test('the migration can run twice', async () => {
  const text = await readFile(new URL('../../supabase/migrations/0139_kfc_po_close.sql', import.meta.url), 'utf8');
  // Migrations run as the owner, not as service_role.
  await db.pg.exec('reset role');
  try { await db.pg.exec(text); } finally { await db.pg.exec('set role service_role'); }
  const checks = await db.sql(
    "select conname from pg_constraint where conrelid = 'public.kfc_purchase_orders'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%cancelled%'",
  );
  assert.deepEqual(checks.map((c) => c.conname), ['kfc_purchase_orders_status_check'], 'exactly one status check after a re-run');
  assert.equal(Number((await position(articleA)).incoming), 0, 'no open orders left for article A');
});
