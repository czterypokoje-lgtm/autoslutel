/*
 * 0142: Autosleutel24 webshop orders enter the CRM order ledger the moment they are written.
 *
 * The webshop (Vercel project "shop") writes public.orders in this database. Until now those rows reached
 * the ledger (kfc_shop_orders / kfc_shop_order_lines) only through the import button, the nightly
 * reconcile cron, or opening the order screen. This trigger copies every paid-or-later order in the same
 * transaction, 24/7, without the CRM app, a cron or a network call.
 *
 * The mapping is src/lib/kfcOwnShop.ts mapOwnOrder + upsertOwnOrder, line for line:
 *   pending -> not copied (unpaid); paid/processing -> processing, fulfilment open (pick list);
 *   shipped/delivered -> completed, fulfilment external; cancelled -> cancelled; refunded -> refunded.
 *   An older updated_at than the ledger has is ignored; the CRM's fulfilment wins, except that a cancelled
 *   or refunded order stops being pickable. Stock reservations follow through the ledger's own triggers.
 * tests/pglite/own-order-sync.test.mjs checks that the trigger writes exactly what the app import writes.
 *
 * The webshop must never notice this: any error inside the copy is caught, logged in kfc_import_runs
 * (kind 'webhook', with the message) and the order is saved as always. The app import (button, nightly
 * reconcile, order screen) still runs and picks up anything the trigger could not copy.
 *
 * Ends by copying the paid-or-later orders that are not in the ledger yet. Idempotent: safe to run twice.
 */

-- The order key and article codes are SHA-1 based (pgcrypto, schema extensions on Supabase). Stop early
-- rather than install a trigger that could never copy anything.
do $$
begin
  if to_regprocedure('extensions.digest(bytea, text)') is null then
    raise exception 'extensions.digest is missing: enable the pgcrypto extension in schema extensions (Database > Extensions) first.';
  end if;
  if to_regclass('public.kfc_shop_orders') is null or to_regclass('public.orders') is null then
    raise exception 'public.orders or public.kfc_shop_orders is missing: this database is not an Autosleutel24 CRM at 0091+.';
  end if;
end
$$;

