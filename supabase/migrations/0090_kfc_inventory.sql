-- ============================================================================
-- 0090: KeyForCars inventory ledger (phase 1 of the stock/orders/accounts design).
--
-- Replaces the one-row JSON record in kfc_stock_state with tables:
--
--   kfc_articles            master article (code = label code, e.g. KFC-1-2689)
--   kfc_locations           shelf + box in a warehouse; one 'quarantine' location
--                           holds unusable units, so Unusable is a balance, never
--                           a move reason
--   kfc_stock_moves         append-only ledger: delta, quantity after, cost,
--                           reason, source document, who, when, idempotency key
--   kfc_stock_levels        per (article, location) cache of the ledger; the row
--                           every RPC locks, so two phones cannot race
--   kfc_count_batches/photos bulk photo counts; a photo hash is a primary key, so
--                           the same picture can never be counted twice
--   kfc_reservations        reserve (+) / release (−) rows per order line; filled
--                           by phase 2, created now so Reserved is a sum from day one
--   kfc_purchase_orders/lines  what is on order at the supplier; feeds Incoming
--   kfc_stock_position      view: physical · unusable · reserved · available · incoming
--
-- All tables are server-only: RLS on, no policies, no grants to anon or
-- authenticated. The Next.js server reads and writes them with the service-role
-- key after crmSession.ts has checked the signed-in user's role. Prices are
-- therefore hidden from warehouse and picker in server code, not by a view.
--
-- The existing public.stock_moves (0039) belongs to the Autosleutel24 locksmith
-- CRM and is not touched. Idempotent.
-- ============================================================================

