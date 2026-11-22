-- One open follow-up per lead. Completed tasks remain in the task history.
create unique index if not exists crm_tasks_open_lead_followup
on public.crm_tasks (lead_id) where task_type = 'lead_followup' and completed_at is null;

create or replace function public.crm_open_lead_followup(p_lead uuid)
returns void language plpgsql set search_path = '' as $$
begin
  perform 1 from public.leads where id = p_lead and status = 'new'
    and first_contact_at is null and retracted_at is null for update;
  if not found then raise exception 'CRM_LEAD_NOT_WAITING'; end if;

  insert into public.crm_tasks (lead_id, task_type, description, due_at)
  values (p_lead, 'lead_followup', 'Neem contact op over de aanvraag.', now())
  on conflict (lead_id) where task_type = 'lead_followup' and completed_at is null do nothing;
end;
$$;
revoke all on function public.crm_open_lead_followup(uuid) from public, anon, authenticated;
grant execute on function public.crm_open_lead_followup(uuid) to service_role;
