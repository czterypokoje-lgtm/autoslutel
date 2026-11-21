-- ============================================================================
-- 0134: KeyForCars product master data (ERPNext "Item Group" style).
--
--   kfc_categories           category tree: parent, name, sort, default VAT rate,
--                            default margin. kfc_articles.category_id points here;
--                            kfc_articles.category (free text) is kept and always
--                            mirrors the leaf name, so older code keeps working.
--   kfc_category_aliases     old names that were merged into another category; a
--                            later write of the old text lands on the survivor
--                            instead of re-creating the merged category.
--   kfc_article_specs        one row per article: key type, frequency, chip,
--                            buttons, blade, vehicle brand.
--   kfc_article_fitments     make / model / year range the article fits.
--   kfc_article_changes      audit trail of bulk edits and imports (old → new).
--   kfc_barcode_duplicates   view: a barcode on more than one quantity-tracked
--                            article. Reported, never deleted; new duplicates are
--                            refused by the bulk editor and the import.
--   kfc_article_quality      view: one row per article with data-quality flags.
--   kfc_import_runs          (0091) also records article imports now: kind
--                            'article_import', a checksum per file + options, so
--                            the same file applied twice changes nothing.
--
-- RPCs: kfc_category_resolve (path → id, creates missing levels),
-- kfc_merge_categories, kfc_bulk_update_articles, kfc_apply_article_import.
--
-- Server-only like the rest of kfc_*: RLS on, no policies, nothing granted to
-- anon or authenticated; functions executable by service_role only. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Category tree
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_categories (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid references public.kfc_categories (id) on delete restrict,
  name                text not null check (length(btrim(name)) between 1 and 80 and name !~ '[>›]'),
  sort                integer not null default 0,
  vat_rate            numeric(5,2) not null default 21 check (vat_rate >= 0 and vat_rate <= 100),
  default_margin_pct  numeric(7,2) check (default_margin_pct is null or (default_margin_pct > -100 and default_margin_pct < 10000)),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index if not exists kfc_categories_sibling_name
  on public.kfc_categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)));
create index if not exists kfc_categories_parent_idx on public.kfc_categories (parent_id);

