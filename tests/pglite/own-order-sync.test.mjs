/**
 * 0142: webshop orders (public.orders) copied into the order ledger by a trigger, in the same transaction.
 *
 * Checks the trigger against the app's own mapping (src/lib/kfcOwnShop.ts mapOwnOrder, ownArticleCode):
 * unpaid orders stay out, a paid order lands with the same totals, statuses, address and lines, article
 * codes are found by slug and by SKU, status changes follow, an older version is ignored, and a failing
 * copy never fails the webshop's own write (it is logged in kfc_import_runs instead).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb } from './harness.mjs';
import { mapOwnOrder, ownArticleCode, ownOrderKey, OWN_SHOP } from '../../src/lib/kfcOwnShop.ts';

const ORDER = {
  order_number: 'TEST-AS24-0001', status: 'pending',
  email: '  Test.Klant@Example.TEST ', name: ' Test Klant ', phone: '0612345678',
  street: 'Teststraat 1', postcode: '1234 AB', city: 'Teststad', country: 'NL',
  items: [
    { slug: 'test-sleutel-a', sku: 'p-100', title: 'Test sleutelbehuizing', quantity: 2, unitPrice: 19.95, lineTotal: 39.9 },
    { slug: 'test-chip-b', supplierCode: 'testsup-2', name: 'Test transponder', quantity: '1', price: '49.50', surcharge: 5 },
    { title: 'Test onbekend', quantity: 1, unitPrice: 10 },
  ],
  subtotal_inc: 104.4, shipping_cost: 6.95, total_inc: 111.35, total_ex_vat: 92.02, total_vat: 19.33, currency: 'EUR',
};

async function insertOrder(db, order) {
  const cols = Object.keys(order);
  const [row] = await db.sql(
    `insert into public.orders (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
    cols.map((c) => order[c]));
  return row.id;
}
const orderJson = async (db, number) => (await db.sql(`select to_jsonb(o) j from public.orders o where order_number = $1`, [number]))[0].j;
const ledger = async (db, number) => (await db.sql(`select * from public.kfc_shop_orders where shop = $1 and number = $2`, [OWN_SHOP, number]))[0];
const ledgerLines = async (db, id) => db.sql(`select * from public.kfc_shop_order_lines where order_id = $1 order by woo_line_id`, [id]);
const ts = (v) => (v == null ? null : new Date(v).getTime());

test('webshop orders reach the ledger by trigger, exactly as the app import maps them', async () => {
  const db = await freshDb({ all: true });
  try {
    await db.sql(`insert into public.kfc_articles (code, name, sku) values ($1, 'Test artikel A', 'SUP-A'), ('TEST-ART-B', 'Test artikel B', 'TESTSUP-2')`,
      [ownArticleCode('test-sleutel-a')]);

    // Unpaid: stays out.
    await insertOrder(db, ORDER);
    assert.equal(await ledger(db, ORDER.order_number), undefined, 'a pending order is not in the ledger');

    // Paid: in the ledger at once, field for field what mapOwnOrder produces.
    await db.sql(`update public.orders set status = 'paid', paid_at = now() where order_number = $1`, [ORDER.order_number]);
    const row = await orderJson(db, ORDER.order_number);
    const want = mapOwnOrder(row);
    const got = await ledger(db, ORDER.order_number);
    assert.ok(got, 'a paid order is in the ledger');
    assert.equal(Number(got.woo_order_id), ownOrderKey(ORDER.order_number));
    for (const k of ['shop', 'number', 'status', 'currency', 'country', 'customer_email_hash', 'total_incl_cents', 'total_excl_cents',
      'shipping_incl_cents', 'tax_cents', 'fulfilment', 'ship_name', 'ship_company', 'ship_street', 'ship_postcode', 'ship_city',
      'ship_phone', 'ship_email']) {
      assert.deepEqual(got[k], want.order[k], `order.${k}`);
    }
    for (const k of ['created_at', 'modified_at', 'paid_at']) assert.equal(ts(got[k]), ts(want.order[k]), `order.${k}`);
    assert.equal(got.status, 'processing');
    assert.equal(got.fulfilment, 'open');

    const lines = await ledgerLines(db, got.id);
    assert.equal(lines.length, want.lines.length);
    lines.forEach((line, i) => {
      for (const k of ['sku', 'name', 'quantity', 'unit_incl_cents', 'total_excl_cents']) assert.deepEqual(line[k], want.lines[i][k], `line ${i + 1}.${k}`);
      assert.equal(Number(line.woo_line_id), want.lines[i].woo_line_id);
    });
    assert.equal(lines[0].article_code, ownArticleCode('test-sleutel-a'), 'line 1 found by slug');
    assert.equal(lines[1].article_code, 'TEST-ART-B', 'line 2 found by supplier code');
    assert.equal(lines[2].article_code, null, 'line 3 has no article');

    const runs = await db.sql(`select kind, orders, error from public.kfc_import_runs where shop = $1 order by id`, [OWN_SHOP]);
    assert.deepEqual(runs.at(-1), { kind: 'webhook', orders: 1, error: null });

    // Cancelled: follows, and the order leaves the pick list.
    await db.sql(`update public.orders set status = 'cancelled' where order_number = $1`, [ORDER.order_number]);
    const cancelled = await ledger(db, ORDER.order_number);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.fulfilment, 'cancelled');
    assert.equal((await ledgerLines(db, got.id)).length, 3);

    // An older version of the order changes nothing.
    const older = { ...(await orderJson(db, ORDER.order_number)), status: 'paid', updated_at: '2020-01-01T00:00:00+00:00' };
    assert.deepEqual(await db.rpc('kfc_own_order_to_ledger', { p: older }), [{ kfc_own_order_to_ledger: 'unchanged' }]);
    assert.equal((await ledger(db, ORDER.order_number)).status, 'cancelled');
  } finally {
    await db.close();
  }
});

test('a failing copy never fails the webshop order; it is logged', async () => {
  const db = await freshDb({ all: true });
  try {
    await db.pg.exec(`reset role; alter table public.kfc_shop_orders add constraint test_refuse_all check (number <> 'TEST-AS24-0002'); set role service_role`);
    await insertOrder(db, { ...ORDER, order_number: 'TEST-AS24-0002', status: 'paid' });
    assert.equal((await db.sql(`select count(*)::int n from public.orders where order_number = 'TEST-AS24-0002'`))[0].n, 1, 'the order itself is saved');
    assert.equal(await ledger(db, 'TEST-AS24-0002'), undefined, 'not in the ledger');
    const [run] = await db.sql(`select kind, orders, error from public.kfc_import_runs where shop = $1 order by id desc limit 1`, [OWN_SHOP]);
    assert.equal(run.kind, 'webhook');
    assert.match(run.error, /TEST-AS24-0002.*test_refuse_all/);
  } finally {
    await db.close();
  }
});

test('the migration copies paid orders written before it, and runs twice', async () => {
  const { dbAt, prepareSql } = await import('./harness.mjs');
  const { readFileSync } = await import('node:fs');
  const sql = prepareSql(readFileSync(new URL('../../supabase/migrations/0142_own_shop_order_sync.sql', import.meta.url), 'utf8'));
  const pg = await dbAt(141);
  try {
    const cols = Object.keys(ORDER);
    for (const [number, status] of [['TEST-AS24-0010', 'paid'], ['TEST-AS24-0011', 'pending'], ['TEST-AS24-0012', 'shipped']]) {
      const o = { ...ORDER, order_number: number, status };
      await pg.query(`insert into public.orders (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
        cols.map((c) => (c === 'items' ? JSON.stringify(o[c]) : o[c])));
    }
    await pg.exec(sql);
    await pg.exec(sql);
    const rows = (await pg.query(`select number, status, fulfilment from public.kfc_shop_orders order by number`)).rows;
    assert.deepEqual(rows, [
      { number: 'TEST-AS24-0010', status: 'processing', fulfilment: 'open' },
      { number: 'TEST-AS24-0012', status: 'completed', fulfilment: 'external' },
    ]);
  } finally {
    await pg.close();
  }
});
