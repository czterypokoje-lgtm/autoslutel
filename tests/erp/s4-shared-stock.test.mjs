import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('S4 and S5: one webshop or service reservation wins and confirmed use deducts once', async () => {
  const tag = uniq('shared-stock');
  const article = tag.toUpperCase();
  const key = randomUUID();
  let location, job, order, line;

  async function read(request) {
    const { data, error } = await request;
    assert.equal(error, null, error?.message);
    return data;
  }
  const reserve = (id = key) => db.rpc('kfc_reserve_job_stock', { p_id: id, p_job: job, p_article: article, p_quantity: 1 });
  const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
  async function login(email, password) {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const session = await read(anon.auth.signInWithPassword({ email, password }));
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    return {
      userId: session.user.id,
      cookie: 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(session.session)).toString('base64url'),
    };
  }
  const position = () => read(db.from('kfc_stock_position').select('physical, available, reserved').eq('article_code', article).single());
  try {
    await read(db.from('kfc_articles').insert({ code: article, name: tag, purchase_price_cents: 2200 }));
    location = (await read(db.from('kfc_locations').insert({ warehouse: 'main', shelf: tag, box: '01' }).select('id').single())).id;
    const receive = (suffix) => read(db.rpc('kfc_book_move', {
      p_article: article, p_location: location, p_delta: 1, p_reason: 'received', p_key: tag + suffix,
    }));
    await receive('-initial');
    job = (await read(db.from('jobs').insert({
      scheduled_date: '2026-11-21', slot_start: '10:00', slot_end: '12:00',
    }).select('id').single())).id;
    const now = new Date();
    const woo = 13_000_000 + now.getTime() % 1_000_000;
    order = (await read(db.from('kfc_shop_orders').insert({
      shop: tag, woo_order_id: woo, number: tag, status: 'processing', created_at: now.toISOString(), modified_at: now.toISOString(),
    }).select('id').single())).id;
    const [service, webshop] = await Promise.all([
      reserve(), read(db.from('kfc_shop_order_lines').insert({
        order_id: order, woo_line_id: woo, article_code: article, name: tag, quantity: 1,
      }).select('id').single()),
    ]);
    line = webshop.id;
    const orderLine = () => read(db.from('kfc_shop_order_lines').select('reserved').eq('id', line).single());
    assert.equal(Number(!service.error) + (await orderLine()).reserved, 1);
    assert.deepEqual(await position(), { physical: 1, available: 0, reserved: 1 });
    if (service.error) {
      assert.match(service.error.message, /KFC_INSUFFICIENT/);
      await read(db.from('kfc_shop_orders').update({ status: 'cancelled' }).eq('id', order));
      await read(reserve());
      await read(db.from('kfc_shop_orders').update({ status: 'processing', fulfilment: 'open' }).eq('id', order));
      await read(db.from('kfc_shop_order_lines').update({ state: 'open', quantity: 1 }).eq('id', line));
    }
    const shipment = await db.rpc('kfc_ship_order', { p_order: order, p_key: tag + '-ship' });
    // 0138: the unit is held for the job, so the web line is not reserved and the order is refused
    // before any stock is looked at. The older KFC_STOCK_RESERVED_FOR_JOB guard sits behind this one.
    assert.match(shipment.error?.message ?? '', /KFC_NOT_PICKED|KFC_STOCK_RESERVED_FOR_JOB/);
    const [owner, worker] = await Promise.all([
      login(process.env.CRM_TEST_EMAIL, process.env.CRM_TEST_PASSWORD),
      login(process.env.CRM_TECH_EMAIL, process.env.CRM_TECH_PASSWORD),
    ]);
    const route = base + '/api/admin/jobs/' + job + '/warehouse-stock';
    const openJob = await fetch(base + '/admin/jobs/' + job, { headers: { cookie: owner.cookie } });
    assert.ok((await openJob.text()).includes('Magazijnvoorraad voor deze klus'));
    const post = (actor, body) => fetch(route, { method: 'POST', headers: { cookie: actor.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const usage = { action: 'use', id: key, location };
    assert.equal((await post(worker, usage)).status, 403);
    const workerId = (await read(db.from('technicians').select('id').eq('user_id', worker.userId).single())).id;
    await read(db.from('jobs').update({ technician_id: workerId }).eq('id', job));
    const stock = await fetch(route, { headers: { cookie: worker.cookie } });
    assert.equal(stock.status, 200);
    const view = await stock.json();
    assert.equal(view.canReserve, false);
    assert.ok(view.reservations.some((row) => row.id === key && row.state === 'reserved'));
    assert.equal((await post(worker, { action: 'release', id: key })).status, 403);
    assert.equal((await post(worker, usage)).status, 200);
    const confirmUsage = () => read(db.rpc('kfc_finish_job_stock', { p_id: key, p_job: job, p_location: location, p_user: null }));
    assert.equal((await confirmUsage()).state, 'used');
    assert.equal((await confirmUsage()).state, 'used');
    assert.deepEqual(await position(), { physical: 0, available: 0, reserved: 0 });
    assert.deepEqual(await read(db.from('kfc_stock_moves').select('delta, unit_cost_cents').eq('idempotency_key', 'job-stock:' + key)),
      [{ delta: -1, unit_cost_cents: 2200 }]);

    await read(db.from('kfc_shop_orders').update({ status: 'cancelled' }).eq('id', order));
    await receive('-replenish');
    const secondKey = randomUUID();
    await read(reserve(secondKey));
    await read(db.from('jobs').update({ status: 'geannuleerd' }).eq('id', job));
    assert.equal((await read(db.from('kfc_job_stock').select('state').eq('id', secondKey).single())).state, 'released');
    assert.deepEqual(await position(), { physical: 1, available: 1, reserved: 0 });
  } finally {
    if (job) await read(db.from('jobs').delete().eq('id', job));
    if (line) {
      await read(db.from('kfc_reservations').delete().eq('order_line_id', line));
      await read(db.from('kfc_shop_order_lines').delete().eq('id', line));
    }
    if (order) await read(db.from('kfc_shop_orders').delete().eq('id', order));
    await read(db.from('kfc_stock_moves').delete().eq('article_code', article));
    await read(db.from('kfc_stock_levels').delete().eq('article_code', article));
    if (location) await read(db.from('kfc_locations').delete().eq('id', location));
    await read(db.from('kfc_articles').delete().eq('code', article));
  }
});
