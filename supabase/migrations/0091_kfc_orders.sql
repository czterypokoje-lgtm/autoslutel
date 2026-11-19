-- ============================================================================
-- 0091: KeyForCars shop orders (phase 2 of the stock/orders/accounts design).
--
--   kfc_shop_orders        one row per WooCommerce order, unique on (shop, woo id).
--                          `status` is the shop's word and is never edited here;
--                          `fulfilment` is the CRM's word and is never imported.
--   kfc_shop_order_lines   lines with the article they map to, reserved and picked
--                          quantities, and a state: open · short · reserved ·
--                          picked · shipped · cancelled
--   kfc_shop_order_refunds refunds as the shop reports them
--   kfc_import_runs        every backfill, webhook batch and reconcile, for the
--                          settings screen
--
--   kfc_allocate(article)  the allocator: releases reservations of orders that are
--                          no longer paid-and-open, then fills eligible lines oldest
--                          order first from Available. Runs in the transaction of
--                          every stock move, every line change and every order
--                          status change, so Reserved can never drift.
--   kfc_ship_order(order)  releases the order's reservations, writes one 'sale'
--                          move per line, marks the order shipped. All or nothing.
--
-- Server-only like 0090. Idempotent.
-- ============================================================================

create table if not exists public.kfc_shop_orders (
  id                   uuid primary key default gen_random_uuid(),
  shop                 text not null,
  woo_order_id         bigint not null,
  number               text not null,
  status               text not null,
  created_at           timestamptz not null,
  modified_at          timestamptz not null,
  paid_at              timestamptz,
  currency             text not null default 'EUR',
  country              text,
  customer_email_hash  text,
  total_incl_cents     integer not null default 0,
  total_excl_cents     integer not null default 0,
  shipping_incl_cents  integer not null default 0,
  tax_cents            integer not null default 0,
  fulfilment           text not null default 'open' check (fulfilment in ('open', 'picked', 'shipped', 'cancelled', 'external')),
  shipped_at           timestamptz,
  shipped_by           uuid,
  shop_completed_at    timestamptz,
  raw                  jsonb,
  imported_at          timestamptz not null default now(),
  unique (shop, woo_order_id)
);
create index if not exists kfc_shop_orders_created_idx on public.kfc_shop_orders (created_at desc);
create index if not exists kfc_shop_orders_open_idx on public.kfc_shop_orders (status, fulfilment);

create table if not exists public.kfc_shop_order_lines (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.kfc_shop_orders (id) on delete cascade,
  woo_line_id       bigint not null,
  sku               text not null default '',
  article_code      text references public.kfc_articles (code),
  name              text not null,
  quantity          integer not null check (quantity >= 0),
  unit_incl_cents   integer,
  total_excl_cents  integer,
  reserved          integer not null default 0,
  picked            integer not null default 0,
  state             text not null default 'open' check (state in ('open', 'short', 'reserved', 'picked', 'shipped', 'cancelled')),
  unique (order_id, woo_line_id)
);
create index if not exists kfc_shop_order_lines_article_idx on public.kfc_shop_order_lines (article_code, state);

create table if not exists public.kfc_shop_order_refunds (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.kfc_shop_orders (id) on delete cascade,
  woo_refund_id  bigint not null,
  amount_cents   integer not null,
  created_at     timestamptz,
  raw            jsonb,
  unique (order_id, woo_refund_id)
);

create table if not exists public.kfc_import_runs (
  id          bigserial primary key,
  shop        text not null,
  kind        text not null check (kind in ('backfill', 'webhook', 'reconcile', 'writeback')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  orders      integer not null default 0,
  error       text
);

-- ---------------------------------------------------------------------------
-- The allocator.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_allocate(p_article text)
returns void language plpgsql as $$
declare v_avail integer; v_line record; v_take integer;
begin
  if p_article is null then return; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || p_article));
  select available into v_avail from public.kfc_stock_position where article_code = p_article;
  v_avail := coalesce(v_avail, 0);

  -- Release what orders no longer paid-and-open still hold.
  for v_line in
    select l.id, l.reserved, l.state
      from public.kfc_shop_order_lines l join public.kfc_shop_orders o on o.id = l.order_id
     where l.article_code = p_article and l.reserved > 0
       and not (o.status = 'processing' and o.fulfilment in ('open', 'picked'))
  loop
    insert into public.kfc_reservations (article_code, order_line_id, delta) values (p_article, v_line.id, -v_line.reserved);
    update public.kfc_shop_order_lines
       set reserved = 0, state = case when state = 'shipped' then 'shipped' else 'cancelled' end
     where id = v_line.id;
    v_avail := v_avail + v_line.reserved;
  end loop;

  -- Fill eligible lines, oldest order first.
  for v_line in
    select l.id, l.quantity, l.reserved
      from public.kfc_shop_order_lines l join public.kfc_shop_orders o on o.id = l.order_id
     where l.article_code = p_article and o.status = 'processing' and o.fulfilment in ('open', 'picked')
       and l.state in ('open', 'short', 'reserved') and l.reserved < l.quantity
     order by o.created_at, l.woo_line_id
  loop
    exit when v_avail <= 0;
    v_take := least(v_line.quantity - v_line.reserved, v_avail);
    insert into public.kfc_reservations (article_code, order_line_id, delta) values (p_article, v_line.id, v_take);
    update public.kfc_shop_order_lines
       set reserved = reserved + v_take,
           state = case when reserved + v_take >= quantity then 'reserved' else 'short' end
     where id = v_line.id;
    v_avail := v_avail - v_take;
  end loop;

  -- Whatever is still unfilled is short.
  update public.kfc_shop_order_lines l set state = 'short'
    from public.kfc_shop_orders o
   where o.id = l.order_id and l.article_code = p_article
     and o.status = 'processing' and o.fulfilment in ('open', 'picked')
     and l.state in ('open', 'reserved') and l.reserved < l.quantity;
