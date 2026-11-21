/*
 * Kassa (point of sale) for the shop counter.
 *
 * A till session is opened with a cash float and closed with a counted amount;
 * the difference against what the session's cash sales say should be in the
 * drawer is the Z-report. One sale is one call to kfc_pos_sale, which in a
 * single transaction:
 *
 *   - writes a paid sales invoice (shelf prices are incl. VAT; the invoice
 *     stores lines and totals excl. VAT + VAT, like every other invoice),
 *   - books a 'sale' stock move per line through kfc_book_move, linked to the
 *     invoice, taken from the bin that holds the most of that article,
 *   - records the payments (cash / pin / other) against the session,
 *   - and, when a known customer is chosen, settles the ledger entry the
 *     kfc_post_invoice trigger just posted, so their balance stays at zero.
 *
 * Retry-safe: p_key is the client's id for the sale. A second call with the
 * same key returns the invoice already made instead of selling twice.
 *
 * Server-only like the other kfc_* tables: RLS on, no policies, no grants.
 */

create table if not exists public.kfc_pos_sessions (
  id                   uuid primary key default gen_random_uuid(),
  register             text not null default 'winkel',
  opened_at            timestamptz not null default now(),
  opened_by            uuid,
  opening_float_cents  integer not null default 0 check (opening_float_cents >= 0),
  closed_at            timestamptz,
  closed_by            uuid,
  expected_cash_cents  integer,
  counted_cash_cents   integer check (counted_cash_cents is null or counted_cash_cents >= 0),
  note                 text
);

-- One open session per till.
create unique index if not exists kfc_pos_sessions_one_open
  on public.kfc_pos_sessions (register) where closed_at is null;

alter table public.sales_invoices
  add column if not exists pos_session_id uuid references public.kfc_pos_sessions (id),
  add column if not exists pos_key text;

create unique index if not exists sales_invoices_pos_key on public.sales_invoices (pos_key) where pos_key is not null;
create index if not exists sales_invoices_pos_session on public.sales_invoices (pos_session_id) where pos_session_id is not null;

create table if not exists public.kfc_pos_payments (
  id                bigserial primary key,
  session_id        uuid not null references public.kfc_pos_sessions (id),
  sales_invoice_id  uuid not null references public.sales_invoices (id) on delete restrict,
  method            text not null check (method in ('cash', 'pin', 'other')),
  -- What stays in the till / on the terminal: for cash, tendered minus change.
  amount_cents      integer not null check (amount_cents > 0),
  tendered_cents    integer not null check (tendered_cents >= amount_cents),
  created_at        timestamptz not null default now(),
  created_by        uuid,
  idempotency_key   text not null unique
);

create index if not exists kfc_pos_payments_session on public.kfc_pos_payments (session_id);

-- ---------------------------------------------------------------------------
-- Open / close
-- ---------------------------------------------------------------------------

create or replace function public.kfc_pos_open(p_register text, p_float_cents integer, p_opened_by uuid)
returns public.kfc_pos_sessions language plpgsql as $$
declare v_row public.kfc_pos_sessions;
begin
  if p_float_cents is null or p_float_cents < 0 or p_float_cents > 10000000 then raise exception 'KFC_POS_BAD_FLOAT'; end if;
  select * into v_row from public.kfc_pos_sessions where register = p_register and closed_at is null;
  if found then return v_row; end if;
  insert into public.kfc_pos_sessions (register, opening_float_cents, opened_by)
  values (p_register, p_float_cents, p_opened_by)
  returning * into v_row;
  return v_row;
exception when unique_violation then
  select * into v_row from public.kfc_pos_sessions where register = p_register and closed_at is null;
  return v_row;
end $$;

create or replace function public.kfc_pos_close(p_session uuid, p_counted_cents integer, p_note text, p_closed_by uuid)
returns public.kfc_pos_sessions language plpgsql as $$
declare v_row public.kfc_pos_sessions; v_cash integer;
begin
  if p_counted_cents is null or p_counted_cents < 0 or p_counted_cents > 100000000 then raise exception 'KFC_POS_BAD_COUNT'; end if;
  select * into v_row from public.kfc_pos_sessions where id = p_session for update;
  if not found then raise exception 'KFC_POS_NO_SESSION'; end if;
  if v_row.closed_at is not null then return v_row; end if;
  select coalesce(sum(amount_cents), 0) into v_cash from public.kfc_pos_payments where session_id = p_session and method = 'cash';
  update public.kfc_pos_sessions
     set closed_at = now(), closed_by = p_closed_by, counted_cash_cents = p_counted_cents,
         expected_cash_cents = v_row.opening_float_cents + v_cash, note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_session
  returning * into v_row;
  return v_row;
end $$;

