-- ============================================================================
-- CRM fase 9: de webshopcatalogus beheerbaar maken.
--
-- Run after 0009_webshop_orders.sql. Idempotent.
--
-- The 1020 products come from a supplier feed that is rebuilt by
-- scripts/build-catalog.mjs into src/lib/catalog.json. That file stays the
-- base: it is an import, and the next import must not wipe what the office
-- decided.
--
-- So this table holds only the decisions — a price, a translation, whether it
-- is for sale at all, how many are on the shelf. One row per product that was
-- actually touched; a product nobody edited has no row and costs nothing.
-- Re-import the feed and every one of these survives, keyed on slug.
-- ============================================================================

create table if not exists public.product_overrides (
  slug            text primary key,

  -- Null means "not overridden": fall back to the feed. That is different from
  -- an override that happens to be empty, which is why nothing is NOT NULL.
  published       boolean,
  price_override  numeric(10,2),
  cost_override   numeric(10,2),
  title_override  text,
  description_override text,

  -- Webshop stock. Separate from stock_items, which is what is in a van.
  track_stock     boolean not null default false,
  stock_quantity  numeric(10,2) not null default 0,
  min_quantity    numeric(10,2) not null default 0,

  featured        boolean not null default false,
  internal_note   text,

  updated_at      timestamptz not null default now(),
  updated_by      uuid references auth.users (id) on delete set null,

  constraint product_overrides_price_check check (price_override is null or price_override >= 0),
  constraint product_overrides_cost_check  check (cost_override  is null or cost_override  >= 0),
  constraint product_overrides_stock_check check (stock_quantity >= 0)
);

create index if not exists product_overrides_published_idx on public.product_overrides (published);
create index if not exists product_overrides_low_stock_idx on public.product_overrides (slug)
  where track_stock = true and stock_quantity <= min_quantity;

create or replace function public.product_overrides_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists product_overrides_touch_trg on public.product_overrides;
create trigger product_overrides_touch_trg
  before insert or update on public.product_overrides
  for each row execute function public.product_overrides_touch();

-- ── Grants and RLS ──────────────────────────────────────────────────────────
/*
 * The webshop reads this on every product request, and it has no session — so
 * `anon` needs select. That is not a leak: every column here is something the
 * shop shows to the customer anyway. Writing is office-only.
 */
grant select on public.product_overrides to anon, authenticated;
grant insert, update, delete on public.product_overrides to authenticated;

alter table public.product_overrides enable row level security;

drop policy if exists product_overrides_read on public.product_overrides;
create policy product_overrides_read on public.product_overrides
  for select to anon, authenticated
  using (true);

drop policy if exists product_overrides_write on public.product_overrides;
create policy product_overrides_write on public.product_overrides
  for all to authenticated
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

notify pgrst, 'reload schema';
