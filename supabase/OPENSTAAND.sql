-- ============================================================================
-- OPENSTAANDE MIGRATIES — plak dit hele bestand in de Supabase SQL editor.
--
-- Samengesteld op 2026-09-08 door te kijken wat er werkelijk in de
-- database staat, niet door de bestandenlijst te lezen:
--
--   22 van de 25 tabellen bestonden al
--   crm_transfer_stock en crm_confirm_invoice ontbraken
--   er bestond nog geen enkele storage-bucket
--
-- Dat plaatst de grens precies na 0016. Alles hieronder is 0017 tot en met
-- 0020, in volgorde, ongewijzigd overgenomen uit supabase/migrations/.
--
-- Alles is idempotent: opnieuw draaien doet geen kwaad. Draai het in één keer,
-- want 0018 en 0019 leunen op my_technician_id() en crm_role() uit eerdere
-- migraties, en 0020 leunt op de tabellen uit 0019.
--
-- Wat het toevoegt:
--
--   0017  een monteur kan zijn eigen uitbetaling niet meer goedkeuren
--   0018  voorraad overzetten zonder de servicesleutel, met eigendomscontrole
--   0019  inkoopfacturen en de voorraad die eruit volgt
--   0020  de opslagmap voor de factuurbestanden, privé
-- ============================================================================




-- ############################################################################
-- ### 0017_payout_permissions.sql
-- ############################################################################

-- ============================================================================
-- CRM fase 17: een monteur mag zijn eigen uitbetaling niet goedkeuren.
--
-- Run after 0016_payout_requests.sql. Idempotent.
--
-- 0016 gave `payout_requests` a single `for all` policy allowing either the
-- office or the technician the row belongs to, together with
-- `grant update (status, paid_at, notes) to authenticated`. Read them together
-- and a technician can:
--
--     update payout_requests set status = 'paid' where technician_id = mine;
--
-- The anon key ships in the page bundle, so this needs no CRM screen — a
-- PostgREST call from anywhere with a monteur session does it. Asking for money
-- and approving the payment of money are the same permission in that policy,
-- which is the one separation a payout table exists to enforce.
--
-- Splitting it: a technician may see their own requests and file new ones;
-- only the office may change one, and only the office may delete one.
-- ============================================================================

-- 1. Take the blanket policy off ---------------------------------------------
drop policy if exists payout_requests_access on public.payout_requests;

-- 2. Privileges first: they are checked before policies ----------------------
revoke update, delete on public.payout_requests from authenticated;
grant select, insert on public.payout_requests to authenticated;
grant update (status, paid_at, notes) on public.payout_requests to authenticated;

