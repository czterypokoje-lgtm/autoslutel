-- Service jobs and webshop orders compete for the same available stock.
create table if not exists public.kfc_job_stock (
  id uuid primary key,
  job_id uuid not null references public.jobs (id) on delete cascade,
  article_code text not null references public.kfc_articles (code),
  quantity integer not null check (quantity > 0),
  state text not null default 'reserved' check (state in ('reserved', 'used', 'released')),
  created_at timestamptz not null default now()
);
create index if not exists kfc_job_stock_article_idx on public.kfc_job_stock (article_code) where state = 'reserved';
create index if not exists kfc_job_stock_job_idx on public.kfc_job_stock (job_id);
alter table public.kfc_job_stock enable row level security;
revoke all on public.kfc_job_stock from public, anon, authenticated;
grant select, insert, update, delete on public.kfc_job_stock to service_role;

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
  select article_code, sum(delta) as reserved from (
    select article_code, delta from public.kfc_reservations
    union all
    select article_code, quantity from public.kfc_job_stock where state = 'reserved'
  ) reservations group by article_code
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
    where level.article_code = p_article and location.kind = 'shelf'
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
    if not exists (select 1 from public.kfc_locations where id = p_location and kind = 'shelf') then
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

-- A webshop shipment may overdraw for legacy orders, but cannot take service-held stock.
create or replace function public.kfc_protect_job_stock()
returns trigger language plpgsql as $$
declare v_available bigint;
begin
  perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || new.article_code));
  if exists (select 1 from public.kfc_job_stock where article_code = new.article_code and state = 'reserved') then
    select available into v_available from public.kfc_stock_position where article_code = new.article_code;
    if v_available + (case when new.location_id is null then new.delta else 0 end) < 0 then
      raise exception 'KFC_STOCK_RESERVED_FOR_JOB';
    end if;
  end if;
  return new;
end $$;

create or replace trigger kfc_protect_job_stock
before insert on public.kfc_stock_moves
for each row when (new.reason = 'sale' and new.delta < 0)
execute function public.kfc_protect_job_stock();

create or replace function public.kfc_release_cancelled_job_stock()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  for v_id in select id from public.kfc_job_stock where job_id = old.id and state = 'reserved' order by article_code, id loop
    perform public.kfc_finish_job_stock(v_id, old.id, null, null);
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create or replace trigger kfc_release_cancelled_job_stock
after update of status on public.jobs for each row
when (old.status is distinct from new.status and new.status = 'geannuleerd')
execute function public.kfc_release_cancelled_job_stock();

create or replace trigger kfc_release_deleted_job_stock
before delete on public.jobs for each row execute function public.kfc_release_cancelled_job_stock();

revoke all on function public.kfc_reserve_job_stock(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.kfc_finish_job_stock(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.kfc_protect_job_stock() from public, anon, authenticated;
revoke all on function public.kfc_release_cancelled_job_stock() from public, anon, authenticated;
grant execute on function public.kfc_reserve_job_stock(uuid, uuid, text, integer) to service_role;
grant execute on function public.kfc_finish_job_stock(uuid, uuid, uuid, uuid) to service_role;
