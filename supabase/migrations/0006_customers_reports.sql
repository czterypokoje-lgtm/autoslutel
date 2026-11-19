-- ============================================================================
-- CRM fase 5: klantbeeld en rapportage.
--
-- Run after 0005_job_records.sql. Idempotent.
--
-- Everything here is a view, not a table. The same person already exists in
-- `leads` and `jobs`, keyed by the one field this trade can rely on — the phone
-- number. Copying them into a `customers` table would create a second version
-- of the truth that has to be kept in step on every insert, and the only thing
-- it would buy today is a primary key nobody needs yet.
--
-- Access is guarded twice, on purpose. Each view carries `crm_visible()` in its
-- WHERE clause, and `security_invoker = true` is applied at the end where the
-- server supports it (PostgreSQL 15+). The second one alone would be enough on
-- a modern server, but it is a create-time option: get it wrong, or run on an
-- older server, and the view quietly runs with the creator's rights and hands a
-- monteur the whole lead table. The guard in the WHERE cannot be skipped.
-- ============================================================================

-- 0. Who may see reporting ----------------------------------------------------
/*
 * Reporting is office-only, and this says so inside the view definitions
 * themselves rather than relying on how the view executes.
 *
 * `security_invoker` (applied at the end of this file) would normally make the
 * RLS on `leads` and `jobs` apply to whoever queries the view. It needs
 * PostgreSQL 15, and a view created without it runs with the *creator's*
 * rights — which on an older server would hand a monteur the whole lead table
 * through the back door. Belt and braces: the guard below holds either way.
 */
create or replace function public.crm_visible()
returns boolean
language sql
stable
as $$
  select
    public.crm_role() in ('owner', 'kantoor')
    -- Service-role connections (migrations, scripts, diagnostics) are not a
    -- browser session and carry no CRM role.
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

grant execute on function public.crm_visible() to authenticated;

-- 1. Klanten ------------------------------------------------------------------
drop view if exists public.crm_customers;
create view public.crm_customers as
select
  l.phone_e164,
  -- The most recent non-empty name and e-mail win: people correct their own
  -- details over time, and the latest is the one to call them by.
  (array_remove(array_agg(l.name  order by l.created_at desc), null))[1] as name,
  (array_remove(array_agg(l.email order by l.created_at desc), null))[1] as email,
  min(l.created_at)                                        as first_seen,
  max(l.created_at)                                        as last_seen,
  count(*)                                                 as lead_count,
  count(*) filter (where l.status = 'sold')                as sold_count,
  coalesce(sum(l.sale_price) filter (where l.status = 'sold'), 0) as total_value,
  bool_or(l.consent_marketing)                             as consent_marketing,
  max(l.consent_at)                                        as consent_at,
  (array_remove(array_agg(l.postcode order by l.created_at desc), null))[1] as postcode
from public.leads l
where l.phone_e164 is not null
  and public.crm_visible()
group by l.phone_e164;

comment on view public.crm_customers is
  'One row per phone number: the customer identity this business actually has.';

-- 2. Voertuigen ---------------------------------------------------------------
/*
 * Vehicle history is the quiet win here. When the same car comes back for a
 * second key, the previous job is visible: which chip was used, what it cost,
 * how long it took. That is minutes saved on the driveway.
 */
drop view if exists public.crm_customer_vehicles;
create view public.crm_customer_vehicles as
select
  phone_e164,
  kenteken,
  (array_remove(array_agg(brand order by created_at desc), null))[1] as brand,
  (array_remove(array_agg(model order by created_at desc), null))[1] as model,
  (array_remove(array_agg(year  order by created_at desc), null))[1] as year,
  min(created_at) as first_seen,
  max(created_at) as last_seen,
  count(*)        as aanvragen
from public.leads
where phone_e164 is not null and kenteken is not null and kenteken <> ''
  and public.crm_visible()
group by phone_e164, kenteken;

-- 3. Rapportage ---------------------------------------------------------------
-- Five numbers that change a decision. Not a dashboard: nobody reads twenty
-- charts, and every extra one makes the useful ones harder to find.

-- 3a. Which channel actually brings work, not just clicks.
drop view if exists public.crm_report_source;
create view public.crm_report_source as
select
  coalesce(l.source, 'unknown') as source,
  count(*)                                            as leads,
  count(*) filter (where l.status = 'sold')           as verkocht,
  count(j.id)                                         as klussen,
  coalesce(sum(l.sale_price) filter (where l.status = 'sold'), 0) as omzet,
  date_trunc('month', l.created_at)                   as maand
from public.leads l
left join public.jobs j on j.lead_id = l.id
where public.crm_visible()
group by coalesce(l.source, 'unknown'), date_trunc('month', l.created_at);

-- 3b. What a job is worth, per service. Drives pricing and ad budget.
drop view if exists public.crm_report_service;
create view public.crm_report_service as
select
  coalesce(nullif(j.service_type, ''), 'onbekend') as dienst,
  count(*)                                         as klussen,
  round(avg(coalesce(j.final_price, j.quoted_price)), 2) as gemiddelde_waarde,
  coalesce(sum(coalesce(j.final_price, j.quoted_price)), 0) as totaal
from public.jobs j
where j.status = 'afgerond'
  and public.crm_visible()
