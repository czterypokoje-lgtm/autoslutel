/*
 * Kassa, part two: returns at the counter, cash in / out, closing per payment
 * method and a stored Z-report.
 *
 *   kfc_pos_return(...)     a counter return against the original till sale:
 *                           per invoice line at most sold − already returned
 *                           (the original invoice row is locked, so two returns
 *                           at once cannot over-return), the goods go back on a
 *                           location the cashier picks (shelf or quarantine, no
 *                           van) through kfc_book_move with reason 'return' at
 *                           the unit cost of the original sale move, the money
 *                           goes out as a negative payment in the cashier's open
 *                           session, and a credit invoice with negative lines is
 *                           written, linked by sales_invoices.credit_of_invoice_id.
 *   kfc_pos_cash_move(...)  petty cash / bank deposit: money into or out of the
 *                           drawer with a mandatory reason, only on an open session.
 *   kfc_pos_close(...)      now takes the counted cash AND the PIN terminal total;
 *                           expected, counted and difference are stored per method,
 *                           a gapless Z-number is allocated inside the closing
 *                           transaction and the closing figures are frozen in
 *                           kfc_pos_sessions.z_report (jsonb) for reprints.
 *   kfc_pos_sale(...)       same contract as 0129, but stock only leaves sellable
 *                           shelf locations (kind 'shelf', not a technician's van);
 *                           an optional per-line "location" must be one of those.
 *                           The incl.-VAT price per line is kept on the invoice line
 *                           (pos_unit_incl_cents), so refunds and reprints use the
 *                           exact cents the customer paid.
 *
 * Expected cash = opening float + cash sales − cash refunds + cash in − cash out.
 * Expected PIN  = PIN sales − PIN refunds.
 *
 * Unit cost of sales is NOT set here: migration 0137 stamps the moving average on
 * every outbound move. kfc_book_move is not changed.
 *
 * Server-only like 0129: RLS on, no policies, nothing for anon / authenticated.
 * Idempotent: if not exists / create or replace / drop … if exists throughout.
 */

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.sales_invoices
  add column if not exists credit_of_invoice_id uuid references public.sales_invoices (id);
create index if not exists sales_invoices_credit_of on public.sales_invoices (credit_of_invoice_id) where credit_of_invoice_id is not null;

-- What the customer paid per unit and the discount, incl. VAT, in cents (till lines only).
alter table public.sales_invoice_lines
  add column if not exists pos_unit_incl_cents integer,
  add column if not exists pos_discount_incl_cents integer;

alter table public.kfc_pos_sessions
  add column if not exists expected_pin_cents    integer,
  add column if not exists counted_pin_cents     integer,
  add column if not exists cash_difference_cents integer,
  add column if not exists pin_difference_cents  integer,
  add column if not exists z_number              integer,
  add column if not exists z_report              jsonb;

alter table public.kfc_pos_sessions drop constraint if exists kfc_pos_sessions_counted_pin_check;
alter table public.kfc_pos_sessions add constraint kfc_pos_sessions_counted_pin_check
  check (counted_pin_cents is null or counted_pin_cents >= 0);
create unique index if not exists kfc_pos_sessions_z_number on public.kfc_pos_sessions (z_number) where z_number is not null;
create index if not exists kfc_pos_sessions_closed on public.kfc_pos_sessions (closed_at desc) where closed_at is not null;

