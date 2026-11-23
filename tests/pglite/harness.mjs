/**
 * Offline SQL test harness: this repo's migrations on an in-process Postgres (PGlite, Postgres 16 in WASM).
 * No network service, no real database. Each freshDb() is a new, isolated database.
 *
 *   import { freshDb, seedBasics } from './harness.mjs';
 *   const db = await freshDb({ plus: ['0138_kfc_ship_rule.sql'] });
 *   await db.rpc('kfc_book_move', { p_article: 'X', ... });
 *   await db.close();
 *
 * Run: npm run test:pglite   (node --test "tests/pglite/*.test.mjs")
 *
 * PGlite install: like scripts/check-jobroom-sql.mts, @electric-sql/pglite@0.2.17 is installed once into
 * PGLITE_DIR (default os.tmpdir()/jobroom-pglite), never into this repo's package.json. PGLITE_OFFLINE=1
 * forbids that install.
 *
 * Base snapshot: migrations 0000 .. 0135 (inclusive, filename order, 0104z included) are applied once and
 * the data directory is cached as a tarball in os.tmpdir()/kfc-pglite-snapshots/base-<hash>.tar, where the
 * hash covers the base migration files' contents, this harness's bootstrap SQL and the PGlite version.
 * Change any of those and the next run rebuilds it. PGLITE_SNAPSHOT_DIR overrides the folder.
 *
 * ---------------------------------------------------------------------------------------------------------
 * STUBS. These are NOT the real Supabase objects; they exist only so the migrations apply.
 * ---------------------------------------------------------------------------------------------------------
 *  Roles      anon, authenticated, service_role (service_role has BYPASSRLS), all NOLOGIN, none superuser.
 *             Default privileges in schema public grant everything to all three, like Supabase.
 *             Tests run as `set role service_role` with request.jwt.claims = {"role":"service_role"}.
 *             Migrations themselves run as the PGlite superuser (Supabase runs them as `postgres`).
 *  auth       schema auth; table auth.users (id uuid pk, email, phone, raw_app_meta_data, raw_user_meta_data,
 *             created_at, updated_at, last_sign_in_at, deleted_at, is_anonymous) - a cut-down table, no trigger.
 *             auth.jwt()   = current_setting('request.jwt.claims')::jsonb (or '{}'), like Supabase.
 *             auth.uid()   = auth.jwt()->>'sub' as uuid (null when unset).
 *             auth.role()  = auth.jwt()->>'role'.  auth.email() = auth.jwt()->>'email'.
 *  storage    schema storage; tables storage.buckets (id, name, public, file_size_limit, allowed_mime_types,
 *             owner, created_at, updated_at) and storage.objects (id, bucket_id, name, owner, metadata,
 *             created_at, updated_at) with RLS enabled; storage.foldername(text) = folder parts of a path,
 *             storage.filename(text), storage.extension(text). No file storage behind them.
 *  extensions schema `extensions` (on the search_path, as in Supabase).
 *             btree_gist, pg_trgm, uuid-ossp, citext, hstore, fuzzystrmatch: PGlite's bundled contrib (real).
 *             pgcrypto: NOT bundled in PGlite 0.2.17. `create extension pgcrypto` is turned into a no-op;
 *               gen_random_uuid() is core Postgres (real). extensions.digest(text|bytea, text) is a stub over core
 *               md5/sha224/sha256/sha384/sha512 plus a plpgsql SHA-1 (extensions.sha1_stub) (same output for
 *               those algorithms); extensions.gen_random_bytes(int)
 *               is a stub built from random() (NOT cryptographically secure). crypt/gen_salt/pgp_* do not exist.
 *             unaccent: NOT bundled. `create extension unaccent` is a no-op; extensions.unaccent(text) is a
 *               stub that strips common Latin diacritics with translate() (no dictionary).
 *             pg_cron: NOT available. `create extension pg_cron` is a no-op; schema cron with
 *               cron.schedule(...) / cron.unschedule(...) that only record into cron.job (nothing ever runs).
 *             pg_net: NOT available. `create extension pg_net` is a no-op; net.http_post / net.http_get only
 *               record the request into net.http_request_queue and return its id (no HTTP is sent).
 *  realtime   publication supabase_realtime (a real but unused publication; no Realtime server).
 *  vault      schema vault with an empty table vault.decrypted_secrets (id, name, secret, decrypted_secret,
 *             description, created_at). Insert rows yourself if a test needs a secret.
 *
 * The `create extension` rewrite is done in memory on the migration text before it is executed; the files on
 * disk are never changed. Every rewrite is listed in EXTENSION_NOOPS below.
 *
 * SKIP-LIST: see SKIP below (empty means every base migration applies).
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PGLITE_VERSION = '0.2.17';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIGRATIONS = join(REPO, 'supabase', 'migrations');
/** Last migration of the cached base (inclusive). */
export const BASE_LAST = 135;

