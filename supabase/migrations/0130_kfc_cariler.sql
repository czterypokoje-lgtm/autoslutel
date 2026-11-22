-- ============================================================================
-- 0130: cariler — customer and supplier accounts, purchasing on supplier
-- accounts (Nebim V3 / ERPNext style: Customer, Supplier, Purchase Order,
-- Purchase Receipt, Purchase Invoice, statement, aging).
--
--   kfc_customers              + kvk, invoice_email, iban, bic, website
--                              (company accounts need KvK and BTW; the app
--                              validates, the database keeps the KvK format).
--   kfc_suppliers              the supplier account (crediteur).
--   kfc_supplier_contacts      people at the supplier.
--   kfc_purchase_orders        + supplier_id, backfilled from the free-text
--                              supplier names (the text column stays as the
--                              name on the order).
--   kfc_supplier_articles      supplier SKU, agreed price, lead time, minimum
--                              quantity, preferred supplier; last price paid
--                              is kept up to date from purchase order lines.
--   kfc_supplier_ledger        append-only, mirrors kfc_customer_ledger (0093):
--                              invoice (+), payment (−), credit_note (−),
--                              refund (+), opening (±), write_off (−),
--                              reversal (opposite). amount_cents > 0 means
--                              we owe the supplier.
--   kfc_supplier_allocations   which payment/credit settles which invoice.
--   kfc_supplier_invoice_open  open remainder per invoice entry.
--   kfc_supplier_balance       open, overdue, aging and open purchase orders.
--   kfc_purchase_line_facts    one row per purchase order line, for reports.
--
--   kfc_post_supplier_entry    books an invoice, payment, credit, refund,
--                              opening or write-off; idempotent on p_key;
--                              credits allocate oldest due first.
--   kfc_reverse_supplier_entry the opposite entry and opposite allocations.
--
-- Server-only like 0090/0093: RLS on, nothing for anon/authenticated.
-- Idempotent: safe to run twice.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Customers: company registration and invoicing fields
-- ---------------------------------------------------------------------------
alter table public.kfc_customers add column if not exists kvk text;
alter table public.kfc_customers add column if not exists invoice_email text;
alter table public.kfc_customers add column if not exists iban text;
alter table public.kfc_customers add column if not exists bic text;
alter table public.kfc_customers add column if not exists website text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kfc_customers_kvk_format') then
    alter table public.kfc_customers add constraint kfc_customers_kvk_format check (kvk is null or kvk ~ '^[0-9]{8}$');
  end if;
end $$;
create index if not exists kfc_customers_kvk_idx on public.kfc_customers (kvk) where kvk is not null;
create index if not exists kfc_customers_vat_idx on public.kfc_customers (upper(vat_number)) where vat_number is not null;

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_suppliers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(btrim(name)) between 1 and 160),
  kvk               text check (kvk is null or kvk ~ '^[0-9]{8}$'),
  vat_number        text,
  iban              text,
  bic               text,
  email             text,
  order_email       text,
  phone             text,
  website           text,
  contact_name      text,
  street            text,
  postcode          text,
  city              text,
  country           text not null default 'NL',
  terms_days        integer not null default 30 check (terms_days between 0 and 180),
  lead_time_days    integer check (lead_time_days is null or lead_time_days between 0 and 365),
  min_order_cents   integer check (min_order_cents is null or min_order_cents >= 0),
  customer_number   text,  -- our account number at this supplier
  note              text,
  active            boolean not null default true,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists kfc_suppliers_name_key on public.kfc_suppliers (lower(btrim(name)));
create index if not exists kfc_suppliers_active_idx on public.kfc_suppliers (active, lower(name));

create table if not exists public.kfc_supplier_contacts (
  id           uuid primary key default gen_random_uuid(),
  supplier_id  uuid not null references public.kfc_suppliers (id) on delete cascade,
  name         text not null check (length(btrim(name)) between 1 and 120),
  position     text,
  email        text,
  phone        text,
  created_at   timestamptz not null default now()
);
create index if not exists kfc_supplier_contacts_supplier_idx on public.kfc_supplier_contacts (supplier_id);

-- ---------------------------------------------------------------------------
-- Purchase orders on the supplier account
-- ---------------------------------------------------------------------------
alter table public.kfc_purchase_orders add column if not exists supplier_id uuid references public.kfc_suppliers (id);
create index if not exists kfc_purchase_orders_supplier_idx on public.kfc_purchase_orders (supplier_id, created_at desc);

