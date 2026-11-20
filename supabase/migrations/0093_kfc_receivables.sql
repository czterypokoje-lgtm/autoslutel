-- ============================================================================
-- 0093: KeyForCars customer accounts (phase 3): the cari hesap.
--
--   kfc_customers            B2B customers only (dealers, locksmiths, garages).
--   sales_invoices.customer_id  an invoice posted to an account.
--   kfc_customer_ledger      append-only entries: invoice (+), payment (−),
--                            credit_note (−), refund (+), opening (±),
--                            write_off (−), reversal (opposite of what it reverses).
--                            amount_cents is signed: positive = the customer owes.
--   kfc_ledger_allocations   which credit entry settles which invoice entry.
--   kfc_invoice_open         open remainder per invoice entry.
--   kfc_customer_balance     open, overdue and the aging buckets per customer.
--
--   An invoice posts to the ledger the moment its status leaves 'concept'
--   (trigger). Payments go through kfc_post_entry, which allocates oldest due
--   first and marks an invoice 'betaald' when nothing is left open. Mistakes
--   get kfc_reverse_entry, never an edit. Server-only like 0090. Idempotent.
-- ============================================================================

create table if not exists public.kfc_customers (
  id                 uuid primary key default gen_random_uuid(),
  company            text not null,
  contact_name       text,
  email              text,
  phone              text,
  vat_number         text,
  street             text,
  postcode           text,
  city               text,
  country            text not null default 'NL',
  terms_days         integer not null default 30 check (terms_days between 0 and 120),
  credit_limit_cents integer,
  reverse_charge     boolean not null default false,
  merged_into        uuid references public.kfc_customers (id),
  anonymised_at      timestamptz,
  note               text,
  created_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists kfc_customers_company_idx on public.kfc_customers (lower(company));

alter table public.sales_invoices add column if not exists customer_id uuid references public.kfc_customers (id);
create index if not exists sales_invoices_customer_idx on public.sales_invoices (customer_id);

create table if not exists public.kfc_customer_ledger (
  id                 bigserial primary key,
  customer_id        uuid not null references public.kfc_customers (id),
  entry_type         text not null check (entry_type in ('invoice', 'payment', 'credit_note', 'refund', 'opening', 'write_off', 'reversal')),
  amount_cents       integer not null,
  vat_cents          integer not null default 0,
  entry_date         date not null default (now() at time zone 'Europe/Amsterdam')::date,
  due_date           date,
  booked_at          timestamptz not null default now(),
  sales_invoice_id   uuid references public.sales_invoices (id) on delete set null,
  reverses_entry_id  bigint references public.kfc_customer_ledger (id),
  note               text,
  created_by         uuid,
  idempotency_key    text not null unique
);
create index if not exists kfc_ledger_customer_idx on public.kfc_customer_ledger (customer_id, entry_date desc, booked_at desc, id desc);

create table if not exists public.kfc_ledger_allocations (
  id                bigserial primary key,
  credit_entry_id   bigint not null references public.kfc_customer_ledger (id),
  invoice_entry_id  bigint not null references public.kfc_customer_ledger (id),
  amount_cents      integer not null,
  created_at        timestamptz not null default now()
);
create index if not exists kfc_alloc_invoice_idx on public.kfc_ledger_allocations (invoice_entry_id);
create index if not exists kfc_alloc_credit_idx on public.kfc_ledger_allocations (credit_entry_id);

-- Open remainder of every debit entry (invoice, opening debit, refund).
create or replace view public.kfc_invoice_open as
select e.id as entry_id, e.customer_id, e.entry_type, e.entry_date, e.due_date, e.sales_invoice_id, e.amount_cents,
       e.amount_cents - coalesce((select sum(a.amount_cents) from public.kfc_ledger_allocations a where a.invoice_entry_id = e.id), 0) as open_cents
  from public.kfc_customer_ledger e
 where e.amount_cents > 0;

-- Balance and aging by due date, per customer.
create or replace view public.kfc_customer_balance as
with open as (
  select customer_id,
         sum(open_cents) filter (where open_cents > 0 and (due_date is null or due_date >= current_date)) as not_due,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 1 and 30)  as d1_30,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 31 and 60) as d31_60,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date between 61 and 90) as d61_90,
         sum(open_cents) filter (where open_cents > 0 and current_date - due_date > 90)              as d90p,
         min(due_date) filter (where open_cents > 0 and due_date < current_date) as oldest_overdue
    from public.kfc_invoice_open group by customer_id
), bal as (
  select customer_id, sum(amount_cents) as open_cents, max(entry_date) as last_entry from public.kfc_customer_ledger group by customer_id
)
select c.id as customer_id,
       coalesce(b.open_cents, 0) as open_cents,
       coalesce(o.d1_30, 0) + coalesce(o.d31_60, 0) + coalesce(o.d61_90, 0) + coalesce(o.d90p, 0) as overdue_cents,
       coalesce(o.not_due, 0) as not_due, coalesce(o.d1_30, 0) as d1_30, coalesce(o.d31_60, 0) as d31_60,
       coalesce(o.d61_90, 0) as d61_90, coalesce(o.d90p, 0) as d90p, o.oldest_overdue, b.last_entry
  from public.kfc_customers c
  left join open o on o.customer_id = c.id
  left join bal  b on b.customer_id = c.id;

