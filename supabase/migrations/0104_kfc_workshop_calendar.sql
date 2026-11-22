-- ============================================================================
-- KeyForCars werkplaatsagenda: kalenders, openingstijden, diensten,
-- blokkades/sluitingen en afspraken, met één boekingsregel voor CRM en
-- de ElevenLabs Workshop Service-agent.
--
-- Times are timestamptz. Opening hours are local wall-clock times in
-- Europe/Amsterdam and are converted per day, so DST is handled by Postgres.
--
-- Double booking is prevented twice:
--   1. kfc_workshop_book / kfc_workshop_move take a transaction advisory lock,
--      re-check hours, closures and capacity, and pick a free seat (unit).
--   2. An exclusion constraint on (calendar, unit, time range) for every
--      non-cancelled appointment, so even a direct insert cannot overbook.
--
-- Tables and functions are reachable by service_role only. The CRM routes and
-- the agent routes decide who may call them (same pattern as 0103).
-- ============================================================================

create extension if not exists btree_gist;

-- 1. Kalenders (werkplaats / monteur) ----------------------------------------
create table if not exists public.kfc_workshop_calendar (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name          text not null,
  technician_id uuid references public.technicians (id) on delete set null,
  capacity      smallint not null default 1 check (capacity between 1 and 20),
  color         text not null default '#2563eb',
  active        boolean not null default true,
  sort          smallint not null default 0
);

-- 2. Openingstijden (isodow 1 = maandag … 7 = zondag) -------------------------
create table if not exists public.kfc_workshop_hours (
  weekday    smallint primary key check (weekday between 1 and 7),
  closed     boolean not null default false,
  open_time  time,
  close_time time,
  check (closed or (open_time is not null and close_time is not null and close_time > open_time))
);

insert into public.kfc_workshop_hours (weekday, closed, open_time, close_time) values
  (1, false, '10:00', '18:00'),
  (2, false, '09:00', '18:00'),
  (3, false, '09:00', '18:00'),
  (4, false, '09:00', '18:00'),
  (5, false, '09:00', '18:00'),
  (6, false, '09:00', '17:00'),
  (7, true,  null,    null)
on conflict (weekday) do nothing;

-- 3. Diensten met duur -------------------------------------------------------
create table if not exists public.kfc_workshop_service (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name_nl          text not null,
  name_en          text not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 600),
  active           boolean not null default true,
  sort             smallint not null default 0
);

insert into public.kfc_workshop_service (code, name_nl, name_en, duration_minutes, sort) values
  ('sleutel-bijmaken',      'Sleutel bijmaken',             'Spare key',                 45, 1),
  ('sleutel-programmeren',  'Sleutel programmeren',         'Key programming',           30, 2),
  ('alle-sleutels-kwijt',   'Alle sleutels kwijt',          'All keys lost',             90, 3),
  ('behuizing-vervangen',   'Behuizing vervangen',          'Key shell replacement',     20, 4),
  ('afstandsbediening-reparatie', 'Afstandsbediening repareren', 'Remote repair',        45, 5),
  ('diagnose',              'Diagnose sleutel/immobiliser', 'Key/immobiliser diagnosis', 60, 6)
on conflict (code) do nothing;

