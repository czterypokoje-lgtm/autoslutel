-- ============================================================================
-- CRM fase 32: facturen die een monteur zelf opstelt, in de eigen huisstijl.
--
-- Run after 0031_marketplace_listings.sql. Idempotent.
--
-- Not the inkoopfacturen from 0019 — those are what a supplier sends us. This
-- is what we send a klant: a garage, een leverancier, een particulier met een
-- zakelijke afspraak. A monteur or the office fills in a client and a few
-- regels and gets a number, a PDF-vriendelijke weergave, and a record that
-- outlives the browser tab it was made in.
--
-- The invoice number is never picked by hand — 'twee mensen typen "I-00001"
-- op hetzelfde moment' is exactly the bug a sequence exists to prevent.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'sales_invoice_status') then
    create type public.sales_invoice_status as enum ('concept', 'verzonden', 'betaald');
  end if;
end $$;

create sequence if not exists public.sales_invoice_number_seq start 1;

create or replace function public.next_sales_invoice_number()
returns text
language sql
as $$
  select 'I-' || lpad(nextval('public.sales_invoice_number_seq')::text, 5, '0');
$$;

create table if not exists public.sales_invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default public.next_sales_invoice_number(),
  issue_date     date not null default (now() at time zone 'Europe/Amsterdam')::date,

  -- Wie de rekening stuurt. Los van SITE_CONFIG opgeslagen, zodat een factuur
  -- van vorig jaar niet met terugwerkende kracht een ander adres krijgt als
  -- de configuratie ooit verandert.
  biller_name     text not null,
  biller_street   text,
  biller_postcode text,
  biller_city     text,
  biller_country  text not null default 'Nederland',
  biller_email    text,
  biller_phone    text,
  biller_kvk      text,
  biller_btw      text,

  client_name     text not null,
  client_street   text,
  client_postcode text,
  client_city     text,
  client_country  text not null default 'Nederland',
  client_email    text,
  client_phone    text,
  client_btw      text,

  credit_applied  numeric(10,2) not null default 0,
  notes           text,

  -- Vastgelegd bij het opslaan, niet herberekend bij het tonen: een factuur is
  -- wat er op het moment van versturen stond, ook als een regel later wijzigt.
  subtotal        numeric(10,2) not null default 0,
  vat_total       numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,

  status          public.sales_invoice_status not null default 'concept',
  created_by      uuid references auth.users (id) on delete set null,
  technician_id   uuid references public.technicians (id) on delete set null,
  job_id          uuid references public.jobs (id) on delete set null,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists sales_invoices_created_idx on public.sales_invoices (created_at desc);
create index if not exists sales_invoices_tech_idx on public.sales_invoices (technician_id, created_at desc);

create table if not exists public.sales_invoice_lines (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.sales_invoices (id) on delete cascade,
  line_no      int not null default 0,

  description  text not null,
  quantity     numeric(10,2) not null default 1,
  unit_price   numeric(10,2) not null default 0,
  discount     numeric(10,2) not null default 0,
  vat_rate     numeric(5,2) not null default 21,

  constraint sales_invoice_lines_qty_check check (quantity > 0)
);

create index if not exists sales_invoice_lines_invoice_idx on public.sales_invoice_lines (invoice_id, line_no);


-- Security -------------------------------------------------------------------
alter table public.sales_invoices      enable row level security;
alter table public.sales_invoice_lines enable row level security;

grant select, insert, update, delete on public.sales_invoices      to authenticated;
grant select, insert, update, delete on public.sales_invoice_lines to authenticated;
grant usage on sequence public.sales_invoice_number_seq to authenticated;

do $$
begin
  -- Kantoor ziet alles; een monteur alleen wat hijzelf (of op zijn naam)
  -- heeft opgesteld — dezelfde regel als bij de inkoopfacturen in 0019.
  if not exists (select 1 from pg_policies where policyname = 'sales_invoices_access') then
    create policy sales_invoices_access on public.sales_invoices
      for all
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
        or created_by = auth.uid()
      )
      with check (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
        or created_by = auth.uid()
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'sales_invoice_lines_access') then
    create policy sales_invoice_lines_access on public.sales_invoice_lines
      for all
      using (
        exists (
          select 1 from public.sales_invoices i
          where i.id = invoice_id
            and (
              public.crm_role() in ('owner', 'kantoor')
              or i.technician_id = public.my_technician_id()
              or i.created_by = auth.uid()
            )
        )
      )
      with check (
        exists (
          select 1 from public.sales_invoices i
          where i.id = invoice_id
            and (
              public.crm_role() in ('owner', 'kantoor')
              or i.technician_id = public.my_technician_id()
              or i.created_by = auth.uid()
            )
        )
      );
  end if;
end $$;

notify pgrst, 'reload schema';
