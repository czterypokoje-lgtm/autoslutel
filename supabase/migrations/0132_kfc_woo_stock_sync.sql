-- ============================================================================
-- 0132: KeyForCars ↔ WooCommerce stock push, and returns back into stock.
--
-- Stock push (CRM → shops). The CRM ledger is the master; the shops only show
-- what the warehouse can still sell (kfc_webshop_position.available: on the
-- shelves, minus order and job reservations, minus van stock).
--
--   kfc_woo_products        every product/variation a shop lists, with the
--                           article it maps to by SKU. status:
--                             ok         one article, shop manages stock → pushed
--                             unmapped   no article with this SKU
--                             ambiguous  SKU matches several articles, or the same
--                                        SKU is listed twice in one shop
--                             no_stock   the shop does not manage stock for it
--                           pushed_quantity/pushed_at/push_error: per-shop result.
--   kfc_woo_stock_outbox    one row per article whose sellable quantity may have
--                           changed. Filled by triggers (below) on every stock
--                           move, reservation and job reservation, so the POS,
--                           receipts, counts, returns and shipping all queue
--                           without touching their code. Only articles that a
--                           shop actually lists are queued, so an install with
--                           no shops (Autosleutel24) never fills it.
--   kfc_woo_sync_runs       one row per worker run per shop, for the status screen.
--
--   kfc_woo_enqueue(codes)  queue articles (manual "push now", "queue all").
--   kfc_woo_claim(n)        hand the worker up to n due articles; claimed rows
--                           are skipped by a parallel worker for 5 minutes.
--   kfc_woo_settle(...)     after a push: delete the row if nothing re-queued it
--                           meanwhile, else release it; on error back off
--                           1, 2, 4 … minutes, capped at 6 hours.
--   kfc_woo_release(codes)  give claimed rows back without counting an attempt.
--
-- Returns (shop → CRM).
--
--   kfc_shop_returns        one row per "Retour ontvangen": line, quantity,
--                           condition (new · opened · defect), where it went, the
--                           move(s) it booked, and the refund it answers (if any).
--   kfc_receive_return(...) books the return once per idempotency key: new and
--                           opened go to the chosen location (a shelf, or the
--                           quarantine location when it may not be sold), defect
--                           is booked into quarantine and written off in the same
--                           transaction ('correction'), so the line counts as
--                           returned and the value leaves stock traceably.
--                           Same shipped-minus-returned guard as 0113.
--
-- Server-only like 0090/0091: RLS on, no policies, nothing granted to anon or
-- authenticated; the Next.js server uses the service role. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Shop products and their article.
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_woo_products (
  shop             text not null,
  woo_product_id   bigint not null,
  woo_variation_id bigint not null default 0,   -- 0 = simple product
  sku              text not null default '',
  name             text not null default '',
  woo_type         text not null default 'simple',
  manage_stock     boolean not null default false,
  shop_quantity    integer,                     -- what the shop said at the last refresh
  article_code     text references public.kfc_articles (code) on delete set null,
  manual           boolean not null default false, -- article set by hand; a refresh keeps it
  status           text not null default 'unmapped' check (status in ('ok', 'unmapped', 'ambiguous', 'no_stock')),
  candidates       text[] not null default '{}', -- article codes when ambiguous
  pushed_quantity  integer,
  pushed_at        timestamptz,
  push_error       text,
  seen_at          timestamptz not null default now(),
  primary key (shop, woo_product_id, woo_variation_id)
);
create index if not exists kfc_woo_products_article_idx on public.kfc_woo_products (article_code) where article_code is not null;
create index if not exists kfc_woo_products_status_idx on public.kfc_woo_products (shop, status);

create table if not exists public.kfc_woo_stock_outbox (
  article_code    text primary key references public.kfc_articles (code) on delete cascade,
  queued_at       timestamptz not null default clock_timestamp(),
  next_attempt_at timestamptz not null default now(),
  claimed_until   timestamptz,
  attempts        integer not null default 0,
  last_error      text
);
create index if not exists kfc_woo_stock_outbox_due_idx on public.kfc_woo_stock_outbox (next_attempt_at);

