-- ============================================================================
-- CRM fase 2: monteurs, jobs en agenda.
--
-- Run in the Supabase SQL editor, after 0003_crm_roles.sql. Idempotent.
--
-- The shape follows the flow the business actually runs:
--   lead → job → (fase 4) factuur
-- A job is where a lead becomes work: a technician, a time window, an address
-- and a plate. Everything the monteur screen in fase 3 needs hangs off it.
-- ============================================================================

-- 1. Monteurs -----------------------------------------------------------------
create table if not exists public.technicians (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users (id) on delete set null,
  name        text not null,
  phone       text,
  active      boolean not null default true,
  -- Dutch postcode ranges this person covers: {'3500-3599','1000-1099'}.
  -- The first four digits are the region, which is all routing needs.
  werkgebied  text[] not null default '{}',
  -- Column colour in the agenda. Set per person so the day view is readable
  -- at a glance rather than by reading names.
  color       text not null default '#2c4a63',
  created_at  timestamptz not null default now()
);

comment on column public.technicians.user_id is
  'Links the monteur to their login. Null means someone who is planned but has no CRM account yet.';

-- 2. Jobs ---------------------------------------------------------------------
create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  -- Where the work came from. Both nullable: a job can be created by hand.
  lead_id        uuid references public.leads (id) on delete set null,
  order_id       uuid references public.orders (id) on delete set null,

  technician_id  uuid references public.technicians (id) on delete set null,
  status         text not null default 'gepland',

  /*
   * A time window, not a clock time. In emergency work "14:00" is a promise
   * that cannot be kept — the job before it runs over. A two-hour window is
   * both honest and what the customer is actually told.
   */
  scheduled_date date not null,
  slot_start     time not null,
  slot_end       time not null,

  street         text,
  postcode       text,
  city           text,
  kenteken       text,

  service_type   text,
  quoted_price   numeric(10,2),
  final_price    numeric(10,2),

  started_at     timestamptz,
  completed_at   timestamptz,

  signature_url  text,
  notes          text,

  updated_at     timestamptz,
  updated_by     uuid references auth.users (id) on delete set null,

  constraint jobs_status_check check (
    status in ('gepland', 'onderweg', 'bezig', 'afgerond', 'geannuleerd')
  ),
  constraint jobs_slot_check check (slot_end > slot_start)
);

create index if not exists jobs_technician_date_idx on public.jobs (technician_id, scheduled_date);
create index if not exists jobs_status_date_idx     on public.jobs (status, scheduled_date);
create index if not exists jobs_date_idx            on public.jobs (scheduled_date);
create index if not exists jobs_lead_idx            on public.jobs (lead_id);

-- 3. Availability -------------------------------------------------------------
create table if not exists public.technician_availability (
  technician_id uuid not null references public.technicians (id) on delete cascade,
  date          date not null,
  available     boolean not null default false,
  reason        text,
  primary key (technician_id, date)
);

-- 4. Audit stamp on jobs ------------------------------------------------------
create or replace function public.jobs_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();

  -- Timestamps that describe the work, filled from the status the monteur taps
  -- rather than from a separate form nobody would complete.
  if new.status = 'bezig' and new.started_at is null then
    new.started_at := now();
  end if;
  if new.status = 'afgerond' and new.completed_at is null then
    new.completed_at := now();
  end if;

  return new;
end $$;

drop trigger if exists jobs_touch_trg on public.jobs;
create trigger jobs_touch_trg
  before update on public.jobs
  for each row execute function public.jobs_touch();

-- 5. Grants -------------------------------------------------------------------
-- Learned the hard way on `leads`: without these Postgres answers "permission
-- denied" and never reaches a policy. `anon` gets nothing, deliberately.
grant select, insert, update on public.jobs                   to authenticated;
grant select, insert, update on public.technicians            to authenticated;
grant select, insert, update on public.technician_availability to authenticated;

-- 6. Row Level Security -------------------------------------------------------
alter table public.jobs                    enable row level security;
alter table public.technicians             enable row level security;
alter table public.technician_availability enable row level security;

/*
 * A monteur sees their own work and nothing else, and only the window they can
 * act on. Enforced here rather than in the UI: if a phone is lost, whoever has
 * it still cannot read another technician's day, let alone the lead table.
 */
drop policy if exists jobs_monteur_select on public.jobs;
create policy jobs_monteur_select on public.jobs
  for select to authenticated
  using (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
    and scheduled_date between current_date - 1 and current_date + 7
  );

drop policy if exists jobs_monteur_update on public.jobs;
create policy jobs_monteur_update on public.jobs
  for update to authenticated
  using (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
    and scheduled_date between current_date - 1 and current_date + 7
  )
  with check (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
  );

drop policy if exists jobs_office_all on public.jobs;
create policy jobs_office_all on public.jobs
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- Every signed-in role may read the technician list: the monteur app shows who
-- is on today, and the agenda cannot draw columns without it. Only the office
-- may change it.
drop policy if exists technicians_read on public.technicians;
create policy technicians_read on public.technicians
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor', 'monteur'));

drop policy if exists technicians_office_write on public.technicians;
create policy technicians_office_write on public.technicians
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists availability_read on public.technician_availability;
create policy availability_read on public.technician_availability
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor', 'monteur'));

drop policy if exists availability_office_write on public.technician_availability;
create policy availability_office_write on public.technician_availability
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- 7. Link a lead to its job ---------------------------------------------------
-- Handy for the leads list, which shows "already planned" without a join in
-- application code.
create index if not exists jobs_lead_status_idx on public.jobs (lead_id, status);