-- Backfill: one supplier per distinct (case- and space-insensitive) name.
insert into public.kfc_suppliers (name)
select distinct on (lower(btrim(supplier))) btrim(supplier)
  from public.kfc_purchase_orders
 where supplier_id is null and btrim(coalesce(supplier, '')) <> ''
 order by lower(btrim(supplier)), created_at
on conflict (lower(btrim(name))) do nothing;

update public.kfc_purchase_orders po
   set supplier_id = s.id
  from public.kfc_suppliers s
 where po.supplier_id is null
   and lower(btrim(po.supplier)) = lower(btrim(s.name));

-- ---------------------------------------------------------------------------
-- Supplier articles: what this supplier sells us, under which code, at what price
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_supplier_articles (
  supplier_id       uuid not null references public.kfc_suppliers (id) on delete cascade,
  article_code      text not null references public.kfc_articles (code) on delete cascade,
  supplier_sku      text,
  price_cents       integer check (price_cents is null or price_cents >= 0),
  min_qty           integer not null default 1 check (min_qty > 0),
  lead_time_days    integer check (lead_time_days is null or lead_time_days between 0 and 365),
  preferred         boolean not null default false,
  last_price_cents  integer,
  last_ordered_at   timestamptz,
  note              text,
  updated_at        timestamptz not null default now(),
  primary key (supplier_id, article_code)
);
create index if not exists kfc_supplier_articles_article_idx on public.kfc_supplier_articles (article_code);
create index if not exists kfc_supplier_articles_sku_idx on public.kfc_supplier_articles (upper(supplier_sku)) where supplier_sku is not null;
create unique index if not exists kfc_supplier_articles_one_preferred on public.kfc_supplier_articles (article_code) where preferred;

-- A priced purchase order line keeps the supplier-article row current: last
-- price paid, last ordered; the agreed price is only filled when still empty.
create or replace function public.kfc_supplier_article_from_po_line() returns trigger
language plpgsql set search_path = '' as $$
declare v_supplier uuid;
begin
  select supplier_id into v_supplier from public.kfc_purchase_orders where id = new.po_id;
  if v_supplier is null then return new; end if;
  insert into public.kfc_supplier_articles as sa (supplier_id, article_code, price_cents, last_price_cents, last_ordered_at)
  values (v_supplier, new.article_code, new.unit_cost_cents, new.unit_cost_cents, now())
  on conflict (supplier_id, article_code) do update
    set last_price_cents = coalesce(excluded.last_price_cents, sa.last_price_cents),
        price_cents      = coalesce(sa.price_cents, excluded.price_cents),
        last_ordered_at  = now(),
        updated_at       = now();
  return new;
end $$;
drop trigger if exists kfc_supplier_article_from_po_line on public.kfc_purchase_order_lines;
create trigger kfc_supplier_article_from_po_line after insert or update of unit_cost_cents on public.kfc_purchase_order_lines
  for each row execute function public.kfc_supplier_article_from_po_line();

-- Existing priced lines seed the table once (latest price per supplier and article).
insert into public.kfc_supplier_articles (supplier_id, article_code, price_cents, last_price_cents, last_ordered_at)
select distinct on (po.supplier_id, l.article_code) po.supplier_id, l.article_code, l.unit_cost_cents, l.unit_cost_cents, coalesce(po.ordered_at, po.created_at)
  from public.kfc_purchase_order_lines l
  join public.kfc_purchase_orders po on po.id = l.po_id
 where po.supplier_id is not null
 order by po.supplier_id, l.article_code, (l.unit_cost_cents is null), coalesce(po.ordered_at, po.created_at) desc
on conflict (supplier_id, article_code) do nothing;

-- ---------------------------------------------------------------------------
-- Supplier ledger (crediteuren), mirroring the customer ledger of 0093/0094
-- ---------------------------------------------------------------------------
create table if not exists public.kfc_supplier_ledger (
  id                 bigserial primary key,
  supplier_id        uuid not null references public.kfc_suppliers (id),
  entry_type         text not null check (entry_type in ('invoice', 'payment', 'credit_note', 'refund', 'opening', 'write_off', 'reversal')),
  amount_cents       integer not null,
  vat_cents          integer not null default 0,
  entry_date         date not null default (now() at time zone 'Europe/Amsterdam')::date,
  due_date           date,
  booked_at          timestamptz not null default now(),
  invoice_ref        text,
  purchase_order_id  uuid references public.kfc_purchase_orders (id) on delete set null,
  reverses_entry_id  bigint references public.kfc_supplier_ledger (id),
  note               text,
  created_by         uuid,
  idempotency_key    text not null unique
);
create index if not exists kfc_supplier_ledger_supplier_idx on public.kfc_supplier_ledger (supplier_id, entry_date desc, booked_at desc, id desc);
create index if not exists kfc_supplier_ledger_po_idx on public.kfc_supplier_ledger (purchase_order_id) where purchase_order_id is not null;
create index if not exists kfc_supplier_ledger_reverses_idx on public.kfc_supplier_ledger (reverses_entry_id) where reverses_entry_id is not null;

