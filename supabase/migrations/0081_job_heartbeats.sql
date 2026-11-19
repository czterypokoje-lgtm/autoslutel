-- ============================================================================
-- CRM: heartbeats for the live view and the stop alarm (slice S8).
-- NOT APPLIED: owner reviews first. Run after 0078_job_room.sql. Idempotent.
--
-- One row per service (for example 'transport'). The service calls
-- /api/ops/jobroom/heartbeat every minute or so; the check route compares the
-- newest beat with the clock and alerts the owner on Telegram when it is stale
-- during the day. alerted_at keeps one alert from repeating every minute.
-- Holds no message text and no contact data.
-- ============================================================================

create table if not exists public.job_heartbeats (
  service     text primary key check (service ~ '^[a-z][a-z0-9_-]{1,39}$'),
  beat_at     timestamptz not null default now(),
  note        text check (note is null or length(note) <= 200),
  alerted_at  timestamptz
);

alter table public.job_heartbeats enable row level security;
grant select on public.job_heartbeats to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'job_heartbeats'
                   and policyname = 'job_heartbeats_owner_read') then
    create policy job_heartbeats_owner_read on public.job_heartbeats
      for select using (public.crm_role() = 'owner');
  end if;
end $$;
