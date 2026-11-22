-- 0109: a technician's open offers, readable by the technician.
--
-- The Offers screen (/admin/aanbod) read job_offers joined to jobs with the
-- technician's own session. But jobs_monteur_select (0004, widened in 0022)
-- only lets a monteur read jobs *assigned* to them, and an offer is by
-- definition on a job nobody has yet. The join came back empty, so the screen
-- never showed a single offer.
--
-- Opening jobs to every offered technician would hand them the customer's name,
-- phone and street before they accept — exactly what the page comment says
-- must not happen ("the door number is the customer's"). So instead: one
-- function, scoped to the caller, returning only what judging the offer needs
-- (car, work, postcode, town, date). Same shape the page already reads, so the
-- page swaps one query and nothing else.
--
-- Additive: no table, policy or existing function changes. Idempotent.

create or replace function public.crm_my_open_offers()
returns table (
  id          uuid,
  rank        integer,
  score       numeric,
  reason      text,
  offered_at  timestamptz,
  expires_at  timestamptz,
  jobs        jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.rank, o.score, o.reason, o.offered_at, o.expires_at,
         jsonb_build_object(
           'id', j.id, 'scheduled_date', j.scheduled_date, 'slot_start', j.slot_start, 'slot_end', j.slot_end,
           'postcode', j.postcode, 'city', j.city,
           'car_make', j.car_make, 'car_model', j.car_model, 'car_year', j.car_year,
           'scenario', j.scenario, 'keyless', j.keyless, 'technician_id', j.technician_id
         ) as jobs
    from public.job_offers o
    join public.jobs j on j.id = o.job_id
   where o.technician_id = public.my_technician_id()
     and o.response is null
     and j.technician_id is null
     and o.offered_at <= now()
     and o.expires_at > now()
   order by o.expires_at;
$$;

revoke all on function public.crm_my_open_offers() from public, anon;
grant execute on function public.crm_my_open_offers() to authenticated;