create table if not exists public.kfc_supplier_allocations (
  id                bigserial primary key,
  credit_entry_id   bigint not null references public.kfc_supplier_ledger (id),
  invoice_entry_id  bigint not null references public.kfc_supplier_ledger (id),
  amount_cents      integer not null,
  created_at        timestamptz not null default now()
);
create index if not exists kfc_supplier_alloc_invoice_idx on public.kfc_supplier_allocations (invoice_entry_id);
create index if not exists kfc_supplier_alloc_credit_idx on public.kfc_supplier_allocations (credit_entry_id);

-- Open remainder of every debit entry we still owe (invoice, opening, refund).
-- Reversals and reversed entries are never open themselves (as 0094).
create or replace view public.kfc_supplier_invoice_open as
select e.id as entry_id, e.supplier_id, e.entry_type, e.entry_date, e.due_date, e.invoice_ref, e.purchase_order_id, e.amount_cents,
       e.amount_cents - coalesce((select sum(a.amount_cents) from public.kfc_supplier_allocations a where a.invoice_entry_id = e.id), 0) as open_cents
  from public.kfc_supplier_ledger e
 where e.amount_cents > 0
   and e.entry_type <> 'reversal'
   and not exists (select 1 from public.kfc_supplier_ledger r where r.reverses_entry_id = e.id);

-- Balance, aging by due date and open purchase orders, per supplier.
create or replace view public.kfc_supplier_balance as
with open as (
  select supplier_id,
         sum(open_cents) filter (where open_cents > 0 and (due_date is null or due_date >= current_date)) as not_due,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 1 and 30)  as d1_30,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 31 and 60) as d31_60,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 61 and 90) as d61_90,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date > 90)              as d90p,
         min(due_date) filter (where open_cents > 0 and due_date < current_date) as oldest_overdue
    from public.kfc_supplier_invoice_open group by supplier_id
), bal as (
  select supplier_id, sum(amount_cents) as open_cents, max(entry_date) as last_entry from public.kfc_supplier_ledger group by supplier_id
), lines as (
  select po_id, sum(greatest(quantity - received, 0)::bigint * coalesce(unit_cost_cents, 0)) as open_value
    from public.kfc_purchase_order_lines group by po_id
), po as (
  select o.supplier_id,
         count(*) filter (where o.status in ('draft', 'ordered')) as open_pos,
         count(*) filter (where o.status = 'ordered' and o.expected_on < current_date) as late_pos,
         coalesce(sum(l.open_value) filter (where o.status = 'ordered'), 0) as on_order_cents,
         max(coalesce(o.ordered_at, o.created_at)) as last_order_at
    from public.kfc_purchase_orders o
    left join lines l on l.po_id = o.id
   where o.supplier_id is not null
   group by o.supplier_id
)
select s.id as supplier_id,
       coalesce(b.open_cents, 0) as open_cents,
       coalesce(o.d1_30, 0) + coalesce(o.d31_60, 0) + coalesce(o.d61_90, 0) + coalesce(o.d90p, 0) as overdue_cents,
       coalesce(o.not_due, 0) as not_due, coalesce(o.d1_30, 0) as d1_30, coalesce(o.d31_60, 0) as d31_60,
       coalesce(o.d61_90, 0) as d61_90, coalesce(o.d90p, 0) as d90p, o.oldest_overdue, b.last_entry,
       coalesce(p.open_pos, 0) as open_pos, coalesce(p.late_pos, 0) as late_pos,
       coalesce(p.on_order_cents, 0) as on_order_cents, p.last_order_at
  from public.kfc_suppliers s
  left join open o on o.supplier_id = s.id
  left join bal  b on b.supplier_id = s.id
  left join po   p on p.supplier_id = s.id;

