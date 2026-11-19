-- ============================================================================
-- CRM fase 8: webshopbestellingen in het CRM.
--
-- Run after 0008_calendar_stock_templates.sql. Idempotent.
--
-- 0002 created `orders` and then revoked everything from `authenticated`, so
-- only the service-role key could read it. That was right at the time — there
-- was no CRM. Now there is one, and it needs to see orders without the API
-- routes handing out a service-role client to a browser session.
-- ============================================================================

-- 1. Fulfilment ---------------------------------------------------------------
/*
 * Track & trace lives on the order rather than in a separate shipments table:
 * this shop sends one parcel per order. If that ever stops being true, a
 * shipments table is the change, and it will be obvious when it happens.
 */
alter table public.orders add column if not exists carrier        text;
alter table public.orders add column if not exists tracking_code  text;
alter table public.orders add column if not exists shipped_at     timestamptz;
alter table public.orders add column if not exists delivered_at   timestamptz;

-- Herroepingsrecht: fourteen days, and the clock starts at delivery. Recording
-- when the customer asked is what makes the deadline checkable afterwards.
alter table public.orders add column if not exists return_requested_at timestamptz;
alter table public.orders add column if not exists return_reason       text;
alter table public.orders add column if not exists refunded_at         timestamptz;

alter table public.orders add column if not exists internal_note  text;
alter table public.orders add column if not exists updated_by     uuid references auth.users (id) on delete set null;

create index if not exists orders_needs_technician_idx
  on public.orders (needs_technician, created_at desc)
  where needs_technician = true;

-- 2. Timestamps that follow the status ----------------------------------------
/*
 * Same reasoning as on jobs: the person changing the status is holding a parcel
 * or a phone, not filling in a date field. The timestamp follows the action.
 */
create or replace function public.orders_status_stamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'shipped' and new.shipped_at is null then
    new.shipped_at := now();
  end if;
  if new.status = 'delivered' and new.delivered_at is null then
    new.delivered_at := now();
  end if;
  if new.status = 'refunded' and new.refunded_at is null then
    new.refunded_at := now();
  end if;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists orders_status_stamps_trg on public.orders;
create trigger orders_status_stamps_trg
  before update on public.orders
  for each row execute function public.orders_status_stamps();

-- 3. Grants and RLS -----------------------------------------------------------
-- Office only. A monteur fits keys; they do not ship parcels, and the order
-- table carries names and addresses of people they will never visit.
grant select, update on public.orders to authenticated;

drop policy if exists orders_office_read on public.orders;
create policy orders_office_read on public.orders
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists orders_office_write on public.orders;
create policy orders_office_write on public.orders
  for update to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- No insert policy: orders are created by /api/checkout with the service-role
-- key. A hand-typed order would have no payment behind it.

-- 4. Wat nog gepland moet worden ----------------------------------------------
/*
 * The gap the handoff document warned about: a customer pays for a service
 * order and nobody comes, because the order sits in one table and the agenda
 * reads another. This view is the queue that closes it.
 */
drop view if exists public.crm_orders_to_plan;
create view public.crm_orders_to_plan as
select
  o.id,
  o.order_number,
  o.name,
  o.phone,
  o.email,
  o.street,
  o.postcode,
  o.city,
  o.kenteken,
  o.total_inc,
  o.status,
  o.paid_at,
  o.created_at
from public.orders o
where o.needs_technician = true
  and o.status in ('paid', 'processing')
  and not exists (
    select 1 from public.jobs j
    where j.order_id = o.id and j.status <> 'geannuleerd'
  )
  and public.crm_visible();

grant select on public.crm_orders_to_plan to authenticated;

-- 5. security_invoker where available -----------------------------------------
do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    execute 'alter view public.crm_orders_to_plan set (security_invoker = true)';
  end if;
end $$;

notify pgrst, 'reload schema';