-- An invoice that leaves 'concept' posts once.
create or replace function public.kfc_post_invoice() returns trigger language plpgsql as $$
declare v_terms integer;
begin
  if new.customer_id is null or new.status = 'concept' then return new; end if;
  if exists (select 1 from public.kfc_customer_ledger where idempotency_key = 'inv:' || new.id::text) then return new; end if;
  select terms_days into v_terms from public.kfc_customers where id = new.customer_id;
  insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, vat_cents, entry_date, due_date, sales_invoice_id, note, created_by, idempotency_key)
  values (new.customer_id, 'invoice', round(new.total * 100)::integer, round(new.vat_total * 100)::integer, new.issue_date,
          new.issue_date + coalesce(v_terms, 30), new.id, 'Factuur ' || new.invoice_number, new.created_by, 'inv:' || new.id::text);
  return new;
end $$;
drop trigger if exists kfc_post_invoice on public.sales_invoices;
create trigger kfc_post_invoice after insert or update of status, customer_id on public.sales_invoices
  for each row execute function public.kfc_post_invoice();

-- A credit entry (payment, credit note, write-off) or a debit (refund, opening).
-- p_allocations: [{"invoice_entry_id": 12, "amount_cents": 5000}] or null for oldest-due-first.
create or replace function public.kfc_post_entry(
  p_customer uuid, p_type text, p_amount_cents integer, p_key text,
  p_entry_date date default null, p_note text default null, p_created_by uuid default null,
  p_allocations jsonb default null, p_sales_invoice_id uuid default null
) returns bigint language plpgsql as $$
declare v_id bigint; v_signed integer; v_left integer; v_inv record; v_take integer; v_alloc jsonb;
begin
  if p_amount_cents <= 0 and p_type <> 'opening' then raise exception 'KFC_BAD_AMOUNT'; end if;
  if p_type not in ('payment', 'credit_note', 'refund', 'opening', 'write_off') then raise exception 'KFC_BAD_TYPE'; end if;
  select id into v_id from public.kfc_customer_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_ledger:' || p_customer::text));
  v_signed := case when p_type in ('payment', 'credit_note', 'write_off') then -p_amount_cents else p_amount_cents end;
  insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, entry_date, sales_invoice_id, note, created_by, idempotency_key)
  values (p_customer, p_type, v_signed, coalesce(p_entry_date, (now() at time zone 'Europe/Amsterdam')::date), p_sales_invoice_id, p_note, p_created_by, p_key)
  returning id into v_id;
  if v_signed >= 0 then return v_id; end if;

  v_left := -v_signed;
  if p_allocations is not null then
    for v_alloc in select * from jsonb_array_elements(p_allocations) loop
      v_take := least((v_alloc->>'amount_cents')::integer, v_left);
      exit when v_take <= 0;
      insert into public.kfc_ledger_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_id, (v_alloc->>'invoice_entry_id')::bigint, v_take);
      v_left := v_left - v_take;
    end loop;
  else
    for v_inv in select entry_id, open_cents from public.kfc_invoice_open where customer_id = p_customer and open_cents > 0 order by due_date nulls last, entry_date, entry_id loop
      exit when v_left <= 0;
      v_take := least(v_inv.open_cents, v_left);
      insert into public.kfc_ledger_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_id, v_inv.entry_id, v_take);
      v_left := v_left - v_take;
    end loop;
  end if;
  -- Invoices with nothing left open are paid.
  update public.sales_invoices s set status = 'betaald'
    from public.kfc_invoice_open o
   where o.sales_invoice_id = s.id and o.customer_id = p_customer and o.open_cents <= 0 and s.status = 'verzonden';
  return v_id;
end $$;

-- A mistake gets the opposite entry and the opposite allocations.
create or replace function public.kfc_reverse_entry(p_entry bigint, p_key text, p_created_by uuid default null, p_note text default null)
returns bigint language plpgsql as $$
declare v_orig public.kfc_customer_ledger; v_id bigint; v_a record;
begin
  select id into v_id from public.kfc_customer_ledger where idempotency_key = p_key;
  if found then return v_id; end if;
  select * into v_orig from public.kfc_customer_ledger where id = p_entry;
  if not found then raise exception 'KFC_NO_ENTRY'; end if;
  if exists (select 1 from public.kfc_customer_ledger where reverses_entry_id = p_entry) then raise exception 'KFC_ALREADY_REVERSED'; end if;
  insert into public.kfc_customer_ledger (customer_id, entry_type, amount_cents, vat_cents, sales_invoice_id, reverses_entry_id, note, created_by, idempotency_key)
  values (v_orig.customer_id, 'reversal', -v_orig.amount_cents, -v_orig.vat_cents, v_orig.sales_invoice_id, p_entry, coalesce(p_note, 'Tegenboeking van #' || p_entry::text), p_created_by, p_key)
  returning id into v_id;
  for v_a in select * from public.kfc_ledger_allocations where credit_entry_id = p_entry or invoice_entry_id = p_entry loop
    insert into public.kfc_ledger_allocations (credit_entry_id, invoice_entry_id, amount_cents) values (v_a.credit_entry_id, v_a.invoice_entry_id, -v_a.amount_cents);
  end loop;
  if v_orig.entry_type = 'invoice' and v_orig.sales_invoice_id is not null then
    update public.sales_invoices set status = 'verzonden' where id = v_orig.sales_invoice_id and status = 'betaald';
  end if;
  return v_id;
end $$;

do $$
declare t text;
begin
  foreach t in array array['kfc_customers', 'kfc_customer_ledger', 'kfc_ledger_allocations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on public.kfc_invoice_open from anon, authenticated;
revoke all on public.kfc_customer_balance from anon, authenticated;
revoke all on function public.kfc_post_entry(uuid, text, integer, text, date, text, uuid, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.kfc_reverse_entry(bigint, text, uuid, text) from public, anon, authenticated;
