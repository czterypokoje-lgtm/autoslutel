// Period lock (0140): nothing is booked, changed or deleted on or before locked_until.
// Runs on the PGlite harness (migrations through 0135 + 0140), posting through the real functions.
//   node --test tests/pglite/period-lock.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { freshDb, seedBasics } from './harness.mjs';

const MIGRATION = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'migrations', '0140_kfc_period_lock.sql');
const LOCKED = (e) => e instanceof Error && /KFC_PERIOD_LOCKED/.test(e.message);
const OWNER = '00000000-0000-4000-8000-0000000000aa';

/** Dates computed by Postgres in Europe/Amsterdam, like the triggers do. */
async function dates(db) {
  const [d] = await db.sql(`
    with t as (select (now() at time zone 'Europe/Amsterdam')::date as today)
    select today::text,
           (date_trunc('month', today)::date - 1)::text                         as end_last_month,
           date_trunc('month', today)::date::text                               as first_this_month,
           (date_trunc('month', today)::date - interval '1 month')::date::text  as first_last_month,
           (today + 1)::text                                                    as tomorrow
      from t`);
  return d;
}

async function setup() {
  const db = await freshDb({ plus: ['0140_kfc_period_lock.sql'] });
  const seed = await seedBasics(db);
  return { db, seed, d: await dates(db) };
}

const customerEntry = (db, seed, key, date, type = 'payment', amount = 1000) =>
  db.rpc('kfc_post_entry', { p_customer: seed.customer.id, p_type: type, p_amount_cents: amount, p_key: key, p_entry_date: date });
const supplierEntry = (db, seed, key, date, type = 'invoice', amount = 5000) =>
  db.rpc('kfc_post_supplier_entry', {
    p_supplier: seed.supplier.id, p_type: type, p_amount_cents: amount, p_key: key, p_entry_date: date,
    p_invoice_ref: type === 'invoice' ? `TEST-INV-${key}` : null,
  });
const lock = (db, until, note = null) => db.rpc('kfc_set_period_lock', { p_until: until, p_user: OWNER, p_note: note });
const idOf = (rows) => Object.values(rows[0])[0];

test('with no lock everything posts, including past dates', async () => {
  const { db, seed, d } = await setup();
  try {
    const [state] = await db.rpc('kfc_period_lock_state');
    assert.deepEqual(state.kfc_period_lock_state, { lock: null, log: [] });
    await customerEntry(db, seed, 'c-old', d.first_last_month, 'opening', 2500);
    await customerEntry(db, seed, 'c-pay', d.end_last_month);
    await supplierEntry(db, seed, 's-old', d.first_last_month);
    const [move] = await db.rpc('kfc_count_bin', { p_article: seed.articles[0].code, p_location: seed.locations[0].id, p_counted: 4, p_minimum: 0, p_key: 'count-1' });
    assert.equal(move.delta, 4);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_customer_ledger`))[0].n, 2);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_supplier_ledger`))[0].n, 1);
  } finally {
    await db.close();
  }
});

test('locked until the end of last month: last month refused, today and the day after posts', async () => {
  const { db, seed, d } = await setup();
  try {
    await lock(db, d.end_last_month);
    assert.equal((await db.sql(`select locked_until::text as u from public.kfc_period_lock`))[0].u, d.end_last_month);

    await assert.rejects(customerEntry(db, seed, 'c-1', d.first_last_month), LOCKED);
    await assert.rejects(supplierEntry(db, seed, 's-1', d.first_last_month), LOCKED);
    // exactly on locked_until: refused
    await assert.rejects(customerEntry(db, seed, 'c-2', d.end_last_month), LOCKED);
    await assert.rejects(supplierEntry(db, seed, 's-2', d.end_last_month, 'payment', 100), LOCKED);
    // the day after: posts
    await customerEntry(db, seed, 'c-3', d.first_this_month, 'opening', 700);
    await supplierEntry(db, seed, 's-3', d.first_this_month);
    // today (default date): posts
    await customerEntry(db, seed, 'c-4', null, 'payment', 100);
    await supplierEntry(db, seed, 's-4', null, 'payment', 100);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_customer_ledger`))[0].n, 2);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_supplier_ledger`))[0].n, 2);
  } finally {
    await db.close();
  }
});

