-- 0089: the KeyForCars preview table and bucket, moved from supabase/kfc-preview.sql into
-- migration history so the KeyForCars project is tracked by the CLI from here on. Idempotent.

-- ============================================================================
-- KeyForCars preview: everything its database needs.
--
-- Paste this whole file once into the SQL editor of the KeyForCars PREVIEW
-- Supabase project. Never into Autosleutel24's project: that one has its own
-- migrations in supabase/migrations/, and none of them belong here.
--
-- Idempotent: running it again does no harm.
--
-- What the preview stores:
--   kfc_stock_state   the stock record (articles counted, shelves, movements,
--                     bulk counts) as one jsonb row per slot: 'stock' for real
--                     counts, 'demo' for the sample screen (?demo=1).
--   kfc-stock-photos  private bucket for count and label photos.
--
-- Orders are sample data generated in code (src/lib/kfcSampleOrders.ts), so
-- there is no orders table and no customer data in this database.
--
-- Logins are Supabase Auth users with app_metadata.role = owner or kantoor,
-- created with scripts/crm-user.mjs against this project.
-- ============================================================================

create table if not exists public.kfc_stock_state (
  slot       text primary key check (slot in ('stock', 'demo')),
  state      jsonb not null,
  -- Every save names the version it read; a save against a newer version is
  -- refused, so two people cannot silently overwrite each other's count.
  version    integer not null default 1,
  updated_at timestamptz not null default now()
);

-- Only the server reads and writes this, with the service-role key, after it
-- has checked the signed-in user. Browsers get nothing: RLS on, no policies,
-- no grants for anon or authenticated.
alter table public.kfc_stock_state enable row level security;
revoke all on public.kfc_stock_state from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('kfc-stock-photos', 'kfc-stock-photos', false)
on conflict (id) do nothing;
