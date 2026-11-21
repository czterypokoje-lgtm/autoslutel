-- Technician vans hold stock in the same ledger as the central warehouse.
alter table public.kfc_locations
  add column if not exists technician_id uuid references public.technicians(id);
create unique index if not exists kfc_locations_one_van_per_technician
  on public.kfc_locations(technician_id) where technician_id is not null;

create or replace view public.kfc_webshop_position as
select p.article_code, p.available - coalesce(v.quantity, 0) as available, p.incoming
from public.kfc_stock_position p
left join (
  select l.article_code, sum(l.quantity) as quantity from public.kfc_stock_levels l
  join public.kfc_locations loc on loc.id = l.location_id and loc.technician_id is not null
  where loc.kind = 'shelf' group by l.article_code
) v on v.article_code = p.article_code;
revoke all on public.kfc_webshop_position from public, anon, authenticated;
grant select on public.kfc_webshop_position to service_role;

create or replace function public.kfc_allocate(p_article text)
returns void language plpgsql as $$
declare v_avail integer; v_line record; v_take integer;
begin
  if p_article is null then return; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || p_article));
  select available into v_avail from public.kfc_webshop_position where article_code = p_article;
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
     where l.article_code = v_line.article_code and loc.technician_id is null
     order by (loc.kind = 'shelf') desc, l.quantity desc limit 1;
    if v_loc is not null then perform public.kfc_lock_level(v_line.article_code, v_loc); end if;
    if exists (select 1 from public.kfc_stock_levels l join public.kfc_locations loc on loc.id = l.location_id
      where l.article_code = v_line.article_code and loc.technician_id is not null) then
      if v_loc is null or not exists (select 1 from public.kfc_stock_levels level join public.kfc_locations loc on loc.id = level.location_id
        where level.article_code = v_line.article_code and level.location_id = v_loc and loc.kind = 'shelf' and level.quantity >= v_line.quantity)
      then raise exception 'KFC_CENTRAL_STOCK_REQUIRED'; end if;
    end if;
    select purchase_price_cents into v_cost from public.kfc_articles where code = v_line.article_code;
    perform public.kfc_book_move(v_line.article_code, v_loc, -v_line.quantity, 'sale', p_key || ':' || v_line.id::text,
      v_cost, null, null, p_created_by, v_line.id);
    update public.kfc_shop_order_lines set reserved = 0, picked = quantity, state = 'shipped' where id = v_line.id;
  end loop;
  update public.kfc_shop_orders set fulfilment = 'shipped', shipped_at = now(), shipped_by = p_created_by where id = p_order;
end $$;

create or replace function public.kfc_reserve_job_stock(p_id uuid, p_job uuid, p_article text, p_quantity integer)
returns public.kfc_job_stock language plpgsql as $$
declare v_job public.jobs; v_row public.kfc_job_stock; v_available bigint;
begin
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'KFC_NO_JOB'; end if;
  select * into v_row from public.kfc_job_stock where id = p_id;
  if found then
    if v_row.job_id <> p_job or v_row.article_code <> p_article or v_row.quantity <> p_quantity then
      raise exception 'KFC_RESERVATION_MISMATCH';
    end if;
    return v_row;
  end if;
  if v_job.status in ('geannuleerd', 'afgerond') then raise exception 'KFC_JOB_CLOSED'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  perform public.kfc_allocate(p_article);
  select least(position.available, coalesce((
    select sum(level.quantity) from public.kfc_stock_levels level join public.kfc_locations location on location.id = level.location_id
    where level.article_code = p_article and location.kind = 'shelf' and location.technician_id is null
  ), 0) - position.reserved) into v_available
  from public.kfc_stock_position position where position.article_code = p_article;
  if not found then raise exception 'KFC_UNKNOWN_ARTICLE'; end if;
  if v_available < p_quantity then raise exception 'KFC_INSUFFICIENT'; end if;
  insert into public.kfc_job_stock (id, job_id, article_code, quantity)
  values (p_id, p_job, p_article, p_quantity) returning * into v_row;
  return v_row;
