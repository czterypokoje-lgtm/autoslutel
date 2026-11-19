-- ============================================================================
-- CRM fase 22: de klus als geheugen voor de monteur zelf.
--
-- Run after 0021_job_payments_ideal.sql. Idempotent.
--
-- Nothing here changes what the office sees. What is missing is the
-- technician's own record of *how* a job was actually done: which programmer
-- they plugged in, which key they used, which adapter made a stubborn model
-- work. That is exactly the knowledge that otherwise lives in someone's head
-- and leaves with them — writing it onto the job is what lets them look back
-- at "Toyota Prius 2010" next year and see what worked last time.
--
-- The read restriction this is really about: `jobs_monteur_select` (0004)
-- only let a monteur see the last day and the next seven — right for "what is
-- my day", wrong for "what did I do on this model six months ago". History
-- needs the read opened; nothing about who owns a row changes.
-- ============================================================================

alter table public.jobs add column if not exists tool_used_id uuid references public.technician_tools (id) on delete set null;
alter table public.jobs add column if not exists key_used     text;
alter table public.jobs add column if not exists adapter_used text;
alter table public.jobs add column if not exists tech_note    text;

create index if not exists jobs_tool_used_idx on public.jobs (tool_used_id) where tool_used_id is not null;

/*
 * Own history, unrestricted by date. Still their own rows only — this widens
 * *how far back*, not *whose*.
 */
drop policy if exists jobs_monteur_select on public.jobs;
create policy jobs_monteur_select on public.jobs
  for select to authenticated
  using (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
  );

/*
 * Editing stays close to "just finished this job": a month back, so a note
 * forgotten on a Friday can still be added on Monday, and a week ahead for
 * the ordinary case of moving a booked slot. Not open-ended — a job from a
 * year ago is history to read, not a row to keep rewriting.
 */
drop policy if exists jobs_monteur_update on public.jobs;
create policy jobs_monteur_update on public.jobs
  for update to authenticated
  using (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
    and scheduled_date between current_date - 30 and current_date + 7
  )
  with check (
    public.crm_role() = 'monteur'
    and technician_id in (
      select id from public.technicians where user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
