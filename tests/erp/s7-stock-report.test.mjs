import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('S7: a transfer changes locations once and keeps the inventory report total', async () => {
  const tag = uniq('s7');
  const article = tag.toUpperCase();
  let from, to, warehouseUser;
  async function read(request) {
    const { data, error } = await request;
    assert.equal(error, null, error?.message);
    return data;
  }
  const levels = () => read(db.from('kfc_stock_position').select('physical,reserved,available').eq('article_code', article).single());
  try {
    await read(db.from('kfc_articles').insert({ code: article, sku: article, name: article, purchase_price_cents: 2200 }));
    const shelf = (name) => read(db.from('kfc_locations').insert({ warehouse: 'main', shelf: tag + name, box: '01' }).select('id').single());
    from = (await shelf('-A')).id;
    to = (await shelf('-B')).id;
    await read(db.rpc('kfc_book_move', { p_article: article, p_location: from, p_delta: 10, p_reason: 'received', p_key: tag + '-initial' }));
    const before = await levels();
    const transfer = () => read(db.rpc('kfc_transfer', {
      p_article: article, p_from: from, p_to: to, p_quantity: 3, p_key: tag + '-transfer',
    }));
    await transfer();
    await transfer();
    assert.deepEqual(before, { physical: 10, reserved: 0, available: 10 });
    assert.deepEqual(await levels(), before);
    assert.deepEqual(await read(db.from('kfc_stock_moves').select('delta').eq('article_code', article).eq('reason', 'transfer').order('delta')), [{ delta: -3 }, { delta: 3 }]);
    const stocks = await read(db.from('kfc_stock_levels').select('location_id,quantity').eq('article_code', article));
    assert.deepEqual(Object.fromEntries(stocks.map((row) => [row.location_id, row.quantity])), { [from]: 7, [to]: 3 });
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { session } = await read(client.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD }));
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
    const cookie = 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');
    const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
    const report = await fetch(base + '/admin/rapport/voorraad?q=' + article, { headers: { cookie } });
    assert.equal(report.status, 200);
    const html = await report.text();
    assert.ok(html.includes(tag + '-A') && html.includes(tag + '-B') && html.includes('220,00'));
    const preview = await fetch(base + '/admin/rapport/voorraad?q=' + article + '&preview=1', { headers: { cookie } });
    assert.equal(preview.status, 200);
    const previewHtml = await preview.text();
    assert.ok(previewHtml.includes('data-report-sheet') && previewHtml.includes('220,00') && previewHtml.includes(tag + '-A'));
    const sheet = previewHtml.split('data-report-sheet')[1].split('</article>')[0];
    assert.match(sheet, /Autosleutel24|KeyForCars/);
    assert.match(sheet, /Peildatum/);
    assert.match(sheet, /Rapport opgehaald op/);
    const credentials = { email: tag + '@example.test', password: 'S7-test-only-' + tag };
    const { user } = await read(db.auth.admin.createUser({ ...credentials, email_confirm: true, app_metadata: { role: 'magazijn' } }));
    warehouseUser = user.id;
    const worker = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { session: workerSession } = await read(worker.auth.signInWithPassword(credentials));
    const workerCookie = 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(workerSession)).toString('base64url');
    const workerPreview = await fetch(base + '/admin/rapport/voorraad?q=' + article + '&preview=1', { headers: { cookie: workerCookie } });
    assert.equal(workerPreview.status, 200);
    const workerHtml = await workerPreview.text();
    assert.ok(workerHtml.includes('data-report-sheet') && workerHtml.includes(article));
    assert.ok(!workerHtml.includes('220,00') && !workerHtml.includes('Inkoopprijs') && !workerHtml.includes('Voorraadwaarde'));



    const now = new Date();
    const day = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(now);
    await read(db.from('kfc_stock_moves').update({ created_at: new Date(now.getTime() - 3 * 864e5).toISOString() }).eq('idempotency_key', tag + '-initial'));
    const activity = await read(db.rpc('kfc_stock_movement_report', { p_from: day, p_to: day, p_query: article }));
    assert.equal(activity.opening, 10);
    assert.equal(activity.closing, 10);
    assert.deepEqual(activity.changes, [{ reason: 'transfer', incoming: 3, outgoing: 3 }]);
    const movement = await fetch(base + '/admin/rapport/voorraadbewegingen?' + new URLSearchParams({ q: article, from: day, to: day }), { headers: { cookie } });
    assert.equal(movement.status, 200);
    const movementHtml = await movement.text();
    assert.ok(movementHtml.includes('Beginvoorraad') && movementHtml.includes(tag + '-A') && movementHtml.includes(tag + '-B'));

  } finally {
    if (warehouseUser) await read(db.auth.admin.deleteUser(warehouseUser));
    await read(db.from('kfc_stock_moves').delete().eq('article_code', article));
    await read(db.from('kfc_stock_levels').delete().eq('article_code', article));
    for (const id of [from, to].filter(Boolean)) await read(db.from('kfc_locations').delete().eq('id', id));
    await read(db.from('kfc_articles').delete().eq('code', article));
  }
});
