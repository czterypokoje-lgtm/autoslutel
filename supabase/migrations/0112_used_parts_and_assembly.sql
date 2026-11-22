-- 0112: second-hand parts and assembly (spec P1-C, scenario S3).
--
-- 1. An article says what it physically is and how it is tracked:
--      condition    new | opened | used
--      tracking     quantity (many identical units on one card)
--                   | serial (one unique unit per card: a used part gets its own card,
--                     and so its own printable internal label)
--      acquisition  purchase | assembly  (how the card came to exist)
--    Defaults keep every existing card exactly as it was: new, quantity, purchase.
--
-- 2. Assembly turns parts into a product in one transaction: each part leaves its
--    shelf (move reason 'assembly', negative), the product arrives on its shelf
--    (reason 'assembly', positive) at a unit cost of parts + labour. Any failure —
--    a part short on its shelf, an unknown article — raises, and Postgres rolls the
--    whole call back, so the ledger never holds half an assembly. A replayed key
--    returns the original assembly and books nothing.
--    A part without a known cost makes the product's cost unknown (null), never
--    zero: the spec forbids publishing a margin that silently assumes free parts.
--
-- Additive: new columns with defaults, one new table, one new function, and the
-- move reason list widened by one value (nothing allowed before is refused now).

alter table public.kfc_articles add column if not exists condition   text not null default 'new';
alter table public.kfc_articles add column if not exists tracking    text not null default 'quantity';
alter table public.kfc_articles add column if not exists acquisition text not null default 'purchase';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kfc_articles_condition_check') then
    alter table public.kfc_articles add constraint kfc_articles_condition_check check (condition in ('new', 'opened', 'used'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kfc_articles_tracking_check') then
    alter table public.kfc_articles add constraint kfc_articles_tracking_check check (tracking in ('quantity', 'serial'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kfc_articles_acquisition_check') then
    alter table public.kfc_articles add constraint kfc_articles_acquisition_check check (acquisition in ('purchase', 'assembly'));
  end if;
end $$;

alter table public.kfc_stock_moves drop constraint if exists kfc_stock_moves_reason_check;
alter table public.kfc_stock_moves add constraint kfc_stock_moves_reason_check
  check (reason in ('count', 'sale', 'return', 'received', 'transfer', 'correction', 'issue', 'assembly'));

create table if not exists public.kfc_assemblies (
  id               uuid primary key default gen_random_uuid(),
  output_article   text not null references public.kfc_articles (code),
  output_location  uuid not null references public.kfc_locations (id),
  quantity         integer not null check (quantity > 0),
  labour_cents     integer not null default 0 check (labour_cents >= 0),
  unit_cost_cents  integer,           -- null when a part's cost was unknown
  components       jsonb not null,    -- [{article, location, quantity, unit_cost_cents}]
  note             text,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  idempotency_key  text not null unique
);
alter table public.kfc_stock_moves add column if not exists assembly_id uuid references public.kfc_assemblies (id);

create or replace function public.kfc_assemble(
  p_output text, p_output_location uuid, p_quantity integer, p_components jsonb,
  p_labour_cents integer, p_key text, p_created_by uuid default null, p_note text default null
) returns public.kfc_assemblies language plpgsql as $$
declare
  v_row public.kfc_assemblies; v_part jsonb; v_cost integer; v_total bigint := 0; v_unknown boolean := false;
  v_parts jsonb := '[]'::jsonb; v_n integer := 0; v_unit integer;
begin
  select * into v_row from public.kfc_assemblies where idempotency_key = p_key;
  if found then return v_row; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
  if coalesce(p_labour_cents, 0) < 0 then raise exception 'KFC_BAD_LABOUR'; end if;
  if jsonb_typeof(p_components) <> 'array' or jsonb_array_length(p_components) = 0 then raise exception 'KFC_NO_COMPONENTS'; end if;
  if not exists (select 1 from public.kfc_articles where code = p_output) then raise exception 'KFC_UNKNOWN_ARTICLE %', p_output; end if;

  insert into public.kfc_assemblies (output_article, output_location, quantity, labour_cents, components, note, created_by, idempotency_key)
  values (p_output, p_output_location, p_quantity, coalesce(p_labour_cents, 0), '[]'::jsonb, p_note, p_created_by, p_key)
  returning * into v_row;

  for v_part in select * from jsonb_array_elements(p_components) loop
    v_n := v_n + 1;
    if (v_part->>'article') = p_output then raise exception 'KFC_PART_IS_OUTPUT'; end if;
    if coalesce((v_part->>'quantity')::integer, 0) <= 0 then raise exception 'KFC_BAD_QUANTITY'; end if;
    select purchase_price_cents into v_cost from public.kfc_articles where code = v_part->>'article';
    if not found then raise exception 'KFC_UNKNOWN_ARTICLE %', v_part->>'article'; end if;
    if v_cost is null then v_unknown := true; else v_total := v_total + v_cost::bigint * (v_part->>'quantity')::integer; end if;
    -- Parts leave their shelf. kfc_book_move raises KFC_INSUFFICIENT on a short shelf, which undoes everything.
    perform public.kfc_book_move(v_part->>'article', (v_part->>'location')::uuid, -((v_part->>'quantity')::integer), 'assembly',
      p_key || ':in:' || v_n, v_cost, p_note, null, p_created_by);
    update public.kfc_stock_moves set assembly_id = v_row.id where idempotency_key = p_key || ':in:' || v_n;
    v_parts := v_parts || jsonb_build_object('article', v_part->>'article', 'location', v_part->>'location',
      'quantity', (v_part->>'quantity')::integer, 'unit_cost_cents', v_cost);
  end loop;

  v_unit := case when v_unknown then null else round((v_total + coalesce(p_labour_cents, 0)) / p_quantity::numeric)::integer end;
  perform public.kfc_book_move(p_output, p_output_location, p_quantity, 'assembly', p_key || ':out', v_unit, p_note, null, p_created_by);
  update public.kfc_stock_moves set assembly_id = v_row.id where idempotency_key = p_key || ':out';
  update public.kfc_articles set acquisition = 'assembly', purchase_price_cents = coalesce(v_unit, purchase_price_cents), updated_at = now()
   where code = p_output;
  update public.kfc_assemblies set unit_cost_cents = v_unit, components = v_parts where id = v_row.id returning * into v_row;
  return v_row;
end $$;

-- Server-only, like the rest of the stock ledger.
alter table public.kfc_assemblies enable row level security;
revoke all on public.kfc_assemblies from anon, authenticated;
grant all on public.kfc_assemblies to service_role;
revoke all on function public.kfc_assemble(text, uuid, integer, jsonb, integer, text, uuid, text) from public, anon, authenticated;
grant execute on function public.kfc_assemble(text, uuid, integer, jsonb, integer, text, uuid, text) to service_role;
