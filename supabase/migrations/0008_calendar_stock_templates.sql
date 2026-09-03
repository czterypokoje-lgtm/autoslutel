-- ============================================================================
-- CRM fase 7: agenda-feed, voorraad in de bus en dienstsjablonen.
--
-- Run after 0007_payments_ledger.sql. Idempotent.
-- ============================================================================

-- 1. Agenda-feed --------------------------------------------------------------
/*
 * A calendar app on a phone cannot log in — it fetches a URL and nothing else.
 * So the URL itself is the credential: 64 random hex characters, one per
 * monteur, revocable by generating a new one.
 *
 * Because that link can be forwarded or end up in a synced backup, the feed
 * deliberately carries less than the app does: time, address, service, plate.
 * No phone number, no price, no notes. Whoever finds the link learns where a
 * van will be, not who the customer is.
 */
alter table public.technicians add column if not exists ical_token text;

update public.technicians
set ical_token = replace(gen_random_uuid()::text, '-', '')
                 || replace(gen_random_uuid()::text, '-', '')
where ical_token is null;

alter table public.technicians alter column ical_token set default
  (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

create unique index if not exists technicians_ical_token_idx on public.technicians (ical_token);

-- 2. Dienstsjablonen ----------------------------------------------------------
/*
 * The same handful of jobs, priced the same way, typed out by hand every time.
 * A template is one tap in the planner and on the van screen, and it is also
 * where the monteur's fee per job type will live once that rule is decided.
 */
create table if not exists public.service_templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  service_type   text not null,
  price_incl     numeric(10,2),
  duration_slots smallint not null default 1,
  -- Filled in when the earnings rule is settled: either a fixed fee or a
  -- percentage. Both nullable so neither is assumed.
  monteur_fee    numeric(10,2),
  monteur_pct    numeric(5,2),
  active         boolean not null default true,
  sort_order     smallint not null default 100,
  created_at     timestamptz not null default now(),

  constraint service_templates_pct_check check (
    monteur_pct is null or (monteur_pct >= 0 and monteur_pct <= 100)
  )
);

create index if not exists service_templates_active_idx on public.service_templates (active, sort_order);

-- 3. Voorraad in de bus -------------------------------------------------------
/*
 * `technician_id is null` means the central stock. Anything else is what is
 * physically in that van — which is the number that matters when a monteur is
 * standing next to a car deciding whether they can finish the job now.
 */
create table if not exists public.stock_items (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid references public.technicians (id) on delete cascade,
  product_slug  text,
  description   text not null,
  quantity      numeric(10,2) not null default 0,
  min_quantity  numeric(10,2) not null default 0,
  unit_cost     numeric(10,2),
  updated_at    timestamptz not null default now(),

  constraint stock_items_quantity_check check (quantity >= 0)
);

create unique index if not exists stock_items_unique_idx
  on public.stock_items (coalesce(technician_id, '00000000-0000-0000-0000-000000000000'::uuid), description);

create index if not exists stock_items_low_idx on public.stock_items (technician_id)
  where quantity <= min_quantity;

-- Materials used on a job may point at a stock row, which then goes down.
alter table public.job_materials add column if not exists stock_item_id uuid
  references public.stock_items (id) on delete set null;

/*
 * Stock is decremented by the database, not by the app.
 *
 * The monteur records what they used because the job needs it; the stock
 * moving is a consequence, and a consequence that lives in application code is
 * one that eventually gets skipped on some path nobody tested.
 */
create or replace function public.job_material_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock_item_id is not null then
    update public.stock_items
    set quantity = greatest(quantity - new.quantity, 0),
        updated_at = now()
    where id = new.stock_item_id;
  end if;
  return new;
end $$;

drop trigger if exists job_material_stock_trg on public.job_materials;
create trigger job_material_stock_trg
  after insert on public.job_materials
  for each row execute function public.job_material_stock();

-- 4. Garantie -----------------------------------------------------------------
/*
 * The same plate coming back soon after a finished job is either a warranty
 * case or a second key — and the difference matters before anyone quotes a
 * price. Derived, not stored: a stored flag would go stale the moment a job is
 * rescheduled.
 */
drop view if exists public.crm_warranty_watch;
create view public.crm_warranty_watch as
select
  j.kenteken,
  j.id                as job_id,
  j.scheduled_date,
  j.service_type,
  j.technician_id,
  j.final_price,
  (current_date - j.scheduled_date) as dagen_geleden
from public.jobs j
where j.status = 'afgerond'
  and j.kenteken is not null
  and j.kenteken <> ''
  and j.scheduled_date >= current_date - 365
  and public.crm_visible();

-- 5. Grants -------------------------------------------------------------------
grant select                        on public.crm_warranty_watch to authenticated;
grant select, insert, update        on public.service_templates  to authenticated;
grant select, insert, update, delete on public.stock_items       to authenticated;

-- 6. Row Level Security -------------------------------------------------------
alter table public.service_templates enable row level security;
alter table public.stock_items       enable row level security;

-- Everyone signed in reads the templates; the van screen needs them too.
drop policy if exists templates_read on public.service_templates;
create policy templates_read on public.service_templates
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor', 'monteur'));

drop policy if exists templates_write on public.service_templates;
create policy templates_write on public.service_templates
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- A monteur sees the central stock and their own van, not a colleague's.
drop policy if exists stock_read on public.stock_items;
create policy stock_read on public.stock_items
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or (
      public.crm_role() = 'monteur'
      and (
        technician_id is null
        or technician_id in (select id from public.technicians where user_id = auth.uid())
      )
    )
  );

drop policy if exists stock_write on public.stock_items;
create policy stock_write on public.stock_items
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- 7. Availability, now that a monteur enters it themselves --------------------
drop policy if exists availability_own_write on public.technician_availability;
create policy availability_own_write on public.technician_availability
  for all to authenticated
  using (
    public.crm_role() = 'monteur'
    and technician_id in (select id from public.technicians where user_id = auth.uid())
  )
  with check (
    public.crm_role() = 'monteur'
    and technician_id in (select id from public.technicians where user_id = auth.uid())
  );

grant delete on public.technician_availability to authenticated;

-- 8. security_invoker where available -----------------------------------------
do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    execute 'alter view public.crm_warranty_watch set (security_invoker = true)';
  end if;
end $$;

notify pgrst, 'reload schema';
