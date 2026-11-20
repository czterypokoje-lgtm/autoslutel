-- 0097: shipping on the order (phase 2 addendum). The recipient address comes
-- in with the import (needed to print a label, so the data-processing
-- agreement must list name and address), and the label step records the
-- carrier, tracking code and label location. Idempotent.
alter table public.kfc_shop_orders
  add column if not exists ship_name text,
  add column if not exists ship_company text,
  add column if not exists ship_street text,
  add column if not exists ship_postcode text,
  add column if not exists ship_city text,
  add column if not exists ship_phone text,
  add column if not exists ship_email text,
  add column if not exists carrier text,
  add column if not exists tracking_code text,
  add column if not exists label_url text,
  add column if not exists label_created_at timestamptz,
  add column if not exists weight_grams integer;
