create table public.kfc_receipt_photos (
  move_id bigint primary key references public.kfc_stock_moves(id) on delete cascade,
  mime text not null check (mime in ('image/jpeg','image/png')),
  content bytea not null check (octet_length(content) between 1 and 2097152)
);
alter table public.kfc_receipt_photos enable row level security;
revoke all on public.kfc_receipt_photos from public,anon,authenticated;
grant select,insert,delete on public.kfc_receipt_photos to service_role;

create function public.kfc_receive_with_photo(p_line uuid,p_quantity integer,p_location uuid,p_key text,p_created_by uuid,p_photo text,p_mime text)
returns bigint language plpgsql set search_path='' as $$
declare l public.kfc_purchase_order_lines; m public.kfc_stock_moves;
begin
  perform pg_advisory_xact_lock(hashtext('receipt:' || p_key));
  select * into l from public.kfc_purchase_order_lines where id=p_line for update;
  if not found then raise exception 'KFC_NO_PO_LINE'; end if;
  select * into m from public.kfc_stock_moves where idempotency_key=p_key;
  if found then
    if m.purchase_order_line_id is distinct from p_line or m.delta<>p_quantity or m.location_id is distinct from p_location
      then raise exception 'KFC_RECEIPT_CONFLICT'; end if;
    if p_photo is not null and not exists(select 1 from public.kfc_receipt_photos where move_id=m.id and content=decode(p_photo,'base64') and mime=p_mime)
      then raise exception 'KFC_RECEIPT_CONFLICT'; end if;
    return m.id;
  end if;
  if l.received+p_quantity>l.quantity or (select status from public.kfc_purchase_orders where id=l.po_id)<>'ordered'
    then raise exception 'KFC_RECEIPT_CONFLICT'; end if;
  m:=public.kfc_receive_po_line(p_line,p_quantity,p_location,p_key,p_created_by);
  if p_photo is not null then insert into public.kfc_receipt_photos values(m.id,p_mime,decode(p_photo,'base64')); end if;
  return m.id;
end $$;
revoke all on function public.kfc_receive_with_photo(uuid,integer,uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.kfc_receive_with_photo(uuid,integer,uuid,text,uuid,text,text) to service_role;
