-- ============================================================================
-- CRM: vehicle facts from the RDW plate lookup, stored on the lead and the job.
--
-- NOT APPLIED. Paste it into the Supabase SQL editor only after the owner OKs.
-- Additive and idempotent: only new nullable columns, nothing is read, changed
-- or dropped. There is no migration runner.
--
-- NUMBER: 0078 is the next free number on main (latest there is 0077). The
-- branch lane/j1-jobroom also uses 0078 to 0084. Whichever merges second must
-- renumber this file (for example to 0085) before it is run.
--
-- Source: opendata.rdw.nl datasets m9d7-ebf2 (vehicle) and 8ys7-d773 (fuel).
-- RDW open data holds no owner name or address. The plate itself is already in
-- leads.kenteken and jobs.kenteken (0003), so it is not repeated here.
-- ============================================================================

alter table public.leads
  add column if not exists rdw_make               text,
  add column if not exists rdw_model              text,
  add column if not exists rdw_first_registration date,
  add column if not exists rdw_version            text,
  add column if not exists rdw_fuel               text,
  add column if not exists rdw_colour             text,
  add column if not exists rdw_catalogue_price    integer,
  add column if not exists rdw_last_owner_change  date,
  add column if not exists rdw_apk_expiry         date,
  add column if not exists rdw_taxi               boolean,
  add column if not exists rdw_export             boolean,
  add column if not exists rdw_key_hint           text,
  add column if not exists rdw_checked_at         timestamptz;

alter table public.jobs
  add column if not exists rdw_make               text,
  add column if not exists rdw_model              text,
  add column if not exists rdw_first_registration date,
  add column if not exists rdw_version            text,
  add column if not exists rdw_fuel               text,
  add column if not exists rdw_colour             text,
  add column if not exists rdw_catalogue_price    integer,
  add column if not exists rdw_last_owner_change  date,
  add column if not exists rdw_apk_expiry         date,
  add column if not exists rdw_taxi               boolean,
  add column if not exists rdw_export             boolean,
  add column if not exists rdw_key_hint           text,
  add column if not exists rdw_checked_at         timestamptz;

comment on column public.leads.rdw_version is
  'RDW type / variant / uitvoering joined with spaces, so the technician brings the right key and programmer.';
comment on column public.leads.rdw_fuel is
  'RDW fuels joined with " + " (hybrids have two rows at RDW).';
comment on column public.leads.rdw_key_hint is
  'Only an indication from the fuel type (hybrid/electric), to be checked with the customer. Never an RDW fact.';
comment on column public.leads.rdw_checked_at is
  'When RDW was asked. Open data can be stale (APK date, owner change): refresh before relying on it for a later job.';

-- A taxi is a B2B lead; a known export car is checked before the job.
create index if not exists leads_rdw_taxi_idx on public.leads (created_at desc) where rdw_taxi is true;