end $$;

create or replace function public.kfc_finish_job_stock(p_id uuid, p_job uuid, p_location uuid, p_user uuid)
returns public.kfc_job_stock language plpgsql as $$
declare v_job public.jobs; v_row public.kfc_job_stock; v_cost integer;
begin
  select * into v_job from public.jobs where id = p_job for update;
  if not found then raise exception 'KFC_NO_JOB'; end if;
  select * into v_row from public.kfc_job_stock where id = p_id and job_id = p_job for update;
  if not found then raise exception 'KFC_NO_RESERVATION'; end if;
  if v_row.state = (case when p_location is null then 'released' else 'used' end) then return v_row; end if;
  if v_row.state <> 'reserved' then raise exception 'KFC_RESERVATION_CLOSED'; end if;
  if p_location is not null then
    if not exists (select 1 from public.kfc_locations where id = p_location and kind = 'shelf' and technician_id is null) then
      raise exception 'KFC_LOCATION_REQUIRED';
    end if;
    -- Stock writers lock the level before their move trigger takes the article lock.
    perform public.kfc_lock_level(v_row.article_code, p_location);
  end if;
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || v_row.article_code));
  update public.kfc_job_stock set state = case when p_location is null then 'released' else 'used' end
    where id = p_id returning * into v_row;
  if p_location is null then
    perform public.kfc_allocate(v_row.article_code);
  else
    select purchase_price_cents into v_cost from public.kfc_articles where code = v_row.article_code;
    perform public.kfc_book_move(v_row.article_code, p_location, -v_row.quantity, 'issue',
      'job-stock:' || p_id::text, v_cost, 'Klus ' || p_job::text, null, p_user);
  end if;
  return v_row;
end $$;

create or replace function public.kfc_protect_job_stock()
returns trigger language plpgsql as $$
declare v_available bigint;
begin
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || new.article_code));
  if exists (select 1 from public.kfc_job_stock where article_code = new.article_code and state = 'reserved') then
    select available into v_available from public.kfc_webshop_position where article_code = new.article_code;
    if v_available + (case when new.location_id is null then new.delta else 0 end) < 0 then
      raise exception 'KFC_STOCK_RESERVED_FOR_JOB';
    end if;
  end if;
  return new;
end $$;

-- A single snapshot for report totals and the requested page of movements.
create or replace function public.kfc_stock_movement_report(
  p_from date, p_to date, p_query text default '', p_warehouse text default '', p_page integer default 1
) returns jsonb language sql stable set search_path = '' as $$
with bounds as (
  select p_from::timestamp at time zone 'Europe/Amsterdam' as starts,
    (p_to + 1)::timestamp at time zone 'Europe/Amsterdam' as ends
), scoped as (
  select m.id, m.created_at, m.delta, m.reason, m.quantity_after,
    a.code, a.name, a.sku, loc.warehouse, loc.shelf, loc.box,
    shop_line.order_id, m.sales_invoice_id, job_stock.job_id, tech.name as van_name
  from public.kfc_stock_moves m
  join public.kfc_articles a on a.code = m.article_code
  left join public.kfc_locations loc on loc.id = m.location_id
  left join public.technicians tech on tech.id = loc.technician_id
  left join public.kfc_shop_order_lines shop_line on shop_line.id = m.order_line_id
  left join public.kfc_job_stock job_stock on m.idempotency_key = 'job-stock:' || job_stock.id::text
  cross join bounds
  where m.created_at < bounds.ends
    and (p_warehouse = '' or loc.warehouse = p_warehouse)
    and (p_query = '' or strpos(lower(a.code), lower(p_query)) > 0
      or strpos(lower(a.name), lower(p_query)) > 0 or strpos(lower(a.sku), lower(p_query)) > 0)
), period as (
  select scoped.* from scoped cross join bounds where created_at >= bounds.starts
), totals as (
  select coalesce(sum(delta) filter (where created_at < bounds.starts), 0) as opening,
    coalesce(sum(delta), 0) as closing
  from scoped cross join bounds
), changes as (
  select reason, coalesce(sum(delta) filter (where delta > 0), 0) as incoming,
    coalesce(-sum(delta) filter (where delta < 0), 0) as outgoing
  from period group by reason
)
select jsonb_build_object(
  'opening', totals.opening, 'closing', totals.closing,
  'count', (select count(*) from period),
  'changes', coalesce((select jsonb_agg(to_jsonb(changes) order by reason) from changes), '[]'::jsonb),
  'rows', coalesce((select jsonb_agg(to_jsonb(visible) order by created_at desc, id desc)
    from (select * from period order by created_at desc, id desc limit 25 offset ((greatest(p_page, 1)::bigint - 1) * 25)) visible), '[]'::jsonb)
)
from totals;
$$;

