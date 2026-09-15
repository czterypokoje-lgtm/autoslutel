-- ============================================================================
-- CRM fase 19: inkoopfacturen, en de voorraad die eruit volgt.
--
-- Run after 0018_stock_transfer.sql. Idempotent.
--
-- A monteur buys parts — from us, from A-Key, from anyone — and photographs the
-- invoice. What is on that paper is the only record of two things we otherwise
-- never learn: what is now in their van, and what they actually paid for it.
--
-- The rule this schema is built around: **reading proposes, a person confirms.**
-- Extracted lines land in `purchase_invoice_lines` unconfirmed and change no
-- stock at all. A monteur ticks the ones that are right, corrects the ones that
-- are not, and only then does anything move. An OCR mistake should cost ten
-- seconds of correcting, never a van that the system believes holds a part it
-- does not.
--
-- That is also why `extracted` keeps the raw reading as jsonb: when a line is
-- wrong we can see whether the reader misread it or a human mistyped it.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum (
      'nieuw',      -- uploaded, not read yet
      'gelezen',    -- lines proposed, waiting for a person
      'verwerkt',   -- confirmed, stock written
      'afgekeurd'   -- not ours, duplicate, unreadable
    );
  end if;
end $$;

create table if not exists public.purchase_invoices (
  id             uuid primary key default gen_random_uuid(),
  technician_id  uuid references public.technicians (id) on delete set null,
  uploaded_by    uuid references auth.users (id) on delete set null,

  supplier       text,
  invoice_number text,
  invoice_date   date,
  total_amount   numeric(10,2),

  /** Where the photo or PDF lives. Kept: it is the proof behind the numbers. */
  file_url       text not null,
  file_type      text,

  status         public.invoice_status not null default 'nieuw',
  /** Exactly what the reader returned, before anyone touched it. */
  extracted      jsonb,
  note           text,

  created_at     timestamptz not null default now(),
  processed_at   timestamptz
);

create index if not exists purchase_invoices_tech_idx on public.purchase_invoices (technician_id, created_at desc);
create index if not exists purchase_invoices_status_idx on public.purchase_invoices (status);

/*
 * One row per line on the paper.
 *
 * `matched_slug` is our catalogue's answer, `confirmed` is the human's. Both
 * are kept: when a match is wrong often enough for one supplier, the matcher
 * is what needs fixing, and that is only visible if we stored what it guessed.
 */
create table if not exists public.purchase_invoice_lines (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.purchase_invoices (id) on delete cascade,
  line_no      int not null default 0,

  description  text not null,
  article_code text,
  quantity     numeric(10,2) not null default 1,
  unit_price   numeric(10,2),

  matched_slug text,
  confirmed    boolean not null default false,
  /** The stock row this line became, once confirmed. */
  stock_item_id uuid references public.stock_items (id) on delete set null,

  constraint purchase_invoice_lines_qty_check check (quantity > 0)
);

create index if not exists purchase_invoice_lines_invoice_idx on public.purchase_invoice_lines (invoice_id, line_no);


-- Security -------------------------------------------------------------------
alter table public.purchase_invoices      enable row level security;
alter table public.purchase_invoice_lines enable row level security;

grant select, insert, update, delete on public.purchase_invoices      to authenticated;
grant select, insert, update, delete on public.purchase_invoice_lines to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'purchase_invoices_access') then
    create policy purchase_invoices_access on public.purchase_invoices
      for all
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      )
      with check (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  /* A line is reachable exactly when its invoice is. */
  if not exists (select 1 from pg_policies where policyname = 'purchase_invoice_lines_access') then
    create policy purchase_invoice_lines_access on public.purchase_invoice_lines
      for all
      using (
        exists (
          select 1 from public.purchase_invoices i
          where i.id = invoice_id
            and (
              public.crm_role() in ('owner', 'kantoor')
              or i.technician_id = public.my_technician_id()
            )
        )
      )
      with check (
        exists (
          select 1 from public.purchase_invoices i
          where i.id = invoice_id
            and (
              public.crm_role() in ('owner', 'kantoor')
              or i.technician_id = public.my_technician_id()
            )
        )
      );
  end if;
end $$;


-- Confirming an invoice into stock -------------------------------------------
/*
 * The only thing that turns a read line into a part in a van.
 *
 * One statement per invoice so a half-processed invoice cannot exist, and it
 * refuses to run twice: `status = 'verwerkt'` is checked first, because a
 * double tap on a phone with a bad connection must not double the stock.
 *
 * The purchase price is written to `unit_cost` as it goes. That number is the
 * whole reason to read invoices at all — it is the only place the business
 * learns what a part actually cost, rather than what a supplier's list says.
 */
create or replace function public.crm_confirm_invoice(p_invoice uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me     uuid := public.my_technician_id();
  v_office boolean := public.crm_role() in ('owner', 'kantoor');
  v_tech   uuid;
  v_status public.invoice_status;
  v_line   record;
  v_stock  uuid;
  v_count  int := 0;
begin
  select technician_id, status into v_tech, v_status
  from public.purchase_invoices
  where id = p_invoice
  for update;

  if v_tech is null and not found then
    return 'niet_gevonden';
  end if;
  if not v_office and (v_me is null or v_tech is distinct from v_me) then
    return 'niet_uw_factuur';
  end if;
  if v_status = 'verwerkt' then
    return 'al_verwerkt';
  end if;

  for v_line in
    select * from public.purchase_invoice_lines
    where invoice_id = p_invoice and confirmed = true
  loop
    /* Add to the row this technician already has for that part, or open one. */
    select id into v_stock
    from public.stock_items
    where technician_id is not distinct from v_tech
      and description = v_line.description
    for update;

    if v_stock is null then
      insert into public.stock_items (technician_id, product_slug, description, quantity, min_quantity, unit_cost)
      values (v_tech, v_line.matched_slug, v_line.description, v_line.quantity, 0, v_line.unit_price)
      returning id into v_stock;
    else
      update public.stock_items
         set quantity = quantity + v_line.quantity,
             /* Keep the newest price actually paid; a null on the line must
                not wipe what we already knew. */
             unit_cost = coalesce(v_line.unit_price, unit_cost),
             product_slug = coalesce(product_slug, v_line.matched_slug),
             updated_at = now()
       where id = v_stock;
    end if;

    update public.purchase_invoice_lines
       set stock_item_id = v_stock
     where id = v_line.id;

    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    return 'niets_aangevinkt';
  end if;

  update public.purchase_invoices
     set status = 'verwerkt', processed_at = now()
   where id = p_invoice;

  return 'ok:' || v_count;
end $$;

grant execute on function public.crm_confirm_invoice(uuid) to authenticated;

notify pgrst, 'reload schema';