create table if not exists public.kfc_woo_sync_runs (
  id          bigserial primary key,
  shop        text not null,
  kind        text not null check (kind in ('push', 'dry_run', 'mapping')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  articles    integer not null default 0,
  updated     integer not null default 0,
  failed      integer not null default 0,
  error       text,
  detail      jsonb
);
create index if not exists kfc_woo_sync_runs_shop_idx on public.kfc_woo_sync_runs (shop, started_at desc);

-- ---------------------------------------------------------------------------
-- Outbox functions.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_woo_enqueue(p_articles text[])
returns integer language plpgsql as $$
declare v_n integer;
begin
  insert into public.kfc_woo_stock_outbox (article_code)
  select distinct a.code from public.kfc_articles a
   where a.code = any (p_articles)
     and exists (select 1 from public.kfc_woo_products p where p.article_code = a.code)
  on conflict (article_code) do update
     set queued_at = clock_timestamp(), next_attempt_at = now(), attempts = 0, last_error = null;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- Row trigger shared by the ledger tables. Cheap: one indexed exists() and one upsert.
create or replace function public.kfc_woo_queue_article() returns trigger language plpgsql as $$
declare v_article text;
begin
  if tg_op = 'DELETE' then v_article := old.article_code; else v_article := new.article_code; end if;
  if v_article is not null and exists (select 1 from public.kfc_woo_products where article_code = v_article) then
    insert into public.kfc_woo_stock_outbox (article_code) values (v_article)
    on conflict (article_code) do update
       set queued_at = clock_timestamp(), next_attempt_at = now(), attempts = 0, last_error = null;
  end if;
  if tg_op = 'UPDATE' then
    if old.article_code is distinct from new.article_code and old.article_code is not null
       and exists (select 1 from public.kfc_woo_products where article_code = old.article_code) then
      insert into public.kfc_woo_stock_outbox (article_code) values (old.article_code)
      on conflict (article_code) do update
         set queued_at = clock_timestamp(), next_attempt_at = now(), attempts = 0, last_error = null;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists kfc_woo_queue_moves on public.kfc_stock_moves;
create trigger kfc_woo_queue_moves after insert on public.kfc_stock_moves
  for each row execute function public.kfc_woo_queue_article();

drop trigger if exists kfc_woo_queue_reservations on public.kfc_reservations;
create trigger kfc_woo_queue_reservations after insert on public.kfc_reservations
  for each row execute function public.kfc_woo_queue_article();

-- Job reservations (0115) compete for the same stock; only when that table exists.
do $$
begin
  if to_regclass('public.kfc_job_stock') is not null then
    execute 'drop trigger if exists kfc_woo_queue_job_stock on public.kfc_job_stock';
    execute 'create trigger kfc_woo_queue_job_stock after insert or update or delete on public.kfc_job_stock
               for each row execute function public.kfc_woo_queue_article()';
  end if;
end $$;

-- Up to p_limit due, unclaimed articles; claims them for 5 minutes.
create or replace function public.kfc_woo_claim(p_limit integer default 200)
returns table (article_code text, queued_at timestamptz, attempts integer) language plpgsql as $$
#variable_conflict use_column
begin
  return query
  with due as (
    select o.article_code as code from public.kfc_woo_stock_outbox o
     where o.next_attempt_at <= now() and (o.claimed_until is null or o.claimed_until < now())
     order by o.next_attempt_at, o.queued_at
     limit greatest(1, least(coalesce(p_limit, 200), 1000))
     for update skip locked
  )
  update public.kfc_woo_stock_outbox o set claimed_until = now() + interval '5 minutes'
    from due where o.article_code = due.code
  returning o.article_code, o.queued_at, o.attempts;
end $$;

-- After a push attempt. p_error null = success.
create or replace function public.kfc_woo_settle(p_article text, p_queued_at timestamptz, p_error text default null)
returns void language plpgsql as $$
begin
  if p_error is null then
    delete from public.kfc_woo_stock_outbox where article_code = p_article and queued_at = p_queued_at;
    update public.kfc_woo_stock_outbox set claimed_until = null where article_code = p_article;
  else
    update public.kfc_woo_stock_outbox
       set claimed_until = null,
           attempts = attempts + 1,
           last_error = left(p_error, 500),
           next_attempt_at = now() + least(interval '6 hours', interval '1 minute' * power(2, least(attempts, 9)))
     where article_code = p_article;
  end if;
end $$;

create or replace function public.kfc_woo_release(p_articles text[])
returns void language sql as $$
  update public.kfc_woo_stock_outbox set claimed_until = null where article_code = any (p_articles);
$$;

-- ---------------------------------------------------------------------------
-- Returns.
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_shop_returns (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.kfc_shop_orders (id) on delete cascade,
  order_line_id    uuid not null references public.kfc_shop_order_lines (id) on delete cascade,
  refund_id        uuid references public.kfc_shop_order_refunds (id) on delete set null,
  article_code     text not null references public.kfc_articles (code),
  quantity         integer not null check (quantity > 0),
  condition        text not null check (condition in ('new', 'opened', 'defect')),
  location_id      uuid references public.kfc_locations (id),
  return_move_id   bigint references public.kfc_stock_moves (id),
  writeoff_move_id bigint references public.kfc_stock_moves (id),
  scan             text,
  note             text,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  idempotency_key  text not null unique
);
create index if not exists kfc_shop_returns_order_idx on public.kfc_shop_returns (order_id);
create index if not exists kfc_shop_returns_line_idx on public.kfc_shop_returns (order_line_id);

create or replace function public.kfc_receive_return(
  p_line uuid, p_quantity integer, p_condition text, p_location uuid, p_key text,
  p_created_by uuid default null, p_refund uuid default null, p_scan text default null, p_note text default null
) returns public.kfc_shop_returns language plpgsql as $$
declare
  v_row public.kfc_shop_returns; v_line public.kfc_shop_order_lines; v_shipped integer; v_returned integer;
  v_cost integer; v_target uuid; v_move public.kfc_stock_moves; v_off public.kfc_stock_moves; v_note text;
begin
  select * into v_row from public.kfc_shop_returns where idempotency_key = p_key;
  if found then return v_row; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  if p_condition is null or p_condition not in ('new', 'opened', 'defect') then raise exception 'KFC_BAD_CONDITION'; end if;

  select * into v_line from public.kfc_shop_order_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_ORDER_LINE'; end if;
  if v_line.article_code is null then raise exception 'KFC_LINE_UNMAPPED'; end if;
  if p_refund is not null and not exists (
    select 1 from public.kfc_shop_order_refunds where id = p_refund and order_id = v_line.order_id
  ) then raise exception 'KFC_BAD_REFUND'; end if;

  select coalesce(-sum(delta), 0), max(unit_cost_cents) into v_shipped, v_cost
    from public.kfc_stock_moves where order_line_id = p_line and reason = 'sale';
  select coalesce(sum(delta), 0) into v_returned
    from public.kfc_stock_moves where order_line_id = p_line and reason = 'return';
  if v_shipped = 0 then raise exception 'KFC_NOT_SHIPPED'; end if;
  if v_returned + p_quantity > v_shipped then raise exception 'KFC_RETURN_EXCEEDS'; end if;

  if p_condition = 'defect' then
    select id into v_target from public.kfc_locations
     where kind = 'quarantine' and technician_id is null order by (warehouse = 'main') desc, created_at limit 1;
    if v_target is null then raise exception 'KFC_LOCATION_REQUIRED'; end if;
  else
    if p_location is null or not exists (
      select 1 from public.kfc_locations where id = p_location and technician_id is null
    ) then raise exception 'KFC_LOCATION_REQUIRED'; end if;
    v_target := p_location;
  end if;

  v_note := left(concat_ws(' · ',
    'Retour (' || case p_condition when 'new' then 'nieuw' when 'opened' then 'geopend' else 'defect' end || ')',
    nullif(trim(p_note), '')), 500);
  v_move := public.kfc_book_move(v_line.article_code, v_target, p_quantity, 'return', p_key || ':return',
    v_cost, v_note, null, p_created_by, p_line);
  if p_condition = 'defect' then
    v_off := public.kfc_book_move(v_line.article_code, v_target, -p_quantity, 'correction', p_key || ':writeoff',
      v_cost, 'Afgeschreven: defecte retour', null, p_created_by);
  end if;

  insert into public.kfc_shop_returns (order_id, order_line_id, refund_id, article_code, quantity, condition,
    location_id, return_move_id, writeoff_move_id, scan, note, created_by, idempotency_key)
  values (v_line.order_id, p_line, p_refund, v_line.article_code, p_quantity, p_condition,
    v_target, v_move.id, v_off.id, left(p_scan, 80), left(nullif(trim(p_note), ''), 500), p_created_by, p_key)
  returning * into v_row;
  return v_row;
exception when unique_violation then
  -- A parallel request with the same key won the race; everything above rolled back.
  select * into v_row from public.kfc_shop_returns where idempotency_key = p_key;
  if found then return v_row; end if;
  raise;
end $$;

-- ---------------------------------------------------------------------------
-- Security: server-only.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['kfc_woo_products', 'kfc_woo_stock_outbox', 'kfc_woo_sync_runs', 'kfc_shop_returns'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
revoke all on sequence public.kfc_woo_sync_runs_id_seq from public, anon, authenticated;
grant usage, select on sequence public.kfc_woo_sync_runs_id_seq to service_role;

revoke all on function public.kfc_woo_enqueue(text[]) from public, anon, authenticated;
revoke all on function public.kfc_woo_queue_article() from public, anon, authenticated;
revoke all on function public.kfc_woo_claim(integer) from public, anon, authenticated;
revoke all on function public.kfc_woo_settle(text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.kfc_woo_release(text[]) from public, anon, authenticated;
revoke all on function public.kfc_receive_return(uuid, integer, text, uuid, text, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.kfc_woo_enqueue(text[]) to service_role;
grant execute on function public.kfc_woo_claim(integer) to service_role;
grant execute on function public.kfc_woo_settle(text, timestamptz, text) to service_role;
grant execute on function public.kfc_woo_release(text[]) to service_role;
grant execute on function public.kfc_receive_return(uuid, integer, text, uuid, text, uuid, uuid, text, text) to service_role;
