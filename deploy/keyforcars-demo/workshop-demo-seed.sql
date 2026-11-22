-- DEMO ONLY (Supabase project jjegtunnlpdubtnshbww). Never run against production.
-- After migration 0104: one workshop calendar per active CRM technician (max 4),
-- and a handful of synthetic appointments so the calendar has something to show.
-- Re-runnable: calendars are keyed by technician, appointments by idempotency key.

insert into public.kfc_workshop_calendar (code, name, technician_id, capacity, color, sort)
select 'monteur-' || left(t.id::text, 8), t.name, t.id, 1, coalesce(nullif(t.color, ''), '#0f766e'),
       (10 + row_number() over (order by t.name))::smallint
from public.technicians t
where t.active
  and not exists (select 1 from public.kfc_workshop_calendar c where c.technician_id = t.id)
order by t.name
limit 4;

-- Synthetic appointments on the next Tuesday–Saturday days (names and numbers are fake).
do $$
declare
  d date;
  n int := 0;
  svc uuid;
  rec record;
  plan text[][] := array[
    array['sleutel-bijmaken', '10:00', 'Demo Klant Jansen', '+31600000101', 'Volkswagen', 'Golf', '2017', 'crm'],
    array['sleutel-programmeren', '13:30', 'Demo Klant de Vries', '+31600000102', 'Toyota', 'Yaris', '2019', 'telefoon'],
    array['alle-sleutels-kwijt', '11:00', 'Demo Klant Bakker', '+31600000103', 'Renault', 'Clio', '2015', 'whatsapp'],
    array['behuizing-vervangen', '15:00', 'Demo Klant Visser', '+31600000104', 'Peugeot', '208', '2020', 'crm'],
    array['diagnose', '10:30', 'Demo Klant Smit', '+31600000105', 'Ford', 'Focus', '2016', 'telefoon']
  ];
begin
  d := (now() at time zone 'Europe/Amsterdam')::date + 1;
  while n < array_length(plan, 1) loop
    if extract(isodow from d) between 2 and 6 then
      n := n + 1;
      select id into svc from public.kfc_workshop_service where code = plan[n][1];
      select * into rec from public.kfc_workshop_book(
        svc, ((d + plan[n][2]::time) at time zone 'Europe/Amsterdam'),
        -- Spread over the calendars so the calendar filter has something to filter.
        (select c.id from public.kfc_workshop_calendar c where c.active order by c.sort, c.name
          offset ((n - 1) % greatest(1, (select count(*) from public.kfc_workshop_calendar where active))) limit 1),
        plan[n][8],
        plan[n][3], plan[n][4], null, plan[n][5], plan[n][6], plan[n][7]::smallint,
        'Synthetisch demo-record', 'demo-seed-' || n, null);
      raise notice 'seed % on %: %', n, d, rec.result;
    end if;
    d := d + 1;
  end loop;
end $$;

select c.name, c.capacity, count(a.*) filter (where a.status <> 'geannuleerd') as appointments
from public.kfc_workshop_calendar c
left join public.kfc_workshop_appointment a on a.calendar_id = c.id
group by c.name, c.capacity, c.sort order by c.sort;
