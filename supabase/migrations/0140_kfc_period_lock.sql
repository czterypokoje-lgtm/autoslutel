-- ============================================================================
-- 0140: period lock ("afgesloten periode") for the KeyForCars books.
--
--   kfc_period_lock      the current lock: at most one row (id is the constant
--                        true). No row = nothing is locked.
--   kfc_period_lock_log  append-only history of every change: old date, new
--                        date, who, when, note.
--   kfc_set_period_lock(p_until, p_user, p_note)
--                        set, move or remove the lock. The date must lie before
--                        today in Europe/Amsterdam (the shop is still trading
--                        today). Moving the lock back (reopening) or removing it
--                        (p_until null) needs a note. Serialised by an advisory
--                        lock; every change is logged; the same date twice is a
--                        no-op and is not logged.
--   kfc_period_lock_state()  current lock + last 20 log rows, for the screen.
--
-- Enforcement is by triggers, so the posting functions (0093/0094/0095/0129/
-- 0130/0090) stay untouched. Each trigger raises KFC_PERIOD_LOCKED when the
-- row's business date is on or before locked_until:
--   kfc_customer_ledger, kfc_supplier_ledger   entry_date
--   kfc_stock_moves                            created_at as an Amsterdam date
--
-- What is blocked, and why not more:
--   INSERT  always checked. Reversals (kfc_reverse_entry, kfc_reverse_supplier_
--           entry) insert a new row dated today, so reversing a locked-period
--           entry still works. kfc_book_move never takes a created_at from the
--           caller (always now()), so on stock moves this is a safety net.
--   DELETE  always checked.
--   UPDATE  only when a money or date column changes (ledgers: amount_cents,
--           vat_cents, entry_date, entry_type; stock moves: delta,
--           unit_cost_cents, created_at). Other updates are legitimate today
--           and must keep working on old rows: 0112 sets assembly_id on moves,
--           and the foreign keys "on delete set null" (sales_invoice_id,
--           purchase_order_id) update old rows when an invoice or order is
--           deleted. The triggers are declared "update of <those columns>", so
--           such updates do not even fire them.
--   TRUNCATE refused on the three tables while a lock exists.
--
-- With no lock row each trigger does one primary-key read of an empty table and
-- returns, so an install that never sets a lock (Autosleutel24) is unaffected.
-- Server-only like the other kfc_ tables. Idempotent.
-- ============================================================================
set search_path = public;

create table if not exists public.kfc_period_lock (
  id            boolean primary key default true check (id),
  locked_until  date not null,
  set_by        uuid,
  set_at        timestamptz not null default now(),
  note          text
);

create table if not exists public.kfc_period_lock_log (
  id         bigserial primary key,
  old_until  date,
  new_until  date,
  set_by     uuid,
  set_at     timestamptz not null default now(),
  note       text
);
create index if not exists kfc_period_lock_log_time_idx on public.kfc_period_lock_log (set_at desc, id desc);

-- The history is append-only.
create or replace function public.kfc_period_lock_log_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'kfc_period_lock_log is append-only';
end $$;
drop trigger if exists kfc_period_lock_log_guard on public.kfc_period_lock_log;
create trigger kfc_period_lock_log_guard before update or delete on public.kfc_period_lock_log
  for each row execute function public.kfc_period_lock_log_guard();
drop trigger if exists kfc_period_lock_log_no_truncate on public.kfc_period_lock_log;
create trigger kfc_period_lock_log_no_truncate before truncate on public.kfc_period_lock_log
  for each statement execute function public.kfc_period_lock_log_guard();

-- ---------------------------------------------------------------------------
-- Set / move / remove
-- ---------------------------------------------------------------------------
create or replace function public.kfc_set_period_lock(p_until date, p_user uuid, p_note text default null)
returns date language plpgsql set search_path = public, pg_temp as $$
declare
  v_today date := (now() at time zone 'Europe/Amsterdam')::date;
  v_old   date;
  v_note  text := nullif(btrim(coalesce(p_note, '')), '');
begin
  perform pg_advisory_xact_lock(hashtext('kfc_period_lock'));
  select locked_until into v_old from public.kfc_period_lock where id for update;

  if p_until is not null and p_until >= v_today then raise exception 'KFC_PERIOD_FUTURE'; end if;
  if p_until is not distinct from v_old then return v_old; end if;
  -- Reopening (moving back) or removing the lock needs a reason.
  if (p_until is null or (v_old is not null and p_until < v_old)) and v_note is null then
    raise exception 'KFC_PERIOD_NOTE_REQUIRED';
  end if;

  if p_until is null then
    delete from public.kfc_period_lock where id;
  else
    insert into public.kfc_period_lock (id, locked_until, set_by, set_at, note)
    values (true, p_until, p_user, now(), v_note)
    on conflict (id) do update set locked_until = excluded.locked_until, set_by = excluded.set_by,
                                   set_at = excluded.set_at, note = excluded.note;
  end if;
  insert into public.kfc_period_lock_log (old_until, new_until, set_by, note) values (v_old, p_until, p_user, v_note);
  return p_until;