/**
 * Migrations that cannot run on PGlite, with the reason. Keep this as short as possible: a missing stub gets
 * a stub, not a skip. Skipped files are not applied in the base nor by `all`.
 */
export const SKIP = {
  // (none)
};

/** Extensions that PGlite does not ship: `create extension` for these becomes a no-op (stubs in BOOTSTRAP). */
const EXTENSION_NOOPS = ['pgcrypto', 'unaccent', 'pg_cron', 'pg_net', 'pg_graphql', 'pg_stat_statements', 'supabase_vault', 'pgsodium', 'pgjwt'];

// ---------------------------------------------------------------------------------------------- PGlite install
let PGliteMod;
function loadPglite() {
  if (PGliteMod) return PGliteMod;
  const dir = process.env.PGLITE_DIR ?? join(tmpdir(), 'jobroom-pglite');
  if (!existsSync(join(dir, 'node_modules', '@electric-sql', 'pglite', 'package.json'))) {
    if (process.env.PGLITE_OFFLINE) {
      throw new Error(`pglite is not installed in ${dir}. Run: npm install @electric-sql/pglite@${PGLITE_VERSION} --prefix ${dir}`);
    }
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, 'package.json'))) writeFileSync(join(dir, 'package.json'), '{"name":"jobroom-pglite","private":true}');
    console.error(`pglite harness: installing @electric-sql/pglite@${PGLITE_VERSION} into ${dir} (once)`);
    execSync(`npm install @electric-sql/pglite@${PGLITE_VERSION} --no-audit --no-fund --silent`, { cwd: dir, stdio: 'inherit' });
  }
  const require = createRequire(join(dir, 'package.json'));
  const { PGlite } = require('@electric-sql/pglite');
  const contrib = (name) => require(`@electric-sql/pglite/contrib/${name}`)[name];
  const extensions = {
    btree_gist: contrib('btree_gist'),
    pg_trgm: contrib('pg_trgm'),
    uuid_ossp: contrib('uuid_ossp'),
    citext: contrib('citext'),
    hstore: contrib('hstore'),
    fuzzystrmatch: contrib('fuzzystrmatch'),
  };
  PGliteMod = { PGlite, extensions };
  return PGliteMod;
}

// ---------------------------------------------------------------------------------------------- bootstrap SQL
const BOOTSTRAP = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
alter database postgres set search_path = "$user", public, extensions;

-- auth (stub)
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text, phone text,
  raw_app_meta_data jsonb not null default '{}',
  raw_user_meta_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sign_in_at timestamptz, deleted_at timestamptz,
  is_anonymous boolean not null default false
);
grant select on auth.users to service_role;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), auth.jwt() ->> 'sub'), '')::uuid $$;
create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), auth.jwt() ->> 'role') $$;
create function auth.email() returns text language sql stable as $$ select auth.jwt() ->> 'email' $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

-- storage (stub)
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text not null unique, owner uuid, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], avif_autodetection boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text,
  owner uuid, owner_id text, metadata jsonb, path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  version text, created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz default now()
);
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant all on storage.buckets, storage.objects to service_role;
grant select, insert, update, delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1 : greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;
create function storage.filename(name text) returns text language sql immutable as $$
  select (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)] $$;
