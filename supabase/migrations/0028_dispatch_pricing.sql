/*
 * What a dispatch job costs — office-maintained, decoupled from the webshop's
 * supplier catalogue (catalog.json). The catalogue prices retail parts; this
 * prices technicians driving out, and the two have never had reason to agree.
 * Same shape as technician_coverage (make/model/scenario/keyless, most-specific
 * row wins) minus the per-technician columns, plus a price.
 */
create table if not exists public.dispatch_pricing (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text,
  scenario public.job_scenario not null,
  from_year int,
  to_year int,
  keyless boolean,
  price numeric(10, 2) not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dispatch_pricing enable row level security;

create unique index if not exists dispatch_pricing_unique_idx
  on public.dispatch_pricing (make, model, scenario, keyless) nulls not distinct;

grant select, insert, update, delete on public.dispatch_pricing to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'dispatch_pricing_office') then
    create policy dispatch_pricing_office on public.dispatch_pricing
      for all
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

notify pgrst, 'reload schema';