create table if not exists public.kfc_category_aliases (
  alias        text primary key,             -- lower(btrim(old name))
  category_id  uuid not null references public.kfc_categories (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- A category may never become its own ancestor.
create or replace function public.kfc_categories_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.name := btrim(new.name);
  if new.parent_id is not null and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    if new.parent_id = new.id or exists (
      with recursive up as (
        select id, parent_id from public.kfc_categories where id = new.parent_id
        union all
        select c.id, c.parent_id from public.kfc_categories c join up on c.id = up.parent_id
      ) select 1 from up where up.id = new.id
    ) then raise exception 'KFC_CATEGORY_CYCLE'; end if;
  end if;
  return new;
end $$;
drop trigger if exists kfc_categories_guard on public.kfc_categories;
create trigger kfc_categories_guard before insert or update of parent_id, name on public.kfc_categories
  for each row execute function public.kfc_categories_guard();

-- Full path per category ("Sleutels › Volkswagen › Golf"), for lists and exports.
create or replace view public.kfc_category_paths as
with recursive tree as (
  select id, parent_id, name, sort, 0 as depth, name::text as path, array[sort]::integer[] as sort_path, array[lower(name)] as name_path
    from public.kfc_categories where parent_id is null
  union all
  select c.id, c.parent_id, c.name, c.sort, t.depth + 1, t.path || ' › ' || c.name, t.sort_path || c.sort, t.name_path || lower(c.name)
    from public.kfc_categories c join tree t on c.parent_id = t.id
  where t.depth < 12
)
select id, parent_id, name, depth, path, sort_path, name_path from tree;

-- ---------------------------------------------------------------------------
-- Article columns
-- ---------------------------------------------------------------------------
alter table public.kfc_articles add column if not exists category_id uuid;
alter table public.kfc_articles add column if not exists min_stock integer;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kfc_articles_category_fk') then
    alter table public.kfc_articles add constraint kfc_articles_category_fk
      foreign key (category_id) references public.kfc_categories (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kfc_articles_min_stock_check') then
    alter table public.kfc_articles add constraint kfc_articles_min_stock_check check (min_stock is null or min_stock >= 0);
  end if;
end $$;
create index if not exists kfc_articles_category_idx on public.kfc_articles (category_id);
create index if not exists kfc_articles_ean_gin on public.kfc_articles using gin (ean);

-- Free text → category: alias first, then a root with that name, then any
-- category with that name, otherwise a new root category.
create or replace function public.kfc_category_for_text(p_text text)
returns uuid language plpgsql set search_path = '' as $$
declare v_name text := left(btrim(regexp_replace(coalesce(p_text, ''), '[>›]', '-', 'g')), 80); v_id uuid;
begin
  if v_name = '' then return null; end if;
  select category_id into v_id from public.kfc_category_aliases where alias = lower(v_name);
  if found then return v_id; end if;
  select id into v_id from public.kfc_categories where lower(name) = lower(v_name)
    order by (parent_id is null) desc, sort, created_at limit 1;
  if found then return v_id; end if;
  insert into public.kfc_categories (name) values (v_name) on conflict do nothing returning id into v_id;
  if v_id is null then
    select id into v_id from public.kfc_categories where parent_id is null and lower(name) = lower(v_name);
  end if;
  return v_id;
end $$;

-- category_id is the master; the text column mirrors its name. A write that
-- only sets the text (older RPCs, Woo import, quick article) is linked to the
-- tree by kfc_category_for_text.
create or replace function public.kfc_articles_category_sync()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.category_id is not null and (tg_op = 'INSERT' or new.category_id is distinct from old.category_id) then
    select name into new.category from public.kfc_categories where id = new.category_id;
  elsif tg_op = 'UPDATE' and new.category_id is null and old.category_id is not null
        and new.category is not distinct from old.category then
    new.category := '';
  elsif tg_op = 'INSERT' or new.category is distinct from old.category then
    if btrim(coalesce(new.category, '')) = '' then
      new.category := '';
      new.category_id := null;
    elsif new.category_id is null or not exists (
      select 1 from public.kfc_categories where id = new.category_id and lower(name) = lower(btrim(new.category))
    ) then
      new.category_id := public.kfc_category_for_text(new.category);
      select name into new.category from public.kfc_categories where id = new.category_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists kfc_articles_category_sync on public.kfc_articles;
create trigger kfc_articles_category_sync before insert or update of category, category_id on public.kfc_articles
  for each row execute function public.kfc_articles_category_sync();

-- A renamed category renames the text on its articles.
create or replace function public.kfc_categories_rename()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.name is distinct from old.name then
    update public.kfc_articles set category = new.name where category_id = new.id;
  end if;
  return null;
end $$;
drop trigger if exists kfc_categories_rename on public.kfc_categories;
create trigger kfc_categories_rename after update of name on public.kfc_categories
  for each row execute function public.kfc_categories_rename();

-- Backfill: one root category per distinct text category, then link. Odd
-- texts (">" in them, over 80 characters) go through the same resolver.
update public.kfc_articles set category_id = public.kfc_category_for_text(category)
 where category_id is null and btrim(category) <> '';

-- Path → id ("Sleutels > Volkswagen"); creates the missing levels.
create or replace function public.kfc_category_resolve(p_path text, p_create boolean default true)
returns uuid language plpgsql set search_path = '' as $$
declare v_part text; v_parent uuid := null; v_id uuid; v_first boolean := true;
begin
  if btrim(coalesce(p_path, '')) = '' then return null; end if;
  foreach v_part in array regexp_split_to_array(p_path, '\s*[>›]\s*') loop
    v_part := left(btrim(v_part), 80);
    continue when v_part = '';
    v_id := null;
    select id into v_id from public.kfc_categories
     where coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(v_parent, '00000000-0000-0000-0000-000000000000'::uuid)
       and lower(name) = lower(v_part);
    if v_id is null and v_first then
      select category_id into v_id from public.kfc_category_aliases where alias = lower(v_part);
    end if;
    if v_id is null then
      if not p_create then return null; end if;
      insert into public.kfc_categories (parent_id, name) values (v_parent, v_part) returning id into v_id;
    end if;
    v_parent := v_id;
    v_first := false;
  end loop;
  return v_parent;
end $$;

-- Merge p_from into p_into: articles move, children move (same-named children
-- merge recursively), the old name becomes an alias, p_from is deleted.
create or replace function public.kfc_merge_categories(p_from uuid, p_into uuid)
returns integer language plpgsql set search_path = '' as $$
declare v_from public.kfc_categories; v_child record; v_twin uuid; v_moved integer := 0; v_n integer;
begin
  if p_from = p_into then raise exception 'KFC_MERGE_SELF'; end if;
  select * into v_from from public.kfc_categories where id = p_from for update;
  if not found or not exists (select 1 from public.kfc_categories where id = p_into) then raise exception 'KFC_NO_CATEGORY'; end if;
  if exists (
    with recursive up as (
      select id, parent_id from public.kfc_categories where id = p_into
      union all select c.id, c.parent_id from public.kfc_categories c join up on c.id = up.parent_id
    ) select 1 from up where up.id = p_from
  ) then raise exception 'KFC_MERGE_INTO_CHILD'; end if;

  update public.kfc_articles set category_id = p_into, updated_at = now() where category_id = p_from;
  get diagnostics v_moved = row_count;

  for v_child in select id, name from public.kfc_categories where parent_id = p_from loop
    v_twin := null;
    select id into v_twin from public.kfc_categories where parent_id = p_into and lower(name) = lower(v_child.name);
    if v_twin is not null then
      v_n := public.kfc_merge_categories(v_child.id, v_twin);
      v_moved := v_moved + v_n;
    else
      update public.kfc_categories set parent_id = p_into, updated_at = now() where id = v_child.id;
    end if;
  end loop;

  update public.kfc_category_aliases set category_id = p_into where category_id = p_from;
  insert into public.kfc_category_aliases (alias, category_id) values (lower(v_from.name), p_into)
    on conflict (alias) do update set category_id = excluded.category_id;
  delete from public.kfc_categories where id = p_from;
  return v_moved;
end $$;

-- ---------------------------------------------------------------------------
-- Item attributes: specs (1:1) and vehicle fitments (1:n)
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_article_specs (
  article_code  text primary key references public.kfc_articles (code) on delete cascade,
  brand         text,                     -- vehicle brand the article is for (Volkswagen, Kawasaki …)
  key_type      text check (key_type is null or key_type in
                  ('remote', 'smart', 'flip', 'transponder', 'blade', 'emergency', 'housing', 'card', 'chip', 'pcb', 'battery', 'tool', 'other')),
  frequency     text,                     -- "433 MHz", "868 MHz", "125 kHz"
  chip          text,                     -- "ID48", "Hitag AES", "4D63"
  buttons       smallint check (buttons is null or buttons between 0 and 12),
  blade         text,                     -- blade profile, e.g. HU66
  updated_at    timestamptz not null default now()
);

create table if not exists public.kfc_article_fitments (
  id            uuid primary key default gen_random_uuid(),
  article_code  text not null references public.kfc_articles (code) on delete cascade,
  make          text not null check (length(btrim(make)) between 1 and 60),
  model         text not null default '',
  year_from     smallint check (year_from is null or year_from between 1950 and 2100),
  year_to       smallint check (year_to is null or year_to between 1950 and 2100),
  note          text,
  source        text not null default 'manual' check (source in ('manual', 'import', 'profile')),
  created_at    timestamptz not null default now(),
  constraint kfc_article_fitments_years check (year_to is null or year_from is null or year_to >= year_from)
);
create unique index if not exists kfc_article_fitments_unique
  on public.kfc_article_fitments (article_code, lower(make), lower(model), coalesce(year_from, 0), coalesce(year_to, 0));
create index if not exists kfc_article_fitments_vehicle_idx on public.kfc_article_fitments (lower(make), lower(model));

-- ---------------------------------------------------------------------------
-- Audit of bulk edits and imports
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_article_changes (
  id             bigserial primary key,
  article_code   text not null references public.kfc_articles (code) on delete cascade,
  source         text not null check (source in ('bulk', 'import')),
  changes        jsonb not null,          -- {"field": [old, new]}
  import_run_id  bigint,
  created_by     uuid,
  created_at     timestamptz not null default now()
);
create index if not exists kfc_article_changes_article_idx on public.kfc_article_changes (article_code, created_at desc);

-- ---------------------------------------------------------------------------
-- Barcodes and data quality
-- ---------------------------------------------------------------------------
create or replace view public.kfc_barcode_duplicates as
select b.barcode, array_agg(distinct b.code order by b.code) as codes, count(distinct b.code)::integer as articles
  -- Serial-tracked (used) articles share the barcode of the new product on purpose.
  from (select code, btrim(unnest(ean)) as barcode from public.kfc_articles where tracking = 'quantity') b
 where b.barcode <> ''
 group by b.barcode
having count(distinct b.code) > 1;

create or replace view public.kfc_article_quality as
with dup as (
  select distinct unnest(codes) as code from public.kfc_barcode_duplicates
), neg as (
  select distinct article_code as code from public.kfc_stock_levels where quantity < 0
)
select a.code, a.name, a.sku, a.status, a.category_id, a.ean,
       a.sale_price_cents, a.purchase_price_cents, a.min_stock, a.supplier_ref, a.tracking, a.condition,
       coalesce(p.physical, 0) as physical,
       (a.status <> 'discontinued' and cardinality(array_remove(a.ean, '')) = 0)          as no_barcode,
       (a.category_id is null)                                                             as no_category,
       (a.status <> 'discontinued' and coalesce(a.sale_price_cents, 0) = 0)                as no_price,
       (a.status <> 'discontinued' and a.purchase_price_cents is null)                     as no_purchase_price,
       (d.code is not null)                                                                as duplicate_barcode,
       (n.code is not null or coalesce(p.physical, 0) < 0)                                 as negative_stock
  from public.kfc_articles a
  left join public.kfc_stock_position p on p.article_code = a.code
  left join dup d on d.code = a.code
  left join neg n on n.code = a.code;

-- ---------------------------------------------------------------------------
-- One article change: {before:{field:value}} must still match the row
-- (someone may have changed it meanwhile), {after:{field:value}} is written.
-- New barcodes may not belong to another article. Returns 'updated',
-- 'unchanged', 'conflict' or 'missing'.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_article_fields()
returns text[] language sql immutable set search_path = '' as $$
  select array['name', 'sku', 'ean', 'category_id', 'status', 'sale_price_cents', 'purchase_price_cents', 'min_stock', 'supplier_ref']
$$;

create or replace function public.kfc_apply_article_change(
  p_code text, p_before jsonb, p_after jsonb, p_source text, p_run bigint, p_user uuid
) returns text language plpgsql set search_path = '' as $$
declare
  v_row public.kfc_articles; v_new public.kfc_articles; v_old jsonb; v_key text; v_diff jsonb := '{}'::jsonb; v_bar text;
begin
  select * into v_row from public.kfc_articles where code = p_code for update;
  if not found then return 'missing'; end if;
  v_old := to_jsonb(v_row);
  for v_key in select jsonb_object_keys(coalesce(p_before, '{}'::jsonb) || coalesce(p_after, '{}'::jsonb)) loop
    if not v_key = any(public.kfc_article_fields()) then raise exception 'KFC_BAD_FIELD:%', v_key; end if;
  end loop;
  for v_key in select jsonb_object_keys(coalesce(p_before, '{}'::jsonb)) loop
    if (v_old -> v_key) is distinct from (p_before -> v_key) then return 'conflict'; end if;
  end loop;
  v_new := jsonb_populate_record(v_row, coalesce(p_after, '{}'::jsonb));
  if v_new.ean is distinct from v_row.ean then
    select coalesce(array_agg(distinct btrim(e)), '{}') into v_new.ean from unnest(v_new.ean) e where btrim(e) <> '';
    foreach v_bar in array v_new.ean loop
      if v_row.tracking = 'quantity' and not v_bar = any(v_row.ean) and exists (
        select 1 from public.kfc_articles where code <> p_code and tracking = 'quantity' and v_bar = any(ean)
      ) then raise exception 'KFC_DUPLICATE_BARCODE:%', v_bar; end if;
    end loop;
  end if;
  for v_key in select unnest(public.kfc_article_fields()) loop
    if (v_old -> v_key) is distinct from (to_jsonb(v_new) -> v_key) then
      v_diff := v_diff || jsonb_build_object(v_key, jsonb_build_array(v_old -> v_key, to_jsonb(v_new) -> v_key));
    end if;
  end loop;
  if v_diff = '{}'::jsonb then return 'unchanged'; end if;
  update public.kfc_articles set
    name = v_new.name, sku = v_new.sku, ean = v_new.ean, category_id = v_new.category_id, status = v_new.status,
    sale_price_cents = v_new.sale_price_cents, purchase_price_cents = v_new.purchase_price_cents,
    min_stock = v_new.min_stock, supplier_ref = v_new.supplier_ref, updated_at = now()
  where code = p_code;
  insert into public.kfc_article_changes (article_code, source, changes, import_run_id, created_by)
  values (p_code, p_source, v_diff, p_run, p_user);
  return 'updated';
end $$;

-- Bulk edit: [{code, before, after}]. All or nothing: one conflict and the
-- whole call is rolled back with the conflicting codes in the message.
create or replace function public.kfc_bulk_update_articles(p_changes jsonb, p_user uuid default null)
returns jsonb language plpgsql set search_path = '' as $$
declare v_item jsonb; v_result text; v_conflicts text[] := '{}'; v_updated integer := 0;
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) > 5000 then raise exception 'KFC_BAD_BATCH'; end if;
  for v_item in select * from jsonb_array_elements(p_changes) loop
    v_result := public.kfc_apply_article_change(v_item ->> 'code', v_item -> 'before', v_item -> 'after', 'bulk', null, p_user);
    if v_result in ('conflict', 'missing') then v_conflicts := v_conflicts || (v_item ->> 'code'); end if;
    if v_result = 'updated' then v_updated := v_updated + 1; end if;
  end loop;
  if cardinality(v_conflicts) > 0 then
    raise exception 'KFC_CONFLICT:%', array_to_string(v_conflicts, ',');
  end if;
  return jsonb_build_object('updated', v_updated);
end $$;

-- ---------------------------------------------------------------------------
-- Import runs: article imports share kfc_import_runs with the Woo importer.
-- The kind check is widened by OR-ing onto whatever the current check is, so a
-- kind another migration added is never lost.
-- ---------------------------------------------------------------------------
alter table public.kfc_import_runs add column if not exists checksum   text;
alter table public.kfc_import_runs add column if not exists file_name  text;
alter table public.kfc_import_runs add column if not exists summary    jsonb;
alter table public.kfc_import_runs add column if not exists created_by uuid;
do $$
declare v_name text; v_def text;
begin
  select conname, pg_get_constraintdef(oid) into v_name, v_def from pg_constraint
   where conrelid = 'public.kfc_import_runs'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kind%'
   limit 1;
  if v_name is not null and v_def not ilike '%article_import%' then
    execute format('alter table public.kfc_import_runs drop constraint %I', v_name);
    execute format('alter table public.kfc_import_runs add constraint %I check (%s or kind = %L)',
      v_name, regexp_replace(v_def, '^CHECK\s*', ''), 'article_import');
  end if;
end $$;
create unique index if not exists kfc_import_runs_article_checksum
  on public.kfc_import_runs (checksum) where kind = 'article_import' and error is null;

-- p_rows: [{action:'create'|'update', code?, before?, after:{…}, category_path?, specs?, fitments?}]
-- prepared by the server from the same file it showed in the dry run. All or
-- nothing; a file already applied (same checksum) returns that run unchanged.
create or replace function public.kfc_apply_article_import(
  p_checksum text, p_file text, p_prefix text, p_rows jsonb, p_user uuid default null
) returns jsonb language plpgsql set search_path = '' as $$
declare
  v_run public.kfc_import_runs; v_row jsonb; v_after jsonb; v_code text; v_next bigint; v_result text;
  v_created integer := 0; v_updated integer := 0; v_unchanged integer := 0; v_fit jsonb; v_constraint text;
  v_conflicts text[] := '{}'; v_bar text; v_ean text[];
begin
  if p_prefix not in ('KFC-1-', 'AS24-1-') then raise exception 'KFC_BAD_PREFIX'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 20000 then raise exception 'KFC_BAD_BATCH'; end if;
  select * into v_run from public.kfc_import_runs where kind = 'article_import' and checksum = p_checksum and error is null;
  if found then return jsonb_build_object('replay', true, 'run', v_run.id, 'summary', v_run.summary, 'finished_at', v_run.finished_at); end if;

  insert into public.kfc_import_runs (shop, kind, checksum, file_name, created_by)
  values ('artikelen', 'article_import', p_checksum, left(p_file, 200), p_user) returning * into v_run;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_after := coalesce(v_row -> 'after', '{}'::jsonb);
    if coalesce(v_row ->> 'category_path', '') <> '' then
      v_after := v_after || jsonb_build_object('category_id', public.kfc_category_resolve(v_row ->> 'category_path', true));
    end if;
    if v_row ->> 'action' = 'create' then
      v_code := nullif(v_row ->> 'code', '');
      if v_code is null then
        perform pg_advisory_xact_lock(hashtext('kfc_article_code:' || p_prefix));
        select coalesce(max(substr(code, length(p_prefix) + 1)::bigint), 0) + 1 into v_next
          from public.kfc_articles where code ~ ('^' || p_prefix || '[0-9]{1,18}$');
        v_code := p_prefix || v_next::text;
      end if;
      select coalesce(array_agg(distinct btrim(e)), '{}') into v_ean
        from jsonb_array_elements_text(coalesce(v_after -> 'ean', '[]'::jsonb)) e where btrim(e) <> '';
      foreach v_bar in array v_ean loop
        if exists (select 1 from public.kfc_articles where tracking = 'quantity' and v_bar = any(ean)) then raise exception 'KFC_DUPLICATE_BARCODE:%', v_bar; end if;
      end loop;
      insert into public.kfc_articles (code, name, sku, ean, category_id, status, sale_price_cents, purchase_price_cents, min_stock, supplier_ref)
      values (v_code, coalesce(v_after ->> 'name', v_code), coalesce(v_after ->> 'sku', ''), v_ean,
              (v_after ->> 'category_id')::uuid, coalesce(v_after ->> 'status', 'held'),
              (v_after ->> 'sale_price_cents')::integer, (v_after ->> 'purchase_price_cents')::integer,
              (v_after ->> 'min_stock')::integer, nullif(v_after ->> 'supplier_ref', ''));
      insert into public.kfc_article_changes (article_code, source, changes, import_run_id, created_by)
      values (v_code, 'import', jsonb_build_object('created', jsonb_build_array(null, v_after)), v_run.id, p_user);
      v_created := v_created + 1;
    elsif v_row ->> 'action' = 'update' then
      v_code := v_row ->> 'code';
      v_result := public.kfc_apply_article_change(v_code, v_row -> 'before', v_after, 'import', v_run.id, p_user);
      if v_result in ('conflict', 'missing') then v_conflicts := v_conflicts || v_code; end if;
      if v_result = 'updated' then v_updated := v_updated + 1; else v_unchanged := v_unchanged + 1; end if;
    else
      continue;
    end if;

    if jsonb_typeof(v_row -> 'specs') = 'object' and v_row -> 'specs' <> '{}'::jsonb then
      insert into public.kfc_article_specs (article_code) values (v_code) on conflict do nothing;
      update public.kfc_article_specs s set
        brand     = coalesce(v_row -> 'specs' ->> 'brand', s.brand),
        key_type  = coalesce(v_row -> 'specs' ->> 'key_type', s.key_type),
        frequency = coalesce(v_row -> 'specs' ->> 'frequency', s.frequency),
        chip      = coalesce(v_row -> 'specs' ->> 'chip', s.chip),
        buttons   = coalesce((v_row -> 'specs' ->> 'buttons')::smallint, s.buttons),
        blade     = coalesce(v_row -> 'specs' ->> 'blade', s.blade),
        updated_at = now()
      where s.article_code = v_code;
    end if;
    for v_fit in select * from jsonb_array_elements(coalesce(v_row -> 'fitments', '[]'::jsonb)) loop
      insert into public.kfc_article_fitments (article_code, make, model, year_from, year_to, source)
      values (v_code, v_fit ->> 'make', coalesce(v_fit ->> 'model', ''), (v_fit ->> 'year_from')::smallint, (v_fit ->> 'year_to')::smallint, 'import')
      on conflict do nothing;
    end loop;
  end loop;

  if cardinality(v_conflicts) > 0 then raise exception 'KFC_CONFLICT:%', array_to_string(v_conflicts, ','); end if;

  update public.kfc_import_runs set finished_at = now(), orders = v_created + v_updated,
    summary = jsonb_build_object('created', v_created, 'updated', v_updated, 'unchanged', v_unchanged)
   where id = v_run.id returning * into v_run;
  return jsonb_build_object('replay', false, 'run', v_run.id, 'summary', v_run.summary, 'finished_at', v_run.finished_at);
exception when unique_violation then
  get stacked diagnostics v_constraint = constraint_name;
  if v_constraint = 'kfc_import_runs_article_checksum' then
    select * into v_run from public.kfc_import_runs where kind = 'article_import' and checksum = p_checksum and error is null;
    return jsonb_build_object('replay', true, 'run', v_run.id, 'summary', v_run.summary, 'finished_at', v_run.finished_at);
  end if;
  raise;
end $$;

-- ---------------------------------------------------------------------------
-- Security: server-only.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['kfc_categories', 'kfc_category_aliases', 'kfc_article_specs', 'kfc_article_fitments', 'kfc_article_changes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on public.kfc_category_paths, public.kfc_barcode_duplicates, public.kfc_article_quality from anon, authenticated;
revoke all on sequence public.kfc_article_changes_id_seq from anon, authenticated;

revoke all on function public.kfc_categories_guard() from public, anon, authenticated;
revoke all on function public.kfc_categories_rename() from public, anon, authenticated;
revoke all on function public.kfc_articles_category_sync() from public, anon, authenticated;
revoke all on function public.kfc_category_for_text(text) from public, anon, authenticated;
revoke all on function public.kfc_category_resolve(text, boolean) from public, anon, authenticated;
revoke all on function public.kfc_merge_categories(uuid, uuid) from public, anon, authenticated;
revoke all on function public.kfc_article_fields() from public, anon, authenticated;
revoke all on function public.kfc_apply_article_change(text, jsonb, jsonb, text, bigint, uuid) from public, anon, authenticated;
revoke all on function public.kfc_bulk_update_articles(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.kfc_apply_article_import(text, text, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.kfc_category_resolve(text, boolean) to service_role;
grant execute on function public.kfc_merge_categories(uuid, uuid) to service_role;
grant execute on function public.kfc_bulk_update_articles(jsonb, uuid) to service_role;
grant execute on function public.kfc_apply_article_import(text, text, text, jsonb, uuid) to service_role;
-- Called inside the triggers and RPCs above, which run as the caller (service_role).
grant execute on function public.kfc_category_for_text(text) to service_role;
grant execute on function public.kfc_article_fields() to service_role;
grant execute on function public.kfc_apply_article_change(text, jsonb, jsonb, text, bigint, uuid) to service_role;
