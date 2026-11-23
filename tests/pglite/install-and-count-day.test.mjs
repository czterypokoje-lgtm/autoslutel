/*
 * Rehearsal of a stock-count day on the warehouse ledger, on an in-process Postgres (no network, no real database):
 *
 *   1. a database built from the migrations (through 0135), with a real article catalogue and some stock
 *      already counted;
 *   2. a full stock-count day on it: two phones, single counts and bulk batches, retries on a bad
 *      connection, recounts, the same bin counted twice — and then "all stock in one place".
 *
 * (Until the KeyForCars split this also rehearsed KeyForCars's migration bundle on its 0105 database;
 * that part moved to the KeyForCars repository with the bundle.)
 *
 * What this cannot show: the real data in production, the Supabase API layer (its 1,000-row page), the camera.
 *   node --test tests/pglite/install-and-count-day.test.mjs
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dbAt } from './harness.mjs';

const ROOT = new URL('../../', import.meta.url);
// A large real catalogue (1,704 cards) to count against; any article master would do.
const CATALOG = JSON.parse(readFileSync(new URL('src/data/keyforcars-stock.json', ROOT), 'utf8'));

let pg;
const q = async (text, params = []) => (await pg.query(text, params)).rows;
const one = async (text, params = []) => (await q(text, params))[0];
after(async () => { await pg?.close(); });

test('setup: database at 0135 with the article master and some stock already counted', async () => {
  pg = await dbAt(135);

  // The article master, loaded the way scripts/as24-seed-articles.mjs does.
  await q(`insert into public.kfc_articles (code, name, sku, image, category)
           select x->>'id', x->>'name', coalesce(x->>'sku', ''), coalesce(x->>'image', ''), coalesce(x->>'category', '')
             from jsonb_array_elements($1::jsonb) x`, [JSON.stringify(CATALOG)]);
  assert.equal((await one('select count(*)::int n from public.kfc_articles')).n, CATALOG.length);

  // Some stock that exists before the count day.
  const { id: loc } = await one(`insert into public.kfc_locations (warehouse, shelf, box) values ('main', 'OUD-01', 'B1') returning id`);
  for (const article of CATALOG.slice(0, 30)) {
    await q(`select public.kfc_count_bin($1, $2::uuid, 5, 1, $3)`, [article.id, loc, `pre-${article.id}`]);
  }
  const before = await one(`select (select count(*)::int from public.kfc_stock_levels) levels, (select coalesce(sum(quantity), 0)::int from public.kfc_stock_levels) units,
                                   (select count(*)::int from public.kfc_stock_moves) moves`);
  assert.deepEqual(before, { levels: 30, units: 150, moves: 30 });
});

test('count day: two phones, 1,704 articles, single counts and bulk batches', async (t) => {
  await pg.exec(`set role service_role; select set_config('request.jwt.claims', '{"role":"service_role"}', false);`);

  // 20 shelves x 10 bins, made the way the app makes a location the first time it is counted.
  const locations = (await q(`insert into public.kfc_locations (warehouse, shelf, box)
                              select 'main', 'A-' || lpad(s::text, 2, '0'), 'B' || lpad(b::text, 2, '0') from generate_series(1, 20) s, generate_series(1, 10) b
                              returning id`)).map((r) => r.id);
  const articles = CATALOG.map((a) => a.id);
  const quantity = (i) => (i % 25) + 1;
  const expected = new Map(); // `${article}|${location}` -> counted
  const moveCountBefore = (await one('select count(*)::int n from public.kfc_stock_moves')).n;
  const started = Date.now();

  // Phone 1: one article at a time (scan, type the number, save).
  for (let i = 0; i < 600; i++) {
    const loc = locations[i % locations.length];
    await q(`select public.kfc_count_bin($1, $2::uuid, $3, 0, $4)`, [articles[i], loc, quantity(i), randomUUID()]);
    expected.set(`${articles[i]}|${loc}`, quantity(i));
  }
  // Phone 2: bulk batches of 150 lines (the photo count books every line or none).
  let batches = 0;
  for (let from = 600; from < articles.length; from += 150) {
    const rows = articles.slice(from, from + 150).map((article, k) => ({ article, location: locations[(from + k) % locations.length], quantity: quantity(from + k) }));
    const booked = (await one(`select public.kfc_bulk_count($1::uuid, string_to_array($2, ','), $3::jsonb, null) n`,
      [randomUUID(), [`photo-${from}-a`, `photo-${from}-b`].join(','), JSON.stringify(rows)])).n;
    assert.equal(booked, rows.length);
    for (const r of rows) expected.set(`${r.article}|${r.location}`, r.quantity);
    batches++;
  }
  // 150 articles also lie in a second bin.
  for (let i = 0; i < 150; i++) {
    const loc = locations[(i + 77) % locations.length];
    await q(`select public.kfc_count_bin($1, $2::uuid, 3, 0, $3)`, [articles[i], loc, randomUUID()]);
    expected.set(`${articles[i]}|${loc}`, 3);
  }
  const ms = Date.now() - started;
  const total = [...expected.values()].reduce((s, n) => s + n, 0);

  const levels = await one(`select count(*)::int n, sum(quantity)::int units from public.kfc_stock_levels l join public.kfc_locations x on x.id = l.location_id where x.shelf like 'A-%'`);
  assert.deepEqual(levels, { n: expected.size, units: total });
  const moves = (await one('select count(*)::int n from public.kfc_stock_moves')).n - moveCountBefore;
  t.diagnostic(`${expected.size} bin counts (${batches} bulk batches) booked in ${ms} ms = ${(ms / expected.size).toFixed(1)} ms per count; ${moves} ledger moves`);
  t.diagnostic(`stock level rows now: ${expected.size + 30} (the API returns 1,000 rows per call: a screen that does not page shows only part of this)`);

  // The ledger and the counters agree for every bin.
  const drift = await one(`select count(*)::int n from public.kfc_stock_levels l
                             left join (select article_code, location_id, sum(delta) s from public.kfc_stock_moves group by 1, 2) m using (article_code, location_id)
                            where l.quantity <> coalesce(m.s, 0)`);
  assert.equal(drift.n, 0, 'no bin where the counter and the ledger disagree');
});

test('count day: bad connection, recount, two phones on one bin', async () => {
  const article = CATALOG[900].id;
  const { id: bin } = await one(`insert into public.kfc_locations (warehouse, shelf, box) values ('main', 'Z-01', 'B01') returning id`);
  const level = async () => (await one('select quantity from public.kfc_stock_levels where article_code = $1 and location_id = $2::uuid', [article, bin]))?.quantity ?? null;
  const moveCount = async () => (await one('select count(*)::int n from public.kfc_stock_moves where article_code = $1 and location_id = $2::uuid', [article, bin])).n;

  // The phone sends the same count twice (no signal, retry): one booking.
  const key = randomUUID();
  await q(`select public.kfc_count_bin($1, $2::uuid, 12, 2, $3)`, [article, bin, key]);
  await q(`select public.kfc_count_bin($1, $2::uuid, 12, 2, $3)`, [article, bin, key]);
  assert.equal(await level(), 12);
  assert.equal(await moveCount(), 1);

  // Recount: the ledger keeps the difference, the level is what was counted.
  await q(`select public.kfc_count_bin($1, $2::uuid, 10, 2, $3)`, [article, bin, randomUUID()]);
  assert.equal(await level(), 10);
  assert.equal((await one(`select delta from public.kfc_stock_moves where article_code = $1 and location_id = $2::uuid order by id desc limit 1`, [article, bin])).delta, -2);

  // Two phones count the same bin: the last count stands, nothing is added up.
  await q(`select public.kfc_count_bin($1, $2::uuid, 7, 2, $3)`, [article, bin, randomUUID()]);
  await q(`select public.kfc_count_bin($1, $2::uuid, 9, 2, $3)`, [article, bin, randomUUID()]);
  assert.equal(await level(), 9);

  // Counting the same number again books nothing; counting to zero empties the bin.
  const n = await moveCount();
  await q(`select public.kfc_count_bin($1, $2::uuid, 9, 2, $3)`, [article, bin, randomUUID()]);
  assert.equal(await moveCount(), n);
  await q(`select public.kfc_count_bin($1, $2::uuid, 0, 2, $3)`, [article, bin, randomUUID()]);
  assert.equal(await level(), 0);

  await assert.rejects(q(`select public.kfc_count_bin($1, $2::uuid, -1, 0, $3)`, [article, bin, randomUUID()]), /KFC_NEGATIVE_COUNT/);
  await assert.rejects(q(`select public.kfc_count_bin('BESTAAT-NIET', $1::uuid, 1, 0, $2)`, [bin, randomUUID()]), 'an article that is not in the database cannot be counted');

  // A bulk batch sent twice books once; a batch that reuses a photo is refused whole.
  const batch = randomUUID();
  const rows = JSON.stringify([{ article, location: bin, quantity: 4 }]);
  assert.equal((await one(`select public.kfc_bulk_count($1::uuid, string_to_array($2, ','), $3::jsonb, null) n`, [batch, 'foto-x', rows])).n, 1);
  assert.equal((await one(`select public.kfc_bulk_count($1::uuid, string_to_array($2, ','), $3::jsonb, null) n`, [batch, 'foto-x', rows])).n, 0);
  assert.equal(await level(), 4);
  await assert.rejects(q(`select public.kfc_bulk_count($1::uuid, string_to_array($2, ','), $3::jsonb, null)`,
    [randomUUID(), 'foto-x', JSON.stringify([{ article, location: bin, quantity: 99 }])]), /kfc_count_photos_pkey/);
  assert.equal(await level(), 4, 'the refused batch changed nothing');
});

test('all stock in one place: the totals every screen reads agree with what was counted', async (t) => {
  const counted = await one(`select count(distinct article_code)::int articles, sum(quantity)::int units from public.kfc_stock_levels where quantity > 0`);
  const position = await one(`select count(*)::int articles, sum(physical)::int units from public.kfc_stock_position where physical > 0`);
  assert.deepEqual(position, counted, 'kfc_stock_position (stock screen)');
  const overview = await one(`select count(*)::int rows, count(*) filter (where physical > 0)::int articles, sum(physical)::int units from public.kfc_article_overview`);
  assert.equal(overview.rows, CATALOG.length, 'the article list shows every article, counted or not');
  assert.deepEqual({ articles: overview.articles, units: overview.units }, counted, 'kfc_article_overview (article list)');
  const totals = (await one(`select public.kfc_article_totals() j`)).j;
  assert.equal(totals.in_stock, counted.articles, 'kfc_article_totals (dashboard)');
  const twoBins = await one(`select count(*)::int n from (select article_code from public.kfc_stock_levels where quantity > 0 group by 1 having count(*) > 1) x`);
  const outbox = await one(`select count(*)::int n from public.kfc_woo_stock_outbox`);
  t.diagnostic(`${counted.articles} articles in stock, ${counted.units} units; ${twoBins.n} articles lie in more than one bin and are summed correctly`);
  t.diagnostic(`article totals: ${JSON.stringify(totals)}`);
  t.diagnostic(`webshop stock queue after the count: ${outbox.n} rows waiting (nothing is sent while the push is switched off)`);
});
