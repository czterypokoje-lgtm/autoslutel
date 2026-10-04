-- ============================================================================
-- CRM fase 71: een monteur bestelt een onderdeel.
--
-- Run after 0070_telegram_connect_tokens.sql. Idempotent.
--
-- De catalogus telt 3627 artikelen met een foto, 3503 met een artikelnummer
-- en 3500 met een inkoopprijs. Een monteur kon er alleen niet bij: die data
-- zat achter /admin/producten, een kantoorscherm voor de webshop, en wat er
-- in een bus ligt kwam via een gescande leveranciersfactuur binnen.
--
-- Bestellen was daardoor een appje. Dit is hetzelfde appje, maar met het
-- artikelnummer eraan vast, zodat kantoor niet hoeft te raden welke van de
-- vier Peugeot-afstandsbedieningen werd bedoeld.
--
-- Bewust geen winkelwagen en geen betaling. Dit is geen webshop: het is een
-- monteur die om een onderdeel vraagt en kantoor dat het regelt. Een regel
-- per artikel, een status, klaar.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'part_order_status') then
    create type public.part_order_status as enum (
      'aangevraagd',  -- de monteur heeft erom gevraagd
      'besteld',      -- kantoor heeft hem bij de leverancier besteld
      'geleverd',     -- binnen, en in de bus bijgeschreven
      'afgewezen'     -- niet besteld, met een reden
    );
  end if;
end $$;

create table if not exists public.part_orders (
  id            uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians (id) on delete cascade,

  /* Wat er gevraagd is. product_slug wijst naar de catalogus, maar de
     omschrijving en het artikelnummer worden apart bewaard: de catalogus
     wordt opnieuw gebouwd en een slug kan verdwijnen, en dan moet een oude
     bestelling nog steeds te lezen zijn. */
  product_slug  text,
  description   text not null,
  article_code  text,
  /* Wat kantoor ervoor betaalde toen het gevraagd werd — niet wat het nu
     kost. Een prijs die met de catalogus meebeweegt maakt een oude
     bestelling onnavolgbaar. */
  unit_cost     numeric(10,2),

  quantity      numeric(10,2) not null default 1 check (quantity > 0),
  note          text,

  status        public.part_order_status not null default 'aangevraagd',
  status_note   text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  handled_by    uuid references auth.users (id) on delete set null,
  handled_at    timestamptz,
  /* De voorraadregel die hieruit ontstond, als hij geleverd is. */
  stock_item_id uuid references public.stock_items (id) on delete set null
);

create index if not exists part_orders_open_idx
  on public.part_orders (status, created_at desc);
create index if not exists part_orders_tech_idx
  on public.part_orders (technician_id, created_at desc);

create trigger part_orders_updated_at
  before update on public.part_orders
  for each row execute function public.touch_updated_at();

alter table public.part_orders enable row level security;

grant select, insert, update on public.part_orders to authenticated;

/* Kantoor ziet alles en beslist. */
drop policy if exists part_orders_office on public.part_orders;
create policy part_orders_office on public.part_orders
  for all
  using (public.crm_role() in ('owner', 'kantoor'))
  with check (public.crm_role() in ('owner', 'kantoor'));

/* Een monteur ziet zijn eigen bestellingen. */
drop policy if exists part_orders_own_read on public.part_orders;
create policy part_orders_own_read on public.part_orders
  for select
  using (technician_id = public.my_technician_id());

/*
 * En vraagt er zelf een aan — op eigen naam, nooit op die van een collega.
 * Zonder die with check kan een monteur een bestelling op het budget van een
 * ander zetten.
 */
drop policy if exists part_orders_own_insert on public.part_orders;
create policy part_orders_own_insert on public.part_orders
  for insert
  with check (technician_id = public.my_technician_id());

notify pgrst, 'reload schema';
