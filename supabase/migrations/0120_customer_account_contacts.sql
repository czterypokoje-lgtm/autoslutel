-- Account classification is explicit. Historical billing records stay unclassified.
alter table public.kfc_customers
  add column if not exists account_kind text check (account_kind in ('person', 'company'));

create table if not exists public.kfc_customer_contacts (
  customer_id uuid not null references public.kfc_customers (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  position text not null check (length(btrim(position)) between 1 and 80),
  primary key (customer_id, contact_id)
);
alter table public.kfc_customer_contacts enable row level security;
revoke all on public.kfc_customer_contacts from public, anon, authenticated;
grant select on public.kfc_customer_contacts to service_role;

create or replace function public.kfc_link_customer_contact(p_customer uuid, p_phone text, p_name text, p_position text)
returns void language plpgsql set search_path = '' as $$
declare
  v_contact public.contacts;
begin
  perform 1 from public.kfc_customers where id = p_customer and account_kind = 'company'
    and merged_into is null and anonymised_at is null for update;
  if not found then raise exception 'CRM_COMPANY_REQUIRED'; end if;
  insert into public.contacts (phone_e164, display_name) values (p_phone, p_name)
    on conflict (phone_e164) do nothing;
  select * into v_contact from public.contacts where phone_e164 = p_phone;
  if not v_contact.active or lower(btrim(v_contact.display_name)) <> lower(btrim(p_name)) then
    raise exception 'CRM_CONTACT_REVIEW';
  end if;
  insert into public.kfc_customer_contacts (customer_id, contact_id, position)
    values (p_customer, v_contact.id, p_position)
    on conflict (customer_id, contact_id) do update set position = excluded.position;
end;
$$;
revoke all on function public.kfc_link_customer_contact(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.kfc_link_customer_contact(uuid, text, text, text) to service_role;
grant insert, update on public.kfc_customer_contacts to service_role;