end $$;

-- Every stock move re-allocates its article (short lines fill the moment stock arrives).
create or replace function public.kfc_moves_allocate() returns trigger language plpgsql as $$
begin perform public.kfc_allocate(new.article_code); return new; end $$;
drop trigger if exists kfc_moves_allocate on public.kfc_stock_moves;
create trigger kfc_moves_allocate after insert on public.kfc_stock_moves
  for each row execute function public.kfc_moves_allocate();

-- A new or changed line re-allocates. Only on quantity/article, which the
-- allocator itself never writes, so it cannot recurse.
create or replace function public.kfc_lines_allocate() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and old.article_code is distinct from new.article_code then perform public.kfc_allocate(old.article_code); end if;
  perform public.kfc_allocate(new.article_code);
  return new;
end $$;
drop trigger if exists kfc_lines_allocate on public.kfc_shop_order_lines;
create trigger kfc_lines_allocate after insert or update of quantity, article_code on public.kfc_shop_order_lines
  for each row execute function public.kfc_lines_allocate();

-- An order whose shop status or fulfilment changes re-allocates all its articles.
create or replace function public.kfc_orders_allocate() returns trigger language plpgsql as $$
declare v_article text;
begin
  for v_article in select distinct article_code from public.kfc_shop_order_lines where order_id = new.id and article_code is not null loop
    perform public.kfc_allocate(v_article);
  end loop;
  return new;
end $$;
drop trigger if exists kfc_orders_allocate on public.kfc_shop_orders;
create trigger kfc_orders_allocate after update of status, fulfilment on public.kfc_shop_orders
  for each row execute function public.kfc_orders_allocate();

-- ---------------------------------------------------------------------------
-- Shipping: release rows, sale moves, states. One transaction.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_ship_order(p_order uuid, p_key text, p_created_by uuid default null)
returns void language plpgsql as $$
declare v_order public.kfc_shop_orders; v_line record; v_loc uuid; v_cost integer;
begin
  select * into v_order from public.kfc_shop_orders where id = p_order for update;
  if not found then raise exception 'KFC_NO_ORDER'; end if;
  if v_order.fulfilment = 'shipped' then return; end if;
  if v_order.status <> 'processing' then raise exception 'KFC_NOT_PAID'; end if;
  for v_line in select * from public.kfc_shop_order_lines where order_id = p_order and state <> 'cancelled' and quantity > 0 loop
    if v_line.article_code is null then
      update public.kfc_shop_order_lines set state = 'shipped' where id = v_line.id;
      continue;
    end if;
    if v_line.reserved > 0 then
      insert into public.kfc_reservations (article_code, order_line_id, delta) values (v_line.article_code, v_line.id, -v_line.reserved);
    end if;
    select l.location_id into v_loc
      from public.kfc_stock_levels l join public.kfc_locations loc on loc.id = l.location_id
     where l.article_code = v_line.article_code
     order by (loc.kind = 'shelf') desc, l.quantity desc limit 1;
    select purchase_price_cents into v_cost from public.kfc_articles where code = v_line.article_code;
    perform public.kfc_book_move(v_line.article_code, v_loc, -v_line.quantity, 'sale', p_key || ':' || v_line.id::text,
      v_cost, null, null, p_created_by, v_line.id);
    update public.kfc_shop_order_lines set reserved = 0, picked = quantity, state = 'shipped' where id = v_line.id;
  end loop;
  update public.kfc_shop_orders set fulfilment = 'shipped', shipped_at = now(), shipped_by = p_created_by where id = p_order;
end $$;

do $$
declare t text;
begin
  foreach t in array array['kfc_shop_orders', 'kfc_shop_order_lines', 'kfc_shop_order_refunds', 'kfc_import_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on function public.kfc_allocate(text) from public, anon, authenticated;
revoke all on function public.kfc_ship_order(uuid, text, uuid) from public, anon, authenticated;
