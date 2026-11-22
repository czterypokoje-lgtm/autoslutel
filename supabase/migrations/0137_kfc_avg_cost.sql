-- ============================================================================
-- 0137: KeyForCars moving-average cost (gemiddelde kostprijs), ERPNext style.
--
-- Before this migration there was no valuation method: receipts and purchase
-- invoice lines overwrite kfc_articles.purchase_price_cents with the latest
-- price, stock was valued at quantity × that latest price, and a till sale
-- (0129) books its move without a cost, so the margin of an old sale changed
-- every time the purchase price changed.
--
-- What this adds
--   kfc_articles.avg_cost_cents            the article's moving average cost
--   kfc_stock_moves.avg_cost_after_cents   the average right after that move
--                                          (history for valuation on a date)
--   trigger kfc_stock_moves_avg_cost       BEFORE INSERT on kfc_stock_moves:
--                                          the whole mechanism. No existing RPC
--                                          is replaced, so every current and
--                                          future write path is covered.
--   0131 reports                           value stock at the average and cost
--                                          sales at the cost stamped on the move.
--
-- purchase_price_cents keeps its meaning "last purchase price" (reorder
-- proposals, supplier comparison, list margin). Nothing here writes it.
--
-- Behaviour per move reason. The reasons are exactly the values allowed by
-- kfc_stock_moves_reason_check (0090, widened in 0112): count, sale, return,
-- received, transfer, correction, issue, assembly. Writers found:
--   received   kfc_receive_po_line (0090/0110, PO line cost, may be null);
--              stock screen "receive" (src/lib/kfcInventory.ts, entered
--              total ÷ quantity, or null)
--   assembly   kfc_assemble (0112): parts −, cost = part's purchase price;
--              product +, cost = parts + labour (null when a part is unpriced)
--   return     kfc_return_line (0113) and the Woo return (0132): + at the
--              cost of the original sale moves; stock screen "return": null
--   sale       webshop shipment (0091/0124): cost = article's purchase price;
--              till kfc_pos_sale (0129): null; stock screen "sale": the
--              entered total ÷ quantity, else null
--   issue      job stock (0115/0124): cost = article's purchase price;
--              stock screen "issue": null
--   correction defect Woo return write-off (0132): − at the return's cost
--   transfer   kfc_transfer (0090, also van transfers 0124): both legs null
--   count      kfc_count_bin / kfc_bulk_count (0090/0092): null
--
--   on_hand = the article's quantity over ALL locations (quarantine and vans
--   included) before this move = sum(delta) of its earlier ledger rows. The
--   ledger is used, not kfc_stock_levels, because kfc_book_move and
--   kfc_count_bin update the level row before they insert the move.
--
--   | move                                         | unit cost on the move   | average                          |
--   |----------------------------------------------|-------------------------|----------------------------------|
--   | received / assembly / return, delta > 0,     | kept as given           | on_hand <= 0 or average unknown: |
--   |   cost given (an external cost)              |                         |   = cost; else (on_hand × avg +  |
--   |                                              |                         |   delta × cost)/(on_hand + delta)|
--   | received / assembly, delta > 0, no cost      | stays null (the real    | unchanged (units join at the     |
--   |   (PO line or entry without a price)         |   price is not known)   |   current average)               |
--   | return, delta > 0, no cost (stock screen)    | current average         | unchanged                        |
--   | any delta < 0 (sale, issue, assembly part,   | given cost kept; null   | unchanged                        |
--   |   correction, count, transfer out, …)        |   -> current average    |                                  |
--   | count / correction / transfer / sale / issue | given cost kept; null   | unchanged                        |
--   |   with delta > 0 (cost-neutral)              |   -> current average    |                                  |
--   | any move while the average is unknown        | null stays null (never  | unchanged (still unknown)        |
--   |                                              |   an invented zero)     |                                  |
--
--   "current average" on a move is rounded to whole cents (the column is an
--   integer); the average itself keeps four decimals.
--   NOTE: outbound callers that pass a cost keep it. The webshop shipment and
--   job issue functions pass the article's LAST PURCHASE PRICE, not the
--   average; that is their choice and is not overridden here (see docs).
--
-- Concurrency: the trigger locks the article row (FOR NO KEY UPDATE — the
-- strongest lock that does not block foreign-key checks of other tables) before
-- it reads the average and the ledger, so two receipts of the same article
-- serialise and neither update is lost. A replayed idempotency key fails on the
-- unique index after the trigger ran; kfc_book_move catches that inside its
-- exception block, which rolls the trigger's update back with it.
--
-- History: moves booked before this migration keep their (often null) cost.
-- Reports fall back to the average, then the purchase price, for those rows and
-- flag them as estimated. The average starts at the purchase price of the moment
-- of migration (backfill below), once.
--
-- Idempotent; server-only like 0090/0131.
-- ============================================================================

