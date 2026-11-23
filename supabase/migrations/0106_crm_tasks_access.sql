/*
 * crm_tasks (0049) existed for a year without a screen, an API or a grant.
 * The policy was there, but Postgres checks table privileges before it looks
 * at a row policy, so nobody could read it anyway. This turns it into the
 * owner's task list: the office writes tasks in /admin/taken, the owner's
 * voice agent writes them through /api/agent/tasks.
 *
 * Idempotent.
 */

alter table public.crm_tasks
  add column if not exists created_by uuid references auth.users (id) on delete set null;

alter table public.crm_tasks
  add column if not exists source text not null default 'crm'
  check (source in ('crm', 'agent'));

alter table public.crm_tasks alter column task_type set default 'algemeen';

create index if not exists crm_tasks_open_idx
  on public.crm_tasks (due_at) where completed_at is null;

grant select, insert, update, delete on public.crm_tasks to authenticated;
