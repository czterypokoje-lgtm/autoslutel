-- 0073 — Which country a monteur works in, and which language they read.
--
-- Two separate facts, and conflating them would be wrong in both directions.
--
-- 1. COUNTRY
--    Dispatch needs it. A werkgebied range is now written 'DE:40000-40999'
--    (see src/lib/crmJobs.ts), because the Dutch and German postcode spaces
--    overlap — '3500-3599' would otherwise match a job in 35001 Hessen, whose
--    first four digits read as a perfectly good Dutch postcode. The prefix is
--    on the range itself so that no row already in this table changes meaning,
--    but the technician's own country is what the profile form needs in order
--    to offer the right shape and to validate what was typed.
--
-- 2. LOCALE
--    The CRM is one deployment for all three countries: the office works in
--    Dutch and a Berlin partner does not read it. So the interface language
--    cannot come from the build (SITE_ID picks the public site's language, and
--    there is only one admin), and it cannot be derived from the country
--    either — Belgium is Dutch and French, and a German-speaking monteur may
--    perfectly well work a Belgian postcode.
--
--    Hence a column the person sets themselves, defaulting to 'nl' so that
--    every existing monteur sees exactly what they saw yesterday.
--
-- Run this BEFORE deploying the code that uses it.

alter table public.technicians
  add column if not exists country text not null default 'NL';

alter table public.technicians
  add column if not exists locale text not null default 'nl';

-- Only the countries dispatch can route and the languages the CRM has strings
-- for. A typo'd 'De' would silently never match a werkgebied.
alter table public.technicians
  drop constraint if exists technicians_country_check;
alter table public.technicians
  add constraint technicians_country_check
  check (country in ('NL', 'BE', 'DE'));

alter table public.technicians
  drop constraint if exists technicians_locale_check;
alter table public.technicians
  add constraint technicians_locale_check
  check (locale in ('nl', 'de', 'fr'));

comment on column public.technicians.country is
  'Country this monteur works in. Drives the werkgebied format (NL/BE four digits, DE five) and dispatch matching.';
comment on column public.technicians.locale is
  'CRM interface language this monteur reads. Set by the monteur, not derived from country: Belgium is nl and fr.';

-- ── a monteur may change their own language ────────────────────────────────
--
-- crm_update_own_profile (0012) and crm_update_own_business (0062) already
-- establish the pattern: a function that can only ever reach the caller's own
-- row, and only the columns named in it. Language belongs in that set —
-- picking it is not an office decision. Country is NOT in it: which country
-- somebody invoices from affects dispatch, VAT and their contract, so the
-- office sets it.

create or replace function public.crm_update_own_locale(p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_locale not in ('nl', 'de', 'fr') then
    raise exception 'Onbekende taal: %', p_locale;
  end if;

  update public.technicians
     set locale = p_locale
   where user_id = auth.uid();
end;
$$;

revoke all on function public.crm_update_own_locale(text) from public;
grant execute on function public.crm_update_own_locale(text) to authenticated;
