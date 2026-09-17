/*
 * What stock was, and what it became.
 *
 * stock_items only ever held a current quantity. Nothing recorded a change,
 * so "we had five of these on Monday" was unanswerable, shrinkage was
 * invisible, and a number that looked wrong could not be traced to whoever
 * last touched it. Every job that consumes a part, every transfer between
 * vans, every hand correction writes a row here now.
 *
 * Written by a trigger rather than by the application: stock moves from four
 * different places (crm_use_material, crm_transfer_stock, crm_adjust_stock
 * and plain edits), and a log the application has to remember to write is a
 * log with holes in it.
 */

alter table public.stock_items
  add column if not exists category text;

comment on column public.stock_items.category is
  'Manual group override. Null means derive it from the catalogue — see src/lib/stockCategory.ts.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stock_items_category_check'
  ) then
    alter table public.stock_items
      add constraint stock_items_category_check
      check (
        category is null or category in (
          'sleutels', 'behuizingen', 'sleutelbaarden', 'elektronica', 'batterijen',
          'gereedschap', 'sloten', 'accessoires', 'woningsleutels', 'overig'
        )
      );
  end if;
end $$;


create table if not exists public.stock_moves (
  id            bigserial primary key,
  stock_item_id uuid,
  technician_id uuid,
  description   text not null,
  /* Signed: negative is stock leaving, positive is stock arriving. */
  delta         numeric(10,2) not null,
  quantity_after numeric(10,2) not null,
  unit_cost     numeric(10,2),
  reason        text not null check (reason in ('correctie', 'verbruik', 'ontvangst', 'overdracht', 'nieuw', 'verwijderd')),
  changed_by    uuid,
  changed_at    timestamptz not null default now()
);

create index if not exists stock_moves_item_idx on public.stock_moves (stock_item_id, changed_at desc);
create index if not exists stock_moves_tech_idx on public.stock_moves (technician_id, changed_at desc);
create index if not exists stock_moves_time_idx on public.stock_moves (changed_at desc);


create or replace function public.log_stock_move()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric(10,2);
  v_reason text;
begin
  if tg_op = 'INSERT' then
    v_delta := new.quantity;
    v_reason := 'nieuw';
  elsif tg_op = 'DELETE' then
    v_delta := -old.quantity;
    v_reason := 'verwijderd';
  else
    v_delta := new.quantity - old.quantity;
    /* An edit that does not move the count is not a stock movement. */
    if v_delta = 0 then
      return new;
    end if;
    v_reason := 'correctie';
  end if;

  insert into public.stock_moves (
    stock_item_id, technician_id, description, delta, quantity_after,
    unit_cost, reason, changed_by
  )
  values (
    coalesce(new.id, old.id),
    coalesce(new.technician_id, old.technician_id),
    coalesce(new.description, old.description),
    v_delta,
    coalesce(new.quantity, 0),
    coalesce(new.unit_cost, old.unit_cost),
    v_reason,
    auth.uid()
  );

  return coalesce(new, old);
end $$;

drop trigger if exists stock_moves_log_trg on public.stock_items;
create trigger stock_moves_log_trg
  after insert or update or delete on public.stock_items
  for each row execute function public.log_stock_move();


alter table public.stock_moves enable row level security;

grant select on public.stock_moves to authenticated;

/*
 * Read-only, and never amendable: the office sees every move, a monteur sees
 * their own van. Only the trigger inserts, and it runs as definer so it
 * succeeds without any policy granting an insert.
 */
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'stock_moves_read') then
    create policy stock_moves_read on public.stock_moves
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;
end $$;
