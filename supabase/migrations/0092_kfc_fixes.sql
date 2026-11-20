-- 0092: two fixes found by the phase 2 end-to-end test. Idempotent.
--
-- 1. kfc_count_bin wrote the move (whose trigger runs the allocator) before it
--    updated the cached level, so the allocator saw the quantity from before
--    the count and lagged one count behind. Level first, move second, like
--    kfc_book_move already does.
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
  update public.kfc_stock_levels set minimum = p_minimum, last_counted_at = now(), updated_at = now(), quantity = p_counted
   where article_code = p_article and location_id = p_location;
  if v_qty = p_counted then return null; end if;
  insert into public.kfc_stock_moves (article_code, location_id, delta, quantity_after, reason, count_batch_id, note, photo_path, created_by, idempotency_key)
  values (p_article, p_location, p_counted - v_qty, p_counted, 'count', p_count_batch_id, p_note, p_photo_path, p_created_by, p_key)
  returning * into v_row;
  return v_row;
end $$;

-- 2. A shop status that ends the order (cancelled, refunded, failed, trash)
--    also ends the CRM's fulfilment when nothing has shipped yet. Before the
--    row is written, so the after-update allocator sees the final state.
create or replace function public.kfc_orders_close() returns trigger language plpgsql as $$
begin
  if new.status in ('cancelled', 'refunded', 'failed', 'trash') and new.fulfilment in ('open', 'picked') then
    new.fulfilment := 'cancelled';
  end if;
  return new;
end $$;
drop trigger if exists kfc_orders_close on public.kfc_shop_orders;
create trigger kfc_orders_close before insert or update of status on public.kfc_shop_orders
  for each row execute function public.kfc_orders_close();