test('reversing a locked-period entry works and is dated today', async () => {
  const { db, seed, d } = await setup();
  try {
    const cid = idOf(await customerEntry(db, seed, 'c-old', d.first_last_month, 'opening', 2500));
    const sid = idOf(await supplierEntry(db, seed, 's-old', d.first_last_month));
    await lock(db, d.end_last_month);

    const crev = idOf(await db.rpc('kfc_reverse_entry', { p_entry: cid, p_key: 'c-rev' }));
    const srev = idOf(await db.rpc('kfc_reverse_supplier_entry', { p_entry: sid, p_key: 's-rev' }));
    const [c] = await db.sql(`select entry_date::text, amount_cents, reverses_entry_id from public.kfc_customer_ledger where id = $1`, [crev]);
    const [s] = await db.sql(`select entry_date::text, amount_cents, reverses_entry_id from public.kfc_supplier_ledger where id = $1`, [srev]);
    assert.deepEqual(c, { entry_date: d.today, amount_cents: -2500, reverses_entry_id: cid });
    assert.deepEqual(s, { entry_date: d.today, amount_cents: -5000, reverses_entry_id: sid });
  } finally {
    await db.close();
  }
});

test('locked rows cannot be deleted or have amount/date changed; other columns still update', async () => {
  const { db, seed, d } = await setup();
  try {
    const cid = idOf(await customerEntry(db, seed, 'c-old', d.first_last_month, 'opening', 2500));
    const sid = idOf(await supplierEntry(db, seed, 's-old', d.first_last_month));
    const [mv] = await db.rpc('kfc_book_move', { p_article: seed.articles[0].code, p_location: seed.locations[0].id, p_delta: 3, p_reason: 'received', p_key: 'mv-old' });
    await db.sql(`update public.kfc_stock_moves set created_at = ($1::date + time '12:00') at time zone 'Europe/Amsterdam' where id = $2`, [d.first_last_month, mv.id]);
    const todayId = idOf(await customerEntry(db, seed, 'c-today', null, 'opening', 300));
    await lock(db, d.end_last_month);

    await assert.rejects(db.sql(`delete from public.kfc_customer_ledger where id = $1`, [cid]), LOCKED);
    await assert.rejects(db.sql(`delete from public.kfc_supplier_ledger where id = $1`, [sid]), LOCKED);
    await assert.rejects(db.sql(`delete from public.kfc_stock_moves where id = $1`, [mv.id]), LOCKED);
    await assert.rejects(db.sql(`update public.kfc_customer_ledger set amount_cents = 1 where id = $1`, [cid]), LOCKED);
    await assert.rejects(db.sql(`update public.kfc_supplier_ledger set entry_date = $2 where id = $1`, [sid, d.today]), LOCKED);
    await assert.rejects(db.sql(`update public.kfc_stock_moves set delta = 1 where id = $1`, [mv.id]), LOCKED);
    // moving an open row into the locked period is refused too
    await assert.rejects(db.sql(`update public.kfc_customer_ledger set entry_date = $2 where id = $1`, [todayId, d.end_last_month]), LOCKED);
    // a direct insert of a stock move dated last month is refused (safety net)
    await assert.rejects(db.sql(
      `insert into public.kfc_stock_moves (article_code, delta, reason, idempotency_key, created_at) values ($1, 1, 'correction', 'mv-direct', ($2::date + time '12:00') at time zone 'Europe/Amsterdam')`,
      [seed.articles[0].code, d.first_last_month]), LOCKED);
    await assert.rejects(db.sql(`truncate public.kfc_stock_moves cascade`), LOCKED);

    // non-money columns keep working on locked rows (notes, assembly link, FK set-null)
    await db.sql(`update public.kfc_customer_ledger set note = 'Toelichting' where id = $1`, [cid]);
    await db.sql(`update public.kfc_stock_moves set note = 'Toelichting' where id = $1`, [mv.id]);
    assert.equal((await db.sql(`select note from public.kfc_customer_ledger where id = $1`, [cid]))[0].note, 'Toelichting');
    // and an open-period row can still be deleted
    await db.sql(`delete from public.kfc_customer_ledger where id = $1`, [todayId]);
  } finally {
    await db.close();
  }
});

