-- ============================================================================
-- 0131: KeyForCars inventory lists and owner reports (Nebim / ERPNext level).
--
-- Read-only views and report functions over the ledger of 0090 and later. Nothing
-- here writes stock; every number is derived from kfc_stock_moves,
-- kfc_stock_levels, kfc_purchase_order_lines and the documents a move links to.
--
--   kfc_article_overview     one row per article: master data, the five stock
--                            numbers, minimum, value at purchase price, last
--                            supplier, last receipt / sale, sales 30 / 90 / 365
--                            days and a stock state (negatief · nul · laag ·
--                            op_voorraad). The article master list pages,
--                            filters and sorts on this view through PostgREST.
--   kfc_sales_lines          every 'sale' and 'return' move as a sales line with
--                            channel (webshop · kassa · factuur · overig), revenue
--                            excl. VAT and cost. Returns are negative lines.
--   kfc_sales_report()       sales per article / category / day / month / channel
--   kfc_article_movement()   per article: stock, sold, revenue, profit, cover days
--                            (slow / fast movers and ABC)
--   kfc_stock_valuation()    quantity and value per article and location on a date
--   kfc_stock_ledger()       every move with a running balance per article
--   kfc_stock_ageing()       FIFO ageing of the current stock in day buckets
--   kfc_article_totals()     counts and stock value for the article list header
--
-- Revenue rules (also in docs/voorraad-rapporten.md):
--   webshop  the order line's total excl. VAT, pro rata the moved quantity;
--   invoice  (kassa and other invoices) the invoice line whose description is the
--            article name (+ " (SKU)"), as kfc_pos_sale writes it; when no line
--            matches, the article's shelf price / 1.21 and the row is flagged
--            revenue_estimated;
--   cost     the move's unit_cost_cents, else the article's current purchase
--            price (flagged cost_estimated).
--
-- Install isolation: these objects only read tables of the database they are
-- created in; KeyForCars and Autosleutel24 each run their own Supabase project.
--
-- Server-only like 0090: nothing for anon or authenticated, select / execute for
-- service_role only. Idempotent: create or replace / if not exists throughout.
-- ============================================================================

-- Indexes the reports filter on -----------------------------------------------
create index if not exists kfc_stock_moves_reason_time_idx on public.kfc_stock_moves (reason, created_at);
create index if not exists kfc_stock_moves_invoice_idx on public.kfc_stock_moves (sales_invoice_id) where sales_invoice_id is not null;
create index if not exists kfc_stock_moves_order_line_idx on public.kfc_stock_moves (order_line_id) where order_line_id is not null;
create index if not exists kfc_stock_moves_location_time_idx on public.kfc_stock_moves (location_id, created_at);
create index if not exists kfc_stock_moves_batch_idx on public.kfc_stock_moves (count_batch_id) where count_batch_id is not null;
create index if not exists kfc_articles_category_idx on public.kfc_articles (category);
create index if not exists kfc_articles_status_idx on public.kfc_articles (status);

-- ---------------------------------------------------------------------------
-- Sales lines
-- ---------------------------------------------------------------------------
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
  (coalesce(m.unit_cost_cents, a.purchase_price_cents, 0)::bigint * (-m.delta)) as cost_cents,
  (m.unit_cost_cents is null)                            as cost_estimated
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

-- ---------------------------------------------------------------------------
-- Article overview (master list)
-- ---------------------------------------------------------------------------
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
  (greatest(p.physical - p.unusable, 0)::bigint * coalesce(a.purchase_price_cents, 0)) as stock_value_cents,
  (a.purchase_price_cents is null)                                                   as unpriced,
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
  end as margin_pct
from public.kfc_articles a
join public.kfc_stock_position p on p.article_code = a.code
left join levels lv on lv.article_code = a.code
left join moves mv on mv.article_code = a.code
left join suppliers s on s.article_code = a.code;

