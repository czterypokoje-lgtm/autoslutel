-- ============================================================================
-- CRM: who may approve what (slice S7, second approver). NOT APPLIED: owner
-- reviews first. Run after 0078_job_room.sql. Additive and idempotent.
--
-- A message in job_outbox is released only by a person who has an active row
-- here, identified by the sender's number (the contact). Anyone else, a
-- technician or a customer included, is refused. Rights are explicit and
-- start empty: a new approver can approve nothing until the owner grants it.
--
-- NO ROWS ARE INSERTED HERE. The person, their number and their rights are the
-- owner's open decision (BACKLOG, owner inputs). To add one, after saving the
-- person as a contact, the owner runs for example:
--
--   insert into public.job_approvers (contact_id, role, audiences, max_tier, may_invoice)
--   values ('<contact uuid>', 'assistant', '{customer_reply,technician}', 2, false);
--
-- The owner's own row uses role 'owner'; an owner may approve everything.
-- The assistant approves through the tech-listen path only, never through the
-- Claw allow list; that part lives on the server, not in this table.
-- ============================================================================

create table if not exists public.job_approvers (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  contact_id   uuid not null unique references public.contacts(id) on delete restrict,
  role         text not null check (role in ('owner','assistant')),
  -- What an assistant may release. An owner ignores these.
  audiences    text[] not null default '{}'
                 check (audiences <@ array['customer_reply','technician','self_started','internal']::text[]),
  max_tier     smallint not null default 0 check (max_tier between 0 and 2),
  may_invoice  boolean not null default false,
  active       boolean not null default true
);

alter table public.job_approvers enable row level security;
grant select on public.job_approvers to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'job_approvers'
                   and policyname = 'job_approvers_owner_read') then
    create policy job_approvers_owner_read on public.job_approvers
      for select using (public.crm_role() = 'owner');
  end if;
end $$;
