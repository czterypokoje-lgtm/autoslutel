-- ============================================================================
-- CRM fase 36: welke auto, welk gebied, welke monteur brengt geld op — en
-- welke niet. Same shape as 0006's reporting views (crm_visible() guard,
-- security_invoker), three new views instead of duplicating those.
--
-- Built entirely on public.jobs, which already has car_make, postcode,
-- technician_id, quoted_price, final_price, commission_amount and status —
-- nothing here needed new chat-mined data, it was already sitting unused.
-- ============================================================================

-- 1. Per automerk: wat het echt oplevert, en hoe vaak het misgaat na boeking.
drop view if exists public.crm_report_make;
create view public.crm_report_make as
select
  coalesce(nullif(j.car_make, ''), 'onbekend')                as merk,
  count(*) filter (where j.status = 'afgerond')                as klussen,
  count(*) filter (where j.status = 'geannuleerd')              as geannuleerd,
  round(
    100.0 * count(*) filter (where j.status = 'geannuleerd')
      / greatest(count(*) filter (where j.status in ('afgerond', 'geannuleerd')), 1),
    1
  )                                                              as annuleer_pct,
  coalesce(sum(coalesce(j.final_price, j.quoted_price)) filter (
    where j.status = 'afgerond'
  ), 0)                                                          as omzet,
  round(avg(coalesce(j.final_price, j.quoted_price)) filter (
    where j.status = 'afgerond'
  ), 2)                                                          as gemiddelde_prijs,
  coalesce(sum(j.commission_amount) filter (where j.status = 'afgerond'), 0) as commissie
from public.jobs j
where public.crm_visible()
group by coalesce(nullif(j.car_make, ''), 'onbekend');

comment on view public.crm_report_make is
  'Revenue and cancel rate per car make — which makes are worth chasing, which cost more than they bring.';

-- 2. Automerk × gebied. The cross the office actually asked for: not "which
-- make" or "which area" alone, but which combination.
drop view if exists public.crm_report_make_region;
create view public.crm_report_make_region as
select
  coalesce(nullif(j.car_make, ''), 'onbekend')                          as merk,
  substring(regexp_replace(j.postcode, '[^0-9]', '', 'g') from 1 for 4) as postcode4,
  count(*) filter (where j.status = 'afgerond')                        as klussen,
  count(*) filter (where j.status = 'geannuleerd')                     as geannuleerd,
  coalesce(sum(coalesce(j.final_price, j.quoted_price)) filter (
    where j.status = 'afgerond'
  ), 0)                                                                as omzet
from public.jobs j
where j.postcode is not null
  and regexp_replace(j.postcode, '[^0-9]', '', 'g') <> ''
  and public.crm_visible()
group by
  coalesce(nullif(j.car_make, ''), 'onbekend'),
  substring(regexp_replace(j.postcode, '[^0-9]', '', 'g') from 1 for 4);

comment on view public.crm_report_make_region is
  'Which make sells where — a make that loses money city-wide can still be worth it in one postcode, and vice versa.';

-- 3. Commissie per monteur — de ~20% waar kantoor vanuit gaat, echt gemeten,
-- niet aangenomen. Een monteur die structureel afwijkt is een gesprek waard,
-- niet een gok.
drop view if exists public.crm_report_commission;
create view public.crm_report_commission as
select
  t.id                                              as technician_id,
  t.name,
  count(j.id)                                       as klussen,
  coalesce(sum(coalesce(j.final_price, j.quoted_price)), 0) as omzet,
  coalesce(sum(j.commission_amount), 0)             as commissie,
  round(
    100.0 * coalesce(sum(j.commission_amount), 0)
      / greatest(sum(coalesce(j.final_price, j.quoted_price)), 1),
    1
  )                                                  as effectief_commissie_pct,
  round(avg(j.commission_pct), 1)                   as gemiddeld_ingesteld_pct
from public.technicians t
left join public.jobs j
  on j.technician_id = t.id
 and j.status = 'afgerond'
where public.crm_visible()
group by t.id, t.name;

comment on view public.crm_report_commission is
  'Real commission rate per technician (commission paid ÷ revenue), next to what their profile says it should be — a gap between the two is worth a conversation.';

-- 4. Grants + security_invoker, same pattern as 0006.
grant select on public.crm_report_make        to authenticated;
grant select on public.crm_report_make_region to authenticated;
grant select on public.crm_report_commission  to authenticated;

do $$
declare
  v text;
begin
  if current_setting('server_version_num')::int >= 150000 then
    foreach v in array array[
      'crm_report_make', 'crm_report_make_region', 'crm_report_commission'
    ] loop
      execute format('alter view public.%I set (security_invoker = true)', v);
    end loop;
  else
    raise notice 'security_invoker not available on this server; crm_visible() is the guard.';
  end if;
end $$;

notify pgrst, 'reload schema';
