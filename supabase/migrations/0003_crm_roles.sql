-- ============================================================================
-- CRM fase 1: rollen, toewijzing en RLS op `leads`.
--
-- Run this in the Supabase SQL editor, after 0001_leads_sellable.sql.
-- Additive and idempotent: /api/leads writes with the service-role key and
-- bypasses RLS, so lead capture keeps working while this runs.
--
-- The role lives in the user's JWT (`app_metadata.role`), not in a table, so a
-- policy check costs no extra read. Assign it once per user with the admin API:
--
--   supabase.auth.admin.updateUserById(id, { app_metadata: { role: 'kantoor' } })
--
-- Roles: owner | kantoor | monteur
-- A monteur gets no access to `leads` at all — that is deliberate, and it is
-- enforced here rather than in the UI.
-- ============================================================================

-- 1. Role helper --------------------------------------------------------------
-- Reads the role straight off the verified JWT. `stable` so Postgres calls it
-- once per statement instead of once per row.
create or replace function public.crm_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

comment on function public.crm_role() is
  'CRM role of the calling user, from the JWT app_metadata. Empty string when absent.';

-- 2. Ownership and audit columns ----------------------------------------------
-- Basic auth was a single shared password, so "who changed this" was
-- unanswerable. With per-user sessions it becomes answerable — record it.
alter table public.leads add column if not exists assigned_to      uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists updated_at       timestamptz;
alter table public.leads add column if not exists updated_by       uuid references auth.users (id) on delete set null;

-- First time anyone moved this lead out of `new`. The response-time metric
-- (lead → eerste contact) is unrecoverable after the fact, so capture it now
-- even though the report that uses it lands in a later phase.
alter table public.leads add column if not exists first_contact_at timestamptz;

create index if not exists leads_assigned_to_idx on public.leads (assigned_to);

-- The licence plate was never stored: the wizard resolves it against the RDW,
-- concatenates it into `model` ("XX-123-X — 3-serie") and drops the field. But
-- `jobs.kenteken` and `customer_vehicles` are both keyed on it, and a plate not
-- captured at lead time cannot be recovered later. Store it now.
alter table public.leads add column if not exists kenteken text;

create index if not exists leads_kenteken_idx on public.leads (upper(replace(kenteken, '-', '')));

-- 3. Stamp the audit columns on every update ----------------------------------
create or replace function public.leads_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();

  -- Leaving `new` for the first time is the moment of first contact.
  if new.first_contact_at is null
     and old.status = 'new'
     and new.status is distinct from 'new' then
    new.first_contact_at := now();
  end if;

  return new;
end $$;

drop trigger if exists leads_touch_trg on public.leads;
create trigger leads_touch_trg
  before update on public.leads
  for each row execute function public.leads_touch();

-- 4. Row Level Security -------------------------------------------------------
-- 0001 enabled RLS and deliberately left zero policies, so only the
-- service-role key could read. Office roles now get a way in; everyone else
-- (anon, monteur, a user with no role) still gets nothing.
alter table public.leads enable row level security;

/*
 * Grants come first, and they are not the same thing as the policies below.
 * Postgres checks table privileges before it ever looks at a row policy: with
 * no GRANT, `authenticated` gets "permission denied for table leads" (42501)
 * and the policy is never consulted. With the GRANT but no policy it would get
 * an empty list instead. Both are needed; neither is sufficient.
 *
 * This is safe precisely because RLS is on: the grant opens the table to every
 * signed-in user, and the policies below then narrow it to office roles. `anon`
 * is deliberately left out — a leaked anon key must still read nothing.
 */
grant select, update on public.leads to authenticated;
grant execute on function public.crm_role() to authenticated;

drop policy if exists leads_office_select on public.leads;
create policy leads_office_select on public.leads
  for select to authenticated
  using (public.crm_role() in ('owner', 'kantoor'));

drop policy if exists leads_office_update on public.leads;
create policy leads_office_update on public.leads
  for update to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

-- No insert policy: leads are created by /api/leads with the service-role key.
-- No delete policy: erasure requests are a later phase and must be logged.
