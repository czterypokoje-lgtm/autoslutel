// P1-B: a purchase order carries the supplier invoice number and the invoice/receipt
// itself (migration 0111, /api/admin/inkoop). End to end over the API as the office
// owner, against the local dev server on :3001. Cleans up the order and the file.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

const BASE = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
const tag = uniq('podoc');
let poId;

// 1x1 transparent PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function ownerCookie() {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD });
  assert.equal(error, null, error?.message);
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  return `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(data.session)).toString('base64url')}`;
}

let s2PoId, s2Article;
const usedCards = [];
after(async () => {
  if (s2PoId) await db.from('kfc_purchase_orders').delete().eq('id', s2PoId);
  if (s2Article) await db.from('kfc_articles').delete().eq('code', s2Article);
  if (usedCards.length) await db.from('kfc_articles').delete().in('code', usedCards);
  if (!poId) return;
  await db.from('kfc_purchase_orders').delete().eq('id', poId);
  rmSync(join(process.cwd(), 'local-data', `po-${poId}.png`), { force: true });
});

test('S3b: each second-hand part gets its own card (serial), even with the same SKU', async () => {
  const cookie = await ownerCookie();
  const post = (body) => fetch(`${BASE}/api/admin/inkoop`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const sku = `USED-${tag}`.toUpperCase();
  for (let i = 0; i < 2; i += 1) {
    const r = await post({ action: 'article', name: `Gebruikte smart key ${i + 1}`, sku, condition: 'used' });
    assert.equal(r.status, 200, await r.clone().text());
    usedCards.push((await r.json()).article.id);
  }
  const scan = await fetch(BASE + '/api/admin/inkoop?scan=' + encodeURIComponent(sku), { headers: { cookie } });
  assert.equal(scan.status, 200);
  assert.deepEqual((await scan.json()).articles.map((card) => card.id).sort(), [...usedCards].sort());
  assert.notEqual(usedCards[0], usedCards[1], 'two used parts are two cards');
  const { data } = await db.from('kfc_articles').select('condition, tracking').in('code', usedCards);
  assert.ok(data.length === 2 && data.every((a) => a.condition === 'used' && a.tracking === 'serial'));
  assert.equal((await post({ action: 'article', name: 'x', condition: 'kapot' })).status, 400, 'unknown condition refused');
});

test('S2: unknown barcode → quick card, opened once, straight onto the order', async () => {
  const cookie = await ownerCookie();
  const post = (body) => fetch(`${BASE}/api/admin/inkoop`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const scan = (value) => fetch(`${BASE}/api/admin/inkoop?scan=${encodeURIComponent(value)}`, { headers: { cookie } });
  const ean = `99${Date.now().toString().slice(-11)}`; // 13 digits, not a real product

  assert.equal((await scan(ean)).status, 404, 'an unknown barcode is not found');

  const draft = { action: 'article', name: `S2 test ${tag}`, sku: '', ean };
  const [first, simultaneous] = await Promise.all([post(draft), post(draft)]);
  assert.equal(first.status, 200, await first.clone().text());
  s2Article = (await first.json()).article.id;

  assert.equal(simultaneous.status, 200);
  assert.equal((await simultaneous.json()).article.id, s2Article);
  const again = await post({ action: 'article', name: `S2 test ${tag} (dubbel)`, sku: '', ean });
  assert.equal((await again.json()).article.id, s2Article, 'the same EAN returns the same card, not a second one');
  const { count } = await db.from('kfc_articles').select('code', { count: 'exact', head: true }).contains('ean', [ean]);
  assert.equal(count, 1, 'exactly one card exists for this EAN');

  const found = await scan(ean);
  assert.equal(found.status, 200);
  assert.equal((await found.json()).article.id, s2Article, 'scanning the barcode now finds the card');

  assert.equal((await post({ action: 'article', name: 'x', ean: '12AB' })).status, 400, 'a malformed EAN is refused');

  const order = await post({ action: 'create', supplier: `S2 test ${tag}`, lines: [{ article: s2Article, quantity: 4 }] });
  assert.equal(order.status, 200, await order.clone().text());
  s2PoId = (await order.json()).id;
  const { data: lines } = await db.from('kfc_purchase_order_lines').select('article_code, quantity').eq('po_id', s2PoId);
  assert.deepEqual(lines, [{ article_code: s2Article, quantity: 4 }], 'the new card is on the order');
});

test('purchase order: invoice number and attached invoice round-trip', async () => {
  const cookie = await ownerCookie();
  const post = (body) => fetch(`${BASE}/api/admin/inkoop`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const { data: art } = await db.from('kfc_articles').select('code').order('code').range(300, 300).single();
  const created = await post({ action: 'create', supplier: `Doc test ${tag}`, invoice_ref: 'INV-1001', lines: [{ article: art.code, quantity: 2 }] });
  assert.equal(created.status, 200, await created.clone().text());
  poId = (await created.json()).id;

  let { data: row } = await db.from('kfc_purchase_orders').select('invoice_ref, document_type').eq('id', poId).single();
  assert.equal(row.invoice_ref, 'INV-1001', 'invoice number saved on create');

  assert.equal((await post({ action: 'invoice_ref', id: poId, invoice_ref: '  INV-1002 ' })).status, 200);
  ({ data: row } = await db.from('kfc_purchase_orders').select('invoice_ref').eq('id', poId).single());
  assert.equal(row.invoice_ref, 'INV-1002', 'invoice number updated and trimmed');

  const tooLong = await post({ action: 'invoice_ref', id: poId, invoice_ref: 'x'.repeat(81) });
  assert.equal(tooLong.status, 400, 'over 80 characters is refused');

  const badType = await post({ action: 'document', id: poId, type: 'text/plain', data: Buffer.from('hi').toString('base64') });
  assert.equal(badType.status, 400, 'only PDF, JPG or PNG');

  assert.equal((await post({ action: 'document', id: poId, type: 'image/png', data: PNG.toString('base64') })).status, 200);
  ({ data: row } = await db.from('kfc_purchase_orders').select('document_type').eq('id', poId).single());
  assert.equal(row.document_type, 'image/png');

  const doc = await fetch(`${BASE}/api/admin/inkoop?document=${poId}`, { headers: { cookie } });
  assert.equal(doc.status, 200);
  assert.equal(doc.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await doc.arrayBuffer()), PNG, 'the same bytes come back');
});