revoke all on function public.kfc_stock_movement_report(date, date, text, text, integer) from public, anon, authenticated;
grant execute on function public.kfc_stock_movement_report(date, date, text, text, integer) to service_role;

-- The source and destination are locked before the allocator, as other ledger writers expect.
create or replace function public.kfc_transfer_van_stock(
  p_id uuid, p_article text, p_central uuid, p_technician uuid, p_quantity integer, p_to_van boolean, p_user uuid
) returns void language plpgsql set search_path = '' as $$
declare v_van uuid; v_from uuid; v_to uuid; v_existing public.kfc_stock_moves;
begin
  if p_id is null or p_quantity <= 0 or p_quantity is null or p_to_van is null then raise exception 'KFC_BAD_TRANSFER'; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_van_transfer:' || p_id::text));
  if not exists (select 1 from public.kfc_locations where id = p_central and warehouse = 'main' and kind = 'shelf' and technician_id is null)
  then raise exception 'KFC_LOCATION_REQUIRED'; end if;
  if not exists (select 1 from public.technicians where id = p_technician and (active or not p_to_van))
  then raise exception 'KFC_BAD_VAN'; end if;
  insert into public.kfc_locations(warehouse, shelf, box, technician_id)
    values ('van', upper(p_technician::text), 'STOCK', p_technician)
    on conflict (technician_id) where technician_id is not null do nothing;
  select id into v_van from public.kfc_locations where technician_id = p_technician;
  v_from := case when p_to_van then p_central else v_van end;
  v_to := case when p_to_van then v_van else p_central end;
  perform public.kfc_lock_level(p_article, least(v_from,v_to));
  perform public.kfc_lock_level(p_article, greatest(v_from,v_to));
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || p_article));
  select * into v_existing from public.kfc_stock_moves where idempotency_key = 'van-transfer:' || p_id::text || ':out';
  if found then
    if v_existing.article_code <> p_article or v_existing.location_id <> v_from or v_existing.delta <> -p_quantity
      or not exists(select 1 from public.kfc_stock_moves where idempotency_key = 'van-transfer:' || p_id::text || ':in' and location_id = v_to)
    then raise exception 'KFC_RESERVATION_MISMATCH'; end if;
    return;
  end if;
  if p_to_van and (select available from public.kfc_webshop_position where article_code = p_article) < p_quantity
  then raise exception 'KFC_INSUFFICIENT'; end if;
  perform public.kfc_transfer(p_article,v_from,v_to,p_quantity,'van-transfer:' || p_id::text,p_user);
end $$;

