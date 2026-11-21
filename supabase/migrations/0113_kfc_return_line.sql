-- 0113: physical return of a shipped webshop line (spec §4-A, scenario S6).
--
-- Refunds already arrive from the shop as money only (kfc_shop_order_refunds). A
-- returned key coming back onto a shelf had no way in: the "Retour vastleggen"
-- button on the order screen belongs to the old orders table. The spec keeps the
-- two apart: a price refund and a physical return are separate events, and a
-- partial return keeps the original sale price.
--
-- kfc_return_line books the units back (move reason 'return', linked to the order
-- line) onto a chosen shelf, at the cost the sale move was booked at, so stock
-- value stays consistent. It refuses to take back more than was shipped on that
-- line, counting earlier returns. A replayed key returns the original move. The
-- sale move and its price are never touched.
--
-- Additive: one new function, nothing else changes.

create or replace function public.kfc_return_line(
  p_line uuid, p_quantity integer, p_location uuid, p_key text, p_created_by uuid default null, p_note text default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_line public.kfc_shop_order_lines; v_row public.kfc_stock_moves; v_shipped integer; v_returned integer; v_cost integer;
begin
  select * into v_row from public.kfc_stock_moves where idempotency_key = p_key;
  if found then return v_row; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  if p_location is null then raise exception 'KFC_LOCATION_REQUIRED'; end if;
  select * into v_line from public.kfc_shop_order_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_ORDER_LINE'; end if;

  select coalesce(-sum(delta), 0), max(unit_cost_cents) into v_shipped, v_cost
    from public.kfc_stock_moves where order_line_id = p_line and reason = 'sale';
  select coalesce(sum(delta), 0) into v_returned
    from public.kfc_stock_moves where order_line_id = p_line and reason = 'return';
  if v_shipped = 0 then raise exception 'KFC_NOT_SHIPPED'; end if;
  if v_returned + p_quantity > v_shipped then raise exception 'KFC_RETURN_EXCEEDS'; end if;

  return public.kfc_book_move(v_line.article_code, p_location, p_quantity, 'return', p_key,
    v_cost, p_note, null, p_created_by, p_line);
end $$;

revoke all on function public.kfc_return_line(uuid, integer, uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.kfc_return_line(uuid, integer, uuid, text, uuid, text) to service_role;