create function storage.extension(name text) returns text language sql immutable as $$
  select reverse(split_part(reverse(storage.filename(name)), '.', 1)) $$;
grant execute on all functions in schema storage to anon, authenticated, service_role;

-- pgcrypto (partial stub; gen_random_uuid() is core)
-- SHA-1 is not in core Postgres: a plain plpgsql implementation (FIPS 180-4), same output as pgcrypto.
create function extensions.sha1_stub(data bytea) returns bytea language plpgsql immutable strict as $$
declare
  m constant bigint := 4294967295;
  h0 bigint := 1732584193; h1 bigint := 4023233417; h2 bigint := 2562383102; h3 bigint := 271733878; h4 bigint := 3285377520;
  msg bytea := data || decode('80', 'hex');
  w bigint[]; a bigint; b bigint; c bigint; d bigint; e bigint; f bigint; k bigint; t bigint; o integer;
begin
  while length(msg) % 64 <> 56 loop msg := msg || decode('00', 'hex'); end loop;
  msg := msg || int8send(length(data)::bigint * 8);
  for chunk in 0 .. length(msg) / 64 - 1 loop
    w := array_fill(0::bigint, array[80]);
    for i in 0 .. 15 loop
      o := chunk * 64 + i * 4;
      w[i + 1] := (get_byte(msg, o)::bigint << 24) | (get_byte(msg, o + 1)::bigint << 16) | (get_byte(msg, o + 2)::bigint << 8) | get_byte(msg, o + 3)::bigint;
    end loop;
    for i in 16 .. 79 loop
      t := w[i - 2] # w[i - 7] # w[i - 13] # w[i - 15];
      w[i + 1] := ((t << 1) | (t >> 31)) & m;
    end loop;
    a := h0; b := h1; c := h2; d := h3; e := h4;
    for i in 0 .. 79 loop
      if i < 20 then f := (b & c) | ((~b & m) & d); k := 1518500249;
      elsif i < 40 then f := b # c # d; k := 1859775393;
      elsif i < 60 then f := (b & c) | (b & d) | (c & d); k := 2400959708;
      else f := b # c # d; k := 3395469782; end if;
      t := ((((a << 5) | (a >> 27)) & m) + f + e + k + w[i + 1]) & m;
      e := d; d := c; c := ((b << 30) | (b >> 2)) & m; b := a; a := t;
    end loop;
    h0 := (h0 + a) & m; h1 := (h1 + b) & m; h2 := (h2 + c) & m; h3 := (h3 + d) & m; h4 := (h4 + e) & m;
  end loop;
  return substring(int8send(h0) from 5) || substring(int8send(h1) from 5) || substring(int8send(h2) from 5)
      || substring(int8send(h3) from 5) || substring(int8send(h4) from 5);
end $$;
create function extensions.digest(data bytea, type text) returns bytea language sql immutable strict as $$
  select case lower(type)
    when 'md5' then decode(md5(data), 'hex') when 'sha1' then extensions.sha1_stub(data)
    when 'sha224' then sha224(data) when 'sha256' then sha256(data)
    when 'sha384' then sha384(data) when 'sha512' then sha512(data) end $$;
create function extensions.digest(data text, type text) returns bytea language sql immutable strict as $$
  select extensions.digest(convert_to(data, 'UTF8'), type) $$;
create function extensions.gen_random_bytes(n integer) returns bytea language sql volatile strict as $$
  select decode(coalesce(string_agg(lpad(to_hex((random() * 255)::int), 2, '0'), ''), ''), 'hex') from generate_series(1, n) $$;

-- unaccent (stub: translate common Latin diacritics, no dictionary)
create function extensions.unaccent(text) returns text language sql immutable strict as $$
  select translate($1,
    'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÝýÿĞğİıŞşŒœ',
    'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOOooooooUUUUuuuuYyyGgIiSsOo') $$;
