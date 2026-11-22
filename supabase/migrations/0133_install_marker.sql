-- 0133: which install a database belongs to.
--
-- Autosleutel24 and KeyForCars run the same code on two Supabase projects. The
-- app already refuses a project ref that does not match CRM_INSTALL
-- (src/lib/supabase/installGuard.ts). This is the second lock, inside the
-- database itself: a one-row table naming the install, read by the app at
-- start and every few minutes through crm_install_profile().
--
-- This migration deliberately inserts NOTHING. The same file runs on both
-- databases, so the value is set by hand, once per database, as the runbook
-- (docs/keyforcars-installatie.md) says:
--   KeyForCars    (lzdwxkhlscsitstxdgar): insert into public.crm_install (profile) values ('keyforcars');
--   Autosleutel24 (utctfircycpjmpjqmtmm): insert into public.crm_install (profile) values ('autosleutel24');
-- Without a row the app runs as before (unless CRM_REQUIRE_INSTALL_MARKER=1).
--
-- Additive and idempotent.

create table if not exists public.crm_install (
  -- Always true: the primary key makes a second row impossible.
  singleton boolean primary key default true check (singleton),
  profile text not null check (profile in ('autosleutel24', 'keyforcars')),
  set_at timestamptz not null default now()
);

comment on table public.crm_install is
  'One row: which CRM install (CRM_INSTALL) this database belongs to. Set by hand per database; see docs/keyforcars-installatie.md.';

-- No policies: nobody reads or writes the table through the API. The app reads
-- it only through the function below.
alter table public.crm_install enable row level security;
revoke all on public.crm_install from anon, authenticated;

-- The profile name only ('keyforcars' / 'autosleutel24' / null). Callable with
-- the anon key because the guard runs before anyone is signed in; it reveals
-- nothing a visitor could not already guess from the domain.
create or replace function public.crm_install_profile()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select profile from public.crm_install where singleton;
$$;

revoke all on function public.crm_install_profile() from public;
grant execute on function public.crm_install_profile() to anon, authenticated, service_role;
