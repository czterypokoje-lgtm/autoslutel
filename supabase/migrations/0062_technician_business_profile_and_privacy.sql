-- 0062 — Technician business profile, and technicians only read their own row.
--
-- 1. PRIVACY FIX
--    technicians_read (0004) let every signed-in role — monteurs included —
--    read every technician row: other people's phone, KVK, BTW, IBAN,
--    telegram_chat_id and ical_token (the secret that IS the calendar feed's
--    password). The office still reads everything; a monteur now reads only
--    their own row. The one monteur screen that needs colleagues (Mijn bus:
--    hand stock to a colleague) reads crm_technician_directory instead, which
--    exposes id, name and colour only.
--    Same for technician_availability: a monteur sees only their own days off.
--
-- 2. BUSINESS PROFILE
--    Columns a zzp monteur fills in themselves (Mijn profiel → Bedrijf), and
--    crm_update_own_business, which — like crm_update_own_profile (0012) — can
--    only ever reach the caller's own row and only these columns.
--
-- Run this BEFORE deploying the code that uses it.

-- ── 1. read policies ───────────────────────────────────────────────────────

drop policy if exists technicians_read on public.technicians;
create policy technicians_read on public.technicians
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or user_id = auth.uid()
  );

drop policy if exists availability_read on public.technician_availability;
create policy availability_read on public.technician_availability
  for select to authenticated
  using (
    public.crm_role() in ('owner', 'kantoor')
    or technician_id = public.my_technician_id()
  );

-- Names only, for "geef door aan een collega". Runs with the view owner's
-- rights (bypassing the policy above) but returns nothing to anyone who is
-- not a CRM user, and never more than these three columns.
create or replace view public.crm_technician_directory as
  select id, name, color
  from public.technicians
  where active
    and public.crm_role() in ('owner', 'kantoor', 'monteur');

revoke all on public.crm_technician_directory from anon;
grant select on public.crm_technician_directory to authenticated;

-- ── 2. business columns ────────────────────────────────────────────────────

alter table public.technicians add column if not exists company_name          text;
alter table public.technicians add column if not exists business_street       text;
alter table public.technicians add column if not exists business_postcode     text;
alter table public.technicians add column if not exists business_city         text;
alter table public.technicians add column if not exists contact_email         text;
alter table public.technicians add column if not exists insurance_company     text;
alter table public.technicians add column if not exists insurance_policy      text;
alter table public.technicians add column if not exists insurance_valid_until date;
-- kvk_nummer, btw_nummer, iban (0007), base_city, certifications, gbp_url (0058)
-- already exist and are reused.

create or replace function public.crm_update_own_business(
  p_company_name          text default null,
  p_kvk_nummer            text default null,
  p_btw_nummer            text default null,
  p_iban                  text default null,
  p_business_street       text default null,
  p_business_postcode     text default null,
  p_business_city         text default null,
  p_contact_email         text default null,
  p_insurance_company     text default null,
  p_insurance_policy      text default null,
  p_insurance_valid_until date default null,
  p_base_city             text default null,
  p_certifications        text[] default null,
  p_gbp_url               text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.technicians%rowtype;
begin
  select * into target from public.technicians where user_id = auth.uid();
  if not found then
    raise exception 'Geen monteur gekoppeld aan dit account' using errcode = 'P0002';
  end if;

  -- An empty string clears a field; null leaves it alone.
  update public.technicians set
    company_name          = case when p_company_name      is null then company_name      else nullif(trim(p_company_name), '') end,
    kvk_nummer            = case when p_kvk_nummer        is null then kvk_nummer        else nullif(trim(p_kvk_nummer), '') end,
    btw_nummer            = case when p_btw_nummer        is null then btw_nummer        else nullif(trim(p_btw_nummer), '') end,
    iban                  = case when p_iban              is null then iban              else nullif(upper(replace(trim(p_iban), ' ', '')), '') end,
    business_street       = case when p_business_street   is null then business_street   else nullif(trim(p_business_street), '') end,
    business_postcode     = case when p_business_postcode is null then business_postcode else nullif(upper(trim(p_business_postcode)), '') end,
    business_city         = case when p_business_city     is null then business_city     else nullif(trim(p_business_city), '') end,
    contact_email         = case when p_contact_email     is null then contact_email     else nullif(lower(trim(p_contact_email)), '') end,
    insurance_company     = case when p_insurance_company is null then insurance_company else nullif(trim(p_insurance_company), '') end,
    insurance_policy      = case when p_insurance_policy  is null then insurance_policy  else nullif(trim(p_insurance_policy), '') end,
    insurance_valid_until = coalesce(p_insurance_valid_until, insurance_valid_until),
    base_city             = case when p_base_city         is null then base_city         else nullif(trim(p_base_city), '') end,
    certifications        = coalesce(p_certifications, certifications),
    gbp_url               = case when p_gbp_url           is null then gbp_url           else nullif(trim(p_gbp_url), '') end
  where id = target.id
  returning * into target;

  return jsonb_build_object(
    'company_name', target.company_name,
    'kvk_nummer', target.kvk_nummer,
    'btw_nummer', target.btw_nummer,
    'iban', target.iban,
    'business_street', target.business_street,
    'business_postcode', target.business_postcode,
    'business_city', target.business_city,
    'contact_email', target.contact_email,
    'insurance_company', target.insurance_company,
    'insurance_policy', target.insurance_policy,
    'insurance_valid_until', target.insurance_valid_until,
    'base_city', target.base_city,
    'certifications', target.certifications,
    'gbp_url', target.gbp_url
  );
end $$;

revoke all on function public.crm_update_own_business(text, text, text, text, text, text, text, text, text, text, date, text, text[], text) from public, anon;
grant execute on function public.crm_update_own_business(text, text, text, text, text, text, text, text, text, text, date, text, text[], text) to authenticated;

notify pgrst, 'reload schema';
