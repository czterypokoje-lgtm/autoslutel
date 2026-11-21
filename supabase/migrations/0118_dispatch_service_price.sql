-- Optional service-only amount excluding VAT. Existing package quotes keep their price.
alter table public.dispatch_pricing
  add column if not exists service_price numeric(10,2) check (service_price >= 0);
