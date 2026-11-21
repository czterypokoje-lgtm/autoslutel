// S5 (docs/P0-kesif.md §4, spec §4-A): one unit left, two paid webshop orders arrive at
// the same moment. Only one may hold the unit; the other must say "short". Reservations
// are made by kfc_allocate (0091) from triggers, serialised per article by an advisory
// lock. Runs against the local TEST database with its own article, shelf and orders.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, uniq } from './helpers.mjs';

const tag = uniq('s5');
const article = `${tag}-KEY`.toUpperCase();
let shelf;
const orders = [];

after(async () => {
  if (orders.length) {
    await db.from('kfc_reservations').delete().in('order_line_id', (await db.from('kfc_shop_order_lines').select('id').in('order_id', orders)).data.map((l) => l.id));
    await db.from('kfc_shop_order_lines').delete().in('order_id', orders);
    await db.from('kfc_shop_orders').delete().in('id', orders);
  }
  await db.from('kfc_stock_moves').delete().like('idempotency_key', `${tag}%`);
  await db.from('kfc_stock_levels').delete().eq('article_code', article);
  await db.from('kfc_articles').delete().eq('code', article);
  if (shelf) await db.from('kfc_locations').delete().eq('id', shelf);
});

async function paidOrder(n) {
  const woo = 7_000_000 + (Date.now() % 1_000_000) * 10 + n;
  const { data: o, error } = await db.from('kfc_shop_orders').insert({
    shop: 'autosleutel24.nl', woo_order_id: woo, number: `S5-${n}`, status: 'processing', fulfilment: 'open',
    created_at: new Date(Date.now() - (10 - n) * 1000).toISOString(), modified_at: new Date().toISOString(), raw: { test: tag },
  }).select('id').single();
  assert.equal(error, null, error?.message);
  orders.push(o.id);
  const line = await db.from('kfc_shop_order_lines').insert({ order_id: o.id, woo_line_id: woo, article_code: article, name: 'S5 sleutel', quantity: 1 });
  assert.equal(line.error, null, line.error?.message);
  return o.id;
}

test('S5: last unit, two paid orders at once → exactly one reserved, the other short', async () => {
  await db.from('kfc_articles').insert({ code: article, name: 'S5 laatste sleutel' });
  ({ data: { id: shelf } } = await db.from('kfc_locations').insert({ warehouse: 'test', shelf: `S5-${Date.now() % 100000}`, box: '01', kind: 'shelf' }).select('id').single());
  const seed = await db.rpc('kfc_book_move', { p_article: article, p_location: shelf, p_delta: 1, p_reason: 'received', p_key: `${tag}-seed` });
  assert.equal(seed.error, null, seed.error?.message);

  // Both orders land at the same time, as two webhooks would.
  await Promise.all([paidOrder(1), paidOrder(2)]);

  const { data: lines } = await db.from('kfc_shop_order_lines').select('reserved, state').in('order_id', orders);
  assert.equal(lines.filter((l) => l.reserved === 1).length, 1, 'exactly one order holds the last unit');
  assert.equal(lines.filter((l) => l.state === 'short').length, 1, 'the other order is marked short');
  assert.equal(lines.reduce((s, l) => s + l.reserved, 0), 1, 'never more reserved than on the shelf');
});

test('S5: when the holder is cancelled, the waiting order gets the unit', async () => {
  const { data: lines } = await db.from('kfc_shop_order_lines').select('order_id, reserved').in('order_id', orders);
  const holder = lines.find((l) => l.reserved === 1).order_id;
  const waiting = lines.find((l) => l.reserved === 0).order_id;
  await db.from('kfc_shop_orders').update({ status: 'cancelled', fulfilment: 'cancelled' }).eq('id', holder);
  const { data: freed } = await db.from('kfc_shop_order_lines').select('reserved, state').eq('order_id', waiting).single();
  assert.deepEqual(freed, { reserved: 1, state: 'reserved' }, 'the freed unit moves to the waiting order');
});