-- numeric(14,4), not integer cents: an average recomputed on every receipt and
-- rounded to whole cents each time drifts (a 0.5 ct rounding on each of many
-- small receipts accumulates); four decimals of a cent keep the drift far below
-- one cent, and numeric (not float) is exact decimal arithmetic. 10 digits
-- before the point = up to 99 999 999,99 euro per unit.
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'kfc_articles' and column_name = 'avg_cost_cents') then
    alter table public.kfc_articles add column avg_cost_cents numeric(14,4);
    -- One-time backfill: the last purchase price is the best known cost today.
    update public.kfc_articles set avg_cost_cents = purchase_price_cents where purchase_price_cents is not null;
  end if;
end $$;
comment on column public.kfc_articles.avg_cost_cents is
  'Moving average cost in cents (4 decimals), maintained by trigger kfc_stock_moves_avg_cost (0137). Null = unknown.';
comment on column public.kfc_articles.purchase_price_cents is
  'Last purchase price in cents (receipt, purchase invoice, assembly). Not the valuation cost: see avg_cost_cents.';

alter table public.kfc_stock_moves add column if not exists avg_cost_after_cents numeric(14,4);
comment on column public.kfc_stock_moves.avg_cost_after_cents is
  'The article''s moving average cost right after this move (0137). Null on moves before 0137 or while unknown.';

create or replace function public.kfc_stock_moves_avg_cost()
returns trigger language plpgsql set search_path = public as $$
declare
  v_avg numeric(14,4);
  v_on_hand bigint;
begin
  -- Serialise every move of this article; the lock is held to commit.
  select avg_cost_cents into v_avg from public.kfc_articles where code = new.article_code for no key update;
  if not found then return new; end if;  -- the foreign key reports the unknown article

  if new.delta > 0 and new.reason in ('received', 'assembly', 'return') and new.unit_cost_cents is not null then
    -- Inbound at a known external cost: recompute the average.
    select coalesce(sum(delta), 0) into v_on_hand from public.kfc_stock_moves where article_code = new.article_code;
    if v_on_hand <= 0 or v_avg is null then
      v_avg := new.unit_cost_cents;
    else
      v_avg := round((v_on_hand * v_avg + new.delta::numeric * new.unit_cost_cents) / (v_on_hand + new.delta), 4);
    end if;
    update public.kfc_articles set avg_cost_cents = v_avg where code = new.article_code;
  elsif new.unit_cost_cents is null and v_avg is not null
        and not (new.delta > 0 and new.reason in ('received', 'assembly')) then
    -- Outbound or cost-neutral: stamp the current average, leave it unchanged.
    new.unit_cost_cents := round(v_avg)::integer;
  end if;

  new.avg_cost_after_cents := v_avg;
  return new;
end $$;

drop trigger if exists kfc_stock_moves_avg_cost on public.kfc_stock_moves;
create trigger kfc_stock_moves_avg_cost before insert on public.kfc_stock_moves
  for each row execute function public.kfc_stock_moves_avg_cost();

-- ---------------------------------------------------------------------------
-- Reports (0131). Same columns, order and types; new columns only at the end.
-- ---------------------------------------------------------------------------

