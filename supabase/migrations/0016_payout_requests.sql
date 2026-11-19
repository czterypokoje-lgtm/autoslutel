-- ============================================================================
-- CRM fase 16: Payout Requests (Bakiye Cek)
-- ============================================================================

create type public.payout_status as enum ('pending', 'paid', 'rejected');

create table if not exists public.payout_requests (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete restrict,
  amount        numeric(10,2) not null check (amount > 0),
  status        public.payout_status not null default 'pending',
  created_at    timestamptz not null default now(),
  paid_at       timestamptz,
  notes         text
);

create index if not exists payout_requests_technician_idx on public.payout_requests (technician_id);
create index if not exists payout_requests_status_idx on public.payout_requests (status);

alter table public.payout_requests enable row level security;

grant select, insert on public.payout_requests to authenticated;
grant update (status, paid_at, notes) on public.payout_requests to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_access') then
    create policy payout_requests_access on public.payout_requests
      for all
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      )
      with check (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;
end $$;

notify pgrst, 'reload schema';
