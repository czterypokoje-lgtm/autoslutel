-- 0139: close an ordered purchase order short ("rest komt niet").
--
-- Problem: an ordered purchase order whose supplier delivers less than ordered
-- could never be finished. Only a draft could be cancelled, so the undelivered
-- rest stayed "incoming" forever: expected stock was overstated, real shortages
-- were hidden in the reorder proposal and the order stayed in every open list.
--
-- What this adds:
--   * status 'closed' on kfc_purchase_orders, with closed_at, closed_by and a
--     mandatory close_reason. Lines keep their ordered and received quantities;
--     nothing is deleted or rewritten, so the history stays true.
--   * kfc_close_purchase_order(p_po, p_reason, p_user): only from 'ordered',
--     locks the order row, works with part of the goods received or none at all
--     (the supplier cancelled). Refuses an order whose lines are all received
--     (KFC_PO_FULLY_RECEIVED: that order becomes 'received' on its last receipt,
--     as kfc_receive_po_line has always done). A replay on an already closed
--     order returns quietly. Codes: KFC_PO_REASON_REQUIRED, KFC_PO_NOT_FOUND,
--     KFC_PO_NOT_ORDERED, KFC_PO_FULLY_RECEIVED.
--   * kfc_receive_po_line refuses a closed order like a cancelled one
--     (KFC_PO_CLOSED next to 0110's KFC_PO_CANCELLED). It now also locks the
--     order row before the status check, so a receipt and a close on the same
--     order are serialised (line lock first, then order lock; the close only
--     locks the order, so there is no lock-order inversion).
--
-- Checked for the undelivered rest (incoming / open value / reorder / expected):
--   kfc_stock_position (0090, latest 0115)   incoming: status = 'ordered'  -> no change
--   kfc_webshop_position (0124)              reads kfc_stock_position       -> no change
--   kfc_article_overview (0131)              incoming from kfc_stock_position; its
--                                            suppliers CTE (last supplier / last PO cost)
--                                            uses status <> 'cancelled': a closed order
--                                            was a real purchase, so it stays -> no change
--   kfc_article_totals (0131)                counts incoming > 0 from the overview -> no change
--   kfc_product_master (0134)                reads kfc_stock_position       -> no change
--   kfc_woo stock sync (0132)                reads available, not incoming   -> no change
--   kfc_supplier_balance (0130)              open_pos: draft/ordered; late_pos and
--                                            on_order_cents: ordered        -> no change
--   kfc_purchase_line_facts (0130)           open_quantity was quantity - received for
--                                            every status                   -> CHANGED:
--                                            0 for a closed order (same columns)
--   kfc_receive_with_photo (0127)            refuses status <> 'ordered' (KFC_RECEIPT_CONFLICT)
--                                            -> no change, a closed order is refused there
--   kfc_stock_movement_report (0119), kfc_stock_ledger (0131): "incoming" there is
--                                            booked moves, not open orders -> no change
-- App side: the reorder proposal (voorraad) uses kfc_stock_position.incoming; the
-- owner dashboard reads only draft/ordered orders.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Columns and status
-- ---------------------------------------------------------------------------
alter table public.kfc_purchase_orders add column if not exists closed_at    timestamptz;
alter table public.kfc_purchase_orders add column if not exists closed_by    uuid;
alter table public.kfc_purchase_orders add column if not exists close_reason text;

-- The status check was created inline in 0090, so its name is generated. Find
-- every check constraint on exactly the status column, drop it, add ours.
do $$
declare
  v_attnum smallint;
  r record;
begin
  select attnum into v_attnum from pg_attribute
   where attrelid = 'public.kfc_purchase_orders'::regclass and attname = 'status' and not attisdropped;
  for r in
    select conname from pg_constraint
     where conrelid = 'public.kfc_purchase_orders'::regclass and contype = 'c' and conkey = array[v_attnum]
  loop
    execute format('alter table public.kfc_purchase_orders drop constraint %I', r.conname);
  end loop;
  alter table public.kfc_purchase_orders add constraint kfc_purchase_orders_status_check
    check (status in ('draft', 'ordered', 'received', 'cancelled', 'closed'));

  if not exists (select 1 from pg_constraint where conname = 'kfc_purchase_orders_closed_fields'
                   and conrelid = 'public.kfc_purchase_orders'::regclass) then
    alter table public.kfc_purchase_orders add constraint kfc_purchase_orders_closed_fields
      check (status <> 'closed' or (closed_at is not null and close_reason is not null and length(btrim(close_reason)) between 1 and 500));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Closing
-- ---------------------------------------------------------------------------
create or replace function public.kfc_close_purchase_order(p_po uuid, p_reason text, p_user uuid)
returns public.kfc_purchase_orders language plpgsql set search_path = '' as $$
declare
  v_po public.kfc_purchase_orders;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_reason = '' or length(v_reason) > 500 then raise exception 'KFC_PO_REASON_REQUIRED'; end if;
  select * into v_po from public.kfc_purchase_orders where id = p_po for update;
  if not found then raise exception 'KFC_PO_NOT_FOUND'; end if;
  if v_po.status = 'closed' then return v_po; end if;          -- replay: quiet
  if v_po.status <> 'ordered' then raise exception 'KFC_PO_NOT_ORDERED'; end if;
  -- Read after the order lock: a receipt that got the lock first is visible here.
  if not exists (select 1 from public.kfc_purchase_order_lines where po_id = p_po and received < quantity) then
    raise exception 'KFC_PO_FULLY_RECEIVED';
  end if;
  update public.kfc_purchase_orders
     set status = 'closed', closed_at = now(), closed_by = p_user, close_reason = v_reason
   where id = p_po
  returning * into v_po;
  return v_po;
end $$;

revoke all on function public.kfc_close_purchase_order(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.kfc_close_purchase_order(uuid, text, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Receiving: refuse a closed order like a cancelled one (body as 0110 plus the
-- order lock and the 'closed' branch).
-- ---------------------------------------------------------------------------
create or replace function public.kfc_receive_po_line(
  p_line uuid, p_quantity integer, p_location uuid, p_key text, p_created_by uuid default null
) returns public.kfc_stock_moves language plpgsql as $$
declare v_line public.kfc_purchase_order_lines; v_row public.kfc_stock_moves; v_open integer; v_status text;
begin
  if p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  select * into v_line from public.kfc_purchase_order_lines where id = p_line for update;
  if not found then raise exception 'KFC_NO_PO_LINE'; end if;
  if exists (select 1 from public.kfc_stock_moves where idempotency_key = p_key) then
    select * into v_row from public.kfc_stock_moves where idempotency_key = p_key; return v_row;
  end if;
  select status into v_status from public.kfc_purchase_orders where id = v_line.po_id for update;
  if v_status = 'cancelled' then
    raise exception 'KFC_PO_CANCELLED';
  end if;
  if v_status = 'closed' then
    raise exception 'KFC_PO_CLOSED';
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

-- ---------------------------------------------------------------------------
-- Reports: the rest of a closed order is no longer open (same columns as 0130).
-- ---------------------------------------------------------------------------
create or replace view public.kfc_purchase_line_facts as
select l.id as line_id, o.id as po_id, o.status, o.supplier_id, coalesce(s.name, o.supplier) as supplier_name,
       o.created_at, o.ordered_at, o.expected_on, o.received_at, o.invoice_ref,
       (coalesce(o.ordered_at, o.created_at) at time zone 'Europe/Amsterdam')::date as order_date,
       l.article_code, a.name as article_name, a.sku, a.category,
       l.quantity, l.received,
       case when o.status = 'closed' then 0 else greatest(l.quantity - l.received, 0) end as open_quantity,
       l.unit_cost_cents,
       l.quantity::bigint * l.unit_cost_cents as ordered_cents,
       l.received::bigint * l.unit_cost_cents as received_cents,
       (select max(m.created_at) from public.kfc_stock_moves m where m.purchase_order_line_id = l.id and m.reason = 'received') as last_receipt_at
  from public.kfc_purchase_order_lines l
  join public.kfc_purchase_orders o on o.id = l.po_id
  left join public.kfc_articles a on a.code = l.article_code
  left join public.kfc_suppliers s on s.id = o.supplier_id;

revoke all on public.kfc_purchase_line_facts from public, anon, authenticated;
grant select on public.kfc_purchase_line_facts to service_role;
