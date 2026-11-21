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
    shop_line.order_id, m.sales_invoice_id
  from public.kfc_stock_moves m
  join public.kfc_articles a on a.code = m.article_code
  left join public.kfc_locations loc on loc.id = m.location_id
  left join public.kfc_shop_order_lines shop_line on shop_line.id = m.order_line_id
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
