-- ============================================================================
-- ERP Lite: Phase 1 - Operational Layer & SLA Tracking
--
-- Enhances the 'leads' and 'jobs' tables with strict SLA (Service Level Agreement)
-- time tracking, comprehensive lost reasons, and call logs.
-- ============================================================================

-- 1. SLA and Lost Reasons on LEADS
do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_lost_reason') then
    create type public.lead_lost_reason as enum (
      'price_too_high', 'unreachable', 'competitor', 'out_of_area', 
      'vehicle_unsupported', 'customer_cancelled'
    );
  end if;
end $$;

alter table public.leads
  add column if not exists first_responded_at timestamptz,
  add column if not exists quoted_at timestamptz,
  add column if not exists lost_reason public.lead_lost_reason,
  add column if not exists estimated_value numeric(10,2);


-- 2. CALL LOGS & TRANSCRIPTS
-- Every call made or received can be logged here, tying into the lead and job
create table if not exists public.call_logs (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references public.leads(id) on delete cascade,
  job_id          uuid references public.jobs(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  
  direction       text check (direction in ('inbound', 'outbound')),
  duration_sec    integer,
  transcript      text,
  audio_url       text,
  summary         text,
  
  created_at      timestamptz not null default now()
);

alter table public.call_logs enable row level security;
create policy erp_calls_office on public.call_logs for all using (public.crm_role() in ('owner', 'kantoor'));


-- 3. FOLLOW-UPS & NEXT ACTIONS
-- Reminders for the office to chase a lead or invoice
create table if not exists public.crm_tasks (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references public.leads(id) on delete cascade,
  job_id          uuid references public.jobs(id) on delete cascade,
  assigned_to     uuid references auth.users(id) on delete set null,
  
  task_type       text not null, -- e.g., 'whatsapp_followup', 'invoice_chase'
  description     text not null,
  due_at          timestamptz not null,
  completed_at    timestamptz,
  
  created_at      timestamptz not null default now()
);

alter table public.crm_tasks enable row level security;
create policy erp_tasks_office on public.crm_tasks for all using (public.crm_role() in ('owner', 'kantoor'));