end $$;

-- Current lock and the last 20 changes, for the settings screen.
create or replace function public.kfc_period_lock_state() returns jsonb
language sql stable set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'lock', (select to_jsonb(l) - 'id' from public.kfc_period_lock l where l.id),
    'log',  coalesce((select jsonb_agg(to_jsonb(g) order by g.set_at desc, g.id desc)
                        from (select * from public.kfc_period_lock_log order by set_at desc, id desc limit 20) g), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Enforcement
-- ---------------------------------------------------------------------------
create or replace function public.kfc_period_lock_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_until date; v_old date; v_new date;
begin
  select locked_until into v_until from public.kfc_period_lock where id;
  if v_until is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_table_name = 'kfc_stock_moves' then
    if tg_op <> 'INSERT' then v_old := (old.created_at at time zone 'Europe/Amsterdam')::date; end if;
    if tg_op <> 'DELETE' then v_new := (new.created_at at time zone 'Europe/Amsterdam')::date; end if;
    if tg_op = 'UPDATE' and (old.delta, old.unit_cost_cents, old.created_at)
                            is not distinct from (new.delta, new.unit_cost_cents, new.created_at) then
      return new;
    end if;
  else
    if tg_op <> 'INSERT' then v_old := old.entry_date; end if;
    if tg_op <> 'DELETE' then v_new := new.entry_date; end if;
    if tg_op = 'UPDATE' and (old.amount_cents, old.vat_cents, old.entry_date, old.entry_type)
                            is not distinct from (new.amount_cents, new.vat_cents, new.entry_date, new.entry_type) then
      return new;
    end if;
  end if;

  if v_old <= v_until or v_new <= v_until then
    raise exception 'KFC_PERIOD_LOCKED'
      using detail = format('%s: boekdatum %s, afgesloten t/m %s', tg_table_name, coalesce(v_new, v_old), v_until);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create or replace function public.kfc_period_lock_no_truncate() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.kfc_period_lock where id) then raise exception 'KFC_PERIOD_LOCKED'; end if;
  return null;
end $$;

drop trigger if exists kfc_customer_ledger_period_lock on public.kfc_customer_ledger;
create trigger kfc_customer_ledger_period_lock
  before insert or delete or update of amount_cents, vat_cents, entry_date, entry_type on public.kfc_customer_ledger
  for each row execute function public.kfc_period_lock_guard();

drop trigger if exists kfc_supplier_ledger_period_lock on public.kfc_supplier_ledger;
create trigger kfc_supplier_ledger_period_lock
  before insert or delete or update of amount_cents, vat_cents, entry_date, entry_type on public.kfc_supplier_ledger
  for each row execute function public.kfc_period_lock_guard();

drop trigger if exists kfc_stock_moves_period_lock on public.kfc_stock_moves;
create trigger kfc_stock_moves_period_lock
  before insert or delete or update of delta, unit_cost_cents, created_at on public.kfc_stock_moves
  for each row execute function public.kfc_period_lock_guard();

drop trigger if exists kfc_customer_ledger_period_lock_truncate on public.kfc_customer_ledger;
create trigger kfc_customer_ledger_period_lock_truncate before truncate on public.kfc_customer_ledger
  for each statement execute function public.kfc_period_lock_no_truncate();
drop trigger if exists kfc_supplier_ledger_period_lock_truncate on public.kfc_supplier_ledger;
create trigger kfc_supplier_ledger_period_lock_truncate before truncate on public.kfc_supplier_ledger
  for each statement execute function public.kfc_period_lock_no_truncate();
drop trigger if exists kfc_stock_moves_period_lock_truncate on public.kfc_stock_moves;
create trigger kfc_stock_moves_period_lock_truncate before truncate on public.kfc_stock_moves
  for each statement execute function public.kfc_period_lock_no_truncate();

-- ---------------------------------------------------------------------------
-- Server only
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['kfc_period_lock', 'kfc_period_lock_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on sequence public.kfc_period_lock_log_id_seq to service_role;
revoke all on function public.kfc_set_period_lock(date, uuid, text) from public, anon, authenticated;
revoke all on function public.kfc_period_lock_state() from public, anon, authenticated;
revoke all on function public.kfc_period_lock_guard() from public, anon, authenticated;
revoke all on function public.kfc_period_lock_no_truncate() from public, anon, authenticated;
revoke all on function public.kfc_period_lock_log_guard() from public, anon, authenticated;
grant execute on function public.kfc_set_period_lock(date, uuid, text) to service_role;
grant execute on function public.kfc_period_lock_state() to service_role;

notify pgrst, 'reload schema';
