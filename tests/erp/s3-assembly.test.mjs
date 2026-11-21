// S3 (docs/P0-kesif.md §4, spec P1-C): parts become a product in one transaction.
// €8 housing + €18 electronics + €4 blade + €5 labour = €35 product cost. Runs against
// the local TEST database; creates its own cards and shelf, removes them afterwards.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, uniq } from './helpers.mjs';

const tag = uniq('s3');
const code = (n) => `${tag}-${n}`.toUpperCase();
const ARTICLES = { housing: 800, electronics: 1800, blade: 400, product: null, nocost: null };
let shelf, apiShelf;
const apiKeys = [];

after(async () => {
  for (const key of apiKeys) await db.from('kfc_stock_moves').delete().like('idempotency_key', `${key}%`);
  await db.from('kfc_assemblies').delete().in('idempotency_key', apiKeys.length ? apiKeys : ['-']);
  await db.from('kfc_stock_moves').delete().like('idempotency_key', `${tag}%`);
  await db.from('kfc_assemblies').delete().like('idempotency_key', `${tag}%`);
  await db.from('kfc_stock_levels').delete().in('location_id', [shelf, apiShelf].filter(Boolean));
  await db.from('kfc_articles').delete().like('code', `${tag.toUpperCase()}%`);
  await db.from('kfc_locations').delete().in('id', [shelf, apiShelf].filter(Boolean));
});

const level = async (article) => (await db.from('kfc_stock_levels').select('quantity').eq('article_code', code(article)).eq('location_id', shelf).maybeSingle()).data?.quantity ?? 0;
const assemble = (key, parts, labour = 500, output = 'product') => db.rpc('kfc_assemble', {
  p_output: code(output), p_output_location: shelf, p_quantity: 1, p_labour_cents: labour, p_key: `${tag}-${key}`,
  p_components: parts.map(([article, quantity]) => ({ article: code(article), location: shelf, quantity })),
});

test('S3 setup: cards default to new / quantity / purchase', async () => {
  ({ data: { id: shelf } } = await db.from('kfc_locations').insert({ warehouse: 'test', shelf: `T-${Date.now() % 100000}`, box: '01', kind: 'shelf' }).select('id').single());
  await db.from('kfc_articles').insert(Object.entries(ARTICLES).map(([n, cost]) => ({ code: code(n), name: `S3 ${n}`, purchase_price_cents: cost })));
  for (const n of ['housing', 'electronics', 'blade']) {
    const r = await db.rpc('kfc_book_move', { p_article: code(n), p_location: shelf, p_delta: 3, p_reason: 'received', p_key: `${tag}-seed-${n}` });
    assert.equal(r.error, null, r.error?.message);
  }
  const { data } = await db.from('kfc_articles').select('condition, tracking, acquisition').eq('code', code('housing')).single();
  assert.deepEqual(data, { condition: 'new', tracking: 'quantity', acquisition: 'purchase' });
});

test('S3: €8 + €18 + €4 + €5 labour = €35, parts −1, product +1', async () => {
  const { data, error } = await assemble('a', [['housing', 1], ['electronics', 1], ['blade', 1]]);
  assert.equal(error, null, error?.message);
  assert.equal(data.unit_cost_cents, 3500, 'product cost is €35');
  assert.deepEqual([await level('housing'), await level('electronics'), await level('blade'), await level('product')], [2, 2, 2, 1]);

  const { data: card } = await db.from('kfc_articles').select('acquisition, purchase_price_cents').eq('code', code('product')).single();
  assert.deepEqual(card, { acquisition: 'assembly', purchase_price_cents: 3500 });

  const { data: moves } = await db.from('kfc_stock_moves').select('delta, reason, assembly_id').like('idempotency_key', `${tag}-a:%`);
  assert.equal(moves.length, 4, 'three parts out, one product in');
  assert.ok(moves.every((m) => m.reason === 'assembly' && m.assembly_id === data.id), 'every move points at the assembly');
});

