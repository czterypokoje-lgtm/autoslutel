-- ============================================================================
-- CRM fase 72: de eigen Telegram-koppeling losmaken.
--
-- Run after 0071_technician_part_orders.sql. Idempotent.
--
-- Een monteur mag zijn eigen regel in `technicians` niet schrijven: de enige
-- schrijfpolicy daar is technicians_office_write (0004). Daarom loopt het
-- opslaan van een profiel al via crm_update_own_profile, een security definer
-- functie — en daarom deed de ontkoppelknop niets. De update raakte nul
-- regels, PostgREST geeft daar geen fout op, en de route meldde vrolijk dat
-- het gelukt was.
--
-- Dit is dezelfde route als het profiel opslaan, voor dat ene veld. Kantoor
-- mag het ook voor een ander doen, want het geval dat ertoe doet is een
-- telefoon die niemand meer heeft, en degene die hem kwijt is kan niet
-- inloggen om het zelf te herstellen.
-- ============================================================================

create or replace function public.crm_disconnect_telegram(p_technician uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me     uuid := public.my_technician_id();
  v_office boolean := public.crm_role() in ('owner', 'kantoor');
  v_target uuid;
begin
  /* Kantoor zonder monteur erbij: zijn eigen meldingen. */
  if p_technician is null and v_office and v_me is null then
    delete from public.admin_telegram where user_id = auth.uid();
    return 'ok';
  end if;

  v_target := coalesce(p_technician, v_me);

  if v_target is null then
    return 'geen_monteur';
  end if;
  /* Een ander losmaken mag alleen kantoor. */
  if v_target is distinct from v_me and not v_office then
    return 'geen_toegang';
  end if;

  update public.technicians
     set telegram_chat_id = null
   where id = v_target;

  if not found then
    return 'niet_gevonden';
  end if;

  /*
   * Openstaande koppelcodes van deze monteur meteen ongeldig maken. Anders
   * blijft een code die eerder is aangemaakt een half uur lang geldig, en
   * koppelt de volgende chat die hem gebruikt zich alsnog aan het oude
   * toestel — precies wat losmaken moest voorkomen.
   */
  update public.telegram_connect_tokens
     set used_at = now(), used_by_chat = 'ingetrokken'
   where kind = 'technician'
     and subject_id = v_target
     and used_at is null;

  return 'ok';
end $$;

grant execute on function public.crm_disconnect_telegram(uuid) to authenticated;

notify pgrst, 'reload schema';