create or replace function public.kfc_own_order_to_ledger(p jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_shop constant text := 'autosleutel24.nl';
  v_number text := p->>'order_number';
  v_status text := p->>'status';
  v_ledger text;
  v_key bigint;
  v_modified timestamptz;
  v_email text;
  v_new_fulfilment text;
  v_fulfilment text;
  v_old record;
  v_order_id uuid;
  v_item jsonb;
  v_index integer;
  v_qty integer;
  v_line_incl bigint;
  v_sku text;
  v_slug text;
  v_hint text;
  v_code text;
begin
  if v_number is null or v_status is null
     or v_status not in ('paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') then
    return 'skipped';
  end if;

  v_ledger := case v_status
    when 'paid' then 'processing' when 'processing' then 'processing'
    when 'shipped' then 'completed' when 'delivered' then 'completed'
    when 'cancelled' then 'cancelled' else 'refunded' end;
  v_new_fulfilment := case when v_ledger = 'completed' then 'external'
    when v_ledger in ('cancelled', 'refunded') then 'cancelled' else 'open' end;

  -- ownOrderKey: the first six bytes of sha1(order number), unsigned big-endian.
  v_key := ('x' || substr(encode(extensions.digest(convert_to(v_number, 'UTF8'), 'sha1'), 'hex'), 1, 12))::bit(48)::bigint;
  v_modified := coalesce(nullif(p->>'updated_at', '')::timestamptz, (p->>'created_at')::timestamptz);

  select o.id, o.modified_at, o.fulfilment into v_old
    from public.kfc_shop_orders o where o.shop = c_shop and o.woo_order_id = v_key;
  if found and v_old.modified_at >= v_modified then
    return 'unchanged';
  end if;
  v_fulfilment := case
    when v_old.id is null then v_new_fulfilment
    when v_new_fulfilment = 'cancelled' and v_old.fulfilment in ('open', 'picked') then 'cancelled'
    else v_old.fulfilment end;

  v_email := lower(btrim(coalesce(p->>'email', '')));

  insert into public.kfc_shop_orders as o (
    shop, woo_order_id, number, status, created_at, modified_at, paid_at, currency, country,
    customer_email_hash, total_incl_cents, total_excl_cents, shipping_incl_cents, tax_cents, fulfilment,
    ship_name, ship_company, ship_street, ship_postcode, ship_city, ship_phone, ship_email, raw, imported_at)
  values (
    c_shop, v_key, v_number, v_ledger, (p->>'created_at')::timestamptz, v_modified,
    nullif(p->>'paid_at', '')::timestamptz,
    coalesce(nullif(p->>'currency', ''), 'EUR'),
    coalesce(nullif(btrim(p->>'country'), ''), 'NL'),
    case when v_email <> '' then encode(extensions.digest(convert_to(v_email, 'UTF8'), 'sha256'), 'hex') end,
    round(coalesce(nullif(p->>'total_inc', ''), '0')::numeric * 100)::integer,
    round(coalesce(nullif(p->>'total_ex_vat', ''), '0')::numeric * 100)::integer,
    round(coalesce(nullif(p->>'shipping_cost', ''), '0')::numeric * 100)::integer,
    round(coalesce(nullif(p->>'total_vat', ''), '0')::numeric * 100)::integer,
    v_fulfilment,
    nullif(btrim(p->>'name'), ''), null, nullif(btrim(p->>'street'), ''), nullif(btrim(p->>'postcode'), ''),
    nullif(btrim(p->>'city'), ''), nullif(btrim(p->>'phone'), ''), nullif(v_email, ''),
    -- The same fields the app import keeps (kfcOwnShop.ts ORDER_FIELDS).
    (select jsonb_object_agg(k, p->k) from unnest(array['id', 'order_number', 'status', 'email', 'name', 'phone',
       'street', 'postcode', 'city', 'country', 'items', 'shipping_cost', 'total_inc', 'total_ex_vat', 'total_vat',
       'currency', 'paid_at', 'created_at', 'updated_at']) k where p ? k),
    now())
  on conflict (shop, woo_order_id) do update set
    number = excluded.number, status = excluded.status, created_at = excluded.created_at,
    modified_at = excluded.modified_at, paid_at = excluded.paid_at, currency = excluded.currency,
    country = excluded.country, customer_email_hash = excluded.customer_email_hash,
    total_incl_cents = excluded.total_incl_cents, total_excl_cents = excluded.total_excl_cents,
    shipping_incl_cents = excluded.shipping_incl_cents, tax_cents = excluded.tax_cents,
    fulfilment = excluded.fulfilment, ship_name = excluded.ship_name, ship_company = excluded.ship_company,
    ship_street = excluded.ship_street, ship_postcode = excluded.ship_postcode, ship_city = excluded.ship_city,
    ship_phone = excluded.ship_phone, ship_email = excluded.ship_email, raw = excluded.raw,
    imported_at = excluded.imported_at
  returning o.id into v_order_id;

  if jsonb_typeof(p->'items') = 'array' then
    for v_item, v_index in select e, i::integer from jsonb_array_elements(p->'items') with ordinality as t(e, i) loop
      begin
        v_qty := greatest(0, round(coalesce(v_item->>'quantity', '1')::numeric))::integer;
      exception when others then
        v_qty := 0;
      end;
      -- The checkout stores lineTotal = unitPrice x quantity + surcharge, VAT included.
      if v_item->'lineTotal' is not null and jsonb_typeof(v_item->'lineTotal') <> 'null' then
        v_line_incl := round(coalesce(nullif(v_item->>'lineTotal', ''), '0')::numeric * 100);
      else
        v_line_incl := round(coalesce(nullif(coalesce(v_item->>'unitPrice', v_item->>'price'), ''), '0')::numeric * 100) * v_qty
                     + round(coalesce(nullif(v_item->>'surcharge', ''), '0')::numeric * 100);
      end if;
      -- The article master's SKU is the supplier code; the checkout's sku is the catalogue product id.
      v_sku := btrim(coalesce(nullif(v_item->>'supplierCode', ''), nullif(v_item->>'sku', ''), nullif(v_item->>'slug', ''), ''));
      v_slug := nullif(v_item->>'slug', '');
      -- ownArticleCode: 'AS24-1-' + the first 32 bits of sha1(slug), as scripts/build-as24-stock.mjs derives it.
      v_hint := case when v_slug is not null then 'AS24-1-' ||
        (('x' || substr(encode(extensions.digest(convert_to(v_slug, 'UTF8'), 'sha1'), 'hex'), 1, 8))::bit(32)::bigint)::text end;
      v_code := null;
      if v_hint is not null then
        select a.code into v_code from public.kfc_articles a where a.code = v_hint;
      end if;
      if v_code is null and v_sku <> '' then
        select a.code into v_code from public.kfc_articles a where a.sku = upper(v_sku) order by a.code limit 1;
      end if;

      insert into public.kfc_shop_order_lines as l
        (order_id, woo_line_id, sku, name, quantity, unit_incl_cents, total_excl_cents, article_code)
      values (
        v_order_id, v_index, v_sku,
        left(coalesce(nullif(v_item->>'title', ''), nullif(v_item->>'name', ''), 'Onbekend artikel'), 200),
        v_qty,
        case when v_qty > 0 then round(v_line_incl::numeric / v_qty)::integer end,
        round(v_line_incl::numeric / 1.21)::integer,
        v_code)
      on conflict (order_id, woo_line_id) do update set
        sku = excluded.sku, name = excluded.name, quantity = excluded.quantity,
        unit_incl_cents = excluded.unit_incl_cents, total_excl_cents = excluded.total_excl_cents,
        article_code = excluded.article_code;
    end loop;
  end if;

  return case when v_old.id is null then 'inserted' else 'updated' end;
end;
$$;

revoke all on function public.kfc_own_order_to_ledger(jsonb) from public, anon, authenticated;
grant execute on function public.kfc_own_order_to_ledger(jsonb) to service_role;

create or replace function public.kfc_own_order_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result text;
begin
  begin
    v_result := public.kfc_own_order_to_ledger(to_jsonb(new));
    if v_result in ('inserted', 'updated') then
      insert into public.kfc_import_runs (shop, kind, started_at, finished_at, orders)
      values ('autosleutel24.nl', 'webhook', now(), now(), 1);
    end if;
  exception when others then
    -- Never fail the webshop's write: log and let the app import catch up.
    begin
      insert into public.kfc_import_runs (shop, kind, started_at, finished_at, orders, error)
      values ('autosleutel24.nl', 'webhook', now(), now(), 0,
              left('Bestelling ' || coalesce(new.order_number, '?') || ': ' || sqlerrm, 500));
    exception when others then
      null;
    end;
  end;
  return null;
end;
$$;

revoke all on function public.kfc_own_order_sync() from public, anon, authenticated;

drop trigger if exists orders_kfc_ledger_sync on public.orders;
create trigger orders_kfc_ledger_sync
  after insert or update on public.orders
  for each row execute function public.kfc_own_order_sync();

-- Paid-or-later orders not in the ledger yet (the trigger only sees writes from now on).
do $$
declare
  r record;
  v_done integer := 0;
  v_failed integer := 0;
begin
  for r in select o.* from public.orders o
            where o.status in ('paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
            order by o.created_at loop
    begin
      if public.kfc_own_order_to_ledger(to_jsonb(r)) in ('inserted', 'updated') then v_done := v_done + 1; end if;
    exception when others then
      v_failed := v_failed + 1;
      raise notice 'Bestelling %: %', r.order_number, sqlerrm;
    end;
  end loop;
  raise notice 'Webshop orders copied into the ledger: %, failed: %', v_done, v_failed;
end
$$;