grant execute on all functions in schema extensions to anon, authenticated, service_role;

-- pg_cron (stub: records only, nothing runs)
create schema cron;
create table cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text, active boolean default true);
create function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid $$;
create function cron.schedule(schedule text, command text) returns bigint language sql as $$
  insert into cron.job (schedule, command) values (schedule, command) returning jobid $$;
create function cron.unschedule(job_name text) returns boolean language sql as $$
  with d as (delete from cron.job where jobname = job_name returning 1) select exists (select 1 from d) $$;
create function cron.unschedule(job_id bigint) returns boolean language sql as $$
  with d as (delete from cron.job where jobid = job_id returning 1) select exists (select 1 from d) $$;

-- pg_net (stub: records only, no HTTP)
create schema net;
create table net.http_request_queue (id bigserial primary key, method text, url text, headers jsonb, body jsonb, timeout_milliseconds int, created_at timestamptz default now());
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000)
  returns bigint language sql as $$
  insert into net.http_request_queue (method, url, headers, body, timeout_milliseconds) values ('POST', url, headers, body, timeout_milliseconds) returning id $$;
create function net.http_get(url text, params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000)
  returns bigint language sql as $$
  insert into net.http_request_queue (method, url, headers, timeout_milliseconds) values ('GET', url, headers, timeout_milliseconds) returning id $$;

-- realtime: the publication Supabase creates (a real, empty Postgres publication; nothing listens to it)
create publication supabase_realtime;

-- vault (stub: empty)
create schema vault;
create table vault.decrypted_secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text,
  decrypted_secret text, description text, created_at timestamptz default now());