test('S3: replaying the same assembly books nothing', async () => {
  const { error } = await assemble('a', [['housing', 1], ['electronics', 1], ['blade', 1]]);
  assert.equal(error, null);
  assert.deepEqual([await level('housing'), await level('product')], [2, 1], 'unchanged');
});

test('S3: a part short on its shelf undoes the whole assembly', async () => {
  const { error } = await assemble('short', [['housing', 1], ['electronics', 5], ['blade', 1]]);
  assert.match(error?.message ?? '', /KFC_INSUFFICIENT/);
  assert.deepEqual([await level('housing'), await level('electronics'), await level('blade'), await level('product')], [2, 2, 2, 1], 'nothing moved');
  const { count } = await db.from('kfc_assemblies').select('id', { count: 'exact', head: true }).eq('idempotency_key', `${tag}-short`);
  assert.equal(count, 0, 'no half assembly is recorded');
});

test('S3: a part with unknown cost makes the product cost unknown, not zero', async () => {
  await db.rpc('kfc_book_move', { p_article: code('nocost'), p_location: shelf, p_delta: 1, p_reason: 'received', p_key: `${tag}-seed-nocost` });
  const { data, error } = await assemble('unknown', [['housing', 1], ['nocost', 1]]);
  assert.equal(error, null, error?.message);
  assert.equal(data.unit_cost_cents, null);
  const { data: card } = await db.from('kfc_articles').select('purchase_price_cents').eq('code', code('product')).single();
  assert.equal(card.purchase_price_cents, 3500, 'an unknown cost does not overwrite the last known one');
});

test('S3 screen API: /api/admin/montage assembles from shelf/box, once, and refuses a short shelf', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: login } = await anon.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD });
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(login.session)).toString('base64url')}`;
  const BASE = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
  const post = (body) => fetch(`${BASE}/api/admin/montage`, { method: 'POST', headers: { cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // A shelf in the main warehouse, the way the screen addresses it (shelf + box).
  const shelfCode = `T${Date.now() % 100000}`;
  ({ data: { id: apiShelf } } = await db.from('kfc_locations').insert({ warehouse: 'main', shelf: shelfCode, box: '01', kind: 'shelf' }).select('id').single());
  for (const n of ['housing', 'electronics', 'blade']) {
    await db.rpc('kfc_book_move', { p_article: code(n), p_location: apiShelf, p_delta: 2, p_reason: 'received', p_key: `${tag}-api-seed-${n}` });
  }
  const body = (key, electronics = 1) => ({
    output: code('product'), shelf: shelfCode, box: '01', quantity: 1, labour_cents: 500, key,
    components: [['housing', 1], ['electronics', electronics], ['blade', 1]].map(([n, q]) => ({ article: code(n), shelf: shelfCode, box: '01', quantity: q })),
  });

  const key = crypto.randomUUID(); apiKeys.push(key);
  const first = await post(body(key));
  assert.equal(first.status, 200, await first.clone().text());
  const made = (await first.json()).assembly;
  assert.equal(made.unit_cost_cents, 3500, 'owner sees the €35 cost');

  const again = await post(body(key));
  assert.equal((await again.json()).assembly.id, made.id, 'a double click books the same assembly once');

  const shortKey = crypto.randomUUID(); apiKeys.push(shortKey);
  const short = await post(body(shortKey, 9));
  assert.equal(short.status, 409);
  assert.match((await short.json()).error, /Onvoldoende/, 'a readable message, not a database code');

  const elsewhere = crypto.randomUUID(); apiKeys.push(elsewhere);
  const wrongShelf = await post({ ...body(elsewhere), components: [{ article: code('housing'), shelf: 'NOPE', box: '01', quantity: 1 }] });
  assert.equal(wrongShelf.status, 409, 'a part that is not on that shelf is refused before anything is booked');
});
