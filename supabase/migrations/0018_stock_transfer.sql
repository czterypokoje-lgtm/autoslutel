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
