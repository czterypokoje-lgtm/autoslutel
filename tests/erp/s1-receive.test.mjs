// S1 (docs/P0-kesif.md §4): supplier invoice says 10, goods arrive as 8 then 2.
// The ledger must show +8 and +2, the line must say received 10, and replaying
// the first receipt must change nothing. Runs against the local TEST database only.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, uniq } from './helpers.mjs';

const tag = uniq('s1');
let po, line, article, location, levelBefore, priceBefore;

after(async () => {
  // Put everything back exactly as it was.
  await db.from('kfc_stock_moves').delete().like('idempotency_key', `${tag}%`);
  if (levelBefore === null) await db.from('kfc_stock_levels').delete().eq('article_code', article).eq('location_id', location);
  else await db.from('kfc_stock_levels').update({ quantity: levelBefore }).eq('article_code', article).eq('location_id', location);
  await db.from('kfc_articles').update({ purchase_price_cents: priceBefore }).eq('code', article);
  if (po) await db.from('kfc_purchase_orders').delete().eq('id', po.id); // lines cascade
});

test('S1: invoice 10, received 8 + 2, replay changes nothing', async () => {
  const { data: art } = await db.from('kfc_articles').select('code, purchase_price_cents').order('code').range(200, 200).single();
  article = art.code; priceBefore = art.purchase_price_cents;
  const { data: loc } = await db.from('kfc_locations').select('id').limit(1).single();
  location = loc.id;
  const { data: lvl } = await db.from('kfc_stock_levels').select('quantity').eq('article_code', article).eq('location_id', location).maybeSingle();
  levelBefore = lvl ? lvl.quantity : null;

  ({ data: po } = await db.from('kfc_purchase_orders').insert({ supplier: `S1 test ${tag}`, status: 'ordered', note: tag }).select().single());
  ({ data: line } = await db.from('kfc_purchase_order_lines').insert({ po_id: po.id, article_code: article, quantity: 10, unit_cost_cents: 350 }).select().single());

  const receive = (qty, key) => db.rpc('kfc_receive_po_line', { p_line: line.id, p_quantity: qty, p_location: location, p_key: `${tag}-${key}` });

  const first = await receive(8, 'a');
  assert.equal(first.error, null, first.error?.message);
  let { data: l1 } = await db.from('kfc_purchase_order_lines').select('received').eq('id', line.id).single();
  assert.equal(l1.received, 8, 'after the first receipt the line says 8');
  let { data: p1 } = await db.from('kfc_purchase_orders').select('status').eq('id', po.id).single();
  assert.equal(p1.status, 'ordered', 'order stays open while 2 are missing');

  assert.equal((await receive(2, 'b')).error, null);
  assert.equal((await receive(8, 'a')).error, null, 'replaying receipt a must not fail');

  const { data: l2 } = await db.from('kfc_purchase_order_lines').select('received').eq('id', line.id).single();
  assert.equal(l2.received, 10, 'line total is 10, not 18');

  const { data: moves } = await db.from('kfc_stock_moves').select('delta, reason, purchase_order_line_id').like('idempotency_key', `${tag}%`).order('id');
  assert.deepEqual(moves.map((m) => m.delta), [8, 2], 'ledger shows +8 and +2, once each');
  assert.ok(moves.every((m) => m.reason === 'received' && m.purchase_order_line_id === line.id), 'moves point back at the PO line');

  const { data: lvlAfter } = await db.from('kfc_stock_levels').select('quantity').eq('article_code', article).eq('location_id', location).single();
  assert.equal(lvlAfter.quantity, (levelBefore ?? 0) + 10, 'shelf went up by exactly 10');

  const { data: p2 } = await db.from('kfc_purchase_orders').select('status').eq('id', po.id).single();
  assert.equal(p2.status, 'received', 'order closes when everything is in');
});

test('S1c: purchase cost is dated per receipt; a new price does not rewrite the old one', async () => {
  const { data: dpo } = await db.from('kfc_purchase_orders').insert({ supplier: `S1c test ${tag}`, status: 'ordered', note: tag }).select().single();
  try {
    const { data: l350 } = await db.from('kfc_purchase_order_lines').insert({ po_id: dpo.id, article_code: article, quantity: 1, unit_cost_cents: 350 }).select().single();
    const { data: l500 } = await db.from('kfc_purchase_order_lines').insert({ po_id: dpo.id, article_code: article, quantity: 1, unit_cost_cents: 500 }).select().single();
    assert.equal((await db.rpc('kfc_receive_po_line', { p_line: l350.id, p_quantity: 1, p_location: location, p_key: `${tag}-c350` })).error, null);
    assert.equal((await db.rpc('kfc_receive_po_line', { p_line: l500.id, p_quantity: 1, p_location: location, p_key: `${tag}-c500` })).error, null);

    const { data: moves } = await db.from('kfc_stock_moves').select('idempotency_key, unit_cost_cents, created_at').in('idempotency_key', [`${tag}-c350`, `${tag}-c500`]).order('id');
    assert.deepEqual(moves.map((m) => m.unit_cost_cents), [350, 500], 'each receipt keeps the cost it was booked at');
    const { data: art } = await db.from('kfc_articles').select('purchase_price_cents').eq('code', article).single();
    assert.equal(art.purchase_price_cents, 500, 'the article card shows the latest purchase price (current method)');
  } finally {
    await db.from('kfc_stock_moves').delete().in('idempotency_key', [`${tag}-c350`, `${tag}-c500`]);
    await db.from('kfc_purchase_orders').delete().eq('id', dpo.id);
  }
});

test('S1b: a cancelled order cannot be received (0110)', async () => {
  const { data: cpo } = await db.from('kfc_purchase_orders').insert({ supplier: `S1b test ${tag}`, status: 'cancelled', note: tag }).select().single();
  try {
    const { data: cline } = await db.from('kfc_purchase_order_lines').insert({ po_id: cpo.id, article_code: article, quantity: 3 }).select().single();
    const res = await db.rpc('kfc_receive_po_line', { p_line: cline.id, p_quantity: 3, p_location: location, p_key: `${tag}-cancelled` });
    assert.match(res.error?.message ?? '', /KFC_PO_CANCELLED/, 'receiving on a cancelled order is refused');
    const { count } = await db.from('kfc_stock_moves').select('id', { count: 'exact', head: true }).eq('idempotency_key', `${tag}-cancelled`);
    assert.equal(count, 0, 'no stock move was booked');
  } finally {
    await db.from('kfc_purchase_orders').delete().eq('id', cpo.id);
  }
});