create or replace function public.kfc_use_van_stock(
  p_id uuid, p_job uuid, p_article text, p_location uuid, p_quantity integer, p_user uuid
) returns void language plpgsql set search_path = '' as $$
declare v_job public.jobs; v_existing public.kfc_job_stock; v_cost integer;
begin
  select * into v_job from public.jobs where id = p_job for update;
  if not found or not exists (
    select 1 from public.technicians tech join public.kfc_locations loc on loc.technician_id = tech.id
    where tech.id = v_job.technician_id and tech.user_id = p_user and loc.id = p_location
  ) then raise exception 'KFC_BAD_VAN'; end if;
  select * into v_existing from public.kfc_job_stock where id = p_id;
  if found then
    if v_existing.job_id <> p_job or v_existing.article_code <> p_article or v_existing.quantity <> p_quantity
      or not exists (select 1 from public.kfc_stock_moves where idempotency_key = 'job-stock:' || p_id::text and location_id = p_location)
    then raise exception 'KFC_RESERVATION_MISMATCH'; end if;
    return;
  end if;
  if v_job.status = 'geannuleerd' or exists (select 1 from public.sales_invoices where job_id = p_job and status <> 'concept')
  then raise exception 'KFC_JOB_CLOSED'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  select purchase_price_cents into v_cost from public.kfc_articles where code = p_article;
  if not found then raise exception 'KFC_UNKNOWN_ARTICLE'; end if;
  insert into public.kfc_job_stock(id,job_id,article_code,quantity,state) values (p_id,p_job,p_article,p_quantity,'used');
  perform public.kfc_book_move(p_article,p_location,-p_quantity,'issue','job-stock:' || p_id::text,v_cost,'Klus ' || p_job::text,null,p_user);
end $$;
revoke all on function public.kfc_transfer_van_stock(uuid,text,uuid,uuid,integer,boolean,uuid) from public, anon, authenticated;
revoke all on function public.kfc_use_van_stock(uuid,uuid,text,uuid,integer,uuid) from public, anon, authenticated;
grant execute on function public.kfc_transfer_van_stock(uuid,text,uuid,uuid,integer,boolean,uuid) to service_role;
grant execute on function public.kfc_use_van_stock(uuid,uuid,text,uuid,integer,uuid) to service_role;

create or replace function public.snapshot_issued_job_invoice()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_lines jsonb;
  v_warehouse jsonb;
  v_warehouse_cost numeric;
  v_legacy_cost numeric;
begin
  perform 1 from public.jobs where id = new.job_id for no key update;
  select jsonb_agg(jsonb_build_object(
    'description', line.description, 'quantity', line.quantity, 'unit_price', line.unit_price,
    'discount', line.discount, 'vat_rate', line.vat_rate,
    'job_stock_id', line.job_stock_id, 'job_line_kind', line.job_line_kind
  ) order by line.line_no, line.id)
  into v_lines from public.sales_invoice_lines line where line.invoice_id = new.id;
  if v_lines is null then
    raise exception 'JOB_INVOICE_LINES_REQUIRED';
  end if;

  select jsonb_agg(jsonb_build_object(
      'article_code', stock.article_code, 'quantity', stock.quantity, 'unit_cost_cents', move.unit_cost_cents
    ) order by stock.created_at, stock.id),
    case when count(*) = count(move.unit_cost_cents)
      then sum(stock.quantity::numeric * move.unit_cost_cents) / 100 end
  into v_warehouse, v_warehouse_cost
  from public.kfc_job_stock stock
  left join public.kfc_stock_moves move
    on move.idempotency_key = 'job-stock:' || stock.id::text and move.reason = 'issue'
  where stock.job_id = new.job_id and stock.state = 'used';

  select case when count(*) = count(unit_cost)
    then coalesce(sum(quantity * unit_cost), 0) end into v_legacy_cost
  from public.job_materials where job_id = new.job_id;

  -- A manually entered job total may already include warehouse parts.
  insert into public.job_invoice_snapshots (invoice_id, lines, subtotal, material_cost, technician_cost, warehouse_materials)
  select new.id, v_lines, new.subtotal,
    case when v_warehouse is null then nullif(job.cost_materials, 0) else v_warehouse_cost + v_legacy_cost end,
    nullif(job.cost_technician, 0), coalesce(v_warehouse, '[]'::jsonb)
  from public.jobs job where job.id = new.job_id
  on conflict (invoice_id) do nothing;
  return new;
end;
$$;

revoke all on function public.snapshot_issued_job_invoice() from public, anon, authenticated;
