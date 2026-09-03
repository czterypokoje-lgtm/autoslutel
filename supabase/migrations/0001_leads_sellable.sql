-- ============================================================================
-- Turns `leads` into a table you can deduplicate, route and sell from.
--
-- Run this in the Supabase SQL editor. It is additive and idempotent: existing
-- rows and existing queries keep working, and /api/leads starts writing the new
-- columns automatically as soon as they exist.
-- ============================================================================

-- 1. Contact fields -----------------------------------------------------------
-- The phone number used to live inside the free-text `location` column, which
-- made deduplication and partner routing impossible.
alter table public.leads add column if not exists phone       text;
alter table public.leads add column if not exists phone_e164  text;
alter table public.leads add column if not exists name        text;
alter table public.leads add column if not exists email       text;
alter table public.leads add column if not exists postcode    text;

-- 2. Attribution --------------------------------------------------------------
-- Which form produced this lead: hero_form, city_form, kenteken_form,
-- contact_form, phone, …
alter table public.leads add column if not exists source      text default 'unknown';

-- 3. Consent ------------------------------------------------------------------
-- Required before a lead may lawfully be shared with or sold to a third party.
-- The burden of proof is on us, so store what was agreed and when.
alter table public.leads add column if not exists consent_marketing    boolean not null default false;
alter table public.leads add column if not exists consent_at           timestamptz;
alter table public.leads add column if not exists consent_text_version text;
alter table public.leads add column if not exists consent_ip           inet;

-- 4. Sales pipeline -----------------------------------------------------------
alter table public.leads add column if not exists status     text not null default 'new';
alter table public.leads add column if not exists sold_to    text;
alter table public.leads add column if not exists sold_at    timestamptz;
alter table public.leads add column if not exists sale_price numeric(10,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_status_check'
  ) then
    alter table public.leads
      add constraint leads_status_check
      check (status in ('new','qualified','contacted','sold','rejected','duplicate'));
  end if;
end $$;

-- 5. Backfill phone out of the legacy location string -------------------------
-- Historic rows stored it as "Utrecht (Tel: 0612345678)".
update public.leads
set phone = substring(location from '\(Tel:\s*([^)]+)\)')
where phone is null
  and location ~ '\(Tel:';

update public.leads
set location = btrim(regexp_replace(location, '\s*\(Tel:[^)]*\)', ''))
where location ~ '\(Tel:';

-- Normalise the backfilled numbers to E.164 so duplicates collapse.
update public.leads
set phone_e164 =
  case
    when regexp_replace(phone, '[^0-9+]', '', 'g') like '+31%'
      then '+31' || ltrim(substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 4), '0')
    when regexp_replace(phone, '[^0-9+]', '', 'g') like '0031%'
      then '+31' || ltrim(substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 5), '0')
    when regexp_replace(phone, '[^0-9+]', '', 'g') like '0%'
      then '+31' || substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 2)
    else null
  end
where phone is not null and phone_e164 is null;

-- 6. Indexes ------------------------------------------------------------------
create index if not exists leads_phone_e164_idx  on public.leads (phone_e164);
create index if not exists leads_created_at_idx  on public.leads (created_at desc);
create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_source_idx      on public.leads (source);

-- Same number on the same calendar day = one lead, not two.
/*
 * This cannot be indexed as `(created_at::date)`.
 *
 * `created_at` is a timestamptz, and turning one into a date depends on the
 * server's timezone — so the cast is STABLE, not IMMUTABLE, and Postgres
 * refuses it in an index (42P17). The original statement therefore never ran,
 * and deduplication was silently off from the day this file was written.
 *
 * The fix is a real column, pinned to the timezone the business actually works
 * in, maintained by a trigger. Now the value is fixed at insert time and the
 * index is allowed.
 */
alter table public.leads add column if not exists created_date date;

update public.leads
set created_date = (created_at at time zone 'Europe/Amsterdam')::date
where created_date is null;

create or replace function public.leads_set_created_date()
returns trigger
language plpgsql
as $$
begin
  new.created_date := ((coalesce(new.created_at, now())) at time zone 'Europe/Amsterdam')::date;
  return new;
end $$;

drop trigger if exists leads_created_date_trg on public.leads;
create trigger leads_created_date_trg
  before insert on public.leads
  for each row execute function public.leads_set_created_date();

/*
 * The unique index is only created when the existing rows allow it. Duplicates
 * that are already there are not this migration's to delete — a duplicate lead
 * is still somebody who called, and merging or dropping one is a decision for
 * the office, not for a schema change.
 */
do $$
begin
  if exists (
    select 1
    from (
      select phone_e164, created_date
      from public.leads
      where phone_e164 is not null
      group by phone_e164, created_date
      having count(*) > 1
    ) d
  ) then
    raise notice 'leads_dedupe_idx not created: duplicate phone/day pairs exist. Resolve them, then re-run.';
  else
    create unique index if not exists leads_dedupe_idx
      on public.leads (phone_e164, created_date)
      where phone_e164 is not null;
  end if;
end $$;

-- 7. Row Level Security -------------------------------------------------------
-- The API writes with the service-role key, which bypasses RLS. Enabling it
-- with no permissive policy means the anon/public key can read nothing —
-- so a leaked anon key cannot expose the lead table.
alter table public.leads enable row level security;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'anon_no_access'
  ) then
    drop policy anon_no_access on public.leads;
  end if;
end $$;

-- No policy = no access for anon/authenticated. Intentional.