-- One row per purchase order line: purchases per supplier / period / article,
-- open orders, late deliveries and purchase price history all read this.
create or replace view public.kfc_purchase_line_facts as
select l.id as line_id, o.id as po_id, o.status, o.supplier_id, coalesce(s.name, o.supplier) as supplier_name,
       o.created_at, o.ordered_at, o.expected_on, o.received_at, o.invoice_ref,
       (coalesce(o.ordered_at, o.created_at) at time zone 'Europe/Amsterdam')::date as order_date,
       l.article_code, a.name as article_name, a.sku, a.category,
       l.quantity, l.received, greatest(l.quantity - l.received, 0) as open_quantity, l.unit_cost_cents,
       l.quantity::bigint * l.unit_cost_cents as ordered_cents,
       l.received::bigint * l.unit_cost_cents as received_cents,
       (select max(m.created_at) from public.kfc_stock_moves m where m.purchase_order_line_id = l.id and m.reason = 'received') as last_receipt_at
  from public.kfc_purchase_order_lines l
  join public.kfc_purchase_orders o on o.id = l.po_id
  left join public.kfc_articles a on a.code = l.article_code
  left join public.kfc_suppliers s on s.id = o.supplier_id;

-- ---------------------------------------------------------------------------
-- Booking
-- ---------------------------------------------------------------------------
-- p_allocations: [{"invoice_entry_id": 12, "amount_cents": 5000}] or null for oldest-due-first.
create or replace function public.kfc_post_supplier_entry(
  p_supplier uuid, p_type text, p_amount_cents integer, p_key text,
  p_entry_date date default null, p_due_date date default null, p_invoice_ref text default null,
  p_purchase_order uuid default null, p_vat_cents integer default 0, p_note text default null,
  p_created_by uuid default null, p_allocations jsonb default null
) returns bigint language plpgsql set search_path = '' as $$
declare
  v_id bigint; v_signed integer; v_left integer; v_inv record; v_take integer; v_alloc jsonb;
  v_terms integer; v_date date; v_ref text; v_po_supplier uuid;
begin
  if p_type not in ('invoice', 'payment', 'credit_note', 'refund', 'opening', 'write_off') then raise exception 'KFC_BAD_TYPE'; end if;
  if p_type <> 'opening' and (p_amount_cents is null or p_amount_cents <= 0) then raise exception 'KFC_BAD_AMOUNT'; end if;
  if p_type = 'opening' and coalesce(p_amount_cents, 0) = 0 then raise exception 'KFC_BAD_AMOUNT'; end if;
  select id into v_id from public.kfc_supplier_ledger where idempotency_key = p_key;
  if found then return v_id; end if;

  perform pg_advisory_xact_lock(hashtext('kfc_supplier_ledger:' || p_supplier::text));
  -- A retry that raced the first attempt finds its entry after the lock.
  select id into v_id from public.kfc_supplier_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  select terms_days into v_terms from public.kfc_suppliers where id = p_supplier;
  if not found then raise exception 'KFC_NO_SUPPLIER'; end if;

  v_date := coalesce(p_entry_date, (now() at time zone 'Europe/Amsterdam')::date);
  v_ref := nullif(btrim(coalesce(p_invoice_ref, '')), '');

  if p_purchase_order is not null then
    select supplier_id into v_po_supplier from public.kfc_purchase_orders where id = p_purchase_order;
    if not found then raise exception 'KFC_NO_PO'; end if;
    if v_po_supplier is distinct from p_supplier then raise exception 'KFC_PO_SUPPLIER'; end if;
  end if;

  if p_type = 'invoice' then
    if v_ref is null then raise exception 'KFC_INVOICE_REF'; end if;
    if exists (select 1 from public.kfc_supplier_ledger e
                where e.supplier_id = p_supplier and e.entry_type = 'invoice' and lower(e.invoice_ref) = lower(v_ref)
                  and not exists (select 1 from public.kfc_supplier_ledger r where r.reverses_entry_id = e.id)) then
      raise exception 'KFC_DUPLICATE_INVOICE';
    end if;
  end if;

  v_signed := case when p_type in ('payment', 'credit_note', 'write_off') then -p_amount_cents else p_amount_cents end;
  insert into public.kfc_supplier_ledger (supplier_id, entry_type, amount_cents, vat_cents, entry_date, due_date, invoice_ref, purchase_order_id, note, created_by, idempotency_key)
  values (p_supplier, p_type, v_signed, case when p_type = 'invoice' then coalesce(p_vat_cents, 0) else 0 end, v_date,
          case when p_type in ('invoice', 'opening', 'refund') then coalesce(p_due_date, v_date + coalesce(v_terms, 30)) end,
          v_ref, p_purchase_order, nullif(btrim(coalesce(p_note, '')), ''), p_created_by, p_key)
  returning id into v_id;

  -- The supplier's invoice number lands on the order when the order has none yet.
  if p_type = 'invoice' and p_purchase_order is not null then
    update public.kfc_purchase_orders set invoice_ref = v_ref where id = p_purchase_order and invoice_ref is null;
  end if;

  if v_signed >= 0 then return v_id; end if;

  v_left := -v_signed;
  if p_allocations is not null then
    for v_alloc in select * from jsonb_array_elements(p_allocations) loop
      v_take := least((v_alloc->>'amount_cents')::integer, v_left);
      exit when v_take is null or v_take <= 0;
      select o.entry_id, o.open_cents into v_inv from public.kfc_supplier_invoice_open o
       where o.entry_id = (v_alloc->>'invoice_entry_id')::bigint and o.supplier_id = p_supplier;
      if not found then raise exception 'KFC_BAD_ALLOCATION'; end if;
      v_take := least(v_take, greatest(v_inv.open_cents, 0));
      continue when v_take <= 0;
      insert into public.kfc_supplier_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_id, v_inv.entry_id, v_take);
      v_left := v_left - v_take;
    end loop;
  end if;
  -- Whatever the explicit allocations did not use goes oldest due first.
  for v_inv in select entry_id, open_cents from public.kfc_supplier_invoice_open
                where supplier_id = p_supplier and open_cents > 0
                order by due_date nulls last, entry_date, entry_id loop
    exit when v_left <= 0;
    v_take := least(v_inv.open_cents, v_left);
    insert into public.kfc_supplier_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_id, v_inv.entry_id, v_take);
    v_left := v_left - v_take;
  end loop;
  return v_id;