-- ---------------------------------------------------------------------------
-- One sale
-- ---------------------------------------------------------------------------
--
-- p_lines:    [{ "article": "AS24-1-...", "quantity": 2, "unit_price_cents": 1995,
--                "discount_cents": 0, "vat_rate": 21 }, ...]   prices incl. VAT
-- p_payments: [{ "method": "cash", "tendered_cents": 5000 }, { "method": "pin", "tendered_cents": 1990 }]
-- p_biller:   { "name": ..., "street": ..., "postcode": ..., "city": ..., "email": ...,
--               "phone": ..., "kvk": ..., "btw": ..., "iban": ... }

create or replace function public.kfc_pos_sale(
  p_session uuid, p_key text, p_lines jsonb, p_payments jsonb,
  p_customer uuid, p_client_name text, p_biller jsonb, p_created_by uuid
) returns uuid language plpgsql as $$
declare
  v_invoice uuid; v_session public.kfc_pos_sessions;
  v_line jsonb; v_pay jsonb; v_i integer := 0;
  v_article public.kfc_articles; v_qty integer; v_price integer; v_disc integer; v_rate numeric;
  v_incl integer; v_total integer := 0; v_vat numeric := 0;
  v_cash integer := 0; v_noncash integer := 0; v_change integer;
  v_method text; v_tendered integer; v_location uuid; v_number text;
begin
  if p_key is null or length(p_key) < 8 or length(p_key) > 80 then raise exception 'KFC_POS_BAD_KEY'; end if;

  -- Retry: the same sale again returns the invoice it already made.
  select id into v_invoice from public.sales_invoices where pos_key = p_key;
  if found then return v_invoice; end if;

  select * into v_session from public.kfc_pos_sessions where id = p_session for update;
  if not found or v_session.closed_at is not null then raise exception 'KFC_POS_CLOSED'; end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 200 then
    raise exception 'KFC_POS_BAD_LINES';
  end if;
  if jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 or jsonb_array_length(p_payments) > 10 then
    raise exception 'KFC_POS_BAD_PAYMENTS';
  end if;

  -- Validate every line and work out the totals before writing anything.
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
    v_incl := v_qty * v_price - v_disc;
    v_total := v_total + v_incl;
    v_vat := v_vat + v_incl - v_incl / (1 + v_rate / 100);
  end loop;

  -- Payments: non-cash is taken as entered; cash may exceed what is left (change).
  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_method := v_pay->>'method';
    v_tendered := (v_pay->>'tendered_cents')::integer;
    if v_method not in ('cash', 'pin', 'other') or v_tendered is null or v_tendered <= 0 or v_tendered > 100000000 then
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

  -- Lines (excl. VAT per unit) and the stock moves.
  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_i := v_i + 1;
    select * into v_article from public.kfc_articles where code = v_line->>'article';
    v_qty := (v_line->>'quantity')::integer;
    v_price := (v_line->>'unit_price_cents')::integer;
    v_disc := coalesce((v_line->>'discount_cents')::integer, 0);
    v_rate := coalesce((v_line->>'vat_rate')::numeric, 21);
    insert into public.sales_invoice_lines (invoice_id, line_no, description, quantity, unit_price, discount, vat_rate)
    values (v_invoice, v_i,
      left(v_article.name || case when v_article.sku <> '' then ' (' || v_article.sku || ')' else '' end, 300),
      v_qty, round(v_price / (1 + v_rate / 100) / 100.0, 2), round(v_disc / (1 + v_rate / 100) / 100.0, 2), v_rate);

    v_location := null;
    select location_id into v_location from public.kfc_stock_levels
     where article_code = v_article.code order by quantity desc, location_id limit 1;
    perform public.kfc_book_move(v_article.code, v_location, -v_qty, 'sale', p_key || ':line:' || v_i,
      null, 'Kassa ' || v_number, null, p_created_by, null, null, null, v_invoice);
  end loop;

  -- Payments: cash keeps tendered minus change.
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

  -- A known customer: the trigger posted the invoice to their ledger; settle it now.
  if p_customer is not null and v_total > 0 then
    perform public.kfc_post_entry(p_customer, 'payment', v_total, p_key || ':ledger', null, 'Kassa ' || v_number,
      p_created_by, null, v_invoice);
  end if;

  return v_invoice;
end $$;

-- ---------------------------------------------------------------------------
-- Security: server-only.
-- ---------------------------------------------------------------------------

alter table public.kfc_pos_sessions enable row level security;
alter table public.kfc_pos_payments enable row level security;
revoke all on public.kfc_pos_sessions from anon, authenticated;
revoke all on public.kfc_pos_payments from anon, authenticated;
revoke all on function public.kfc_pos_open(text, integer, uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_close(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.kfc_pos_sale(uuid, text, jsonb, jsonb, uuid, text, jsonb, uuid) from public, anon, authenticated;
