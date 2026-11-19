-- ============================================================================
-- Orders for the webshop.
--
-- Run in the Supabase SQL editor. Uses the same Postgres the leads table lives
-- in, so a mobile-technician order can become a service job without a second
-- database.
--
-- Money is numeric, never float: floating point on currency produces rounding
-- errors that surface as invoices that do not add up.
-- ============================================================================

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  -- Human readable, e.g. AS24-2026-00042. A customer cannot be given a uuid.
  order_number     text unique not null,
  status           text not null default 'pending',

  -- Guest checkout: no account required, so the details live on the order.
  email            text not null,
  name             text not null,
  phone            text,
  street           text not null,
  postcode         text not null,
  city             text not null,
  country          text not null default 'NL',

  -- Present when any line was ordered with a technician visit.
  kenteken         text,
  needs_technician boolean not null default false,

  -- Line snapshots. Once an order exists its lines must never change because a
  -- product was edited later — an invoice has to stay reproducible.
  items            jsonb not null,

  subtotal_inc     numeric(10,2) not null,
  shipping_cost    numeric(10,2) not null default 0,
  total_inc        numeric(10,2) not null,
  total_ex_vat     numeric(10,2) not null,
  total_vat        numeric(10,2) not null,
  currency         text not null default 'EUR',

  mollie_payment_id text unique,
  paid_at          timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table public.orders add constraint orders_status_check
      check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded'));
  end if;
end $$;

create index if not exists orders_status_idx     on public.orders (status, created_at desc);
create index if not exists orders_email_idx      on public.orders (lower(email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Orders hold names, addresses and phone numbers. The API writes with the
-- service-role key, which bypasses RLS; enabling it with no permissive policy
-- means a leaked anon key exposes nothing.
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;

-- ── Reviews ─────────────────────────────────────────────────────────────────
-- Only ever written against a delivered order. The shop shipped fabricated
-- reviews once; the unique constraint makes it awkward to repeat by accident.
create table if not exists public.product_reviews (
  id           uuid primary key default gen_random_uuid(),
  product_slug text not null,
  order_id     uuid not null references public.orders(id) on delete cascade,
  rating       int  not null check (rating between 1 and 5),
  title        text,
  body         text not null,
  author_name  text not null,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (product_slug, order_id)
);

create index if not exists product_reviews_slug_idx
  on public.product_reviews (product_slug, published_at desc);

alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from anon, authenticated;

-- Published reviews are the one thing the public may read.
drop policy if exists product_reviews_public_read on public.product_reviews;
create policy product_reviews_public_read on public.product_reviews
  for select to anon, authenticated
  using (published_at is not null);
grant select on public.product_reviews to anon, authenticated;
