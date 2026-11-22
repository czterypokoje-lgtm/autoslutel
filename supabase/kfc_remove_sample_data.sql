-- KeyForCars: remove ONLY the sample data that "Laad voorbeeldgegevens" wrote into the real tables.
--   sample orders = woo_order_id >= 900000000 (raw.source = 'sample'), with their lines and refunds
--   sample stock  = the counts booked with key 'sample-count-<article>' (12 per article)
-- Real orders, real counts, purchase orders, till and accounts stay.
--
-- A bin that held sample stock may have been counted for real afterwards. Then the real count stands:
--   - counted to another number  -> that number stays (the ledger is rebased so it still adds up);
--   - counted and found the same -> the number stays, booked as a real count.
--
-- All or nothing: if any statement fails, nothing is changed. The last query shows what was removed.
begin;

create temp table _sample_orders on commit drop as
  select id from public.kfc_shop_orders where woo_order_id >= 900000000 or raw @> '{"source":"sample"}'::jsonb;
create temp table _sample_lines on commit drop as
  select id, article_code from public.kfc_shop_order_lines where order_id in (select id from _sample_orders);
create temp table _sample_moves on commit drop as
  select id, article_code, location_id from public.kfc_stock_moves
   where idempotency_key like 'sample-count-%' or order_line_id in (select id from _sample_lines);
create temp table _touched on commit drop as
  select article_code from _sample_moves union select article_code from _sample_lines where article_code is not null;
create temp table _bins on commit drop as
  select l.article_code, l.location_id, l.quantity, l.last_counted_at,
         (select max(m.created_at) from public.kfc_stock_moves m
           where m.article_code = l.article_code and m.location_id = l.location_id and m.reason = 'count') as last_count_move
    from public.kfc_stock_levels l
   where exists (select 1 from _sample_moves s where s.article_code = l.article_code and s.location_id = l.location_id);
create temp table _removed on commit drop as
  select (select count(*) from _sample_orders) as sample_orders,
         (select count(*) from _sample_lines) as sample_lines,
         (select count(*) from _sample_moves) as sample_stock_moves,
         (select count(*) from public.kfc_reservations where order_line_id in (select id from _sample_lines)) as sample_reservations,
         0 as bins_with_a_real_count_kept;

-- Orders first: their lines, refunds and returns go with them.
delete from public.kfc_shop_orders where id in (select id from _sample_orders);
delete from public.kfc_reservations where order_line_id in (select id from _sample_lines);
delete from public.kfc_stock_moves where id in (select id from _sample_moves);

-- Every bin that held sample stock: rebuild it from what really happened there.
do $$
declare b record; m record; v_run integer; v_confirmed boolean; v_kept integer := 0;
begin
  for b in select * from _bins loop
    -- A count call after the last recorded count that changed nothing leaves no move, only a newer
    -- last_counted_at: somebody counted this bin and found the number right.
    v_confirmed := b.last_counted_at is not null and b.last_count_move is not null
                   and b.last_counted_at > b.last_count_move + interval '5 seconds';
    v_run := 0;
    for m in select id, reason, delta, quantity_after from public.kfc_stock_moves
              where article_code = b.article_code and location_id = b.location_id order by id loop
      if m.reason = 'count' then            -- a count states a number: its difference is measured from what was there
        if m.quantity_after - v_run = 0 then delete from public.kfc_stock_moves where id = m.id;
        else update public.kfc_stock_moves set delta = m.quantity_after - v_run where id = m.id; end if;
        v_run := m.quantity_after;
      else                                   -- anything else is a difference: the running number follows
        v_run := v_run + m.delta;
        update public.kfc_stock_moves set quantity_after = v_run where id = m.id;
      end if;
    end loop;
    if v_confirmed and b.quantity <> v_run then
      insert into public.kfc_stock_moves (article_code, location_id, delta, quantity_after, reason, note, idempotency_key)
      values (b.article_code, b.location_id, b.quantity - v_run, b.quantity, 'count',
              'Telling bevestigd; voorbeeldvoorraad verwijderd', 'sample-cleanup-' || b.article_code || '-' || b.location_id);
      v_run := b.quantity;
    end if;
    if exists (select 1 from public.kfc_stock_moves where article_code = b.article_code and location_id = b.location_id) then
      update public.kfc_stock_levels set quantity = v_run, updated_at = now()
       where article_code = b.article_code and location_id = b.location_id;
      v_kept := v_kept + 1;
    else
      delete from public.kfc_stock_levels where article_code = b.article_code and location_id = b.location_id;
    end if;
  end loop;
  update _removed set bins_with_a_real_count_kept = v_kept;
end
$$;

-- Real orders that had reserved (or picked) sample stock: give the units back, so the allocator
-- below reserves again against what is really there. The allocator alone never takes units back.
create temp table _reset on commit drop as
  select l.id, l.order_id, l.article_code, l.reserved
    from public.kfc_shop_order_lines l
   where l.article_code in (select article_code from _touched) and l.reserved > 0
     and l.state in ('open', 'short', 'reserved', 'picked');
insert into public.kfc_reservations (article_code, order_line_id, delta)
  select article_code, id, -reserved from _reset;
update public.kfc_shop_order_lines set reserved = 0, picked = 0, state = 'open' where id in (select id from _reset);
update public.kfc_shop_orders set fulfilment = 'open' where fulfilment = 'picked' and id in (select order_id from _reset);
do $$
declare r record;
begin
  for r in select article_code from _touched where article_code is not null loop
    perform public.kfc_allocate(r.article_code);
  end loop;
end
$$;

select r.*,
       (select count(*) from public.kfc_shop_orders) as orders_left,
       (select count(*) from public.kfc_stock_levels) as stock_rows_left,
       (select count(*) from public.kfc_stock_levels l
          left join (select article_code, location_id, sum(delta) s from public.kfc_stock_moves group by 1, 2) m using (article_code, location_id)
         where l.quantity <> coalesce(m.s, 0)) as counter_ledger_mismatch
  from _removed r;

commit;