-- Sales lines: cost = the cost stamped on the move. Moves without one (booked
-- before 0137, or while the average was unknown) fall back to the average, then
-- the purchase price, flagged cost_estimated as before. New: cost_source.
create or replace view public.kfc_sales_lines as
select
  m.id                                                   as move_id,
  m.created_at,
  (m.created_at at time zone 'Europe/Amsterdam')::date   as day,
  m.article_code,
  a.name,
  a.sku,
  a.category,
  m.reason,
  -m.delta                                               as quantity,  -- sale +, return −
  case
    when m.order_line_id is not null then 'webshop'
    when m.sales_invoice_id is not null and coalesce(m.note, '') like 'Kassa %' then 'kassa'
    when m.sales_invoice_id is not null then 'factuur'
    else 'overig'
  end                                                    as channel,
  so.shop,
  coalesce(so.number, si.invoice_number)                 as document,
  m.order_line_id,
  m.sales_invoice_id,
  case
    when sl.id is not null and sl.quantity > 0
      then round(coalesce(sl.total_excl_cents, 0)::numeric * (-m.delta) / sl.quantity)::bigint
    when il.unit_price is not null
      then round((il.unit_price * il.quantity - il.discount) / il.quantity * 100 * (-m.delta))::bigint
    else round(coalesce(a.sale_price_cents, 0)::numeric / 1.21 * (-m.delta))::bigint
  end                                                    as revenue_cents,
  (sl.id is null and il.unit_price is null)              as revenue_estimated,
  round(coalesce(m.unit_cost_cents::numeric, a.avg_cost_cents, a.purchase_price_cents::numeric, 0) * (-m.delta))::bigint
                                                         as cost_cents,
  (m.unit_cost_cents is null)                            as cost_estimated,
  case
    when m.unit_cost_cents is not null then 'boeking'
    when a.avg_cost_cents is not null then 'gemiddeld'
    when a.purchase_price_cents is not null then 'inkoopprijs'
  end                                                    as cost_source
from public.kfc_stock_moves m
join public.kfc_articles a on a.code = m.article_code
left join public.kfc_shop_order_lines sl on sl.id = m.order_line_id
left join public.kfc_shop_orders so on so.id = sl.order_id
left join public.sales_invoices si on si.id = m.sales_invoice_id
left join lateral (
  select l.unit_price, l.quantity, l.discount
  from public.sales_invoice_lines l
  where m.sales_invoice_id is not null and l.invoice_id = m.sales_invoice_id
    and l.description in (a.name, left(a.name || case when a.sku <> '' then ' (' || a.sku || ')' else '' end, 300))
  order by l.line_no
  limit 1
) il on true
where m.reason in ('sale', 'return');

-- Article overview: stock value at the average (purchase price only when no
-- average is known: value_estimated). margin_pct stays the list margin on the
-- last purchase price. New: avg_cost_cents, value_estimated.
create or replace view public.kfc_article_overview as
with levels as (
  select l.article_code,
         sum(l.minimum) filter (where loc.kind = 'shelf')                                   as minimum,
         array_agg(distinct loc.warehouse) filter (where l.quantity <> 0)                   as warehouses,
         array_agg(distinct loc.warehouse || '/' || loc.shelf || '/' || loc.box)
           filter (where l.quantity <> 0)                                                    as locations,
         max(l.last_counted_at)                                                              as last_counted_at
  from public.kfc_stock_levels l
  join public.kfc_locations loc on loc.id = l.location_id
  group by l.article_code
), moves as (
  select article_code,
         max(created_at) filter (where reason in ('received', 'assembly') and delta > 0) as last_received_at,
         max(created_at) filter (where reason = 'sale')                                  as last_sold_at,
         max(created_at)                                                                  as last_move_at,
         coalesce(-sum(delta) filter (where reason in ('sale', 'return') and created_at >= now() - interval '30 days'), 0)  as sold_30d,
         coalesce(-sum(delta) filter (where reason in ('sale', 'return') and created_at >= now() - interval '90 days'), 0)  as sold_90d,
         coalesce(-sum(delta) filter (where reason in ('sale', 'return') and created_at >= now() - interval '365 days'), 0) as sold_365d
  from public.kfc_stock_moves
  group by article_code
), suppliers as (
  select pl.article_code,
         array_agg(distinct po.supplier)                                                   as suppliers,
         (array_agg(po.supplier order by coalesce(po.ordered_at, po.created_at) desc))[1]  as last_supplier,
         (array_agg(pl.unit_cost_cents order by coalesce(po.ordered_at, po.created_at) desc)
            filter (where pl.unit_cost_cents is not null))[1]                              as last_po_cost_cents
  from public.kfc_purchase_order_lines pl
  join public.kfc_purchase_orders po on po.id = pl.po_id
  where po.status <> 'cancelled'
  group by pl.article_code
)
select
  a.code, a.name, a.sku, a.ean, a.category, a.status, a.condition, a.tracking, a.supplier_ref,
  a.sale_price_cents, a.purchase_price_cents, a.photo_version, a.created_at, a.updated_at,
  p.physical, p.unusable, p.reserved, p.available, p.incoming,
  coalesce(lv.minimum, 0)::integer                                                   as minimum,
  round(greatest(p.physical - p.unusable, 0) * coalesce(a.avg_cost_cents, a.purchase_price_cents::numeric, 0))::bigint
                                                                                     as stock_value_cents,
  (a.avg_cost_cents is null and a.purchase_price_cents is null)                      as unpriced,
  coalesce(lv.warehouses, '{}')                                                      as warehouses,
  coalesce(lv.locations, '{}')                                                       as locations,
  lv.last_counted_at,
  coalesce(s.suppliers, '{}')                                                        as suppliers,
  s.last_supplier,
  s.last_po_cost_cents,
  mv.last_received_at, mv.last_sold_at, mv.last_move_at,
  coalesce(mv.sold_30d, 0)::integer  as sold_30d,
  coalesce(mv.sold_90d, 0)::integer  as sold_90d,
  coalesce(mv.sold_365d, 0)::integer as sold_365d,
  case
    when p.physical < 0 then 'negatief'
    when p.physical = 0 then 'nul'
    when coalesce(lv.minimum, 0) > 0 and p.available <= lv.minimum then 'laag'
    else 'op_voorraad'
  end as stock_state,
  case when a.sale_price_cents is null or a.purchase_price_cents is null or a.sale_price_cents = 0 then null
       else round((a.sale_price_cents / 1.21 - a.purchase_price_cents) / (a.sale_price_cents / 1.21) * 100, 1)
  end as margin_pct,
  a.avg_cost_cents,
  (a.avg_cost_cents is null)                                                         as value_estimated
