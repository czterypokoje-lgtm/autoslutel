-- ============================================================================
-- CRM fase 3: wat de monteur op straat vastlegt.
--
-- Run after 0004_jobs_agenda.sql. Idempotent.
--
-- Photos and a signature are not paperwork: they are the evidence in a dispute
-- and the reference on a warranty claim months later. Materials are what makes
-- the job's real cost knowable.
-- ============================================================================

-- 1. The one contact detail the monteur needs ---------------------------------
/*
 * A monteur has no access to `leads` — deliberately, and enforced by RLS. But
 * "call the customer" is the single most used button on the van screen, so the
 * name and number are copied onto the job when it is planned.
 *
 * This is denormalisation with a privacy dividend: the field carries exactly
 * one person's number to exactly the person driving there, instead of opening
 * the lead table to do it.
 */
alter table public.jobs add column if not exists customer_name  text;
alter table public.jobs add column if not exists customer_phone text;

-- 2. Photos -------------------------------------------------------------------
create table if not exists public.job_photos (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.jobs (id) on delete cascade,
  url        text not null,
  kind       text not null default 'after',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,

  constraint job_photos_kind_check check (kind in ('before', 'after', 'damage'))
);

create index if not exists job_photos_job_idx on public.job_photos (job_id, created_at);

-- 3. Materials ----------------------------------------------------------------
create table if not exists public.job_materials (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references public.jobs (id) on delete cascade,
  -- Points at the webshop catalogue when the part came from stock; free text
  -- when it did not. Both happen, so neither is required.
  product_slug  text,
  description   text not null,
  quantity      numeric(10,2) not null default 1,
  unit_cost     numeric(10,2),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null
);

create index if not exists job_materials_job_idx on public.job_materials (job_id);

-- 4. Grants -------------------------------------------------------------------
grant select, insert, delete on public.job_photos    to authenticated;
grant select, insert, delete on public.job_materials to authenticated;

-- 5. Row Level Security -------------------------------------------------------
alter table public.job_photos    enable row level security;
alter table public.job_materials enable row level security;

/*
 * Access follows the job. A monteur may add to and read the record of a job
 * that is theirs and inside their window; the office sees everything. Written
 * as an `exists` against `jobs` so the rules live in one place — change who may
 * see a job and this follows automatically.
 */
create or replace function public.can_touch_job(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when public.crm_role() in ('owner', 'kantoor') then true
      when public.crm_role() = 'monteur' then exists (
        select 1
        from public.jobs j
        join public.technicians t on t.id = j.technician_id
        where j.id = target
          and t.user_id = auth.uid()
          and j.scheduled_date between current_date - 1 and current_date + 7
      )
      else false
    end;
$$;

grant execute on function public.can_touch_job(uuid) to authenticated;

drop policy if exists job_photos_access on public.job_photos;
create policy job_photos_access on public.job_photos
  for select to authenticated
  using (public.can_touch_job(job_id));

drop policy if exists job_photos_insert on public.job_photos;
create policy job_photos_insert on public.job_photos
  for insert to authenticated
  with check (public.can_touch_job(job_id));

-- Only the office may remove evidence, and even then it is a deliberate act.
drop policy if exists job_photos_delete on public.job_photos;
create policy job_photos_delete on public.job_photos
  for delete to authenticated
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists job_materials_access on public.job_materials;
create policy job_materials_access on public.job_materials
  for select to authenticated
  using (public.can_touch_job(job_id));

drop policy if exists job_materials_insert on public.job_materials;
create policy job_materials_insert on public.job_materials
  for insert to authenticated
  with check (public.can_touch_job(job_id));

drop policy if exists job_materials_delete on public.job_materials;
create policy job_materials_delete on public.job_materials
  for delete to authenticated
  using (public.can_touch_job(job_id));
