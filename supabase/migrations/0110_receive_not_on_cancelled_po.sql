-- 0110: goods cannot be received on a cancelled purchase order.
--
-- kfc_receive_po_line (0090) never looked at the order's status, so a line of a
-- cancelled order could still be received and the shelf went up for goods that
-- were never meant to come. A draft stays receivable on purpose: the spec allows
-- starting from a direct purchase without placing the order first.
--
-- Same body as 0090 plus the one guard. Replays of an existing receipt key still
-- return the original move, before the guard, so a retry never turns into an error.

create or replace function public.kfc_receive_po_line(
  p_line uuid, p_quantity integer, p_location uuid, p_key text, p_created_by uuid default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_line public.kfc_purchase_order_lines; v_row public.kfc_stock_moves; v_open integer;
begin
  if p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  select * into v_line from public.kfc_purchase_order_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_PO_LINE'; end if;
  if exists (select 1 from public.kfc_stock_moves where idempotency_key = p_key) then
    select * into v_row from public.kfc_stock_moves where idempotency_key = p_key; return v_row;
  end if;
  if (select status from public.kfc_purchase_orders where id = v_line.po_id) = 'cancelled' then
    raise exception 'KFC_PO_CANCELLED';
  end if;
  v_row := public.kfc_book_move(v_line.article_code, p_location, p_quantity, 'received', p_key,
    v_line.unit_cost_cents, null, null, p_created_by, null, p_line);
  update public.kfc_purchase_order_lines set received = received + p_quantity where id = p_line;
  if v_line.unit_cost_cents is not null then
    update public.kfc_articles set purchase_price_cents = v_line.unit_cost_cents, updated_at = now() where code = v_line.article_code;
  end if;
  select count(*) into v_open from public.kfc_purchase_order_lines where po_id = v_line.po_id and received < quantity;
  if v_open = 0 then
    update public.kfc_purchase_orders set status = 'received', received_at = now() where id = v_line.po_id and status = 'ordered';
  end if;
  return v_row;
end $$;

revoke all on function public.kfc_receive_po_line(uuid, integer, uuid, text, uuid) from public, anon, authenticated;
