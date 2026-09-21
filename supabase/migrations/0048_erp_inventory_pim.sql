-- ============================================================================
-- ERP Lite: Phase 2 - Product Information Management (PIM) & Multi-location Inventory
--
-- Replaces the simple 'stock_items' with a full relational inventory system.
-- Supports SKUs, OEM part numbers, FCC IDs, transponder types, frequencies,
-- cost/price tracking, and strict location-based inventory holding.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_type_enum') then
    create type public.product_type_enum as enum (
      'key_blank', 'remote', 'smart_key', 'transponder_chip', 'shell', 
      'blade', 'battery', 'lock_cylinder', 'programming_accessory', 
      'tool', 'consumable'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_location_type') then
    create type public.inventory_location_type as enum (
      'main_warehouse', 'van', 'quarantine', 'scrap'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_transaction_reason') then
    create type public.inventory_transaction_reason as enum (
      'purchase', 'transfer', 'job_used', 'invoice_auto_deduct', 
      'count_variance', 'lost_damaged', 'warranty_replacement', 
      'customer_return', 'supplier_return', 'manual_adjustment'
    );
  end if;
end $$;


-- 1. MASTER PRODUCTS (PIM)
create table if not exists public.inventory_products (
  id                      uuid primary key default gen_random_uuid(),
  internal_sku            text not null unique,
  barcode                 text,
  supplier_sku            text,
  oem_part_number         text,
  fcc_id                  text,
  manufacturer            text,
  
  product_type            public.product_type_enum not null,
  
  -- Compatibility
  car_make                text,
  car_model               text,
  year_range              text,
  platform                text,
  immobilizer_type        text,
  
  -- Key Technical Specs
  frequency               text,
  transponder             text,
  keyway_blade            text,
  
  -- Purchasing & Costing
  supplier_name           text,
  last_cost               numeric(10,2) default 0,
  average_cost            numeric(10,2) default 0,
  
  -- Selling
  standard_price          numeric(10,2) default 0,
  min_price               numeric(10,2) default 0,
  suggested_price         numeric(10,2) default 0,
  vat_rate                numeric(5,2) default 21.00,
  warranty_months         integer default 12,
  requires_serial         boolean not null default false,
  
  photo_url               text,
  technical_notes         text,
  active                  boolean not null default true,
  
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger inventory_products_updated_at
  before update on public.inventory_products
  for each row execute function public.jobs_touch(); -- reusing existing touch trigger function if available, else we write one.

-- Fallback touch function if jobs_touch is too specific
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists inventory_products_updated_at on public.inventory_products;
create trigger inventory_products_updated_at
  before update on public.inventory_products
  for each row execute function public.touch_updated_at();


-- 2. INVENTORY LOCATIONS
create table if not exists public.inventory_locations (
  id              uuid primary key default gen_random_uuid(),
  type            public.inventory_location_type not null,
  technician_id   uuid references public.technicians(id) on delete restrict,
  name            text not null,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Ensure a technician only has one main 'van' location
create unique index if not exists inventory_locations_tech_idx 
  on public.inventory_locations(technician_id) 
  where type = 'van' and technician_id is not null;


-- 3. STOCK LEVELS
create table if not exists public.inventory_levels (
  location_id       uuid references public.inventory_locations(id) on delete cascade,
  product_id        uuid references public.inventory_products(id) on delete cascade,
  quantity          numeric(10,2) not null default 0,
  reserved_quantity numeric(10,2) not null default 0,
  min_quantity      numeric(10,2) not null default 0,
  last_counted_at   timestamptz,
  updated_at        timestamptz not null default now(),
  
  primary key (location_id, product_id),
  constraint inventory_levels_quantity_check check (quantity >= 0),
  constraint inventory_levels_reserved_check check (reserved_quantity >= 0 and reserved_quantity <= quantity)
);

create trigger inventory_levels_updated_at
  before update on public.inventory_levels
  for each row execute function public.touch_updated_at();


-- 4. INVENTORY TRANSACTIONS
create table if not exists public.inventory_transactions (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references public.inventory_products(id) on delete restrict not null,
  from_location_id  uuid references public.inventory_locations(id) on delete restrict,
  to_location_id    uuid references public.inventory_locations(id) on delete restrict,
  quantity          numeric(10,2) not null,
  job_id            uuid references public.jobs(id) on delete set null,
  user_id           uuid references auth.users(id) on delete set null,
  reason            public.inventory_transaction_reason not null,
  notes             text,
  created_at        timestamptz not null default now(),
  
  constraint inventory_transactions_quantity_check check (quantity > 0)
);


-- RLS Policies
alter table public.inventory_products enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.inventory_transactions enable row level security;

-- Office can do everything. Technicians can read products/locations, and read/update their own stock levels.
create policy erp_pim_office_all on public.inventory_products for all using (public.crm_role() in ('owner', 'kantoor'));
create policy erp_pim_monteur_read on public.inventory_products for select using (public.crm_role() = 'monteur');

create policy erp_loc_office_all on public.inventory_locations for all using (public.crm_role() in ('owner', 'kantoor'));
create policy erp_loc_monteur_read on public.inventory_locations for select using (public.crm_role() = 'monteur');

create policy erp_lvl_office_all on public.inventory_levels for all using (public.crm_role() in ('owner', 'kantoor'));
create policy erp_lvl_monteur_read on public.inventory_levels for select using (public.crm_role() = 'monteur');
-- Note: complex stock movements by monteurs should be handled via a secure API route rather than direct RLS update, 
-- to ensure transactions are always generated atomically.

create policy erp_tx_office_all on public.inventory_transactions for all using (public.crm_role() in ('owner', 'kantoor'));
create policy erp_tx_monteur_read on public.inventory_transactions for select using (public.crm_role() = 'monteur' and (
  from_location_id in (select id from public.inventory_locations where technician_id = public.my_technician_id())
  or 
  to_location_id in (select id from public.inventory_locations where technician_id = public.my_technician_id())
));