group by coalesce(nullif(j.service_type, ''), 'onbekend');

/*
 * 3c. Response time — lead in, first contact out.
 *
 * The strongest reason a lead is lost in emergency work, and only measurable
 * because 0003 started stamping `first_contact_at`. Leads from before that
 * migration have no value here and are excluded rather than counted as zero.
 */
drop view if exists public.crm_report_response;
create view public.crm_report_response as
select
  date_trunc('week', created_at) as week,
  count(*)                       as leads_met_contact,
  round(avg(extract(epoch from (first_contact_at - created_at)) / 60)::numeric, 1)
    as gemiddelde_minuten,
  round(
    (percentile_cont(0.5) within group (
      order by extract(epoch from (first_contact_at - created_at)) / 60
    ))::numeric, 1
  ) as mediaan_minuten,
  count(*) filter (
    where first_contact_at - created_at > interval '60 minutes'
  ) as te_laat
from public.leads
where first_contact_at is not null
  and public.crm_visible()
group by date_trunc('week', created_at);

-- 3d. Jobs per technician per working day. Capacity, and the hiring decision.
drop view if exists public.crm_report_technician;
create view public.crm_report_technician as
select
  t.id                                    as technician_id,
  t.name,
  count(j.id)                             as klussen,
  count(distinct j.scheduled_date)        as werkdagen,
  round(
    count(j.id)::numeric
      / greatest(count(distinct j.scheduled_date), 1), 2
  )                                       as per_dag,
  coalesce(sum(coalesce(j.final_price, j.quoted_price)) filter (
    where j.status = 'afgerond'
  ), 0)                                   as omzet
from public.technicians t
left join public.jobs j
  on j.technician_id = t.id
 and j.status <> 'geannuleerd'
where public.crm_visible()
group by t.id, t.name;

/*
 * 3e. Demand per postcode region.
 *
 * This is the one that feeds back into the website: if Eindhoven produces
 * leads, that city page earns the next hour of content work. The CRM is where
 * the SEO roadmap gets its evidence.
 */
drop view if exists public.crm_report_region;
create view public.crm_report_region as
select
  substring(regexp_replace(postcode, '[^0-9]', '', 'g') from 1 for 4) as postcode4,
  count(*)                                  as leads,
  count(*) filter (where status = 'sold')   as verkocht,
  max(created_at)                           as laatste
from public.leads
where postcode is not null
  and regexp_replace(postcode, '[^0-9]', '', 'g') <> ''
  and public.crm_visible()
group by substring(regexp_replace(postcode, '[^0-9]', '', 'g') from 1 for 4);

-- 4. Grants -------------------------------------------------------------------
-- Views need their own grant; the RLS on the underlying tables is what limits
-- the rows, thanks to security_invoker above.
grant select on public.crm_customers          to authenticated;
grant select on public.crm_customer_vehicles  to authenticated;
grant select on public.crm_report_source      to authenticated;
grant select on public.crm_report_service     to authenticated;
grant select on public.crm_report_response    to authenticated;
grant select on public.crm_report_technician  to authenticated;
grant select on public.crm_report_region      to authenticated;

-- 5. AVG: erasure -------------------------------------------------------------
/*
 * "Verwijder mijn gegevens" is a legal right, and answering it by hand in the
 * SQL editor is how a record gets missed. This does the whole erasure in one
 * transaction and reports what it touched.
 *
 * Jobs are anonymised rather than deleted: the work happened, the invoice for
 * it has to stay for the seven-year retention, and an accounting record with a
 * hole in it is its own problem. What goes is everything that identifies a
 * person.
 */
create or replace function public.crm_erase_customer(target_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  erased_leads int;
  erased_jobs  int;
begin
  if public.crm_role() not in ('owner', 'kantoor') then
    raise exception 'Geen toegang' using errcode = '42501';
  end if;

  if target_phone is null or length(trim(target_phone)) < 5 then
    raise exception 'Ongeldig telefoonnummer' using errcode = '22023';
  end if;

  update public.jobs
  set customer_name = null,
      customer_phone = null,
      street = null,
      notes = null
  where customer_phone = target_phone;
  get diagnostics erased_jobs = row_count;

  delete from public.leads where phone_e164 = target_phone;
  get diagnostics erased_leads = row_count;

  return jsonb_build_object(
    'leads_verwijderd', erased_leads,
    'klussen_geanonimiseerd', erased_jobs
  );
end $$;

grant execute on function public.crm_erase_customer(text) to authenticated;

-- 6. security_invoker, where the server has it --------------------------------
/*
 * PostgreSQL 15 and later. On an older server this is skipped and the guard in
 * crm_visible() is what keeps the views office-only — which is why that guard
 * is not optional.
 */
do $$
declare
  v text;
begin
  if current_setting('server_version_num')::int >= 150000 then
    foreach v in array array[
      'crm_customers', 'crm_customer_vehicles', 'crm_report_source',
      'crm_report_service', 'crm_report_response', 'crm_report_technician',
      'crm_report_region'
    ] loop
      execute format('alter view public.%I set (security_invoker = true)', v);
    end loop;
  else
    raise notice 'security_invoker not available on this server; crm_visible() is the guard.';
  end if;
end $$;

notify pgrst, 'reload schema';