-- 3. Read: the office sees everything, a monteur sees their own --------------
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_read') then
    create policy payout_requests_read on public.payout_requests
      for select
      using (
        public.crm_role() in ('owner', 'kantoor')
        or technician_id = public.my_technician_id()
      );
  end if;

  /*
   * Filing a request. A monteur may only file one for themselves, and only as
   * 'pending' — the status column is the approval, so the row may not arrive
   * already approved.
   */
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_insert') then
    create policy payout_requests_insert on public.payout_requests
      for insert
      with check (
        status = 'pending'
        and (
          public.crm_role() in ('owner', 'kantoor')
          or technician_id = public.my_technician_id()
        )
      );
  end if;

  /* Approving, rejecting, marking paid: the office, and nobody else. */
  if not exists (select 1 from pg_policies where policyname = 'payout_requests_office_update') then
    create policy payout_requests_office_update on public.payout_requests
      for update
      using (public.crm_role() in ('owner', 'kantoor'))
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'payout_requests_office_delete') then
    create policy payout_requests_office_delete on public.payout_requests
      for delete
      using (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

-- 4. The enum in 0016 was created unguarded ----------------------------------
/*
 * `create type public.payout_status ...` without a guard makes 0016 fail on a
 * second run, which turns "apply all migrations" into a manual job. Nothing to
 * repair here — this note is so the next person does not rediscover it — but
 * the guard belongs in 0016 itself if it is ever re-edited.
 */

notify pgrst, 'reload schema';


-- ############################################################################
-- ### 0018_stock_transfer.sql
-- ############################################################################

-- ============================================================================
-- CRM fase 18: voorraad overzetten, zonder de servicesleutel.
--
-- Run after 0017_payout_permissions.sql. Idempotent.
--
-- `mijn-bus` moved stock between vans with the service-role client, because
-- 0008 quite rightly gives a monteur no write access to `stock_items`. That
-- worked around the policy instead of adding one, and the bypass took both
-- technician ids from the caller — so any signed-in monteur could move parts
-- out of somebody else's van into their own by passing a different id.
--
-- Three things wrong with the workaround, all fixed by doing it in the
-- database instead:
--
--   ownership   the caller must own the source, or be the office
--   atomicity   the old code decremented, then incremented in a second
--               statement; a failure between them destroyed stock
--   correctness it matched the van with `.is('technician_id', id)`, and
--               PostgREST's `is` only takes null/true/false — so it worked
--               only for the warehouse row and quietly failed for real vans
--
-- The warehouse is `technician_id is null`. A monteur may load their own van
-- from it and may give from their own van back — what they may not do is reach
-- into another van, which is the whole of the hole that was there.
-- ============================================================================

create or replace function public.crm_transfer_stock(
  p_from        uuid,          -- null = the warehouse
  p_to          uuid,          -- null = back to the warehouse
  p_description text,
  p_quantity    numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      uuid := public.my_technician_id();
  v_office  boolean := public.crm_role() in ('owner', 'kantoor');
  v_from_id uuid;
  v_have    numeric;
  v_to_id   uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    return 'ongeldig_aantal';
  end if;
  if p_description is null or length(trim(p_description)) = 0 then
    return 'geen_omschrijving';
  end if;
  if p_from is not distinct from p_to then
    return 'zelfde_bus';
  end if;

  /*
   * The check the old code did not do.
   *
   * Loading the van from the warehouse is ordinary morning work, so that is
   * allowed — into their own van only. Giving from their own van, to the
   * warehouse or to a colleague, is allowed too: van-to-van is the point of
   * this screen. Reaching into somebody else's van is not, and that is exactly
   * what the caller-supplied ids used to permit.
   */
  if not v_office then
    if v_me is null then
      return 'geen_monteur';
    end if;
    if p_from is null then
      if p_to is distinct from v_me then
        return 'alleen_eigen_bus';
      end if;
    elsif p_from <> v_me then
      return 'niet_uw_voorraad';
    end if;
  end if;

  /* Lock the source row so two transfers cannot both see the same quantity. */
  select id, quantity into v_from_id, v_have
  from public.stock_items
  where description = p_description
    and technician_id is not distinct from p_from
  for update;

  if v_from_id is null then
    return 'niet_gevonden';
  end if;
  if v_have < p_quantity then
    return 'te_weinig';
  end if;

  update public.stock_items
     set quantity = quantity - p_quantity,
         updated_at = now()
   where id = v_from_id;

  select id into v_to_id
  from public.stock_items
  where description = p_description
    and technician_id is not distinct from p_to
  for update;

  if v_to_id is null then
    insert into public.stock_items (technician_id, description, quantity, min_quantity)
    values (p_to, p_description, p_quantity, 0);
  else
    update public.stock_items
       set quantity = quantity + p_quantity,
           updated_at = now()
     where id = v_to_id;
  end if;

  /* One function, one transaction: both sides move or neither does. */
  return 'ok';
end $$;

grant execute on function public.crm_transfer_stock(uuid, uuid, text, numeric) to authenticated;

/*
 * A monteur still may not write `stock_items` directly — the function above is
 * the whole of their write surface, and it is the one place the ownership rule
 * lives. 0008's stock_write policy stays exactly as it is.
 */

notify pgrst, 'reload schema';


-- ############################################################################
-- ### 0019_purchase_invoices.sql
-- ############################################################################

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


-- ############################################################################
-- ### 0020_invoice_storage.sql
-- ############################################################################

-- ============================================================================
-- CRM fase 20: een plek voor de facturen zelf.
--
-- Run after 0019_purchase_invoices.sql. Idempotent.
--
-- The upload was going to Vercel Blob, which needs BLOB_READ_WRITE_TOKEN — a
-- variable this deployment does not have. Every upload therefore failed with
-- "Opslaan van het bestand mislukt" and no way for the monteur to know why.
-- Supabase is already paid for and already authenticated on the request.
--
-- Private on purpose. An invoice carries a supplier, an address and what
-- somebody paid; the page reads it back through a signed link that expires,
-- never a public URL that would sit in a browser history forever.
--
-- The path is `<technician_id>/<uuid>.<ext>`, so the first folder is the owner
-- and the policies below are one string comparison.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'facturen',
  'facturen',
  false,
  12582912, -- 12 MB, the same cap the route enforces
  array[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'facturen_read') then
    create policy facturen_read on storage.objects
      for select to authenticated
      using (
        bucket_id = 'facturen'
        and (
          public.crm_role() in ('owner', 'kantoor')
          -- The first path segment is the technician the invoice belongs to.
          or (storage.foldername(name))[1] = public.my_technician_id()::text
        )
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'facturen_write') then
    create policy facturen_write on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'facturen'
        and (
          public.crm_role() in ('owner', 'kantoor')
          or (storage.foldername(name))[1] = public.my_technician_id()::text
        )
      );
  end if;

  /* Deleting proof of a purchase is the office's call, never the buyer's. */
  if not exists (select 1 from pg_policies where policyname = 'facturen_delete') then
    create policy facturen_delete on storage.objects
      for delete to authenticated
      using (bucket_id = 'facturen' and public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;