from public.kfc_articles a
join public.kfc_stock_position p on p.article_code = a.code
left join levels lv on lv.article_code = a.code
left join moves mv on mv.article_code = a.code
left join suppliers s on s.article_code = a.code;

-- Valuation on a date: the average as it was after the article's last move up
-- to that day (avg_cost_after_cents). An article without any move since 0137 has
-- had the same average since the backfill, so its current average is used.
-- Before 0137 (no recorded average yet): the last receipt / assembly cost up to
-- that day, then the purchase price — both flagged cost_estimated, as in 0131.
create or replace function public.kfc_stock_valuation(p_date date, p_warehouse text default '', p_category text default '')
returns table (
  article_code text, name text, sku text, category text,
  location_id uuid, warehouse text, shelf text, box text, kind text, technician_id uuid,
  quantity bigint, unit_cost_cents integer, value_cents bigint, cost_estimated boolean
) language sql stable set search_path = '' as $$
  with bound as (select (p_date + 1)::timestamp at time zone 'Europe/Amsterdam' as ends),
  qty as (
    select m.article_code, m.location_id, sum(m.delta)::bigint as quantity
    from public.kfc_stock_moves m cross join bound
    where m.created_at < bound.ends
    group by m.article_code, m.location_id
    having sum(m.delta) <> 0
  ), avg_on as (
    select distinct on (m.article_code) m.article_code, m.avg_cost_after_cents
    from public.kfc_stock_moves m cross join bound
    where m.created_at < bound.ends and m.avg_cost_after_cents is not null
    order by m.article_code, m.created_at desc, m.id desc
  ), cost as (
    select distinct on (m.article_code) m.article_code, m.unit_cost_cents
    from public.kfc_stock_moves m cross join bound
    where m.created_at < bound.ends and m.delta > 0 and m.reason in ('received', 'assembly')
      and m.unit_cost_cents is not null
    order by m.article_code, m.created_at desc, m.id desc
  ), priced as (
    select q.*, a.name, a.sku, a.category,
      coalesce(
        av.avg_cost_after_cents,
        case when not exists (select 1 from public.kfc_stock_moves x
                               where x.article_code = q.article_code and x.avg_cost_after_cents is not null)
             then a.avg_cost_cents end
      ) as avg_cost,
      c.unit_cost_cents as receipt_cost, a.purchase_price_cents
    from qty q
    join public.kfc_articles a on a.code = q.article_code
    left join avg_on av on av.article_code = q.article_code
    left join cost c on c.article_code = q.article_code
    where (p_category = '' or a.category = p_category)
  )
  select pr.article_code, pr.name, pr.sku, pr.category,
    pr.location_id, coalesce(loc.warehouse, '(geen locatie)'), loc.shelf, loc.box, coalesce(loc.kind, 'shelf'), loc.technician_id,
    pr.quantity,
    coalesce(round(pr.avg_cost)::integer, pr.receipt_cost, pr.purchase_price_cents),
    case when coalesce(loc.kind, 'shelf') = 'quarantine' then 0::bigint
         else round(greatest(pr.quantity, 0) * coalesce(pr.avg_cost, pr.receipt_cost::numeric, pr.purchase_price_cents::numeric, 0))::bigint end,
    pr.avg_cost is null
  from priced pr
  left join public.kfc_locations loc on loc.id = pr.location_id
  where (p_warehouse = '' or coalesce(loc.warehouse, '(geen locatie)') = p_warehouse);
