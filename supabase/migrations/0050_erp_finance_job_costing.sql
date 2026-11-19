-- ============================================================================
-- ERP Lite: Phase 3 - Finance, Job Costing & Expenses
--
-- Tracks exact profitability per job (Gross Margin), logs company expenses,
-- and expands the sales invoice statuses for advanced collections.
-- ============================================================================

-- 1. EXPAND SALES INVOICE STATUS
-- PostgreSQL ENUM cannot be altered in a transaction easily if used in constraints, 
-- but we can add values if outside transaction blocks. Supabase migrations run in blocks by default,
-- so we use 'commit' trick or just add them IF NOT EXISTS.
alter type public.sales_invoice_status add value if not exists 'partially_paid';
alter type public.sales_invoice_status add value if not exists 'overdue';
alter type public.sales_invoice_status add value if not exists 'written_off';

-- 2. JOB COSTING (Gross Margin per Job)
alter table public.jobs
  -- Revenues (split)
  add column if not exists revenue_callout numeric(10,2) default 0,
  add column if not exists revenue_materials numeric(10,2) default 0,
  add column if not exists revenue_labor numeric(10,2) default 0,
  add column if not exists revenue_discount numeric(10,2) default 0,
  
  -- Costs
  add column if not exists cost_materials numeric(10,2) default 0,
  add column if not exists cost_technician numeric(10,2) default 0,
  add column if not exists cost_travel numeric(10,2) default 0,
  add column if not exists cost_payment_fee numeric(10,2) default 0,
  add column if not exists cost_other numeric(10,2) default 0,
  
  -- Calculated Profitability
  add column if not exists gross_margin numeric(10,2)
    generated always as (
      (coalesce(final_price, 0)) - 
      (coalesce(cost_materials, 0) + coalesce(cost_technician, 0) + coalesce(cost_travel, 0) + coalesce(cost_payment_fee, 0) + coalesce(cost_other, 0))
    ) stored;


-- 3. EXPENSES TRACKING
do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_category') then
    create type public.expense_category as enum (
      'fuel', 'parking', 'toll', 'meals', 'vehicle_maintenance',
      'tool_subscription', 'phone', 'advertising', 'supplier',
      'office', 'insurance', 'rent', 'training', 'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type public.expense_status as enum ('pending', 'approved', 'rejected', 'paid');
  end if;
end $$;

create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  category        public.expense_category not null,
  description     text not null,
  amount          numeric(10,2) not null,
  date_incurred   date not null,
  
  -- Links to cost centers
  technician_id   uuid references public.technicians(id) on delete set null,
  job_id          uuid references public.jobs(id) on delete set null,
  location_id     uuid references public.inventory_locations(id) on delete set null,
  
  supplier_name   text,
  receipt_url     text,
  
  is_reimbursable boolean not null default false,
  status          public.expense_status not null default 'pending',
  
  created_by      uuid references auth.users(id) on delete set null,
  approved_by     uuid references auth.users(id) on delete set null,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.touch_updated_at();

alter table public.expenses enable row level security;
create policy erp_exp_office on public.expenses for all using (public.crm_role() in ('owner', 'kantoor'));
create policy erp_exp_monteur on public.expenses 
  for select 
  using (public.crm_role() = 'monteur' and technician_id = public.my_technician_id());
create policy erp_exp_monteur_insert on public.expenses 
  for insert 
  with check (public.crm_role() = 'monteur' and technician_id = public.my_technician_id());