-- ---------------------------------------------------------------------------
-- Sales report: grouped sales lines for a period.
-- p_group: article · category · day · month · channel · shop
-- ---------------------------------------------------------------------------
create or replace function public.kfc_sales_report(
  p_from date, p_to date, p_group text default 'article',
  p_category text default '', p_channel text default '', p_query text default ''
) returns table (
  key text, label text, category text, quantity bigint, lines bigint,
  revenue_cents bigint, cost_cents bigint, profit_cents bigint, margin_pct numeric,
  estimated bigint, first_at timestamptz, last_at timestamptz
) language sql stable set search_path = '' as $$
  with scoped as (
    select s.*,
      case p_group
        when 'category' then coalesce(nullif(s.category, ''), '(geen categorie)')
        when 'day'      then to_char(s.day, 'YYYY-MM-DD')
        when 'month'    then to_char(s.day, 'YYYY-MM')
        when 'channel'  then s.channel
        when 'shop'     then coalesce(s.shop, s.channel)
        else s.article_code
      end as k
    from public.kfc_sales_lines s
    where s.day between p_from and p_to
      and (p_category = '' or s.category = p_category)
      and (p_channel = '' or s.channel = p_channel)
      and (p_query = '' or strpos(lower(s.article_code), lower(p_query)) > 0
           or strpos(lower(s.name), lower(p_query)) > 0 or strpos(lower(s.sku), lower(p_query)) > 0)
  )
  select k,
    case when p_group = 'article' then max(name) else k end,
    case when p_group = 'article' then max(category) else null end,
    sum(quantity)::bigint, count(*)::bigint,
    sum(revenue_cents)::bigint, sum(cost_cents)::bigint, (sum(revenue_cents) - sum(cost_cents))::bigint,
    case when sum(revenue_cents) = 0 then null
         else round((sum(revenue_cents) - sum(cost_cents))::numeric / sum(revenue_cents) * 100, 1) end,
    count(*) filter (where revenue_estimated or cost_estimated)::bigint,
    min(created_at), max(created_at)
  from scoped
  group by k
  order by case when p_group in ('day', 'month') then k end, sum(revenue_cents) desc;
$$;

-- ---------------------------------------------------------------------------
-- Article movement: slow / fast movers and ABC (classification done in the app).
-- ---------------------------------------------------------------------------
create or replace function public.kfc_article_movement(p_from date, p_to date, p_category text default '')
returns table (
  code text, name text, sku text, category text, status text,
  physical integer, available integer, stock_value_cents bigint,
  sold bigint, revenue_cents bigint, profit_cents bigint,
  last_sold_at timestamptz, last_received_at timestamptz, days_cover numeric
) language sql stable set search_path = '' as $$
  with sales as (
    select article_code, sum(quantity)::bigint as sold, sum(revenue_cents)::bigint as revenue,
           (sum(revenue_cents) - sum(cost_cents))::bigint as profit
    from public.kfc_sales_lines
    where day between p_from and p_to
    group by article_code
  )
  select o.code, o.name, o.sku, o.category, o.status,
    o.physical::integer, o.available::integer, o.stock_value_cents,
    coalesce(s.sold, 0), coalesce(s.revenue, 0), coalesce(s.profit, 0),
    o.last_sold_at, o.last_received_at,
    case when coalesce(s.sold, 0) <= 0 then null
         else round(o.physical::numeric / (s.sold::numeric / greatest(p_to - p_from + 1, 1)), 0) end
  from public.kfc_article_overview o
  left join sales s on s.article_code = o.code
  where (p_category = '' or o.category = p_category)
    and (o.physical <> 0 or s.article_code is not null);
$$;

-- ---------------------------------------------------------------------------
-- Stock valuation on a date (end of that day, Amsterdam), per article and
-- location, from the ledger. Value at the last known unit cost on that date
-- (receipts / assemblies), else the current purchase price. Quarantine stock
-- is listed with value 0.
-- ---------------------------------------------------------------------------
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
  ), cost as (
    select distinct on (m.article_code) m.article_code, m.unit_cost_cents
    from public.kfc_stock_moves m cross join bound
    where m.created_at < bound.ends and m.delta > 0 and m.reason in ('received', 'assembly')
      and m.unit_cost_cents is not null
    order by m.article_code, m.created_at desc, m.id desc
  )
  select q.article_code, a.name, a.sku, a.category,
    q.location_id, coalesce(loc.warehouse, '(geen locatie)'), loc.shelf, loc.box, coalesce(loc.kind, 'shelf'), loc.technician_id,
    q.quantity,
    coalesce(c.unit_cost_cents, a.purchase_price_cents),
    case when coalesce(loc.kind, 'shelf') = 'quarantine' then 0::bigint
         else greatest(q.quantity, 0) * coalesce(c.unit_cost_cents, a.purchase_price_cents, 0) end,
    c.unit_cost_cents is null
  from qty q
  join public.kfc_articles a on a.code = q.article_code
  left join public.kfc_locations loc on loc.id = q.location_id
  left join cost c on c.article_code = q.article_code
  where (p_warehouse = '' or coalesce(loc.warehouse, '(geen locatie)') = p_warehouse)
    and (p_category = '' or a.category = p_category);
$$;