$$;

-- Ledger: value = the move's own cost; without one the average, then the
-- purchase price (only moves from before 0137 or with an unknown average).
create or replace function public.kfc_stock_ledger(
  p_from date, p_to date, p_article text default '', p_reason text default '', p_warehouse text default '',
  p_query text default '', p_page integer default 1, p_page_size integer default 100
) returns jsonb language sql stable set search_path = '' as $$
  with bounds as (
    select p_from::timestamp at time zone 'Europe/Amsterdam' as starts,
           (p_to + 1)::timestamp at time zone 'Europe/Amsterdam' as ends
  ), arts as (
    select a.code, a.name, a.sku, a.category, a.purchase_price_cents, a.avg_cost_cents from public.kfc_articles a
    where (p_article = '' or a.code = p_article)
      and (p_query = '' or strpos(lower(a.code), lower(p_query)) > 0 or strpos(lower(a.name), lower(p_query)) > 0
           or strpos(lower(a.sku), lower(p_query)) > 0)
  ), running as (
    select m.id, m.created_at, m.article_code, m.location_id, m.delta, m.quantity_after, m.reason,
      m.unit_cost_cents, m.note, m.order_line_id, m.sales_invoice_id, m.purchase_order_line_id, m.count_batch_id, m.created_by,
      sum(m.delta) over (partition by m.article_code order by m.created_at, m.id) as balance
    from public.kfc_stock_moves m
    join arts on arts.code = m.article_code
    cross join bounds
    where m.created_at < bounds.ends
  ), period as (
    select r.*, arts.name, arts.sku, arts.category,
      loc.warehouse, loc.shelf, loc.box,
      round(coalesce(r.unit_cost_cents::numeric, arts.avg_cost_cents, arts.purchase_price_cents::numeric) * r.delta)::bigint as value_cents,
      po.supplier, so.number as order_number, si.invoice_number
    from running r
    join arts on arts.code = r.article_code
    cross join bounds
    left join public.kfc_locations loc on loc.id = r.location_id
    left join public.kfc_purchase_order_lines pl on pl.id = r.purchase_order_line_id
    left join public.kfc_purchase_orders po on po.id = pl.po_id
    left join public.kfc_shop_order_lines sl on sl.id = r.order_line_id
    left join public.kfc_shop_orders so on so.id = sl.order_id
    left join public.sales_invoices si on si.id = r.sales_invoice_id
    where r.created_at >= bounds.starts
      and (p_reason = '' or r.reason = p_reason)
      and (p_warehouse = '' or loc.warehouse = p_warehouse)
  ), opening as (
    select coalesce(sum(m.delta), 0) as qty
    from public.kfc_stock_moves m join arts on arts.code = m.article_code cross join bounds
    where m.created_at < bounds.starts
  ), totals as (
    select count(*) as n,
      coalesce(sum(delta) filter (where delta > 0), 0) as incoming,
      coalesce(-sum(delta) filter (where delta < 0), 0) as outgoing
    from period
  )
  select jsonb_build_object(
    'opening', (select qty from opening),
    'count', totals.n, 'incoming', totals.incoming, 'outgoing', totals.outgoing,
    'rows', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.created_at desc, v.id desc) from (
        select * from period order by created_at desc, id desc
        limit case when p_page_size <= 0 then 50000 else p_page_size end
        offset case when p_page_size <= 0 then 0 else (greatest(p_page, 1)::bigint - 1) * p_page_size end
      ) v), '[]'::jsonb)
  ) from totals;