-- let tests (service_role) look at what the stubs recorded
grant usage on schema cron, net, vault to service_role;
grant all on all tables in schema cron, net, vault to service_role;
grant all on all sequences in schema cron, net, vault to service_role;
`;

// ---------------------------------------------------------------------------------------------- migrations
const num = (f) => parseInt(f.slice(0, 4), 10);
function migrationFiles() {
  return readdirSync(MIGRATIONS).filter((f) => /^\d{4}.*\.sql$/.test(f)).sort();
}
const baseFiles = () => migrationFiles().filter((f) => num(f) <= BASE_LAST && !(f in SKIP));

const NOOP_RE = new RegExp(`create\\s+extension\\s+(if\\s+not\\s+exists\\s+)?"?(${EXTENSION_NOOPS.map((e) => e.replace('-', '\\-')).join('|')})"?[^;]*;`, 'gi');
function migrationSql(file) {
  return readFileSync(join(MIGRATIONS, file), 'utf8').replace(NOOP_RE, (m, _i, ext) => `/* pglite harness: extension ${ext} stubbed, see harness.mjs */;`);
}

async function applyMigration(pg, file) {
  const text = migrationSql(file);
  try {
    // A multi-statement simple query is one implicit transaction: the whole file or nothing.
    await pg.exec(text);
  } catch (e) {
    try { await pg.exec('rollback'); } catch { /* not in a transaction */ }
    const err = new Error(`migration ${file} failed: ${e.message}`);
    err.cause = e;
    throw err;
  }
}

// ---------------------------------------------------------------------------------------------- snapshot
function snapshotPath() {
  const h = createHash('sha256');
  h.update(`pglite@${PGLITE_VERSION}\n${BOOTSTRAP}\n${EXTENSION_NOOPS.join(',')}\n${JSON.stringify(SKIP)}\n`);
  for (const f of baseFiles()) h.update(`${f}\n`).update(readFileSync(join(MIGRATIONS, f)));
  const dir = process.env.PGLITE_SNAPSHOT_DIR ?? join(tmpdir(), 'kfc-pglite-snapshots');
  mkdirSync(dir, { recursive: true });
  return { dir, file: join(dir, `base-${h.digest('hex').slice(0, 16)}.tar`) };
}

async function buildSnapshot(file) {
  const { PGlite, extensions } = loadPglite();
  const t0 = Date.now();
  const pg = new PGlite({ extensions });
  await pg.waitReady;
  await pg.exec(BOOTSTRAP);
  await pg.exec(`set search_path = "$user", public, extensions`);
  for (const f of baseFiles()) await applyMigration(pg, f);
  const blob = await pg.dumpDataDir('none');
  await pg.close();
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, Buffer.from(await blob.arrayBuffer()));
  renameSync(tmp, file); // atomic: concurrent builders never see half a file
  console.error(`pglite harness: base snapshot (${baseFiles().length} migrations) built in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${file}`);
}

let snapshotBytes;
async function baseSnapshot() {
  if (snapshotBytes) return snapshotBytes;
  const { dir, file } = snapshotPath();
  if (!existsSync(file)) {
    // A simple cross-process lock so parallel test files build it once.
    const lock = `${file}.lock`;
    const deadline = Date.now() + 10 * 60_000;
    for (;;) {
      if (existsSync(file)) break;
      try {
        mkdirSync(lock);
      } catch {
        try { if (Date.now() - statSync(lock).mtimeMs > 5 * 60_000) rmSync(lock, { recursive: true, force: true }); } catch { /* gone */ }
        if (Date.now() > deadline) throw new Error(`pglite harness: timed out waiting for ${lock}`);
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      try {
        if (!existsSync(file)) {
          // drop older snapshots so the cache stays small
          for (const old of readdirSync(dir)) if (/^base-[0-9a-f]+\.tar$/.test(old)) rmSync(join(dir, old), { force: true });
          await buildSnapshot(file);
        }
      } finally {
        rmSync(lock, { recursive: true, force: true });
      }
      break;
    }
  }
  snapshotBytes = readFileSync(file);
  return snapshotBytes;
}

// ---------------------------------------------------------------------------------------------- public API
const IDENT = /^[a-z_][a-z0-9_]*$/;
const toParam = (v) => (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !(v instanceof Uint8Array) ? JSON.stringify(v) : v);

// PGlite errors are kept as they are: .message is the Postgres message (e.g. 'KFC_INSUFFICIENT'), and
// .code (SQLSTATE), .detail, .hint, .where are set.
const wrapError = (e) => (e instanceof Error ? e : new Error(String(e)));

/**
 * A new isolated database at base (all migrations through 0135), optionally plus later migrations.
 * @param {{ plus?: string[], all?: boolean }} [options]
 */
export async function freshDb(options = {}) {
  const { PGlite, extensions } = loadPglite();
  const bytes = await baseSnapshot();
  const pg = new PGlite({ extensions, loadDataDir: new Blob([bytes]) });
  await pg.waitReady;
  await pg.exec(`set search_path = "$user", public, extensions`);

  let extra = options.plus ?? [];
  if (options.all) {
    const later = migrationFiles().filter((f) => num(f) > BASE_LAST && !(f in SKIP));
    extra = [...later, ...extra.filter((f) => !later.includes(f))];
  }
  for (const f of extra) {
    if (!existsSync(join(MIGRATIONS, f))) {
      await pg.close();
      throw new Error(`pglite harness: no migration file ${f} in supabase/migrations`);
    }
    try {
      await applyMigration(pg, f);
    } catch (e) {
      await pg.close();
      throw e;
    }
  }

  // From here on: act like the Supabase service-role key.
  await pg.exec(`set role service_role; select set_config('request.jwt.claims', '{"role":"service_role"}', false);`);

  const sql = async (text, params = []) => {
    try {
      return (await pg.query(text, params.map(toParam))).rows;
    } catch (e) {
      throw wrapError(e);
    }
  };
  const rpc = async (name, args = {}) => {
    if (!IDENT.test(name)) throw new Error(`bad function name ${name}`);
    const keys = Object.keys(args);
    for (const k of keys) if (!IDENT.test(k)) throw new Error(`bad argument name ${k}`);
    const text = `select * from public.${name}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
    return sql(text, keys.map((k) => args[k]));
  };
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await pg.close();
  };
  return { pg, sql, rpc, close };
}