test('a stock move today is unaffected by the lock', async () => {
  const { db, seed, d } = await setup();
  try {
    await lock(db, d.end_last_month);
    const [count] = await db.rpc('kfc_count_bin', { p_article: seed.articles[0].code, p_location: seed.locations[0].id, p_counted: 5, p_minimum: 1, p_key: 'count-today' });
    assert.equal(count.quantity_after, 5);
    const [sale] = await db.rpc('kfc_book_move', { p_article: seed.articles[0].code, p_location: seed.locations[0].id, p_delta: -2, p_reason: 'sale', p_key: 'sale-today' });
    assert.equal(sale.quantity_after, 3);
  } finally {
    await db.close();
  }
});

test('setting the lock: no today or future, reopening needs a note, one log row per change', async () => {
  const { db, d } = await setup();
  try {
    await assert.rejects(lock(db, d.today), /KFC_PERIOD_FUTURE/);
    await assert.rejects(lock(db, d.tomorrow), /KFC_PERIOD_FUTURE/);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_period_lock_log`))[0].n, 0);

    await lock(db, d.first_last_month);                     // 1: set
    await lock(db, d.end_last_month);                       // 2: move forward, no note needed
    await lock(db, d.end_last_month);                       // same date: no change, not logged
    await assert.rejects(lock(db, d.first_last_month), /KFC_PERIOD_NOTE_REQUIRED/);
    await assert.rejects(lock(db, d.first_last_month, '   '), /KFC_PERIOD_NOTE_REQUIRED/);
    await assert.rejects(lock(db, null), /KFC_PERIOD_NOTE_REQUIRED/);
    await lock(db, d.first_last_month, 'Factuur gecorrigeerd'); // 3: reopen part
    await lock(db, null, 'Alles heropend');                 // 4: remove

    const log = await db.sql(`select old_until::text, new_until::text, set_by::text, note from public.kfc_period_lock_log order by id`);
    assert.deepEqual(log, [
      { old_until: null, new_until: d.first_last_month, set_by: OWNER, note: null },
      { old_until: d.first_last_month, new_until: d.end_last_month, set_by: OWNER, note: null },
      { old_until: d.end_last_month, new_until: d.first_last_month, set_by: OWNER, note: 'Factuur gecorrigeerd' },
      { old_until: d.first_last_month, new_until: null, set_by: OWNER, note: 'Alles heropend' },
    ]);
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_period_lock`))[0].n, 0);

    const [state] = await db.rpc('kfc_period_lock_state');
    assert.equal(state.kfc_period_lock_state.lock, null);
    assert.equal(state.kfc_period_lock_state.log.length, 4);
    assert.equal(state.kfc_period_lock_state.log[0].note, 'Alles heropend');

    // the log is append-only, and the lock table holds one row at most
    await assert.rejects(db.sql(`delete from public.kfc_period_lock_log`), /append-only/);
    await lock(db, d.end_last_month);
    await assert.rejects(db.sql(`insert into public.kfc_period_lock (id, locked_until) values (false, $1)`, [d.end_last_month]));
    assert.equal((await db.sql(`select count(*)::int n from public.kfc_period_lock`))[0].n, 1);
  } finally {
    await db.close();
  }
});

test('the migration is idempotent and anon/authenticated cannot use it', async () => {
  const { db } = await setup();
  try {
    await db.pg.exec(`reset role; ${readFileSync(MIGRATION, 'utf8')}; set role service_role;`);
    const [g] = await db.sql(`
      select has_function_privilege('anon', 'public.kfc_set_period_lock(date, uuid, text)', 'execute') as anon_set,
             has_function_privilege('authenticated', 'public.kfc_set_period_lock(date, uuid, text)', 'execute') as auth_set,
             has_function_privilege('service_role', 'public.kfc_set_period_lock(date, uuid, text)', 'execute') as svc_set,
             has_table_privilege('anon', 'public.kfc_period_lock', 'select') as anon_read`);
    assert.deepEqual(g, { anon_set: false, auth_set: false, svc_set: true, anon_read: false });
    const triggers = await db.sql(`select tgname from pg_trigger where tgname like '%period_lock%' and not tgisinternal order by 1`);
    assert.deepEqual(triggers.map((t) => t.tgname), [
      'kfc_customer_ledger_period_lock', 'kfc_customer_ledger_period_lock_truncate',
      'kfc_period_lock_log_guard', 'kfc_period_lock_log_no_truncate',
      'kfc_stock_moves_period_lock', 'kfc_stock_moves_period_lock_truncate',
      'kfc_supplier_ledger_period_lock', 'kfc_supplier_ledger_period_lock_truncate',
    ]);
  } finally {
    await db.close();
  }
});
