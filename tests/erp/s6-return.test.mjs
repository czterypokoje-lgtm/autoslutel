// S6 (docs/P0-kesif.md §4, spec §4-A): partial physical return of a shipped webshop line.
// 3 shipped at €12 cost → return 1, then 2 → a 4th is refused; the sale move and its
// price stay untouched; returned units come back at the sale's cost. Migration 0113.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

const tag = uniq('s6');
const article = `${tag}-KEY`.toUpperCase();
let shelf, orderId, lineId;

after(async () => {
  await db.from('kfc_stock_moves').delete().like('idempotency_key', `${tag}%`);
  if (lineId) {
    await db.from('kfc_stock_moves').delete().like('idempotency_key', `return-${lineId}-%`);
    await db.from('kfc_reservations').delete().eq('order_line_id', lineId);
  }
  if (orderId) { await db.from('kfc_shop_order_lines').delete().eq('order_id', orderId); await db.from('kfc_shop_orders').delete().eq('id', orderId); }
  await db.from('kfc_stock_levels').delete().eq('article_code', article);
  await db.from('kfc_articles').delete().eq('code', article);
  if (shelf) await db.from('kfc_locations').delete().eq('id', shelf);
});

const level = async () => (await db.from('kfc_stock_levels').select('quantity').eq('article_code', article).eq('location_id', shelf).single()).data.quantity;
const giveBack = (qty, key) => db.rpc('kfc_return_line', { p_line: lineId, p_quantity: qty, p_location: shelf, p_key: `${tag}-${key}` });

test('S6: partial return books back what came back, never more than shipped, sale untouched', async () => {
  await db.from('kfc_articles').insert({ code: article, name: 'S6 sleutel', purchase_price_cents: 1200 });
  ({ data: { id: shelf } } = await db.from('kfc_locations').insert({ warehouse: 'main', shelf: `S6-${Date.now() % 100000}`, box: '01', kind: 'shelf' }).select('id').single());
  assert.equal((await db.rpc('kfc_book_move', { p_article: article, p_location: shelf, p_delta: 3, p_reason: 'received', p_key: `${tag}-seed` })).error, null);

  const woo = 8_000_000 + (Date.now() % 1_000_000);
  ({ data: { id: orderId } } = await db.from('kfc_shop_orders').insert({
    shop: tag, woo_order_id: woo, number: 'S6-1', status: 'processing', fulfilment: 'open',
    created_at: new Date().toISOString(), modified_at: new Date().toISOString(), raw: { test: tag },
  }).select('id').single());
  ({ data: { id: lineId } } = await db.from('kfc_shop_order_lines').insert({ order_id: orderId, woo_line_id: woo, article_code: article, name: 'S6 sleutel', quantity: 3, unit_incl_cents: 3630 }).select('id').single());

  assert.match((await giveBack(1, 'early')).error?.message ?? '', /KFC_NOT_SHIPPED/, 'nothing can come back before it was shipped');

  const shipped = await db.rpc('kfc_ship_order', { p_order: orderId, p_key: `${tag}-ship` });
  assert.equal(shipped.error, null, shipped.error?.message);
  assert.equal(await level(), 0, 'all three left the shelf');

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD });
  assert.equal(error, null, error?.message);
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(data.session)).toString('base64url')}`;
  const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
  const post = (quantity, key, session = cookie) => fetch(`${base}/api/admin/kfc-orders`, {
    method: 'POST', headers: { cookie: session, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'return', line: lineId, location: shelf, quantity, key }),
  });
  const detail = () => fetch(`${base}/admin/bestellingen/${orderId}`, { headers: { cookie } }).then((response) => response.text());
  assert.match(await detail(), /Fysieke retour/);
  assert.equal((await post(1, randomUUID(), '')).status, 401);
  assert.equal((await post(1.5, randomUUID())).status, 400);
  const key = randomUUID();
  const first = await post(1, key);
  assert.equal(first.status, 200, await first.clone().text());
  assert.deepEqual(await first.json(), { ok: true });
  assert.equal((await post(1, key)).status, 200, 'a replay is harmless');
  assert.equal(await level(), 1, 'one back on the shelf, not two');
  assert.equal((await post(2, randomUUID())).status, 200);
  const returnedPage = await detail();
  assert.doesNotMatch(returnedPage, /<[^>]+>Fysieke retour</);
  assert.match(returnedPage, /Besteld op.*?<time datetime="[^"]+"/is);
  assert.match(returnedPage, /Retourgeschiedenis/);
  assert.equal([...returnedPage.matchAll(/Retour geboekt op[\s\S]*?<time datetime="[^"]+"/gi)]
    .filter((match) => !match[0].includes('<script')).length, 2, 'each physical return displays its own booking time');
  assert.equal(await level(), 3);
  assert.equal((await post(1, randomUUID())).status, 409, 'a fourth unit cannot come back');
  const refundDate = new Date();
  refundDate.setUTCDate(1);
  refundDate.setUTCHours(12, 0, 0, 0);
  refundDate.setUTCMonth(refundDate.getUTCMonth() - 1);
  const refundMonth = refundDate.toISOString().slice(0, 7);
  const { error: refundError } = await db.from('kfc_shop_order_refunds').insert([
    { order_id: orderId, woo_refund_id: woo, amount_cents: 1210, created_at: refundDate.toISOString(),
      raw: { line_items: [{ total: '-10.00', total_tax: '-2.10' }] } },
    { order_id: orderId, woo_refund_id: woo + 1, amount_cents: 199, raw: {} },
  ]);
  assert.equal(refundError, null, refundError?.message);
  const report = await fetch(`${base}/admin/winst/webshop`, { headers: { cookie } });
  assert.equal(report.status, 200);
  const reportHtml = await report.text();
  const refundRows = [...reportHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((match) => match[1]);
  assert.ok(refundRows.some((row) => row.includes(refundMonth) && row.includes(tag) && row.includes('-10,00')));
  const refundRow = refundRows.find(row => row.includes(refundMonth) && row.includes(tag));
  assert.equal((refundRow.match(/-10,00/g) ?? []).length, 2, 'net revenue and margin both reflect the refund excluding VAT');

  const { data: moves } = await db.from('kfc_stock_moves').select('reason, delta, unit_cost_cents').eq('order_line_id', lineId).order('id');
  const sale = moves.filter((m) => m.reason === 'sale');
  assert.equal(sale.reduce((s, m) => s + m.delta, 0), -3, 'the sale move still says 3 sold');
  assert.deepEqual(moves.filter((m) => m.reason === 'return').map((m) => [m.delta, m.unit_cost_cents]), [[1, 1200], [2, 1200]], 'returns at the sale cost');
  const { data: line } = await db.from('kfc_shop_order_lines').select('unit_incl_cents, quantity').eq('id', lineId).single();
  assert.deepEqual(line, { unit_incl_cents: 3630, quantity: 3 }, 'the original price and quantity on the order are kept');
});
