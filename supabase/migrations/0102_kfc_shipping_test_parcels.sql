-- Isolated parcel records for the local KeyForCars shipping test.
create table if not exists public.kfc_shipping_test_parcels (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.kfc_shop_orders(id) on delete cascade,
  parcel_no int not null check (parcel_no between 1 and 20),
  service text not null check (service in ('postnl','dhl-ecommerce','dhl-express')),
  weight_grams int not null check (weight_grams between 1 and 70000),
  length_cm int not null check (length_cm between 1 and 200),
  width_cm int not null check (width_cm between 1 and 200),
  height_cm int not null check (height_cm between 1 and 200),
  destination text not null check (length(destination) between 1 and 250),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  unique(order_id, parcel_no),
  check ((latitude is null) = (longitude is null))
);
alter table public.kfc_shipping_test_parcels enable row level security;
revoke all on public.kfc_shipping_test_parcels from anon, authenticated;
grant select, insert on public.kfc_shipping_test_parcels to service_role;
