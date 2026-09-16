-- ============================================================================
-- CRM fase 37: leads die nooit een klus konden worden omdat niemand de auto
-- aankan — onderscheiden van leads die om een andere reden wegvielen (prijs,
-- geen reactie, naar de concurrent).
--
-- Niets hier is geraden: "gedekt" wordt per lead afgeleid uit
-- technician_coverage, dezelfde tabel die het dispatch-systeem al gebruikt
-- ("Mercedes-Benz doe ik, behalve boven 2014" is letterlijk al twee rijen
-- daarin — een brede include-rij zonder jaargrens plus een excluded-rij met
-- from_year). Een lead is "buiten capaciteit" alleen als er, over alle
-- actieve monteurs samen, geen enkele niet-uitgesloten rij is die dat merk +
-- scenario + jaar dekt, óf als een uitsluitingsrij dat specifieke jaar
-- expliciet blokkeert.
-- ============================================================================

drop view if exists public.crm_report_capability_gap;
create view public.crm_report_capability_gap as
with lead_year as (
  select
    l.*,
    nullif(regexp_replace(coalesce(l.year, ''), '[^0-9]', '', 'g'), '')::int as jaar
  from public.leads l
  where l.brand is not null
    and l.scenario is not null
    and l.status not in ('sold')
    and public.crm_visible()
),
coverage_match as (
  select
    ly.id as lead_id,
    bool_or(not tc.excluded) as heeft_dekking,
    bool_or(tc.excluded)     as heeft_uitsluiting
  from lead_year ly
  join public.technician_coverage tc
    on lower(tc.make) = lower(ly.brand)
   and tc.scenario = ly.scenario
   and (tc.model is null or lower(tc.model) = lower(coalesce(ly.model, '')))
   and (tc.from_year is null or ly.jaar is null or ly.jaar >= tc.from_year)
   and (tc.to_year   is null or ly.jaar is null or ly.jaar <= tc.to_year)
  join public.technicians t
    on t.id = tc.technician_id and t.active
  group by ly.id
)
select
  ly.id,
  ly.brand,
  ly.model,
  ly.jaar                         as year,
  ly.scenario,
  ly.status,
  ly.postcode,
  ly.created_at
from lead_year ly
left join coverage_match cm on cm.lead_id = ly.id
where coalesce(cm.heeft_dekking, false) = false
   or coalesce(cm.heeft_uitsluiting, false) = true;

comment on view public.crm_report_capability_gap is
  'Leads with a car/scenario no active technician currently covers — a real, derived gap, not a guess. Feeds the tooling/hiring decision, not just the "why did we lose this" question.';

-- One row per merk+jaar-combo, for the actual decision: is this worth a tool
-- or a new technician, or is it too rare to matter.
drop view if exists public.crm_report_capability_gap_summary;
create view public.crm_report_capability_gap_summary as
select
  brand,
  year,
  scenario,
  count(*)          as gemiste_leads,
  min(created_at)    as eerste,
  max(created_at)    as laatste
from public.crm_report_capability_gap
group by brand, year, scenario
order by count(*) desc;

grant select on public.crm_report_capability_gap         to authenticated;
grant select on public.crm_report_capability_gap_summary to authenticated;

do $$
begin
  if current_setting('server_version_num')::int >= 150000 then
    alter view public.crm_report_capability_gap set (security_invoker = true);
    alter view public.crm_report_capability_gap_summary set (security_invoker = true);
  else
    raise notice 'security_invoker not available on this server; crm_visible() is the guard.';
  end if;
end $$;

notify pgrst, 'reload schema';
