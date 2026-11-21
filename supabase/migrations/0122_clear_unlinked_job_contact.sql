-- Account deletion clears both references in the same update, also when the
-- billing-account foreign key fires before the membership deletion.
create or replace function public.clear_unlinked_job_contact()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.communication_contact_id := null;
  return new;
end;
$$;
revoke all on function public.clear_unlinked_job_contact() from public, anon, authenticated;
create or replace trigger clear_unlinked_job_contact
before update of billing_account_id on public.jobs
for each row when (old.billing_account_id is not null and new.billing_account_id is null)
execute function public.clear_unlinked_job_contact();
