import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

test('S4 locks linked invoice prices and known job costs on issuance', async () => {
  let jobId, invoiceId, unknownInvoiceId, location;
  const article = uniq('invoice-stock').toUpperCase();
  async function query(request) {
    const { data, error } = await request;
    assert.equal(error, null, error?.message);
    return data;
  }
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: process.env.CRM_TEST_EMAIL, password: process.env.CRM_TEST_PASSWORD });
  assert.equal(error, null, error?.message);
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  const cookie = 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(data.session)).toString('base64url');
  const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
  const headers = { cookie, 'Content-Type': 'application/json' };
  const invoices = base + '/api/admin/invoices';
  const request = (method, path, body) => fetch(path, { method, headers, body: JSON.stringify(body) });
  const snapshot = () => query(db.from('job_invoice_snapshots').select('*').eq('invoice_id', invoiceId).maybeSingle());
  try {
    jobId = (await query(db.from('jobs').insert({
      status: 'gepland', cost_materials: 99, cost_technician: 45, quoted_price: 211.75,
      customer_name: 'Demo S4 test', car_make: article, car_model: 'Corsa', scenario: 'bijmaken',
      scheduled_date: '2026-11-21', slot_start: '10:00', slot_end: '12:00',
    }).select('id').single())).id;
    await query(db.from('kfc_articles').insert({ code: article, name: article, purchase_price_cents: 2200 }));
    location = (await query(db.from('kfc_locations').insert({ warehouse: 'main', shelf: article, box: '01' }).select('id').single())).id;
    await query(db.rpc('kfc_book_move', { p_article: article, p_location: location, p_delta: 1, p_reason: 'received', p_key: article }));
    const reservation = randomUUID();
    await query(db.rpc('kfc_reserve_job_stock', { p_id: reservation, p_job: jobId, p_article: article, p_quantity: 1 }));
    await query(db.rpc('kfc_finish_job_stock', { p_id: reservation, p_job: jobId, p_location: location, p_user: null }));
    await query(db.from('kfc_articles').update({ purchase_price_cents: 9800 }).eq('code', article));
    await query(db.from('jobs').update({ status: 'afgerond' }).eq('id', jobId));

    await query(db.from('dispatch_pricing').insert({ make: article, model: 'Corsa', scenario: 'bijmaken',
      price: 211.75, service_price: 125 }));
    const detail = await fetch(base + '/admin/jobs/' + jobId, { headers });
    assert.ok((await detail.text()).includes('/admin/facturen/nieuw?klus=' + jobId));
    const form = await fetch(base + '/admin/facturen/nieuw?klus=' + jobId, { headers });
    assert.equal(form.status, 200);
    const formHtml = await form.text();
    assert.ok(formHtml.includes(reservation) && formHtml.includes('211,75'));
    const draftMarkup = formHtml.replaceAll(String.fromCharCode(92), '');
    assert.ok(draftMarkup.includes('"unitPrice":50') && draftMarkup.includes('"unitPrice":125'));
    const payload = { client_name: uniq('invoice'), lines: [
      { description: 'Product', quantity: 1, unitPrice: 50, discount: 0, vatRate: 21, job_line_kind: 'product', job_stock_id: reservation },
      { description: 'Service', quantity: 1, unitPrice: 125, discount: 0, vatRate: 21, job_line_kind: 'service' },
    ] };
    assert.equal((await request('POST', invoices, { ...payload, job_id: randomUUID() })).status, 404);
    const wrongTotal = { ...payload, lines: [payload.lines[0], { ...payload.lines[1], unitPrice: 150 }] };
    assert.equal((await request('POST', invoices, { ...wrongTotal, job_id: jobId })).status, 409);
    const wrongSource = { ...payload, lines: [{ ...payload.lines[0], job_stock_id: randomUUID() }, payload.lines[1]] };
    assert.equal((await request('POST', invoices, { ...wrongSource, job_id: jobId })).status, 400);
    const draft = await request('POST', invoices, { ...payload, job_id: jobId });
    assert.equal(draft.status, 201, await draft.clone().text());
    ({ id: invoiceId } = await draft.json());
    assert.equal(await snapshot(), null, 'draft has no snapshot');
    const issued = await request('PATCH', invoices + '/' + invoiceId, { status: 'verzonden' });
    assert.equal(issued.status, 200, await issued.clone().text());
    const initial = await snapshot();
    assert.equal(initial.subtotal, 175);
    assert.equal(initial.material_cost, 22);
    assert.deepEqual(initial.warehouse_materials, [{ article_code: article, quantity: 1, unit_cost_cents: 2200 }]);
    assert.deepEqual(initial.lines.map((line) => line.unit_price), [50, 125]);
    assert.deepEqual(initial.lines.map((line) => [line.job_line_kind, line.job_stock_id]), [['product', reservation], ['service', null]]);
    assert.equal(initial.subtotal - initial.material_cost - initial.technician_cost, 108);
    await query(db.from('jobs').update({ cost_materials: 40, cost_technician: 55 }).eq('id', jobId));
    const paid = await request('PATCH', invoices + '/' + invoiceId, { status: 'betaald' });
    assert.equal(paid.status, 200, await paid.clone().text());
    const salesReport = await fetch(base + '/admin/rapport/verkoop?channel=job', { headers });
    assert.equal(salesReport.status, 200);
    const salesHtml = await salesReport.text();
    assert.ok(salesHtml.includes('/admin/facturen/' + invoiceId), 'issued invoice can be opened from sales report');
    assert.ok(salesHtml.includes('Gefactureerd excl. btw') && salesHtml.includes('Facturen betaald incl. btw'));
    const preview = await fetch(base + '/admin/rapport/verkoop?channel=job&preview=1', { headers });
    assert.equal(preview.status, 200);
    const sheet = (await preview.text()).split('data-report-sheet')[1].split('</article>')[0];
    assert.match(sheet, /Autosleutel24|KeyForCars/);
    assert.match(sheet, /Verkoop &amp; diensten/);
    assert.match(sheet, /\d{4}-\d{2}-\d{2}.*?–.*?\d{4}-\d{2}-\d{2}/s);
    assert.match(sheet, /Rapport opgehaald op/);
    const otherReport = await fetch(base + '/admin/rapport/verkoop?channel=other', { headers });
    assert.equal(otherReport.status, 200);
    assert.ok(!(await otherReport.text()).includes('/admin/facturen/' + invoiceId), 'channel filter excludes job invoice');

    const jobPage = await fetch(base + '/admin/jobs/' + jobId, { headers });
    assert.equal(jobPage.status, 200);
    const jobHtml = await jobPage.text();
    assert.ok(jobHtml.includes('/admin/facturen/' + invoiceId) && jobHtml.includes('108,00'));
    assert.deepEqual(await snapshot(), initial, 'later costs and payment leave issuance amounts fixed');

    await query(db.from('jobs').update({ status: 'gepland' }).eq('id', jobId));
    await query(db.from('kfc_articles').update({ purchase_price_cents: null }).eq('code', article));
    await query(db.rpc('kfc_book_move', { p_article: article, p_location: location, p_delta: 1, p_reason: 'received', p_key: article + '-unknown' }));
    const unknownReservation = randomUUID();
    await query(db.rpc('kfc_reserve_job_stock', { p_id: unknownReservation, p_job: jobId, p_article: article, p_quantity: 1 }));
    await query(db.rpc('kfc_finish_job_stock', { p_id: unknownReservation, p_job: jobId, p_location: location, p_user: null }));
    const unknownDraft = await request('POST', invoices, { ...payload, job_id: jobId });
    assert.equal(unknownDraft.status, 201, await unknownDraft.clone().text());
    ({ id: unknownInvoiceId } = await unknownDraft.json());
    const unknownIssued = await request('PATCH', invoices + '/' + unknownInvoiceId, { status: 'verzonden' });
    assert.equal(unknownIssued.status, 200, await unknownIssued.clone().text());
    const unknownSnapshot = await query(db.from('job_invoice_snapshots').select('material_cost').eq('invoice_id', unknownInvoiceId).single());
    assert.equal(unknownSnapshot.material_cost, null, 'one unpriced part keeps total material cost unknown');
    assert.deepEqual(await snapshot(), initial, 'later material usage leaves the original issuance snapshot fixed');

  } finally {
    for (const id of [invoiceId, unknownInvoiceId].filter(Boolean)) {
      await query(db.from('job_invoice_snapshots').delete().eq('invoice_id', id));
      await query(db.from('sales_invoices').delete().eq('id', id));
    }
    if (jobId) await query(db.from('jobs').delete().eq('id', jobId));
    await query(db.from('kfc_stock_moves').delete().eq('article_code', article));
    await query(db.from('kfc_stock_levels').delete().eq('article_code', article));
    if (location) await query(db.from('kfc_locations').delete().eq('id', location));
    await query(db.from('kfc_articles').delete().eq('code', article));
    await query(db.from('dispatch_pricing').delete().eq('make', article));
  }
});
