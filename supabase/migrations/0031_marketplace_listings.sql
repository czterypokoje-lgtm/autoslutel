/*
 * Technicians selling tools/parts they don't use to each other — browsable by
 * any signed-in CRM user, editable only by whoever posted it (or the office).
 */
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid references public.technicians (id) on delete set null,
  posted_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  price numeric(10, 2),
  photos text[] not null default '{}',
  status text not null default 'available' check (status in ('available', 'sold')),
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

alter table public.marketplace_listings enable row level security;

grant select, insert, update, delete on public.marketplace_listings to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'marketplace_listings_read') then
    create policy marketplace_listings_read on public.marketplace_listings
      for select
      using (public.crm_role() <> '');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'marketplace_listings_insert') then
    create policy marketplace_listings_insert on public.marketplace_listings
      for insert
      with check (public.crm_role() <> '' and posted_by = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where policyname = 'marketplace_listings_update') then
    create policy marketplace_listings_update on public.marketplace_listings
      for update
      using (posted_by = auth.uid() or public.crm_role() in ('owner', 'kantoor'))
      with check (posted_by = auth.uid() or public.crm_role() in ('owner', 'kantoor'));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'marketplace_listings_delete') then
    create policy marketplace_listings_delete on public.marketplace_listings
      for delete
      using (posted_by = auth.uid() or public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

notify pgrst, 'reload schema';