create table if not exists public.kfc_articles (
  code              text primary key,
  name              text not null,
  sku               text not null default '',
  image             text not null default '',
  category          text not null default '',
  ean               text[] not null default '{}',
  sale_price_cents  integer,
  purchase_price_cents integer,
  status            text not null default 'held' check (status in ('held', 'on_demand', 'discontinued')),
  photo_version     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists kfc_articles_sku_idx on public.kfc_articles (upper(sku));

create table if not exists public.kfc_locations (
  id         uuid primary key default gen_random_uuid(),
  warehouse  text not null default 'main',
  shelf      text not null,
  box        text not null,
  kind       text not null default 'shelf' check (kind in ('shelf', 'quarantine')),
  created_at timestamptz not null default now(),
  unique (warehouse, shelf, box)
);
insert into public.kfc_locations (warehouse, shelf, box, kind)
values ('main', 'QUARANTAINE', 'Q1', 'quarantine')
on conflict (warehouse, shelf, box) do nothing;

create table if not exists public.kfc_count_batches (
  id          uuid primary key,
  line_count  integer not null,
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create table if not exists public.kfc_count_photos (
  sha256    text primary key,
  batch_id  uuid not null references public.kfc_count_batches (id) on delete cascade
);

create table if not exists public.kfc_purchase_orders (
  id          uuid primary key default gen_random_uuid(),
  supplier    text not null,
  status      text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  expected_on date,
  note        text,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  ordered_at  timestamptz,
  received_at timestamptz
);
create table if not exists public.kfc_purchase_order_lines (
  id               uuid primary key default gen_random_uuid(),
  po_id            uuid not null references public.kfc_purchase_orders (id) on delete cascade,
  article_code     text not null references public.kfc_articles (code),
  quantity         integer not null check (quantity > 0),
  received         integer not null default 0 check (received >= 0),
  unit_cost_cents  integer
);
create index if not exists kfc_po_lines_po_idx on public.kfc_purchase_order_lines (po_id);
create index if not exists kfc_po_lines_article_idx on public.kfc_purchase_order_lines (article_code);

create table if not exists public.kfc_stock_moves (
  id                      bigserial primary key,
  article_code            text not null references public.kfc_articles (code),
  location_id             uuid references public.kfc_locations (id),
  delta                   integer not null,
  quantity_after          integer,
  unit_cost_cents         integer,
  reason                  text not null check (reason in ('count', 'sale', 'return', 'received', 'transfer', 'correction', 'issue')),
  order_line_id           uuid,
  purchase_order_line_id  uuid references public.kfc_purchase_order_lines (id),
  count_batch_id          uuid references public.kfc_count_batches (id),
  sales_invoice_id        uuid references public.sales_invoices (id) on delete set null,
  note                    text,
  photo_path              text,
  created_by              uuid,
  created_at              timestamptz not null default now(),
  idempotency_key         text not null unique,
  constraint kfc_stock_moves_one_source check (
    num_nonnulls(order_line_id, purchase_order_line_id, count_batch_id, sales_invoice_id) <= 1
  )
);
create index if not exists kfc_stock_moves_article_idx on public.kfc_stock_moves (article_code, created_at desc);
create index if not exists kfc_stock_moves_time_idx on public.kfc_stock_moves (created_at desc);

create table if not exists public.kfc_stock_levels (
  article_code    text not null references public.kfc_articles (code),
  location_id     uuid not null references public.kfc_locations (id),
  quantity        integer not null default 0,   -- may be negative after a sale
  minimum         integer not null default 0,
  last_counted_at timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (article_code, location_id)
);

create table if not exists public.kfc_reservations (
  id             bigserial primary key,
  article_code   text not null references public.kfc_articles (code),
  order_line_id  uuid not null,
  delta          integer not null,  -- +reserve, −release
  created_at     timestamptz not null default now()
);
create index if not exists kfc_reservations_article_idx on public.kfc_reservations (article_code);

-- The five numbers. Physical includes unlocated moves (sales booked before a
-- shelf existed); the cache only covers located stock.
create or replace view public.kfc_stock_position as
with located as (
  select l.article_code,
         sum(l.quantity) filter (where loc.kind = 'shelf')      as on_shelf,
         sum(l.quantity) filter (where loc.kind = 'quarantine') as unusable
  from public.kfc_stock_levels l
  join public.kfc_locations loc on loc.id = l.location_id
  group by l.article_code
), unlocated as (
  select article_code, sum(delta) as delta
  from public.kfc_stock_moves where location_id is null group by article_code
), reserved as (
  select article_code, sum(delta) as reserved from public.kfc_reservations group by article_code
), incoming as (
  select pl.article_code, sum(pl.quantity - pl.received) as incoming
  from public.kfc_purchase_order_lines pl
  join public.kfc_purchase_orders po on po.id = pl.po_id
  where po.status = 'ordered' and pl.quantity > pl.received
  group by pl.article_code
)
select a.code as article_code,
       coalesce(lo.on_shelf, 0) + coalesce(lo.unusable, 0) + coalesce(u.delta, 0) as physical,
       coalesce(lo.unusable, 0)                                                   as unusable,
       coalesce(r.reserved, 0)                                                    as reserved,
       coalesce(lo.on_shelf, 0) + coalesce(u.delta, 0) - coalesce(r.reserved, 0)  as available,
       coalesce(i.incoming, 0)                                                    as incoming
from public.kfc_articles a
left join located   lo on lo.article_code = a.code
left join unlocated u  on u.article_code  = a.code
left join reserved  r  on r.article_code  = a.code
left join incoming  i  on i.article_code  = a.code;

-- ---------------------------------------------------------------------------
-- RPCs. Every write to the ledger goes through one of these. Each locks the
-- (article, location) cache row, computes quantity_after inside the
-- transaction, and inserts the move; the caller never sends a delta it
-- computed from a stale screen.
-- ---------------------------------------------------------------------------

-- Lock (creating if needed) the cache row and return its quantity.
create or replace function public.kfc_lock_level(p_article text, p_location uuid)
returns integer language plpgsql as $$
declare v_qty integer;
begin
  insert into public.kfc_stock_levels (article_code, location_id) values (p_article, p_location)
  on conflict do nothing;
  select quantity into v_qty from public.kfc_stock_levels
   where article_code = p_article and location_id = p_location for update;
  return v_qty;
end $$;

-- One signed move. Location null = unlocated (allowed for sale, return,
-- received, issue when the article has no counted stock at all). Only 'sale'
-- may take a location below zero; issue and transfer are refused, as today.
create or replace function public.kfc_book_move(
  p_article text, p_location uuid, p_delta integer, p_reason text, p_key text,
  p_unit_cost_cents integer default null, p_note text default null, p_photo_path text default null,
  p_created_by uuid default null, p_order_line_id uuid default null,
  p_purchase_order_line_id uuid default null, p_count_batch_id uuid default null,
  p_sales_invoice_id uuid default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_qty integer; v_after integer; v_row public.kfc_stock_moves;
begin
  select * into v_row from public.kfc_stock_moves where idempotency_key = p_key;
  if found then return v_row; end if;
  if p_delta = 0 then raise exception 'KFC_ZERO_MOVE'; end if;
  if p_location is null then
    if p_reason not in ('sale', 'return', 'received', 'issue') then raise exception 'KFC_LOCATION_REQUIRED'; end if;
    if exists (select 1 from public.kfc_stock_levels where article_code = p_article) then raise exception 'KFC_HAS_LOCATED_STOCK'; end if;
    v_after := null;
  else
    v_qty := public.kfc_lock_level(p_article, p_location);
    v_after := v_qty + p_delta;
    if v_after < 0 and p_reason <> 'sale' then raise exception 'KFC_INSUFFICIENT'; end if;
    update public.kfc_stock_levels set quantity = v_after, updated_at = now()
     where article_code = p_article and location_id = p_location;
  end if;
  insert into public.kfc_stock_moves (article_code, location_id, delta, quantity_after, unit_cost_cents, reason,
    order_line_id, purchase_order_line_id, count_batch_id, sales_invoice_id, note, photo_path, created_by, idempotency_key)
  values (p_article, p_location, p_delta, v_after, p_unit_cost_cents, p_reason,
    p_order_line_id, p_purchase_order_line_id, p_count_batch_id, p_sales_invoice_id, p_note, p_photo_path, p_created_by, p_key)
  returning * into v_row;
  return v_row;
exception when unique_violation then
  select * into v_row from public.kfc_stock_moves where idempotency_key = p_key;
  return v_row;
end $$;

-- A count: the phone sends what it counted, the server computes the difference
-- under lock. No difference, no move, but the count date and minimum are kept.
create or replace function public.kfc_count_bin(
  p_article text, p_location uuid, p_counted integer, p_minimum integer, p_key text,
  p_created_by uuid default null, p_count_batch_id uuid default null, p_note text default null, p_photo_path text default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_qty integer; v_row public.kfc_stock_moves;
begin
  if p_counted < 0 then raise exception 'KFC_NEGATIVE_COUNT'; end if;
  select * into v_row from public.kfc_stock_moves where idempotency_key = p_key;
  if found then return v_row; end if;
  v_qty := public.kfc_lock_level(p_article, p_location);
  update public.kfc_stock_levels set minimum = p_minimum, last_counted_at = now(), updated_at = now()
   where article_code = p_article and location_id = p_location;
  if v_qty = p_counted then return null; end if;
  insert into public.kfc_stock_moves (article_code, location_id, delta, quantity_after, reason, count_batch_id, note, photo_path, created_by, idempotency_key)
  values (p_article, p_location, p_counted - v_qty, p_counted, 'count', p_count_batch_id, p_note, p_photo_path, p_created_by, p_key)
  returning * into v_row;
  update public.kfc_stock_levels set quantity = p_counted where article_code = p_article and location_id = p_location;
  return v_row;
end $$;

-- Bulk photo count: every line or none. A repeated batch id returns 0 and
-- changes nothing; a repeated photo hash fails on the primary key.
create or replace function public.kfc_bulk_count(p_batch_id uuid, p_photos text[], p_lines jsonb, p_created_by uuid default null)
returns integer language plpgsql as $$
declare v_line jsonb; v_n integer := 0; v_minimum integer;
begin
  if exists (select 1 from public.kfc_count_batches where id = p_batch_id) then return 0; end if;
  insert into public.kfc_count_batches (id, line_count, created_by) values (p_batch_id, jsonb_array_length(p_lines), p_created_by);
  insert into public.kfc_count_photos (sha256, batch_id) select unnest(p_photos), p_batch_id;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    select minimum into v_minimum from public.kfc_stock_levels
     where article_code = v_line->>'article' and location_id = (v_line->>'location')::uuid;
    perform public.kfc_count_bin(v_line->>'article', (v_line->>'location')::uuid, (v_line->>'quantity')::integer,
      coalesce(v_minimum, 0), p_batch_id::text || '-' || v_n::text, p_created_by, p_batch_id, 'Bulktelling met foto''s');
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;

-- Shelf to shelf, or shelf to quarantine and back: two moves, source first.
create or replace function public.kfc_transfer(
  p_article text, p_from uuid, p_to uuid, p_quantity integer, p_key text, p_created_by uuid default null, p_note text default null
) returns void language plpgsql as $$
begin
  if p_quantity <= 0 or p_from = p_to then raise exception 'KFC_BAD_TRANSFER'; end if;
  perform public.kfc_book_move(p_article, p_from, -p_quantity, 'transfer', p_key || ':out', null, p_note, null, p_created_by);
  perform public.kfc_book_move(p_article, p_to,    p_quantity, 'transfer', p_key || ':in',  null, p_note, null, p_created_by);
end $$;

-- Goods received against a purchase order line, by scan. The only writer of
-- 'received' moves; a confirmed purchase invoice sets prices, never stock.
create or replace function public.kfc_receive_po_line(
  p_line uuid, p_quantity integer, p_location uuid, p_key text, p_created_by uuid default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_line public.kfc_purchase_order_lines; v_row public.kfc_stock_moves; v_open integer;
begin
  if p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  select * into v_line from public.kfc_purchase_order_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_PO_LINE'; end if;
  if exists (select 1 from public.kfc_stock_moves where idempotency_key = p_key) then
    select * into v_row from public.kfc_stock_moves where idempotency_key = p_key; return v_row;
  end if;
  v_row := public.kfc_book_move(v_line.article_code, p_location, p_quantity, 'received', p_key,
    v_line.unit_cost_cents, null, null, p_created_by, null, p_line);
  update public.kfc_purchase_order_lines set received = received + p_quantity where id = p_line;
  if v_line.unit_cost_cents is not null then
    update public.kfc_articles set purchase_price_cents = v_line.unit_cost_cents, updated_at = now() where code = v_line.article_code;
  end if;
  select count(*) into v_open from public.kfc_purchase_order_lines where po_id = v_line.po_id and received < quantity;
  if v_open = 0 then
    update public.kfc_purchase_orders set status = 'received', received_at = now() where id = v_line.po_id and status = 'ordered';
  end if;
  return v_row;
end $$;

-- Security: server-only, like kfc_stock_state.
do $$
declare t text;
begin
  foreach t in array array['kfc_articles', 'kfc_locations', 'kfc_count_batches', 'kfc_count_photos',
    'kfc_purchase_orders', 'kfc_purchase_order_lines', 'kfc_stock_moves', 'kfc_stock_levels', 'kfc_reservations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on public.kfc_stock_position from anon, authenticated;
revoke all on function public.kfc_lock_level(text, uuid) from public, anon, authenticated;
revoke all on function public.kfc_book_move(text, uuid, integer, text, text, integer, text, text, uuid, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.kfc_count_bin(text, uuid, integer, integer, text, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.kfc_bulk_count(uuid, text[], jsonb, uuid) from public, anon, authenticated;
revoke all on function public.kfc_transfer(text, uuid, uuid, integer, text, uuid, text) from public, anon, authenticated;
revoke all on function public.kfc_receive_po_line(uuid, integer, uuid, text, uuid) from public, anon, authenticated;
