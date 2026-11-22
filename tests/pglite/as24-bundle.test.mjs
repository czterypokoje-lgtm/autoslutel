/**
 * Rehearsal of supabase/as24_apply_0129-0141.sql (scripts/build-as24-migration-bundle.mjs) on PGlite.
 *
 * The Autosleutel24 database was at 0128 on 22 Nov 2026. A database at 0128 with data (jobs, a lead,
 * counted stock) takes the bundle without any change to existing rows; a second run, a KeyForCars-like
 * database, a database without jobs and one at 0127 are refused with nothing changed; and the result has
 * the same schema and grants as a database built from the migrations in order (plus the install marker).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbAt, prepareSql } from './harness.mjs';
import { buildFromDisk } from '../../scripts/build-as24-migration-bundle.mjs';

const BUNDLE_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'as24_apply_0129-0141.sql');
const BUNDLE = prepareSql(readFileSync(BUNDLE_FILE, 'utf8'));
const check = (ok, msg) => assert.ok(ok, msg);

test('the committed bundle is what the builder writes', () => {
  assert.equal(readFileSync(BUNDLE_FILE, 'utf8'), buildFromDisk().sql, 'run node scripts/build-as24-migration-bundle.mjs');
});

async function seed(pg) {
  await pg.exec(`
    insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'test-office@example.test');
    insert into public.technicians (id, name) values ('22222222-2222-2222-2222-222222222222', 'Test Monteur');
    insert into public.leads (id) values ('33333333-3333-3333-3333-333333333333');
    insert into public.jobs (id, scheduled_date, slot_start, slot_end, lead_id) values ('44444444-4444-4444-4444-444444444444', '2026-11-20', '09:00', '10:00', '33333333-3333-3333-3333-333333333333');
    insert into public.jobs (scheduled_date, slot_start, slot_end) values ('2026-11-21', '11:00', '12:00');
    insert into public.agent_conversations (conversation_id, channel) values ('TEST-conv-1', 'phone');
    insert into public.kfc_articles (code, name, sku, sale_price_cents, purchase_price_cents) values ('TEST-0001', 'Test sleutel', 'SKU-T1', 1995, 750), ('TEST-0002', 'Test chip', 'SKU-T2', 4950, 2100);
    insert into public.kfc_locations (id, warehouse, shelf, box, kind) values ('55555555-5555-5555-5555-555555555555', 'main', 'T1', 'A', 'shelf');
    insert into public.kfc_purchase_orders (supplier) values ('Test Leverancier');
  `);
  await pg.query(`select public.kfc_count_bin('TEST-0001', '55555555-5555-5555-5555-555555555555', 7, 0, 'test-count-1', null, null, 'rehearsal', null)`);
  await pg.query(`select public.kfc_count_bin('TEST-0002', '55555555-5555-5555-5555-555555555555', 3, 0, 'test-count-2', null, null, 'rehearsal', null)`);
}

// Data snapshot over columns that existed at 0128 (new columns are allowed to be filled).
async function dataSnapshot(pg, cols) {
  const out = {};
  for (const [t, cs] of Object.entries(cols)) {
    const list = cs.map((c) => `"${c}"`).join(', ');
    const r = await pg.query(`select md5(coalesce(string_agg(x::text, '|' order by x::text), '')) h, count(*) n from (select row(${list}) x from public."${t}") s`);
    out[t] = `${r.rows[0].n}:${r.rows[0].h}`;
  }
  return out;
}
async function baseColumns(pg) {
  const r = await pg.query(`select c.table_name t, array_agg(c.column_name::text order by c.ordinal_position) cs from information_schema.columns c join information_schema.tables tb on tb.table_schema=c.table_schema and tb.table_name=c.table_name where c.table_schema='public' and tb.table_type='BASE TABLE' group by 1`);
  return Object.fromEntries(r.rows.map((x) => [x.t, x.cs]));
}

const SCHEMA_Q = `
select 'col '||table_name||'.'||column_name||' '||data_type||' '||coalesce(udt_name,'')||' null='||is_nullable||' def='||coalesce(column_default,'') k from information_schema.columns where table_schema='public'
union all select 'rel '||c.relname||' '||c.relkind::text||' rls='||c.relrowsecurity||' force='||c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','v','m','p','S')
union all select 'con '||conrelid::regclass||' '||conname||' '||pg_get_constraintdef(c.oid) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'
union all select 'idx '||indexname||' '||indexdef from pg_indexes where schemaname='public'
union all select 'trg '||tgrelid::regclass||' '||pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not tgisinternal
union all select 'pol '||tablename||' '||policyname||' '||permissive||' '||array_to_string(roles,',')||' '||cmd||' '||coalesce(qual,'')||' '||coalesce(with_check,'') from pg_policies where schemaname='public'
union all select 'fn '||p.oid::regprocedure||' secdef='||p.prosecdef||' vol='||p.provolatile::text||' cfg='||coalesce(array_to_string(p.proconfig,','),'')||' src='||md5(p.prosrc)||' ret='||pg_get_function_result(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
union all select 'view '||viewname||' '||md5(definition) from pg_views where schemaname='public'
union all select 'grant-tbl '||table_name||' '||grantee||' '||privilege_type from information_schema.role_table_grants where table_schema='public'
union all select 'grant-col '||table_name||'.'||column_name||' '||grantee||' '||privilege_type from information_schema.column_privileges where table_schema='public' and grantee in ('anon','authenticated','service_role')
union all select 'grant-fn '||p.oid::regprocedure||' '||r.rolname from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join pg_roles r where n.nspname='public' and r.rolname in ('anon','authenticated','service_role','public') and r.rolname<>'public' and has_function_privilege(r.oid, p.oid, 'execute')
union all select 'grant-seq '||c.relname||' '||r.rolname||' '||has_sequence_privilege(r.oid,c.oid,'usage') from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join pg_roles r where n.nspname='public' and c.relkind='S' and r.rolname in ('anon','authenticated','service_role')
union all select 'cron '||coalesce(jobname,'')||' '||schedule||' '||md5(command) from cron.job
union all select 'bucket '||id||' '||coalesce(public::text,'') from storage.buckets
union all select 'stpol '||tablename||' '||policyname from pg_policies where schemaname='storage'`;
const schema = async (pg) => new Set((await pg.query(SCHEMA_Q)).rows.map((r) => r.k));

test('Autosleutel24 bundle: data kept, refusals, same schema and grants as migrations in order', async () => {
  // 1. Live-like database at 0128 with data; bundle; data unchanged
  const A = await dbAt(128);
  await seed(A);
  const cols = await baseColumns(A);
  const before = await dataSnapshot(A, cols);
  await A.exec(BUNDLE);
  const after = await dataSnapshot(A, cols);
  const changed = Object.keys(before).filter((t) => before[t] !== after[t]);
  check(changed.length === 0, `data in every 0128 table unchanged after the bundle (${Object.keys(before).length} tables)${changed.length ? ': ' + changed.join(', ') : ''}`);
  const marker = (await A.query(`select public.crm_install_profile() p`)).rows[0].p;
  check(marker === 'autosleutel24', `install marker = ${marker}`);
  const stock = (await A.query(`select article_code, sum(quantity)::int q from public.kfc_stock_levels group by 1 order by 1`)).rows;
  check(JSON.stringify(stock) === JSON.stringify([{ article_code: 'TEST-0001', q: 7 }, { article_code: 'TEST-0002', q: 3 }]), `counted stock intact: ${JSON.stringify(stock)}`);

  // 2. Second run refused, nothing changed
  const s1 = await schema(A); const d1 = await dataSnapshot(A, cols);
  let err = null; try { await A.exec(BUNDLE); } catch (e) { err = e.message; try { await A.exec('rollback'); } catch {} }
  check(err && /already has part of 0129-0141/.test(err), `second run refused: ${err}`);
  const s2 = await schema(A); const d2 = await dataSnapshot(A, cols);
  check([...s1].every((k) => s2.has(k)) && s1.size === s2.size && JSON.stringify(d1) === JSON.stringify(d2), 'second run left schema and data as they were');

  // 3. Compare schema and grants with a database built from the migrations in order
  const B = await dbAt(141);
  await B.exec(`insert into public.crm_install (profile) values ('autosleutel24')`);
  const sa = await schema(A), sb = await schema(B);
  const onlyA = [...sa].filter((k) => !sb.has(k)), onlyB = [...sb].filter((k) => !sa.has(k));
  check(onlyA.length === 0 && onlyB.length === 0, `schema+grants identical to migrations in order (${sa.size} items)`);
  
  await A.close(); await B.close();

  // 4. Wrong databases refused
  for (const [label, make, re] of [
    ['KeyForCars-like database at 0140 marked keyforcars', async () => { const p = await dbAt(140); await p.exec(`insert into public.crm_install (profile) values ('keyforcars'); insert into public.jobs (scheduled_date, slot_start, slot_end) values ('2026-11-20','09:00','10:00')`); return p; }, /already has part/],
    ['database at 0128 without jobs', async () => dbAt(128), /no jobs/],
    ['database at 0127', async () => { const p = await dbAt(127); await p.exec(`insert into public.jobs (scheduled_date, slot_start, slot_end) values ('2026-11-20','09:00','10:00')`); return p; }, /not at migration 0128/],
  ]) {
    const p = await make(); const s = await schema(p);
    let e = null; try { await p.exec(BUNDLE); } catch (x) { e = x.message; try { await p.exec('rollback'); } catch {} }
    const s2b = await schema(p);
    check(e && re.test(e) && s.size === s2b.size, `${label}: refused (${e})`);
    await p.close();
  }
});