-- Payments: a refund is a negative payment. The old "amount > 0" check goes; the
-- new one keeps it for sales and allows only a negative cash / PIN refund.
alter table public.kfc_pos_payments add column if not exists kind text not null default 'sale';
do $$
declare r record;
begin
  for r in select conname from pg_constraint
            where conrelid = 'public.kfc_pos_payments'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%amount_cents > 0%'
              and conname <> 'kfc_pos_payments_kind_amount'
  loop
    execute format('alter table public.kfc_pos_payments drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.kfc_pos_payments drop constraint if exists kfc_pos_payments_kind_amount;
alter table public.kfc_pos_payments add constraint kfc_pos_payments_kind_amount check (
  (kind = 'sale' and amount_cents > 0)
  or (kind = 'refund' and amount_cents < 0 and tendered_cents = amount_cents and method in ('cash', 'pin'))
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.kfc_pos_cash_moves (
  id               bigserial primary key,
  session_id       uuid not null references public.kfc_pos_sessions (id),
  direction        text not null check (direction in ('in', 'out')),
  amount_cents     integer not null check (amount_cents > 0 and amount_cents <= 10000000),
  reason           text not null check (length(btrim(reason)) between 3 and 500),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  idempotency_key  text not null unique
);
create index if not exists kfc_pos_cash_moves_session on public.kfc_pos_cash_moves (session_id);

create table if not exists public.kfc_pos_returns (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references public.kfc_pos_sessions (id),
  original_invoice_id  uuid not null references public.sales_invoices (id),
  credit_invoice_id    uuid not null unique references public.sales_invoices (id),
  method               text not null check (method in ('cash', 'pin')),
  refund_cents         integer not null check (refund_cents >= 0),
  location_id          uuid not null references public.kfc_locations (id),
  reason               text,
  created_by           uuid,
  created_at           timestamptz not null default now(),
  idempotency_key      text not null unique
);
create index if not exists kfc_pos_returns_original on public.kfc_pos_returns (original_invoice_id);
create index if not exists kfc_pos_returns_session on public.kfc_pos_returns (session_id);

create table if not exists public.kfc_pos_return_lines (
  id               bigserial primary key,
  return_id        uuid not null references public.kfc_pos_returns (id),
  invoice_line_id  uuid not null references public.sales_invoice_lines (id),
  article_code     text not null references public.kfc_articles (code),
  quantity         integer not null check (quantity > 0),
  refund_cents     integer not null check (refund_cents >= 0),
  unit_cost_cents  integer,
  stock_move_id    bigint references public.kfc_stock_moves (id)
);
create index if not exists kfc_pos_return_lines_line on public.kfc_pos_return_lines (invoice_line_id);
create index if not exists kfc_pos_return_lines_return on public.kfc_pos_return_lines (return_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- What should be in the drawer and on the terminal right now.
create or replace function public.kfc_pos_expected(p_session uuid)
returns table (expected_cash_cents integer, expected_pin_cents integer)
language sql stable set search_path = public as $$
  select
    (s.opening_float_cents
      + coalesce((select sum(p.amount_cents) from public.kfc_pos_payments p where p.session_id = s.id and p.method = 'cash'), 0)
      + coalesce((select sum(case when m.direction = 'in' then m.amount_cents else -m.amount_cents end)
                    from public.kfc_pos_cash_moves m where m.session_id = s.id), 0))::integer,
    coalesce((select sum(p.amount_cents) from public.kfc_pos_payments p where p.session_id = s.id and p.method = 'pin'), 0)::integer
  from public.kfc_pos_sessions s where s.id = p_session
$$;

-- Incl.-VAT cents of one invoice line: exact for till lines, rebuilt from the
-- excl. prices for older lines.
create or replace function public.kfc_pos_line_incl(l public.sales_invoice_lines)
returns integer language sql immutable set search_path = public as $$
  select case
    when l.pos_unit_incl_cents is not null
      then (l.quantity * l.pos_unit_incl_cents - coalesce(l.pos_discount_incl_cents, 0))::integer
    else round((l.quantity * l.unit_price - l.discount) * (1 + l.vat_rate / 100) * 100)::integer
  end
$$;

-- ---------------------------------------------------------------------------
-- Sale: only from sellable shelf locations
-- ---------------------------------------------------------------------------
--
-- p_lines:    [{ "article": "AS24-1-...", "quantity": 2, "unit_price_cents": 1995,
--                "discount_cents": 0, "vat_rate": 21, "location": <uuid, optional> }, ...]
-- (prices incl. VAT; the server decides who may change them, see src/lib/kfcPos.ts)

create or replace function public.kfc_pos_sale(
  p_session uuid, p_key text, p_lines jsonb, p_payments jsonb,
  p_customer uuid, p_client_name text, p_biller jsonb, p_created_by uuid
) returns uuid language plpgsql set search_path = public as $$
declare
  v_invoice uuid; v_session public.kfc_pos_sessions;
  v_line jsonb; v_pay jsonb; v_i integer := 0;
  v_article public.kfc_articles; v_qty integer; v_price integer; v_disc integer; v_rate numeric;
  v_incl integer; v_total integer := 0; v_vat numeric := 0;
  v_cash integer := 0; v_noncash integer := 0; v_change integer;
  v_method text; v_tendered integer; v_location uuid; v_number text; v_loc_text text;
begin
  if p_key is null or length(p_key) < 8 or length(p_key) > 80 then raise exception 'KFC_POS_BAD_KEY'; end if;

  select id into v_invoice from public.sales_invoices where pos_key = p_key;
  if found then return v_invoice; end if;

  select * into v_session from public.kfc_pos_sessions where id = p_session for update;
  if not found or v_session.closed_at is not null then raise exception 'KFC_POS_CLOSED'; end if;

  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 200 then
    raise exception 'KFC_POS_BAD_LINES';
  end if;
  if jsonb_typeof(p_payments) is distinct from 'array' or jsonb_array_length(p_payments) = 0 or jsonb_array_length(p_payments) > 10 then
    raise exception 'KFC_POS_BAD_PAYMENTS';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    select * into v_article from public.kfc_articles where code = v_line->>'article';
    if not found then raise exception 'KFC_POS_UNKNOWN_ARTICLE'; end if;
    v_qty := (v_line->>'quantity')::integer;
    v_price := (v_line->>'unit_price_cents')::integer;
    v_disc := coalesce((v_line->>'discount_cents')::integer, 0);
    v_rate := coalesce((v_line->>'vat_rate')::numeric, 21);
    if v_qty is null or v_qty < 1 or v_qty > 10000 or v_price is null or v_price < 0 or v_price > 10000000
       or v_disc < 0 or v_disc > v_qty * v_price or v_rate not in (0, 9, 21) then
      raise exception 'KFC_POS_BAD_LINES';
    end if;
    v_loc_text := nullif(v_line->>'location', '');
    if v_loc_text is not null then
      if v_loc_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'KFC_POS_BAD_LINES'; end if;
      if not exists (select 1 from public.kfc_locations
                      where id = v_loc_text::uuid and kind = 'shelf' and technician_id is null) then
        raise exception 'KFC_POS_NOT_SELLABLE';
      end if;
    end if;
    v_incl := v_qty * v_price - v_disc;
    v_total := v_total + v_incl;
    v_vat := v_vat + v_incl - v_incl / (1 + v_rate / 100);
  end loop;

  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_method := v_pay->>'method';
    v_tendered := (v_pay->>'tendered_cents')::integer;
    if v_method is null or v_method not in ('cash', 'pin', 'other') or v_tendered is null or v_tendered <= 0 or v_tendered > 100000000 then
      raise exception 'KFC_POS_BAD_PAYMENTS';
    end if;
    if v_method = 'cash' then v_cash := v_cash + v_tendered; else v_noncash := v_noncash + v_tendered; end if;
  end loop;
  if v_noncash > v_total then raise exception 'KFC_POS_OVERPAID'; end if;
  if v_cash + v_noncash < v_total then raise exception 'KFC_POS_UNDERPAID'; end if;
  v_change := v_cash + v_noncash - v_total;

  insert into public.sales_invoices (
    biller_name, biller_street, biller_postcode, biller_city, biller_email, biller_phone, biller_kvk, biller_btw, biller_iban,
    client_name, notes, subtotal, vat_total, total, status, paid_at, created_by, customer_id, pos_session_id, pos_key
  ) values (
    coalesce(nullif(p_biller->>'name', ''), 'Winkel'), p_biller->>'street', p_biller->>'postcode', p_biller->>'city',
    p_biller->>'email', p_biller->>'phone', p_biller->>'kvk', p_biller->>'btw', p_biller->>'iban',
    coalesce(nullif(trim(coalesce(p_client_name, '')), ''), 'Kassaverkoop'), 'Kassa',
    round((v_total - round(v_vat)) / 100.0, 2), round(round(v_vat) / 100.0, 2), round(v_total / 100.0, 2),
    'betaald', now(), p_created_by, p_customer, p_session, p_key
  ) returning id, invoice_number into v_invoice, v_number;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_i := v_i + 1;
    select * into v_article from public.kfc_articles where code = v_line->>'article';
    v_qty := (v_line->>'quantity')::integer;
    v_price := (v_line->>'unit_price_cents')::integer;
    v_disc := coalesce((v_line->>'discount_cents')::integer, 0);
    v_rate := coalesce((v_line->>'vat_rate')::numeric, 21);
    insert into public.sales_invoice_lines (invoice_id, line_no, description, quantity, unit_price, discount, vat_rate,
      pos_unit_incl_cents, pos_discount_incl_cents)
    values (v_invoice, v_i,
      left(v_article.name || case when v_article.sku <> '' then ' (' || v_article.sku || ')' else '' end, 300),
      v_qty, round(v_price / (1 + v_rate / 100) / 100.0, 2), round(v_disc / (1 + v_rate / 100) / 100.0, 2), v_rate,
      v_price, v_disc);

    -- The bin: the one the cashier named, else the sellable shelf holding the most.
    v_location := nullif(v_line->>'location', '')::uuid;
    if v_location is null then
      select l.location_id into v_location
        from public.kfc_stock_levels l
        join public.kfc_locations loc on loc.id = l.location_id
       where l.article_code = v_article.code and loc.kind = 'shelf' and loc.technician_id is null
       order by l.quantity desc, l.location_id
       limit 1;
      -- Located stock exists, but only in a van or quarantine: not for sale at the counter.
      if v_location is null and exists (select 1 from public.kfc_stock_levels where article_code = v_article.code) then
        raise exception 'KFC_POS_NOT_SELLABLE';
      end if;
    end if;
    perform public.kfc_book_move(v_article.code, v_location, -v_qty, 'sale', p_key || ':line:' || v_i,
      null, 'Kassa ' || v_number, null, p_created_by, null, null, null, v_invoice);
  end loop;

  v_i := 0;
  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_i := v_i + 1;
    v_method := v_pay->>'method';
    v_tendered := (v_pay->>'tendered_cents')::integer;
    if v_method = 'cash' then
      if v_change >= v_tendered then v_change := v_change - v_tendered; continue; end if;
      insert into public.kfc_pos_payments (session_id, sales_invoice_id, method, amount_cents, tendered_cents, created_by, idempotency_key)
      values (p_session, v_invoice, 'cash', v_tendered - v_change, v_tendered, p_created_by, p_key || ':pay:' || v_i);
      v_change := 0;
    else
      insert into public.kfc_pos_payments (session_id, sales_invoice_id, method, amount_cents, tendered_cents, created_by, idempotency_key)
      values (p_session, v_invoice, v_method, v_tendered, v_tendered, p_created_by, p_key || ':pay:' || v_i);
    end if;
  end loop;

  if p_customer is not null and v_total > 0 then
    perform public.kfc_post_entry(p_customer, 'payment', v_total, p_key || ':ledger', null, 'Kassa ' || v_number,
      p_created_by, null, v_invoice);
  end if;

  return v_invoice;
end $$;

-- ---------------------------------------------------------------------------
-- Return at the counter
-- ---------------------------------------------------------------------------
--
-- p_lines: [{ "line_id": <sales_invoice_lines.id of the original>, "quantity": 1 }, ...]
-- Returns the credit invoice id. The same p_key again returns the first result.

create or replace function public.kfc_pos_return(
  p_session uuid, p_key text, p_invoice uuid, p_lines jsonb, p_method text,
  p_location uuid, p_reason text, p_created_by uuid
) returns uuid language plpgsql set search_path = public as $$
declare
  v_existing uuid; v_session public.kfc_pos_sessions; v_orig public.sales_invoices;
  v_req jsonb; v_line public.sales_invoice_lines; v_qty integer; v_line_text text;
  v_returned integer; v_sold integer; v_line_incl integer; v_refund_line integer; v_unit_incl integer;
  v_move public.kfc_stock_moves; v_sale_move public.kfc_stock_moves;
  v_credit uuid; v_number text; v_return uuid := gen_random_uuid();
  v_total integer := 0; v_vat numeric := 0; v_i integer := 0; v_drawer integer;
  v_seen uuid[] := '{}';
begin
  if p_key is null or length(p_key) < 8 or length(p_key) > 80 then raise exception 'KFC_POS_BAD_KEY'; end if;

  select credit_invoice_id into v_existing from public.kfc_pos_returns where idempotency_key = p_key;
  if found then return v_existing; end if;

  select * into v_session from public.kfc_pos_sessions where id = p_session for update;
  if not found or v_session.closed_at is not null then raise exception 'KFC_POS_CLOSED'; end if;

  if p_method is null or p_method not in ('cash', 'pin') then raise exception 'KFC_POS_BAD_REFUND_METHOD'; end if;
  if p_location is null or not exists (
    select 1 from public.kfc_locations where id = p_location and technician_id is null
  ) then raise exception 'KFC_POS_RETURN_LOCATION'; end if;

  -- Lock the original sale: concurrent returns of the same receipt queue here.
  select * into v_orig from public.sales_invoices where id = p_invoice for update;
  if not found or v_orig.pos_session_id is null or v_orig.pos_key is null or v_orig.credit_of_invoice_id is not null then
    raise exception 'KFC_POS_NO_RECEIPT';
  end if;

  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 200 then
    raise exception 'KFC_POS_BAD_RETURN_LINES';
  end if;

  insert into public.sales_invoices (
    biller_name, biller_street, biller_postcode, biller_city, biller_email, biller_phone, biller_kvk, biller_btw, biller_iban,
    client_name, notes, subtotal, vat_total, total, status, paid_at, created_by, pos_session_id, pos_key, credit_of_invoice_id
  ) values (
    v_orig.biller_name, v_orig.biller_street, v_orig.biller_postcode, v_orig.biller_city, v_orig.biller_email,
    v_orig.biller_phone, v_orig.biller_kvk, v_orig.biller_btw, v_orig.biller_iban,
    v_orig.client_name, left('Kassaretour van ' || v_orig.invoice_number
      || coalesce(' · ' || nullif(btrim(coalesce(p_reason, '')), ''), ''), 500),
    0, 0, 0, 'betaald', now(), p_created_by, p_session, 'retour:' || p_key, p_invoice
  ) returning id, invoice_number into v_credit, v_number;

  insert into public.kfc_pos_returns (id, session_id, original_invoice_id, credit_invoice_id, method, refund_cents,
    location_id, reason, created_by, idempotency_key)
  values (v_return, p_session, p_invoice, v_credit, p_method, 0, p_location,
    left(nullif(btrim(coalesce(p_reason, '')), ''), 500), p_created_by, p_key);

  for v_req in select * from jsonb_array_elements(p_lines) loop
    v_i := v_i + 1;
    v_line_text := v_req->>'line_id';
    if v_line_text is null or v_line_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'KFC_POS_BAD_RETURN_LINES';
    end if;
    if v_line_text::uuid = any (v_seen) then raise exception 'KFC_POS_BAD_RETURN_LINES'; end if;
    v_seen := v_seen || v_line_text::uuid;
    if coalesce(v_req->>'quantity', '') !~ '^[0-9]{1,5}$' then raise exception 'KFC_POS_BAD_RETURN_LINES'; end if;
    v_qty := (v_req->>'quantity')::integer;
    if v_qty < 1 or v_qty > 10000 then raise exception 'KFC_POS_BAD_RETURN_LINES'; end if;

    select * into v_line from public.sales_invoice_lines where id = v_line_text::uuid and invoice_id = p_invoice;
    if not found then raise exception 'KFC_POS_BAD_RETURN_LINES'; end if;

    -- The stock move of the original sale line: which article, and at what cost it left.
    select * into v_sale_move from public.kfc_stock_moves
     where idempotency_key = v_orig.pos_key || ':line:' || v_line.line_no and reason = 'sale';
    if not found then raise exception 'KFC_POS_BAD_RETURN_LINES'; end if;

    v_sold := v_line.quantity::integer;
    select coalesce(sum(quantity), 0) into v_returned from public.kfc_pos_return_lines where invoice_line_id = v_line.id;
    if v_returned + v_qty > v_sold then raise exception 'KFC_POS_RETURN_EXCEEDS'; end if;

    -- Pro rata of what was paid for the line; the last return gets the remainder,
    -- so returning everything gives back exactly what was paid.
    v_line_incl := public.kfc_pos_line_incl(v_line);
    v_refund_line := round(v_line_incl::numeric * (v_returned + v_qty) / v_sold)::integer
                   - round(v_line_incl::numeric * v_returned / v_sold)::integer;
    v_unit_incl := coalesce(v_line.pos_unit_incl_cents, round(v_line.unit_price * (1 + v_line.vat_rate / 100) * 100)::integer);

    -- Negative line: quantity stays positive (sales_invoice_lines checks it), price and discount flip sign.
    insert into public.sales_invoice_lines (invoice_id, line_no, description, quantity, unit_price, discount, vat_rate,
      pos_unit_incl_cents, pos_discount_incl_cents)
    values (v_credit, v_i, left('Retour ' || v_line.description, 300), v_qty,
      -v_line.unit_price,
      -round(v_qty * v_line.unit_price - v_refund_line / (1 + v_line.vat_rate / 100) / 100.0, 2),
      v_line.vat_rate,
      -v_unit_incl,
      v_refund_line - v_qty * v_unit_incl);

    v_move := public.kfc_book_move(v_sale_move.article_code, p_location, v_qty, 'return', p_key || ':line:' || v_i,
      v_sale_move.unit_cost_cents, 'Kassa retour ' || v_number || ' (van ' || v_orig.invoice_number || ')',
      null, p_created_by, null, null, null, v_credit);

    insert into public.kfc_pos_return_lines (return_id, invoice_line_id, article_code, quantity, refund_cents, unit_cost_cents, stock_move_id)
    values (v_return, v_line.id, v_sale_move.article_code, v_qty, v_refund_line, v_sale_move.unit_cost_cents, v_move.id);

    v_total := v_total + v_refund_line;
    v_vat := v_vat + v_refund_line - v_refund_line / (1 + v_line.vat_rate / 100);
  end loop;

  -- Cash can only go out if the drawer should hold it.
  if p_method = 'cash' and v_total > 0 then
    select e.expected_cash_cents into v_drawer from public.kfc_pos_expected(p_session) e;
    if v_drawer < v_total then raise exception 'KFC_POS_CASH_SHORT'; end if;
  end if;

  update public.sales_invoices
     set total = -round(v_total / 100.0, 2), vat_total = -round(round(v_vat) / 100.0, 2),
         subtotal = -round((v_total - round(v_vat)) / 100.0, 2)
   where id = v_credit;
  update public.kfc_pos_returns set refund_cents = v_total where id = v_return;

  if v_total > 0 then
    insert into public.kfc_pos_payments (session_id, sales_invoice_id, method, amount_cents, tendered_cents, kind, created_by, idempotency_key)
    values (p_session, v_credit, p_method, -v_total, -v_total, 'refund', p_created_by, p_key || ':refund');
  end if;

  return v_credit;
exception when unique_violation then
  -- A parallel request with the same key won the race; everything above rolled back.
  select credit_invoice_id into v_existing from public.kfc_pos_returns where idempotency_key = p_key;
  if found then return v_existing; end if;
  raise;
end $$;

-- ---------------------------------------------------------------------------
-- Cash in / out
-- ---------------------------------------------------------------------------

create or replace function public.kfc_pos_cash_move(
  p_session uuid, p_key text, p_direction text, p_amount_cents integer, p_reason text, p_created_by uuid
) returns public.kfc_pos_cash_moves language plpgsql set search_path = public as $$
declare v_row public.kfc_pos_cash_moves; v_session public.kfc_pos_sessions; v_drawer integer;
begin
  if p_key is null or length(p_key) < 8 or length(p_key) > 80 then raise exception 'KFC_POS_BAD_KEY'; end if;
  select * into v_row from public.kfc_pos_cash_moves where idempotency_key = p_key;
  if found then return v_row; end if;

  select * into v_session from public.kfc_pos_sessions where id = p_session for update;
  if not found or v_session.closed_at is not null then raise exception 'KFC_POS_CLOSED'; end if;
  if p_direction is null or p_direction not in ('in', 'out') then raise exception 'KFC_POS_BAD_CASH_MOVE'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 or p_amount_cents > 10000000 then raise exception 'KFC_POS_BAD_CASH_MOVE'; end if;
  if p_reason is null or length(btrim(p_reason)) < 3 then raise exception 'KFC_POS_REASON_REQUIRED'; end if;

  if p_direction = 'out' then
    select e.expected_cash_cents into v_drawer from public.kfc_pos_expected(p_session) e;
    if v_drawer < p_amount_cents then raise exception 'KFC_POS_CASH_SHORT'; end if;
  end if;

  insert into public.kfc_pos_cash_moves (session_id, direction, amount_cents, reason, created_by, idempotency_key)
  values (p_session, p_direction, p_amount_cents, left(btrim(p_reason), 500), p_created_by, p_key)
  returning * into v_row;
  return v_row;
exception when unique_violation then
  select * into v_row from public.kfc_pos_cash_moves where idempotency_key = p_key;
  if found then return v_row; end if;
  raise;
end $$;

-- ---------------------------------------------------------------------------
-- Close: count cash and PIN, number and freeze the Z-report
-- ---------------------------------------------------------------------------

-- The cash-only close of 0129 goes: a close must now include the PIN total.
drop function if exists public.kfc_pos_close(uuid, integer, text, uuid);

create or replace function public.kfc_pos_close(
  p_session uuid, p_counted_cents integer, p_counted_pin_cents integer, p_note text, p_closed_by uuid
) returns public.kfc_pos_sessions language plpgsql set search_path = public as $$
declare
  v_row public.kfc_pos_sessions; v_cash integer; v_pin integer; v_z integer; v_report jsonb; v_now timestamptz := now();
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_counted_cents is null or p_counted_cents < 0 or p_counted_cents > 100000000 then raise exception 'KFC_POS_BAD_COUNT'; end if;
  if p_counted_pin_cents is null or p_counted_pin_cents < 0 or p_counted_pin_cents > 100000000 then raise exception 'KFC_POS_BAD_PIN_COUNT'; end if;
  select * into v_row from public.kfc_pos_sessions where id = p_session for update;
  if not found then raise exception 'KFC_POS_NO_SESSION'; end if;
  if v_row.closed_at is not null then return v_row; end if;

  select e.expected_cash_cents, e.expected_pin_cents into v_cash, v_pin from public.kfc_pos_expected(p_session) e;

  -- Gapless: one closing at a time takes max + 1 inside this transaction.
  perform pg_advisory_xact_lock(hashtext('kfc_pos_z_number'));
  select coalesce(max(z_number), 0) + 1 into v_z from public.kfc_pos_sessions;

  with inv as (
    select i.id, i.credit_of_invoice_id, round(i.total * 100)::integer as total_cents
      from public.sales_invoices i where i.pos_session_id = p_session
  ), pay as (
    select p.method, p.kind, sum(p.amount_cents)::integer as cents
      from public.kfc_pos_payments p where p.session_id = p_session group by p.method, p.kind
  ), mv as (
    select m.direction, sum(m.amount_cents)::integer as cents, count(*)::integer as n
      from public.kfc_pos_cash_moves m where m.session_id = p_session group by m.direction
  ), vat as (
    select l.vat_rate, sum(public.kfc_pos_line_incl(l))::integer as incl
      from public.sales_invoice_lines l join inv on inv.id = l.invoice_id
     group by l.vat_rate
  )
  select jsonb_build_object(
    'z_number', v_z,
    'register', v_row.register,
    'opened_at', v_row.opened_at, 'opened_by', v_row.opened_by,
    'closed_at', v_now, 'closed_by', p_closed_by,
    'sales_count', (select count(*) from inv where credit_of_invoice_id is null),
    'sales_total_cents', coalesce((select sum(total_cents) from inv where credit_of_invoice_id is null), 0),
    'returns_count', (select count(*) from inv where credit_of_invoice_id is not null),
    'refunds_total_cents', coalesce(-(select sum(total_cents) from inv where credit_of_invoice_id is not null), 0),
    'net_total_cents', coalesce((select sum(total_cents) from inv), 0),
    'sales_by_method', jsonb_build_object(
      'cash',  coalesce((select cents from pay where method = 'cash'  and kind = 'sale'), 0),
      'pin',   coalesce((select cents from pay where method = 'pin'   and kind = 'sale'), 0),
      'other', coalesce((select cents from pay where method = 'other' and kind = 'sale'), 0)),
    'refunds_by_method', jsonb_build_object(
      'cash', coalesce(-(select cents from pay where method = 'cash' and kind = 'refund'), 0),
      'pin',  coalesce(-(select cents from pay where method = 'pin'  and kind = 'refund'), 0)),
    'cash_in_cents',  coalesce((select cents from mv where direction = 'in'), 0),
    'cash_in_count',  coalesce((select n from mv where direction = 'in'), 0),
    'cash_out_cents', coalesce((select cents from mv where direction = 'out'), 0),
    'cash_out_count', coalesce((select n from mv where direction = 'out'), 0),
    'vat', coalesce((select jsonb_agg(jsonb_build_object(
              'rate', vat_rate, 'incl_cents', incl,
              'base_cents', round(incl / (1 + vat_rate / 100))::integer,
              'vat_cents', incl - round(incl / (1 + vat_rate / 100))::integer) order by vat_rate desc) from vat), '[]'::jsonb),
    'opening_float_cents', v_row.opening_float_cents,
    'cash', jsonb_build_object('expected_cents', v_cash, 'counted_cents', p_counted_cents, 'difference_cents', p_counted_cents - v_cash),
    'pin',  jsonb_build_object('expected_cents', v_pin,  'counted_cents', p_counted_pin_cents, 'difference_cents', p_counted_pin_cents - v_pin),
    'note', v_note
  ) into v_report;

  update public.kfc_pos_sessions
     set closed_at = v_now, closed_by = p_closed_by,
         counted_cash_cents = p_counted_cents, expected_cash_cents = v_cash, cash_difference_cents = p_counted_cents - v_cash,
         counted_pin_cents = p_counted_pin_cents, expected_pin_cents = v_pin, pin_difference_cents = p_counted_pin_cents - v_pin,
         note = v_note, z_number = v_z, z_report = v_report
   where id = p_session
  returning * into v_row;
  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- Security: server-only, like 0129.
-- ---------------------------------------------------------------------------

alter table public.kfc_pos_cash_moves enable row level security;
alter table public.kfc_pos_returns enable row level security;
alter table public.kfc_pos_return_lines enable row level security;
revoke all on public.kfc_pos_cash_moves from public, anon, authenticated;
revoke all on public.kfc_pos_returns from public, anon, authenticated;
revoke all on public.kfc_pos_return_lines from public, anon, authenticated;
revoke all on sequence public.kfc_pos_cash_moves_id_seq from public, anon, authenticated;
revoke all on sequence public.kfc_pos_return_lines_id_seq from public, anon, authenticated;

revoke all on function public.kfc_pos_expected(uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_line_incl(public.sales_invoice_lines) from public, anon, authenticated;
revoke all on function public.kfc_pos_sale(uuid, text, jsonb, jsonb, uuid, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_return(uuid, text, uuid, jsonb, text, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_cash_move(uuid, text, text, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_close(uuid, integer, integer, text, uuid) from public, anon, authenticated;
