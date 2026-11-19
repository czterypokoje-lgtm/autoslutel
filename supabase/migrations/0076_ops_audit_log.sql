-- ============================================================================
-- CRM: what the office assistant (OpenClaw, via /api/ops) asked for.
--
-- Run after 0075_openai_qualified.sql. Additive and idempotent. Paste it into
-- the Supabase SQL editor; there is no migration runner.
--
-- Stores the action and its parameters, never the customer data returned.
-- Written only through the service role in /api/ops, readable by the owner.
-- ============================================================================

create table if not exists public.ops_audit_log (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action     text not null,
  detail     jsonb not null default '{}'::jsonb
);

create index if not exists ops_audit_log_created_idx
  on public.ops_audit_log (created_at desc);

alter table public.ops_audit_log enable row level security;

grant select on public.ops_audit_log to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'ops_audit_log_owner_read') then
    create policy ops_audit_log_owner_read on public.ops_audit_log
      for select
      using (public.crm_role() = 'owner');
  end if;
end $$;
