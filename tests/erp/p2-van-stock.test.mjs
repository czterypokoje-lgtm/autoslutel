import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import { db, uniq } from './helpers.mjs';

async function read(request) {
  const { data, error } = await request;
  assert.equal(error, null, error?.message);
  return data;
}

const base = process.env.ERP_TEST_BASE_URL ?? 'http://localhost:3001';
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const date = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Europe/Amsterdam' });

async function login(email, password) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { user, session } = await read(client.auth.signInWithPassword({ email, password }));
  return {
    id: user.id,
    cookie: 'sb-' + ref + '-auth-token=base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'),
  };
}

function request(actor, path, body, method = body ? 'POST' : 'GET') {
  return fetch(base + path, { method, headers: { cookie: actor.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

// Optional real browser coverage. Use an isolated headless Chrome debugging port.
async function chromeTab() {
  const endpoint = process.env.ERP_TEST_CDP_URL;
  const origin = process.env.ERP_TEST_BROWSER_BASE_URL ?? base;
  const target = await (await fetch(endpoint + '/json/new?about:blank', { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let next = 0;
  const requests = new Set();
  const networkLog = [];
  socket.addEventListener('message', (event) => {
    const { method, params } = JSON.parse(event.data);
    if (method === 'Network.requestWillBeSent' && params.request.url.endsWith('/api/admin/van-stock')) requests.add(params.requestId);
    if (!requests.has(params?.requestId)) return;
    if (method === 'Network.responseReceived') networkLog.push(params.response.status);
    if (method === 'Network.loadingFailed') networkLog.push(params.errorText);
  });
  function send(method, params = {}) {
    const id = ++next;
    return new Promise((resolve, reject) => {
      function receive(event) {
        const reply = JSON.parse(event.data);
        if (reply.id !== id) return;
        socket.removeEventListener('message', receive);
        if (reply.error) reject(new Error(reply.error.message));
        else resolve(reply.result);
      }
      socket.addEventListener('message', receive);
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.result.description);
    return result.result.value;
  };
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const value = await evaluate(expression).catch(() => undefined);
      if (value) return value;
      await delay(250);
    }
    const state = await evaluate('({ online: navigator.onLine, page: document.body.innerText.slice(0,800) })').catch(() => null);
    throw new Error('Chrome timed out at ' + expression + ' | ' + JSON.stringify({ state, networkLog }));
  }
  await send('Network.enable');
  await send('Page.enable');
  await send('Storage.clearDataForOrigin', { origin, storageTypes: 'local_storage' });
  return {
    send, evaluate, waitFor,
    async open(actor, path) {
      const split = actor.cookie.indexOf('=');
      await send('Network.setCookie', { name: actor.cookie.slice(0, split), value: actor.cookie.slice(split + 1), url: origin });
      await send('Page.navigate', { url: origin + path });
    },
    network(offline) {
      return send('Network.emulateNetworkConditions', { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    },
    async close() {
      socket.close();
      await fetch(endpoint + '/json/close/' + target.id);
    },
  };
}

test('P2: 8 received, 2 to van, one offline usage replayed, invoiced once, then 6 + 1 in report and PDF', async () => {
  const [office, worker] = await Promise.all([
    login(process.env.CRM_TEST_EMAIL, process.env.CRM_TEST_PASSWORD),
    login(process.env.CRM_TECH_EMAIL, process.env.CRM_TECH_PASSWORD),
  ]);
  const tech = await read(db.from('technicians').select('id, name').eq('user_id', worker.id).single());
  const existing = await read(db.from('kfc_locations').select('id').eq('technician_id', tech.id).maybeSingle());
  const article = uniq('van').toUpperCase();
  const jobId = randomUUID();
  const central = randomUUID();
  let operation = randomUUID();
  const day = date.format(new Date());
  const vanPath = '/api/admin/van-stock';
  let invoice;
  let van;
  let browser;
  const levels = async () => Object.fromEntries((await read(db.from('kfc_stock_levels')
    .select('location_id, quantity').eq('article_code', article))).map((row) => [row.location_id, row.quantity]));

  try {
    await read(db.from('kfc_articles').insert({ code: article, name: 'Test P2 autosleutel', purchase_price_cents: 2200 }));
    await read(db.from('kfc_locations').insert({ id: central, warehouse: 'main', shelf: article, box: '01' }));
    await read(db.rpc('kfc_book_move', { p_article: article, p_location: central, p_delta: 8, p_reason: 'received', p_key: article }));
    await read(db.from('jobs').insert({
      id: jobId, technician_id: tech.id, status: 'bezig', quoted_price: 211.75, cost_technician: 45,
      customer_name: article, car_make: article, car_model: 'Corsa', scenario: 'bijmaken',
      scheduled_date: day, slot_start: '10:00', slot_end: '12:00',
    }));

    assert.deepEqual(await levels(), { [central]: 8 });
    const transfer = { action: 'transfer', id: randomUUID(), article, location: central, target: tech.id, quantity: 2, toVan: true };
    assert.equal((await request(worker, vanPath, transfer)).status, 403);
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await request(office, vanPath, transfer);
      assert.equal(result.status, 200, await result.text());
    }
    van = (await read(db.from('kfc_locations').select('id, warehouse, kind').eq('technician_id', tech.id).single()));
    assert.equal(van.warehouse, 'van');
    assert.equal(van.kind, 'shelf');
    assert.deepEqual(await levels(), { [central]: 6, [van.id]: 2 });
    assert.equal((await read(db.from('kfc_webshop_position').select('available').eq('article_code', article).single())).available, 6);
    const transferPage = await request(office, '/admin/voorraad/bustransfer');
    assert.equal(transferPage.status, 200);
    assert.ok((await transferPage.text()).includes(tech.name));

    const packet = { action: 'use', id: operation, article, location: van.id, target: jobId, quantity: 1 };
    assert.equal((await request(office, vanPath, packet)).status, 403);
    assert.equal((await request(worker, vanPath, { ...packet, location: central })).status, 403);
    assert.equal((await request(worker, vanPath, { ...packet, target: randomUUID() })).status, 403);
    assert.equal((await request(worker, vanPath, { ...packet, quantity: 3 })).status, 409);
    if (process.env.ERP_TEST_CDP_URL) {
      browser = await chromeTab();
      await browser.open(worker, '/admin/vandaag');
      const selector = JSON.stringify('option[value="' + article + '"]');
      await browser.waitFor('Object.keys(document.querySelector(' + selector + ')?.closest("select") ?? {}).some(key => key.startsWith("__reactProps"))');
      await browser.network(true);
      await browser.waitFor('!navigator.onLine');
      await browser.evaluate(`(() => {
        const select = document.querySelector(${selector}).closest('select');
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, ${JSON.stringify(article)});
        select.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      const form = 'document.querySelector(' + selector + ').closest("form")';
      await browser.waitFor('!' + form + '.querySelector("button").disabled');
      await browser.evaluate(form + '.querySelector("button").click()');
      const keyPrefix = JSON.stringify('crm:van-material:' + worker.id + ':');
      operation = await browser.waitFor('Object.keys(localStorage).find(key => key.startsWith(' + keyPrefix
        + ') && JSON.parse(localStorage.getItem(key)).article === ' + JSON.stringify(article) + ')?.split(":").at(-1)');
      packet.id = operation;
      assert.deepEqual(await levels(), { [central]: 6, [van.id]: 2 });
      await browser.network(false);
      await browser.waitFor('navigator.onLine');
      await browser.waitFor('localStorage.getItem(' + JSON.stringify('crm:van-material:' + worker.id + ':' + operation) + ') === null');
      await browser.waitFor('document.body.innerText.includes("1 materiaalboeking gesynchroniseerd.")');
      assert.deepEqual(await levels(), { [central]: 6, [van.id]: 1 });
    }
    for (const result of await Promise.all([request(worker, vanPath, packet), request(worker, vanPath, packet)])) {
      assert.equal(result.status, 200, await result.text());
    }
    assert.equal((await request(worker, vanPath, { ...packet, quantity: 2 })).status, 409);
    const usage = await (await request(office, '/api/admin/jobs/' + jobId + '/warehouse-stock')).json();
    assert.deepEqual(usage.reservations, [{ id: operation, article_code: article, quantity: 1, state: 'used' }]);

    await read(db.from('jobs').update({ status: 'afgerond' }).eq('id', jobId));
    const invoices = '/api/admin/invoices';
    const draft = await request(office, invoices, { job_id: jobId, client_name: article, lines: [
      { description: 'Autosleutel', quantity: 1, unitPrice: 50, vatRate: 21, job_line_kind: 'product', job_stock_id: operation },
      { description: 'Montage', quantity: 1, unitPrice: 125, vatRate: 21, job_line_kind: 'service' },
    ] });
    assert.equal(draft.status, 201, await draft.clone().text());
    invoice = (await draft.json()).id;
    const issued = await request(office, invoices + '/' + invoice, { status: 'verzonden' }, 'PATCH');
    assert.equal(issued.status, 200, await issued.text());
    const snapshot = await read(db.from('job_invoice_snapshots').select('subtotal,material_cost,lines').eq('invoice_id', invoice).single());
    assert.equal(snapshot.subtotal, 175);
    assert.equal(snapshot.material_cost, 22);
    assert.deepEqual(snapshot.lines.map((line) => line.unit_price), [50, 125]);
    assert.equal((await request(worker, vanPath, packet)).status, 200);
    assert.equal((await request(worker, vanPath, { ...packet, id: randomUUID() })).status, 409);

    assert.deepEqual(await levels(), { [central]: 6, [van.id]: 1 });
    assert.equal((await read(db.from('kfc_stock_position').select('physical').eq('article_code', article).single())).physical, 7);
    const moves = await read(db.from('kfc_stock_moves').select('reason, delta, location_id, idempotency_key').eq('article_code', article));
    assert.deepEqual(moves.filter((row) => ['issue', 'sale'].includes(row.reason)), [
      { reason: 'issue', delta: -1, location_id: van.id, idempotency_key: 'job-stock:' + operation },
    ]);
    assert.deepEqual(moves.filter((row) => row.reason === 'transfer').map((row) => row.delta).sort(), [-2, 2]);
    for (const suffix of ['', '&preview=1']) {
      const result = await request(office, '/admin/rapport/voorraad?q=' + article + suffix);
      assert.equal(result.status, 200);
      const html = await result.text();
      assert.match(html, /Servicebus/);
      assert.ok(html.includes(tech.name) && html.includes(article));
      if (suffix) assert.match(html, /data-report-column="location"/);
    }
    const journalPath = '/admin/rapport/voorraadbewegingen?q=' + article + '&from=' + day + '&to=' + day;
    const journal = await request(office, journalPath);
    assert.equal(journal.status, 200);
    const html = await journal.text();
    const source = '/admin/jobs/' + jobId + '#warehouse-stock-' + jobId;
    assert.ok(html.includes(source) && html.includes(tech.name));
    if (browser) {
      await browser.open(office, journalPath);
      const link = 'document.querySelector(' + JSON.stringify('a[href="' + source + '"]') + ')';
      await browser.waitFor(link + ' !== null');
      await browser.evaluate(link + '.click()');
      await browser.waitFor('document.querySelector("#warehouse-stock-' + jobId + '")?.innerText.includes(' + JSON.stringify(article + ' · 1 × · Gebruikt') + ')');
      await browser.open(office, '/admin/rapport/voorraad?q=' + article + '&preview=1');
      await browser.waitFor('document.querySelector("[data-report-sheet]")?.innerText.includes(' + JSON.stringify(article) + ')');
      const { data } = await browser.send('Page.printToPDF', { preferCSSPageSize: true });
      const { PDFParse } = await import('pdf-parse');
      const pdf = new PDFParse({ data: Buffer.from(data, 'base64') });
      try {
        const { text } = await pdf.getText();
        assert.ok(text.includes(tech.name) && text.includes(article));
        assert.match(text, /Servicebus[^\n]*\/\s*1/);
      } finally {
        await pdf.destroy();
      }
    }
  } finally {
    if (browser) await browser.close();
    if (invoice) {
      await read(db.from('job_invoice_snapshots').delete().eq('invoice_id', invoice));
      await read(db.from('sales_invoices').delete().eq('id', invoice));
    }
    await read(db.from('jobs').delete().eq('id', jobId));
    await read(db.from('kfc_stock_moves').delete().eq('article_code', article));
    await read(db.from('kfc_stock_levels').delete().eq('article_code', article));
    await read(db.from('kfc_locations').delete().eq('id', central));
    if (van && !existing) await read(db.from('kfc_locations').delete().eq('id', van.id));
    await read(db.from('kfc_articles').delete().eq('code', article));
  }
});