end $$;

create or replace function public.kfc_reverse_supplier_entry(p_entry bigint, p_key text, p_created_by uuid default null, p_note text default null)
returns bigint language plpgsql set search_path = '' as $$
declare v_orig public.kfc_supplier_ledger; v_id bigint; v_a record;
begin
  select id into v_id from public.kfc_supplier_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  select * into v_orig from public.kfc_supplier_ledger where id = p_entry;
  if not found then raise exception 'KFC_NO_ENTRY'; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_supplier_ledger:' || v_orig.supplier_id::text));
  select id into v_id from public.kfc_supplier_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  if v_orig.entry_type = 'reversal' then raise exception 'KFC_ALREADY_REVERSED'; end if;
  if exists (select 1 from public.kfc_supplier_ledger where reverses_entry_id = p_entry) then raise exception 'KFC_ALREADY_REVERSED'; end if;
  insert into public.kfc_supplier_ledger (supplier_id, entry_type, amount_cents, vat_cents, entry_date, invoice_ref, purchase_order_id, reverses_entry_id, note, created_by, idempotency_key)
  values (v_orig.supplier_id, 'reversal', -v_orig.amount_cents, -v_orig.vat_cents, (now() at time zone 'Europe/Amsterdam')::date,
          v_orig.invoice_ref, v_orig.purchase_order_id, p_entry, coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Tegenboeking van #' || p_entry::text), p_created_by, p_key)
  returning id into v_id;
  for v_a in select * from public.kfc_supplier_allocations where credit_entry_id = p_entry or invoice_entry_id = p_entry loop
    insert into public.kfc_supplier_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_a.credit_entry_id, v_a.invoice_entry_id, -v_a.amount_cents);
  end loop;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Server only
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['kfc_suppliers', 'kfc_supplier_contacts', 'kfc_supplier_articles', 'kfc_supplier_ledger', 'kfc_supplier_allocations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
revoke all on public.kfc_supplier_invoice_open from public, anon, authenticated;
revoke all on public.kfc_supplier_balance from public, anon, authenticated;
revoke all on public.kfc_purchase_line_facts from public, anon, authenticated;
grant select on public.kfc_supplier_invoice_open, public.kfc_supplier_balance, public.kfc_purchase_line_facts to service_role;
grant usage, select on sequence public.kfc_supplier_ledger_id_seq, public.kfc_supplier_allocations_id_seq to service_role;
revoke all on function public.kfc_post_supplier_entry(uuid, text, integer, text, date, date, text, uuid, integer, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.kfc_reverse_supplier_entry(bigint, text, uuid, text) from public, anon, authenticated;
revoke all on function public.kfc_supplier_article_from_po_line() from public, anon, authenticated;
grant execute on function public.kfc_post_supplier_entry(uuid, text, integer, text, date, date, text, uuid, integer, text, uuid, jsonb) to service_role;
grant execute on function public.kfc_reverse_supplier_entry(bigint, text, uuid, text) to service_role;

notify pgrst, 'reload schema';
