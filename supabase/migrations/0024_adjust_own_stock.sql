-- ============================================================================
-- CRM fase 24: het +/- knopje op je eigen bus, zonder dat er een magazijn
-- achter hoeft te staan.
--
-- Run after 0023_coverage_keyless.sql. Idempotent.
--
-- crm_transfer_stock (0018) moves parts *between* two named bins — a van and
-- the warehouse, or two vans — and correctly refuses when the source bin does
-- not actually hold the article. That is exactly right for a transfer, and
-- exactly wrong for "+1" on an article that arrived straight into this van
-- from a confirmed invoice and never touched the warehouse at all: the tap
-- was quietly refused every time, because there was never a warehouse
-- quantity to pull from.
--
-- This is the other operation the same screen needs: not moving stock
-- between two places, but correcting the count in the one place it already
-- is. A monteur has no direct write grant on stock_items (0008) — this stays
-- security definer for the same reason crm_transfer_stock does, but the
-- write it performs is simpler: lock the caller's own row, add the delta,
-- refuse only if that would go negative.
-- ============================================================================

create or replace function public.crm_adjust_own_stock(
  p_description text,
  p_delta       int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me   uuid := public.my_technician_id();
  v_id   uuid;
  v_have numeric;
begin
  if v_me is null then
    return 'geen_monteur';
  end if;
  if p_description is null or length(trim(p_description)) = 0 then
    return 'geen_omschrijving';
  end if;
  if p_delta = 0 then
    return 'ongeldig_aantal';
  end if;

  select id, quantity into v_id, v_have
  from public.stock_items
  where technician_id = v_me
    and description = p_description
  for update;

  if v_id is null then
    return 'niet_gevonden';
  end if;
  if v_have + p_delta < 0 then
    return 'te_weinig';
  end if;

  update public.stock_items
     set quantity   = quantity + p_delta,
         updated_at = now()
   where id = v_id;

  return 'ok';
end $$;

grant execute on function public.crm_adjust_own_stock(text, int) to authenticated;

notify pgrst, 'reload schema';
