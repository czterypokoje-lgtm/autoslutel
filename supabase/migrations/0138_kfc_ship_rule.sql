-- ============================================================================
-- 0138: the ship rule lives in the database, not only behind a disabled button.
--
--   kfc_ship_order(order, key, by)  same signature, same void return, same
--     idempotency (a shipped order returns at once, before any check, so a
--     replay still answers like the first call), same KFC_NO_ORDER /
--     KFC_NOT_PAID / KFC_STOCK_RESERVED_FOR_JOB behaviour. New:
--
--   1. KFC_NOT_PICKED unless every line that has to leave the warehouse is
--      fully reserved and picked. "Has to leave the warehouse" is exactly the
--      set of lines the 0124 version booked a sale for: state <> 'cancelled',
--      quantity > 0, article_code not null. Such a line passes only with
--      state = 'picked', reserved >= quantity and picked >= quantity
--      (kfc_pick_line sets picked = reserved; reserved can exceed quantity
--      when the shop lowered the quantity after the allocator filled it).
--      Unmapped lines (article_code null) are still marked shipped without a
--      move; zero-quantity lines are still left alone. Both never block.
--      The check runs after the order row and its lines are locked, so two
--      ship calls queue on the order row and the second one returns early
--      on fulfilment = 'shipped'; a pick or an import cannot change a line
--      between the check and the bookings.
--
--   2. No negative stock from shipping. The 0124 version booked the whole
--      quantity on the single fullest bin, which kfc_book_move allows to go
--      below zero for 'sale'. Now the quantity is taken from central shelf
--      bins (no van, no quarantine) that hold stock, fullest first, never
--      more than a bin holds. An article without any bin keeps the unlocated
--      booking, but only up to the unlocated balance. If that is not enough:
--      KFC_CENTRAL_STOCK_REQUIRED (the existing code and message), and the
--      whole call rolls back. The first bin keeps the 0124 idempotency key
--      (key:line); further bins get key:line:2, key:line:3, ...
--      The line can never ship more than was reserved for it, because the
--      rule above already requires reserved >= quantity.
--
-- Lock order stays order row -> lines -> stock level rows -> article advisory
-- lock (taken by the move trigger), like kfc_pick_line and kfc_count_bin.
--
-- kfc_book_move and kfc_allocate are not touched. Idempotent.
-- ============================================================================

create or replace function public.kfc_ship_order(p_order uuid, p_key text, p_created_by uuid default null)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_order public.kfc_shop_orders; v_line record; v_bin record; v_cost integer;
  v_left integer; v_take integer; v_n integer; v_unlocated bigint;
begin
  select * into v_order from public.kfc_shop_orders where id = p_order for update;
  if not found then raise exception 'KFC_NO_ORDER'; end if;
  if v_order.fulfilment = 'shipped' then return; end if;
  if v_order.status <> 'processing' then raise exception 'KFC_NOT_PAID'; end if;

  -- The ship rule, checked under the order lock with the lines locked too.
  perform 1 from public.kfc_shop_order_lines where order_id = p_order order by id for update;
  if exists (
    select 1 from public.kfc_shop_order_lines
     where order_id = p_order and state <> 'cancelled' and quantity > 0 and article_code is not null
       and not (state = 'picked' and reserved >= quantity and picked >= quantity)
  ) then
    raise exception 'KFC_NOT_PICKED';
  end if;

  for v_line in select * from public.kfc_shop_order_lines where order_id = p_order and state <> 'cancelled' and quantity > 0 order by id loop
    if v_line.article_code is null then
      update public.kfc_shop_order_lines set state = 'shipped' where id = v_line.id;
      continue;
    end if;
    if v_line.reserved > 0 then
      insert into public.kfc_reservations (article_code, order_line_id, delta) values (v_line.article_code, v_line.id, -v_line.reserved);
    end if;
    select purchase_price_cents into v_cost from public.kfc_articles where code = v_line.article_code;

    -- Lock every central shelf bin of the article in a fixed order, then read
    -- the quantities fresh and take from the fullest first.
    perform 1 from public.kfc_stock_levels l join public.kfc_locations loc on loc.id = l.location_id
     where l.article_code = v_line.article_code and loc.technician_id is null and loc.kind = 'shelf'
     order by l.location_id for update of l;
    v_left := v_line.quantity; v_n := 0;
    for v_bin in
      select l.location_id, l.quantity
        from public.kfc_stock_levels l join public.kfc_locations loc on loc.id = l.location_id
       where l.article_code = v_line.article_code and loc.technician_id is null and loc.kind = 'shelf' and l.quantity > 0
       order by l.quantity desc, l.location_id
    loop
      exit when v_left <= 0;
      v_take := least(v_left, v_bin.quantity);
      v_n := v_n + 1;
      perform public.kfc_book_move(v_line.article_code, v_bin.location_id, -v_take, 'sale',
        p_key || ':' || v_line.id::text || case when v_n = 1 then '' else ':' || v_n::text end,
        v_cost, null, null, p_created_by, v_line.id);
      v_left := v_left - v_take;
    end loop;

    if v_left > 0 then
      -- Not enough on the central shelves. Unlocated stock only counts for an
      -- article that has no bin at all (kfc_book_move refuses it otherwise).
      if v_n > 0 or exists (select 1 from public.kfc_stock_levels where article_code = v_line.article_code) then
        raise exception 'KFC_CENTRAL_STOCK_REQUIRED';
      end if;
      perform pg_advisory_xact_lock(hashtext('kfc_alloc:' || v_line.article_code));
      select coalesce(sum(delta), 0) into v_unlocated
        from public.kfc_stock_moves where article_code = v_line.article_code and location_id is null;
      if v_unlocated < v_left then raise exception 'KFC_CENTRAL_STOCK_REQUIRED'; end if;
      perform public.kfc_book_move(v_line.article_code, null, -v_left, 'sale', p_key || ':' || v_line.id::text,
        v_cost, null, null, p_created_by, v_line.id);
    end if;

    update public.kfc_shop_order_lines set reserved = 0, picked = quantity, state = 'shipped' where id = v_line.id;
  end loop;
  update public.kfc_shop_orders set fulfilment = 'shipped', shipped_at = now(), shipped_by = p_created_by where id = p_order;
end $$;

revoke all on function public.kfc_ship_order(uuid, text, uuid) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.kfc_ship_order(uuid, text, uuid) to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';
