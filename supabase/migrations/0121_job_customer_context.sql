-- A billing account and the person handling the job are independent selections.
alter table public.jobs
  add column if not exists billing_account_id uuid references public.kfc_customers(id) on delete set null,
  add column if not exists communication_contact_id uuid,
  add constraint jobs_contact_requires_billing_account
    check (communication_contact_id is null or billing_account_id is not null),
  add constraint jobs_company_contact_membership foreign key (billing_account_id, communication_contact_id)
    references public.kfc_customer_contacts(customer_id, contact_id) on delete set null (communication_contact_id)
    deferrable initially immediate;
create index if not exists jobs_billing_account_idx on public.jobs(billing_account_id);
