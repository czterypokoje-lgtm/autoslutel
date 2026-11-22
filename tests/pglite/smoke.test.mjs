// Smoke test for the PGlite harness: the base (migrations through 0135) applies, the stubs answer, and one real
// stock flow runs end to end through the existing RPCs. Uses only the base, never 0136+.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, seedBasics, BASE_LAST, SKIP } from './harness.mjs';

test('base applies and runs as service_role', async () => {
  const db = await freshDb();
  try {
    assert.equal(BASE_LAST, 135);
    const [who] = await db.sql(`select current_user as u, auth.role() as r, auth.uid() as uid`);
    assert.deepEqual(who, { u: 'service_role', r: 'service_role', uid: null });
    const roles = await db.sql(`select rolname from pg_roles where rolname in ('anon','authenticated','service_role') order by 1`);
    assert.deepEqual(roles.map((r) => r.rolname), ['anon', 'authenticated', 'service_role']);
    // the last base migration really ran: 0135 took EXECUTE on kfc_book_move away from anon
    const [g] = await db.sql(`select has_function_privilege('anon', 'public.kfc_book_move(text, uuid, integer, text, text, integer, text, text, uuid, uuid, uuid, uuid, uuid)', 'execute') as anon_exec,
                                     has_function_privilege('service_role', 'public.kfc_book_move(text, uuid, integer, text, text, integer, text, text, uuid, uuid, uuid, uuid, uuid)', 'execute') as svc_exec`);
    assert.deepEqual(g, { anon_exec: false, svc_exec: true });
    assert.deepEqual(Object.keys(SKIP), [], 'no base migration is skipped');
  } finally {
    await db.close();
  }
});

test('each freshDb is isolated', async () => {
  const a = await freshDb();
  const b = await freshDb();
  try {
    await a.sql(`insert into public.kfc_articles (code, name) values ('TEST-ISO', 'Test isolatie')`);
    assert.equal((await a.sql(`select count(*)::int as n from public.kfc_articles where code = 'TEST-ISO'`))[0].n, 1);
    assert.equal((await b.sql(`select count(*)::int as n from public.kfc_articles where code = 'TEST-ISO'`))[0].n, 0);
  } finally {
    await a.close();
    await b.close();
  }
});

test('count a bin, book a move, read the stock level; rpc surfaces raised codes', async () => {
  const db = await freshDb();
  try {
    const s = await seedBasics(db);
    assert.equal(s.articles.length, 2);
    assert.equal(s.locations.length, 2);
    assert.ok(s.quarantine && s.supplier.id && s.customer.id);
    const art = s.articles[0].code;
    const bin = s.locations[0].id;

    // count 5 into the bin
    const [count] = await db.rpc('kfc_count_bin', { p_article: art, p_location: bin, p_counted: 5, p_minimum: 1, p_key: 'smoke-count-1' });
    assert.equal(count.reason, 'count');
    assert.equal(count.delta, 5);
    assert.equal(count.quantity_after, 5);

    // sell 2 from it
    const [sale] = await db.rpc('kfc_book_move', { p_article: art, p_location: bin, p_delta: -2, p_reason: 'sale', p_key: 'smoke-sale-1' });
    assert.equal(sale.quantity_after, 3);

    // the same key again is idempotent
    const [again] = await db.rpc('kfc_book_move', { p_article: art, p_location: bin, p_delta: -2, p_reason: 'sale', p_key: 'smoke-sale-1' });
    assert.equal(again.id, sale.id);

    const [lvl] = await db.sql(`select quantity, minimum from public.kfc_stock_levels where article_code = $1 and location_id = $2`, [art, bin]);
    assert.deepEqual(lvl, { quantity: 3, minimum: 1 });
    const [pos] = await db.sql(`select physical::int, available::int from public.kfc_stock_position where article_code = $1`, [art]);
    assert.deepEqual(pos, { physical: 3, available: 3 });

    // issuing more than is there raises KFC_INSUFFICIENT and changes nothing
    await assert.rejects(
      db.rpc('kfc_book_move', { p_article: art, p_location: bin, p_delta: -10, p_reason: 'issue', p_key: 'smoke-issue-1' }),
      (e) => e instanceof Error && /KFC_INSUFFICIENT/.test(e.message) && e.code === 'P0001',
    );
    assert.equal((await db.sql(`select quantity from public.kfc_stock_levels where article_code = $1 and location_id = $2`, [art, bin]))[0].quantity, 3);
    // the connection is still usable after the error
    assert.equal((await db.sql(`select count(*)::int as n from public.kfc_stock_moves where article_code = $1`, [art]))[0].n, 2);
  } finally {
    await db.close();
  }
});