-- ---------------------------------------------------------------------------
-- Stock ledger: every move in the period with the article's running balance
-- (all locations) after the move, plus the opening balance before the period.
-- One page at a time; p_page_size 0 = everything (for export, capped at 50 000).
-- ---------------------------------------------------------------------------
create or replace function public.kfc_stock_ledger(
  p_from date, p_to date, p_article text default '', p_reason text default '', p_warehouse text default '',
  p_query text default '', p_page integer default 1, p_page_size integer default 100
) returns jsonb language sql stable set search_path = '' as $$
  with bounds as (
    select p_from::timestamp at time zone 'Europe/Amsterdam' as starts,
           (p_to + 1)::timestamp at time zone 'Europe/Amsterdam' as ends
  ), arts as (
    select a.code, a.name, a.sku, a.category, a.purchase_price_cents from public.kfc_articles a
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
      coalesce(r.unit_cost_cents, arts.purchase_price_cents) * r.delta as value_cents,
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

-- ---------------------------------------------------------------------------
-- Stock ageing (FIFO): the current physical stock is taken to be the most
-- recent inbound moves (receipt, assembly, return, positive count/correction;
-- transfers are internal and skipped). Stock older than every recorded inbound
-- has an unknown age and is counted in the oldest bucket.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_stock_ageing(p_category text default '')
returns table (
  code text, name text, sku text, category text, physical integer, unit_cost_cents integer, value_cents bigint,
  q_0_30 bigint, q_31_60 bigint, q_61_90 bigint, q_91_180 bigint, q_181_365 bigint, q_365p bigint,
  oldest_days integer, avg_days numeric, last_received_at timestamptz, last_sold_at timestamptz
) language sql stable set search_path = '' as $$
  with stock as (
    select o.code, o.name, o.sku, o.category, o.physical, o.purchase_price_cents, o.last_received_at, o.last_sold_at
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
  select s.code, s.name, s.sku, s.category, s.physical::integer, s.purchase_price_cents,
    s.physical::bigint * coalesce(s.purchase_price_cents, 0),
    coalesce(k.a30, 0)::bigint, coalesce(k.a60, 0)::bigint, coalesce(k.a90, 0)::bigint,
    coalesce(k.a180, 0)::bigint, coalesce(k.a365, 0)::bigint,
    (coalesce(k.a365p, 0) + greatest(s.physical - coalesce(k.qty, 0), 0))::bigint,
    case when s.physical > coalesce(k.qty, 0) then null else k.oldest end::integer,
    case when coalesce(k.qty, 0) = 0 then null else round(k.weighted::numeric / k.qty, 0) end,
    s.last_received_at, s.last_sold_at
  from stock s left join known k on k.article_code = s.code;
$$;

-- ---------------------------------------------------------------------------
-- Header totals of the article list in one pass over the overview.
-- ---------------------------------------------------------------------------
create or replace function public.kfc_article_totals()
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'articles', count(*),
    'in_stock', count(*) filter (where physical > 0),
    'low',      count(*) filter (where stock_state = 'laag'),
    'zero',     count(*) filter (where stock_state = 'nul'),
    'negative', count(*) filter (where stock_state = 'negatief'),
    'incoming', count(*) filter (where incoming > 0),
    'value',    coalesce(sum(stock_value_cents), 0),
    'unpriced', count(*) filter (where unpriced and physical > 0)
  ) from public.kfc_article_overview;
$$;

-- Security ---------------------------------------------------------------------
revoke all on public.kfc_sales_lines from public, anon, authenticated;
revoke all on public.kfc_article_overview from public, anon, authenticated;
grant select on public.kfc_sales_lines to service_role;
grant select on public.kfc_article_overview to service_role;

revoke all on function public.kfc_sales_report(date, date, text, text, text, text) from public, anon, authenticated;
revoke all on function public.kfc_article_movement(date, date, text) from public, anon, authenticated;
revoke all on function public.kfc_stock_valuation(date, text, text) from public, anon, authenticated;
revoke all on function public.kfc_stock_ledger(date, date, text, text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.kfc_stock_ageing(text) from public, anon, authenticated;
revoke all on function public.kfc_article_totals() from public, anon, authenticated;
grant execute on function public.kfc_sales_report(date, date, text, text, text, text) to service_role;
grant execute on function public.kfc_article_movement(date, date, text) to service_role;
grant execute on function public.kfc_stock_valuation(date, text, text) to service_role;
grant execute on function public.kfc_stock_ledger(date, date, text, text, text, text, integer, integer) to service_role;
grant execute on function public.kfc_stock_ageing(text) to service_role;
grant execute on function public.kfc_article_totals() to service_role;
