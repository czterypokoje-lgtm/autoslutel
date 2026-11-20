-- ============================================================================
-- 0099: picking a line in one transaction.
--
--   kfc_pick_line(line, picked)  locks the order row, validates the line state
--                                the way markPicked did, writes the line, and
--                                recomputes fulfilment in the same transaction.
--                                Only writes fulfilment when it actually
--                                changes, so the allocate trigger on
--                                kfc_shop_orders no longer fires on every tick.
--                                Returns the order id, for the re-read the UI
--                                needs after the call.
--
-- Server-only like 0091. Idempotent.
-- ============================================================================

create or replace function public.kfc_pick_line(p_line uuid, p_picked boolean)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.kfc_shop_orders; v_line public.kfc_shop_order_lines; v_all boolean; v_next text;
begin
  select o.* into v_order
    from public.kfc_shop_orders o join public.kfc_shop_order_lines l on l.order_id = o.id
   where l.id = p_line
     for update of o;
  if not found then raise exception 'KFC_NO_LINE'; end if;
  -- Read the line only after the lock: two pickers on one order now queue.
  select * into v_line from public.kfc_shop_order_lines where id = p_line;
  if v_line.state not in ('short', 'reserved', 'picked') then raise exception 'KFC_LINE_STATE'; end if;

  update public.kfc_shop_order_lines
     set picked = case when p_picked then v_line.reserved else 0 end,
         state = case when p_picked then 'picked'
                      when v_line.reserved >= v_line.quantity then 'reserved'
                      else 'short' end
   where id = p_line;

  select bool_and(state in ('picked', 'shipped')) into v_all
    from public.kfc_shop_order_lines where order_id = v_order.id and state <> 'cancelled';
  v_next := case when coalesce(v_all, true) then 'picked' else 'open' end;
  if v_order.fulfilment in ('open', 'picked') and v_order.fulfilment <> v_next then
    update public.kfc_shop_orders set fulfilment = v_next where id = v_order.id;
  end if;
  return v_order.id;
end $$;

revoke all on function public.kfc_pick_line(uuid, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.kfc_pick_line(uuid, boolean) to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';