-- 4. Blokkades (één kalender) en sluitingen (calendar_id null = hele werkplaats)
create table if not exists public.kfc_workshop_closure (
  id          uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.kfc_workshop_calendar (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  created_at  timestamptz not null default now(),
  created_by  uuid,
  check (ends_at > starts_at)
);
create index if not exists kfc_workshop_closure_time on public.kfc_workshop_closure using gist (tstzrange(starts_at, ends_at, '[)'));

-- 5. Afspraken ---------------------------------------------------------------
create table if not exists public.kfc_workshop_appointment (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  calendar_id     uuid not null references public.kfc_workshop_calendar (id),
  unit            smallint not null default 1 check (unit >= 1),
  service_id      uuid not null references public.kfc_workshop_service (id),
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text not null default 'gepland'
                  check (status in ('gepland', 'bevestigd', 'afgerond', 'geannuleerd', 'no_show')),
  source          text not null check (source in ('crm', 'telefoon', 'whatsapp')),
  customer_name   text not null check (length(customer_name) between 1 and 120),
  customer_phone  text,
  customer_email  text,
  vehicle_make    text,
  vehicle_model   text,
  vehicle_year    smallint check (vehicle_year between 1950 and 2100),
  notes           text,
  idempotency_key text unique,
  created_at      timestamptz not null default now(),
  created_by      uuid,
  updated_at      timestamptz,
  updated_by      uuid,
  cancelled_at    timestamptz,
  check (ends_at > starts_at),
  check (customer_phone is not null or customer_email is not null),
  constraint kfc_workshop_no_overlap exclude using gist (
    calendar_id with =,
    unit with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status <> 'geannuleerd')
);
create index if not exists kfc_workshop_appointment_time on public.kfc_workshop_appointment (starts_at);

-- Default calendar so a fresh install can book at once; edit or add more in the CRM.
insert into public.kfc_workshop_calendar (code, name, capacity, color, sort)
select 'werkplaats', 'Werkplaats', 1, '#2563eb', 0
where not exists (select 1 from public.kfc_workshop_calendar);

alter table public.kfc_workshop_calendar    enable row level security;
alter table public.kfc_workshop_hours       enable row level security;
alter table public.kfc_workshop_service     enable row level security;
alter table public.kfc_workshop_closure     enable row level security;
alter table public.kfc_workshop_appointment enable row level security;
revoke all on public.kfc_workshop_calendar, public.kfc_workshop_hours, public.kfc_workshop_service,
  public.kfc_workshop_closure, public.kfc_workshop_appointment from public, anon, authenticated;
grant select, insert, update, delete on public.kfc_workshop_calendar, public.kfc_workshop_hours,
  public.kfc_workshop_service, public.kfc_workshop_closure, public.kfc_workshop_appointment to service_role;

-- 6. Eén regel: mag [start, end) op deze kalender? Geeft de vrije unit of een reden.
create or replace function public.kfc_workshop_check(
  p_calendar uuid, p_start timestamptz, p_end timestamptz, p_exclude uuid default null
) returns table (result text, free_unit smallint)
language plpgsql stable set search_path = '' as $$
declare
  cal public.kfc_workshop_calendar%rowtype;
  hrs public.kfc_workshop_hours%rowtype;
  local_day date;
  day_open timestamptz;
  day_close timestamptz;
  u smallint;
begin
  select * into cal from public.kfc_workshop_calendar c where c.id = p_calendar;
  if not found or not cal.active then return query select 'unknown_calendar'::text, null::smallint; return; end if;
  if p_end <= p_start then return query select 'invalid_time'::text, null::smallint; return; end if;
  if p_start < clock_timestamp() then return query select 'past'::text, null::smallint; return; end if;

  local_day := (p_start at time zone 'Europe/Amsterdam')::date;
  select * into hrs from public.kfc_workshop_hours h where h.weekday = extract(isodow from local_day)::smallint;
  if not found or hrs.closed then return query select 'closed'::text, null::smallint; return; end if;
  day_open := (local_day + hrs.open_time) at time zone 'Europe/Amsterdam';
  day_close := (local_day + hrs.close_time) at time zone 'Europe/Amsterdam';
  if p_start < day_open or p_end > day_close then return query select 'outside_hours'::text, null::smallint; return; end if;

  if exists (
    select 1 from public.kfc_workshop_closure c
    where (c.calendar_id is null or c.calendar_id = p_calendar)
      and tstzrange(c.starts_at, c.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  ) then return query select 'blocked'::text, null::smallint; return; end if;

  select s.n::smallint into u
  from generate_series(1, cal.capacity) as s(n)
  where not exists (
    select 1 from public.kfc_workshop_appointment a
    where a.calendar_id = p_calendar and a.unit = s.n and a.status <> 'geannuleerd'
      and (p_exclude is null or a.id <> p_exclude)
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_start, p_end, '[)')
  )
  order by s.n limit 1;

  if u is null then return query select 'full'::text, null::smallint; return; end if;
  return query select 'ok'::text, u;
end;
$$;

-- 7. Vrije tijden voor een dienst op een dag ----------------------------------
-- First row is always a status row (calendar_id null): 'open' | 'closed' |
-- 'past' | 'unknown_service'. With 'open', the following rows are free slots;
-- no following rows means the day is fully booked.
create or replace function public.kfc_workshop_free_slots(
  p_service uuid, p_day date, p_calendar uuid default null, p_step integer default 15
) returns table (day_status text, calendar_id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql stable set search_path = '' as $$
declare
  svc public.kfc_workshop_service%rowtype;
  hrs public.kfc_workshop_hours%rowtype;
  day_open timestamptz;
  day_close timestamptz;
  t timestamptz;
  dur interval;
  cal record;
  chk record;
  step interval;
begin
  select * into svc from public.kfc_workshop_service s where s.id = p_service and s.active;
  if not found then return query select 'unknown_service'::text, null::uuid, null::timestamptz, null::timestamptz; return; end if;
  dur := make_interval(mins => svc.duration_minutes);
  step := make_interval(mins => greatest(5, least(coalesce(p_step, 15), 120)));

  select * into hrs from public.kfc_workshop_hours h where h.weekday = extract(isodow from p_day)::smallint;
  if not found or hrs.closed then return query select 'closed'::text, null::uuid, null::timestamptz, null::timestamptz; return; end if;
  day_open := (p_day + hrs.open_time) at time zone 'Europe/Amsterdam';
  day_close := (p_day + hrs.close_time) at time zone 'Europe/Amsterdam';
  if exists (
    select 1 from public.kfc_workshop_closure c
    where c.calendar_id is null and c.starts_at <= day_open and c.ends_at >= day_close
  ) then return query select 'closed'::text, null::uuid, null::timestamptz, null::timestamptz; return; end if;
  if day_close - dur < clock_timestamp() then return query select 'past'::text, null::uuid, null::timestamptz, null::timestamptz; return; end if;

  return query select 'open'::text, null::uuid, null::timestamptz, null::timestamptz;

  for cal in
    select c.id from public.kfc_workshop_calendar c
    where c.active and (p_calendar is null or c.id = p_calendar)
    order by c.sort, c.name
  loop
    t := day_open;
    while t + dur <= day_close loop
      if t >= clock_timestamp() then
        select * into chk from public.kfc_workshop_check(cal.id, t, t + dur);
        if chk.result = 'ok' then
          return query select 'open'::text, cal.id, t, t + dur;
        end if;
      end if;
      t := t + step;
    end loop;
  end loop;
end;
$$;

-- 8. Boeken (CRM en agent) ---------------------------------------------------
-- p_calendar null = first calendar (sort order) with a free unit at that time.
-- Result: booked | duplicate | idempotency_mismatch | unknown_service |
--         unknown_calendar | past | closed | outside_hours | blocked | full | invalid_time
create or replace function public.kfc_workshop_book(
  p_service uuid, p_start timestamptz, p_calendar uuid, p_source text,
  p_customer_name text, p_customer_phone text, p_customer_email text,
  p_vehicle_make text, p_vehicle_model text, p_vehicle_year smallint,
  p_notes text, p_idempotency_key text, p_actor uuid
) returns table (result text, appointment_id uuid, reference text, starts_at timestamptz, ends_at timestamptz, calendar_id uuid)
language plpgsql set search_path = '' as $$
declare
  svc public.kfc_workshop_service%rowtype;
  existing public.kfc_workshop_appointment%rowtype;
  v_end timestamptz;
  cal record;
  chk record;
  last_reason text := 'full';
  v_ref text;
  v_id uuid;
begin
  -- One booking at a time across the workshop: simple and enough for this volume.
  perform pg_advisory_xact_lock(hashtext('kfc_workshop_booking'));

  if p_idempotency_key is not null then
    select * into existing from public.kfc_workshop_appointment a where a.idempotency_key = p_idempotency_key;
    if found then
      if existing.service_id = p_service and existing.starts_at = p_start then
        return query select 'duplicate'::text, existing.id, existing.reference, existing.starts_at, existing.ends_at, existing.calendar_id;
      else
        return query select 'idempotency_mismatch'::text, null::uuid, null::text, null::timestamptz, null::timestamptz, null::uuid;
      end if;
      return;
    end if;
  end if;

  select * into svc from public.kfc_workshop_service s where s.id = p_service and s.active;
  if not found then return query select 'unknown_service'::text, null::uuid, null::text, null::timestamptz, null::timestamptz, null::uuid; return; end if;
  v_end := p_start + make_interval(mins => svc.duration_minutes);

  if p_calendar is not null and not exists (select 1 from public.kfc_workshop_calendar c where c.id = p_calendar and c.active) then
    return query select 'unknown_calendar'::text, null::uuid, null::text, null::timestamptz, null::timestamptz, null::uuid; return;
  end if;

  for cal in
    select c.id from public.kfc_workshop_calendar c
    where c.active and (p_calendar is null or c.id = p_calendar)
    order by c.sort, c.name
  loop
    select * into chk from public.kfc_workshop_check(cal.id, p_start, v_end);
    if chk.result = 'ok' then
      loop
        v_ref := 'WS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
        exit when not exists (select 1 from public.kfc_workshop_appointment a where a.reference = v_ref);
      end loop;
      insert into public.kfc_workshop_appointment (
        reference, calendar_id, unit, service_id, starts_at, ends_at, source,
        customer_name, customer_phone, customer_email, vehicle_make, vehicle_model, vehicle_year,
        notes, idempotency_key, created_by
      ) values (
        v_ref, cal.id, chk.free_unit, p_service, p_start, v_end, p_source,
        p_customer_name, p_customer_phone, p_customer_email, p_vehicle_make, p_vehicle_model, p_vehicle_year,
        p_notes, p_idempotency_key, p_actor
      ) returning id into v_id;
      return query select 'booked'::text, v_id, v_ref, p_start, v_end, cal.id;
      return;
    end if;
    -- Keep the most telling reason: closed/outside hours beats "full".
    if chk.result <> 'full' then last_reason := chk.result; end if;
  end loop;

  return query select last_reason, null::uuid, null::text, null::timestamptz, null::timestamptz, null::uuid;
end;
$$;

-- 9. Verplaatsen (zelfde duur van de dienst, optioneel andere kalender) -------
create or replace function public.kfc_workshop_move(
  p_id uuid, p_start timestamptz, p_calendar uuid, p_actor uuid
) returns table (result text, starts_at timestamptz, ends_at timestamptz, calendar_id uuid)
language plpgsql set search_path = '' as $$
declare
  appt public.kfc_workshop_appointment%rowtype;
  svc public.kfc_workshop_service%rowtype;
  v_end timestamptz;
  v_cal uuid;
  chk record;
begin
  perform pg_advisory_xact_lock(hashtext('kfc_workshop_booking'));
  select * into appt from public.kfc_workshop_appointment a where a.id = p_id for update;
  if not found then return query select 'not_found'::text, null::timestamptz, null::timestamptz, null::uuid; return; end if;
  if appt.status in ('geannuleerd', 'afgerond', 'no_show') then
    return query select 'not_movable'::text, null::timestamptz, null::timestamptz, null::uuid; return;
  end if;
  select * into svc from public.kfc_workshop_service s where s.id = appt.service_id;
  v_end := p_start + make_interval(mins => svc.duration_minutes);
  v_cal := coalesce(p_calendar, appt.calendar_id);
  select * into chk from public.kfc_workshop_check(v_cal, p_start, v_end, p_id);
  if chk.result <> 'ok' then return query select chk.result, null::timestamptz, null::timestamptz, null::uuid; return; end if;
  update public.kfc_workshop_appointment a
     set starts_at = p_start, ends_at = v_end, calendar_id = v_cal, unit = chk.free_unit,
         updated_at = now(), updated_by = p_actor
   where a.id = p_id;
  return query select 'moved'::text, p_start, v_end, v_cal;
end;
$$;

-- 10. Annuleren ---------------------------------------------------------------
create or replace function public.kfc_workshop_cancel(p_id uuid, p_actor uuid)
returns text language plpgsql set search_path = '' as $$
declare st text;
begin
  select a.status into st from public.kfc_workshop_appointment a where a.id = p_id for update;
  if not found then return 'not_found'; end if;
  if st = 'geannuleerd' then return 'already_cancelled'; end if;
  update public.kfc_workshop_appointment a
     set status = 'geannuleerd', cancelled_at = now(), updated_at = now(), updated_by = p_actor
   where a.id = p_id;
  return 'cancelled';
end;
$$;

revoke all on function public.kfc_workshop_check(uuid, timestamptz, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.kfc_workshop_free_slots(uuid, date, uuid, integer) from public, anon, authenticated;
revoke all on function public.kfc_workshop_book(uuid, timestamptz, uuid, text, text, text, text, text, text, smallint, text, text, uuid) from public, anon, authenticated;
revoke all on function public.kfc_workshop_move(uuid, timestamptz, uuid, uuid) from public, anon, authenticated;
revoke all on function public.kfc_workshop_cancel(uuid, uuid) from public, anon, authenticated;
grant execute on function public.kfc_workshop_check(uuid, timestamptz, timestamptz, uuid) to service_role;
grant execute on function public.kfc_workshop_free_slots(uuid, date, uuid, integer) to service_role;
grant execute on function public.kfc_workshop_book(uuid, timestamptz, uuid, text, text, text, text, text, text, smallint, text, text, uuid) to service_role;
grant execute on function public.kfc_workshop_move(uuid, timestamptz, uuid, uuid) to service_role;
grant execute on function public.kfc_workshop_cancel(uuid, uuid) to service_role;