$$;

-- Ageing: value at the average (purchase price when unknown). Buckets unchanged.
create or replace function public.kfc_stock_ageing(p_category text default '')
returns table (
  code text, name text, sku text, category text, physical integer, unit_cost_cents integer, value_cents bigint,
  q_0_30 bigint, q_31_60 bigint, q_61_90 bigint, q_91_180 bigint, q_181_365 bigint, q_365p bigint,
  oldest_days integer, avg_days numeric, last_received_at timestamptz, last_sold_at timestamptz
) language sql stable set search_path = '' as $$
  with stock as (
    select o.code, o.name, o.sku, o.category, o.physical, o.purchase_price_cents, o.avg_cost_cents, o.last_received_at, o.last_sold_at
    from public.kfc_article_overview o
    where o.physical > 0 and (p_category = '' or o.category = p_category)
  ), inbound as (
    select m.article_code, m.created_at, m.delta,
      sum(m.delta) over (partition by m.article_code order by m.created_at desc, m.id desc) as cum
    from public.kfc_stock_moves m
    join stock s on s.code = m.article_code
    where m.delta > 0 and m.reason <> 'transfer'
  ), alloc as (
    select i.article_code,
      greatest(0, least(i.delta, s.physical - (i.cum - i.delta)))::bigint as qty,
      (now() at time zone 'Europe/Amsterdam')::date - (i.created_at at time zone 'Europe/Amsterdam')::date as age
    from inbound i join stock s on s.code = i.article_code
  ), known as (
    select article_code,
      sum(qty) as qty,
      sum(qty) filter (where age <= 30) as a30, sum(qty) filter (where age between 31 and 60) as a60,
      sum(qty) filter (where age between 61 and 90) as a90, sum(qty) filter (where age between 91 and 180) as a180,
      sum(qty) filter (where age between 181 and 365) as a365, sum(qty) filter (where age > 365) as a365p,
      max(age) filter (where qty > 0) as oldest,
      sum(qty * age) as weighted
    from alloc group by article_code
  )
  select s.code, s.name, s.sku, s.category, s.physical::integer,
    coalesce(round(s.avg_cost_cents)::integer, s.purchase_price_cents),
    round(s.physical * coalesce(s.avg_cost_cents, s.purchase_price_cents::numeric, 0))::bigint,
    coalesce(k.a30, 0)::bigint, coalesce(k.a60, 0)::bigint, coalesce(k.a90, 0)::bigint,
    coalesce(k.a180, 0)::bigint, coalesce(k.a365, 0)::bigint,
    (coalesce(k.a365p, 0) + greatest(s.physical - coalesce(k.qty, 0), 0))::bigint,
    case when s.physical > coalesce(k.qty, 0) then null else k.oldest end::integer,
    case when coalesce(k.qty, 0) = 0 then null else round(k.weighted::numeric / k.qty, 0) end,
    s.last_received_at, s.last_sold_at
  from stock s left join known k on k.article_code = s.code;
$$;

-- kfc_sales_report, kfc_article_movement and kfc_article_totals read the views
-- above and need no change.

-- Security ---------------------------------------------------------------------
revoke all on function public.kfc_stock_moves_avg_cost() from public, anon, authenticated;
revoke all on public.kfc_sales_lines from public, anon, authenticated;
revoke all on public.kfc_article_overview from public, anon, authenticated;
grant select on public.kfc_sales_lines to service_role;
grant select on public.kfc_article_overview to service_role;
revoke all on function public.kfc_stock_valuation(date, text, text) from public, anon, authenticated;
revoke all on function public.kfc_stock_ledger(date, date, text, text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.kfc_stock_ageing(text) from public, anon, authenticated;
grant execute on function public.kfc_stock_valuation(date, text, text) to service_role;
grant execute on function public.kfc_stock_ledger(date, date, text, text, text, text, integer, integer) to service_role;
grant execute on function public.kfc_stock_ageing(text) to service_role;
