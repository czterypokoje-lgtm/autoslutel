import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db } from '../tests/erp/helpers.mjs';

const tag = 'webshopmarge-workflow-demo-v1';
const expectedHost = 'ysrebelulbmnbzyvnsic.supabase.co';
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, expectedHost);
const today = new Date().toISOString();
const options = (onConflict) => ({ onConflict, ignoreDuplicates: true });

async function checked(request) {
  const { data, error } = await request;
  assert.equal(error, null, error?.message);
  return data;
}

await checked(db.from('kfc_locations').upsert({ warehouse: 'main', shelf: 'DEMO-WM', box: '01' }, options('warehouse,shelf,box')));
const { id: location } = await checked(db.from('kfc_locations').select('id')
  .eq('warehouse', 'main').eq('shelf', 'DEMO-WM').eq('box', '01').single());

const scenarios = [
  { shop: 'Demo Noord', number: 'WM-DEMO-101', source: 9900000101, article: 'AS24-1-9900101', sku: 'WM-DEMO-CORSA', name: 'Demo · Opel Corsa sleutel', quantity: 4, price: 6000, cost: 2200, ship: true, refund: true },
  { shop: 'Demo Zuid', number: 'WM-DEMO-102', source: 9900000102, article: 'AS24-1-9900102', sku: 'WM-DEMO-POLO', name: 'Demo · Volkswagen Polo sleutel', quantity: 3, price: 6000, cost: 2500, ship: true },
  { shop: 'Demo Zuid', number: 'WM-DEMO-103', source: 9900000103, article: 'AS24-1-9900103', sku: 'WM-DEMO-FIESTA', name: 'Demo · Ford Fiesta sleutel', quantity: 2, price: 5500, cost: null, ship: true },
  { shop: 'Demo Noord', number: 'WM-DEMO-104', source: 9900000104, article: 'AS24-1-9900104', sku: 'WM-DEMO-CLIO', name: 'Demo · Renault Clio sleutel', quantity: 2, price: 6500, cost: 2600, ship: false },
];
const seeded = [];
for (const item of scenarios) {
  await checked(db.from('kfc_articles').upsert({
    code: item.article, sku: item.sku, name: item.name, purchase_price_cents: item.cost,
  }, options('code')));
  const article = await checked(db.from('kfc_articles').select('sku').eq('code', item.article).single());
  assert.equal(article.sku, item.sku);
  await checked(db.rpc('kfc_book_move', {
    p_article: item.article, p_location: location, p_delta: 10, p_reason: 'received', p_key: tag + ':receive:' + item.source,
    p_unit_cost_cents: item.cost, p_note: tag,
  }));

  const unitIncl = Math.round(item.price * 1.21);
  await checked(db.from('kfc_shop_orders').upsert({
    shop: item.shop, woo_order_id: item.source, number: item.number, status: 'processing', fulfilment: 'open',
    created_at: today, modified_at: today, paid_at: today, country: 'NL', total_incl_cents: unitIncl * item.quantity,
    total_excl_cents: item.price * item.quantity, tax_cents: (unitIncl - item.price) * item.quantity,
    raw: { demo: tag },
  }, options('shop,woo_order_id')));
  const order = await checked(db.from('kfc_shop_orders').select('id, raw, fulfilment')
    .eq('shop', item.shop).eq('woo_order_id', item.source).single());
  assert.equal(order.raw?.demo, tag);
  await checked(db.from('kfc_shop_order_lines').upsert({
    order_id: order.id, woo_line_id: item.source, sku: item.sku, article_code: item.article, name: item.name,
    quantity: item.quantity, unit_incl_cents: unitIncl, total_excl_cents: item.price * item.quantity,
  }, options('order_id,woo_line_id')));
  const line = await checked(db.from('kfc_shop_order_lines').select('id').eq('order_id', order.id).eq('woo_line_id', item.source).single());
  if (!item.ship && order.fulfilment === 'open') {
    await checked(db.from('kfc_shop_orders').update({
      ship_name: 'Demo ontvanger', ship_street: 'Testadres 1', ship_postcode: '0000 AA', ship_city: 'Demostad',
      carrier: 'eigen', label_url: '/admin/bestellingen/' + order.id + '/label',
    }).eq('id', order.id).is('label_url', null));
  }
  if (item.ship && order.fulfilment !== 'shipped') {
    await checked(db.rpc('kfc_pick_line', { p_line: line.id, p_picked: true }));
    await checked(db.rpc('kfc_ship_order', { p_order: order.id, p_key: tag + ':ship:' + item.source }));
  }
  if (item.refund) {
    await checked(db.rpc('kfc_return_line', {
      p_line: line.id, p_quantity: 1, p_location: location, p_key: tag + ':return:' + item.source, p_note: tag,
    }));
    await checked(db.from('kfc_shop_order_refunds').upsert({
      order_id: order.id, woo_refund_id: item.source, amount_cents: unitIncl, created_at: today,
      raw: { demo: tag, line_items: [{ total: (-item.price / 100).toFixed(2), total_tax: (-(unitIncl - item.price) / 100).toFixed(2) }] },
    }, options('order_id,woo_refund_id')));
  }
  const verified = await checked(db.from('kfc_shop_orders').select('fulfilment').eq('id', order.id).single());
  if (item.ship) assert.equal(verified.fulfilment, 'shipped');
  const moves = await checked(db.from('kfc_stock_moves').select('reason,delta').eq('order_line_id', line.id));
  assert.equal(moves.filter((move) => move.reason === 'sale').reduce((sum, move) => sum + move.delta, 0), verified.fulfilment === 'shipped' ? -item.quantity : 0);
  if (item.refund) assert.equal(moves.filter((move) => move.reason === 'return').reduce((sum, move) => sum + move.delta, 0), 1);
  seeded.push({ number: item.number, order: order.id, fulfilment: verified.fulfilment });
}

const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { session } = await checked(anon.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD }));
const cookie = 'sb-ysrebelulbmnbzyvnsic-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
const report = await fetch(base + '/admin/winst/webshop?shop=Demo%20Noord', { headers: { cookie } });
assert.equal(report.status, 200);
const html = await report.text();
assert.ok(html.includes('WM-DEMO-101') && html.includes('240,00') && html.includes('60,00') && html.includes('180,00'));
if (seeded.find((row) => row.number === 'WM-DEMO-104').fulfilment === 'open') {
  assert.ok(!html.includes('WM-DEMO-104'), 'open reservations are excluded from reported sales');
}
console.table(seeded);