/** The same in-memory rewrite the migrations get (stubbed extensions), for SQL that is not a migration file, e.g. the install bundle. */
export const prepareSql = (text) => text.replace(NOOP_RE, (m, _i, ext) => `/* pglite harness: extension ${ext} stubbed, see harness.mjs */;`);

/**
 * A database as an install stood at an earlier point: every migration numbered <= `last`, minus `exclude`.
 * For rehearsing an upgrade (e.g. KeyForCars at 0105, then the generated bundle on top). Not cached: it
 * replays the files, a few seconds. Returns the raw PGlite instance as SUPERUSER — the caller runs the
 * upgrade with `pg.exec(prepareSql(sql))` and switches role itself (`set role service_role`).
 */
export async function dbAt(last, { exclude = [] } = {}) {
  const { PGlite, extensions } = loadPglite();
  const pg = new PGlite({ extensions });
  await pg.waitReady;
  await pg.exec(BOOTSTRAP);
  await pg.exec(`set search_path = "$user", public, extensions`);
  for (const f of migrationFiles().filter((f) => num(f) <= last && !(f in SKIP) && !exclude.includes(f))) await applyMigration(pg, f);
  return pg;
}

/**
 * A tiny, clearly fictional fixture (all names start with TEST / Test). Uses only columns that exist at 0135.
 * Returns:
 *   {
 *     articles:   [{ code: 'TEST-0001', sale_price_cents: 1995, purchase_price_cents: 750 },
 *                  { code: 'TEST-0002', sale_price_cents: 4950, purchase_price_cents: 2100 }],
 *     warehouse:  'main',
 *     locations:  [{ id, shelf: 'T1', box: 'A' }, { id, shelf: 'T1', box: 'B' }],   (kind 'shelf', warehouse 'main')
 *     quarantine: id of the 'main' quarantine location that migration 0090 creates,
 *     supplier:   { id, name: 'Test Leverancier BV' },
 *     customer:   { id, company: 'Test Klant BV' },
 *   }
 * No stock is booked: counting/moving is left to the test.
 */
export async function seedBasics(db) {
  const articles = [
    { code: 'TEST-0001', name: 'Test sleutelbehuizing 2 knoppen', sale_price_cents: 1995, purchase_price_cents: 750 },
    { code: 'TEST-0002', name: 'Test transponder chip', sale_price_cents: 4950, purchase_price_cents: 2100 },
  ];
  for (const a of articles) {
    await db.sql(`insert into public.kfc_articles (code, name, sku, sale_price_cents, purchase_price_cents) values ($1, $2, $3, $4, $5)`,
      [a.code, a.name, `SKU-${a.code}`, a.sale_price_cents, a.purchase_price_cents]);
  }
  const locations = [];
  for (const box of ['A', 'B']) {
    const [row] = await db.sql(`insert into public.kfc_locations (warehouse, shelf, box, kind) values ('main', 'T1', $1, 'shelf') returning id, shelf, box`, [box]);
    locations.push(row);
  }
  const [q] = await db.sql(`select id from public.kfc_locations where warehouse = 'main' and kind = 'quarantine' order by created_at limit 1`);
  const [supplier] = await db.sql(
    `insert into public.kfc_suppliers (name, email, city, terms_days) values ('Test Leverancier BV', 'leverancier@example.test', 'Teststad', 14) returning id, name`);
  const [customer] = await db.sql(
    `insert into public.kfc_customers (company, contact_name, email, city, terms_days) values ('Test Klant BV', 'Test Persoon', 'klant@example.test', 'Teststad', 30) returning id, company`);
  return {
    articles: articles.map(({ code, sale_price_cents, purchase_price_cents }) => ({ code, sale_price_cents, purchase_price_cents })),
    warehouse: 'main',
    locations,
    quarantine: q?.id ?? null,
    supplier,
    customer,
  };
}
