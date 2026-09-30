/*
 * crm_respond_to_offer_whatsapp() (0035) needed a p_offer_id the WhatsApp
 * agent could never have: the Meta-template carries auto, plaats en bedrag,
 * not the offer id, and there is no callback_data on WhatsApp the way there
 * is on Telegram (0026). So every respond_to_offer call returned
 * 'niet_gevonden'.
 *
 * Fix: p_offer_id may now be null, in which case the technician's single
 * open, unexpired offer is resolved from their phone number. More than one
 * open offer returns 'meerdere_open' and changes nothing — guessing which
 * of two jobs a "ja" meant is worse than sending them to Aanbod.
 *
 * Signature, grants and the rest of the body are unchanged, including the
 * "select ... for update" claim so two technicians can't both take one job.
 */
create or replace function public.crm_respond_to_offer_whatsapp(
  p_offer_id uuid,
  p_phone    text,
  p_accept   boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm    text;
  v_tech    uuid;
  v_offer   uuid := p_offer_id;
  v_open    int;
  v_job     uuid;
  v_expires timestamptz;
  v_taken   uuid;
  v_pct     numeric(5,2);
begin
  v_norm := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  v_norm := case
    when v_norm like '+31%'  then '+31' || ltrim(substring(v_norm from 4), '0')
    when v_norm like '0031%' then '+31' || ltrim(substring(v_norm from 5), '0')
    when v_norm like '0%'    then '+31' || substring(v_norm from 2)
    else v_norm
  end;

  select id into v_tech
  from public.technicians
  where regexp_replace(
          case
            when phone like '+31%'  then '+31' || ltrim(substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 4), '0')
            when phone like '0031%' then '+31' || ltrim(substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 5), '0')
            when phone like '0%'    then '+31' || substring(regexp_replace(phone, '[^0-9+]', '', 'g') from 2)
            else regexp_replace(phone, '[^0-9+]', '', 'g')
          end, '[^0-9+]', '', 'g'
        ) = v_norm;

  if v_tech is null then
    return 'geen_monteur';
  end if;

  -- No id from the chat: there has to be exactly one offer it could mean.
  if v_offer is null then
    select count(*) into v_open
    from public.job_offers
    where technician_id = v_tech and response is null and expires_at > now();

    if v_open = 0 then
      return 'niet_gevonden';
    elsif v_open > 1 then
      return 'meerdere_open';
    end if;

    select id into v_offer
    from public.job_offers
    where technician_id = v_tech and response is null and expires_at > now();
  end if;

  select job_id, expires_at into v_job, v_expires
  from public.job_offers
  where id = v_offer and technician_id = v_tech and response is null;

  if v_job is null then
    return 'niet_gevonden';
  end if;

  if v_expires < now() then
    update public.job_offers
       set response = 'expired', responded_at = now()
     where id = v_offer;
    return 'verlopen';
  end if;

  if not p_accept then
    update public.job_offers
       set response = 'declined', responded_at = now()
     where id = v_offer;
    return 'afgewezen';
  end if;

  select technician_id into v_taken from public.jobs where id = v_job for update;
  if v_taken is not null then
    update public.job_offers
       set response = 'expired', responded_at = now(), decline_note = 'al toegewezen'
     where id = v_offer;
    return 'al_vergeven';
  end if;

  select commission_pct into v_pct
  from public.technician_subscription where technician_id = v_tech;

  update public.jobs
     set technician_id  = v_tech,
         commission_pct = coalesce(v_pct, 25),
         updated_at     = now()
   where id = v_job;

  update public.job_offers
     set response = 'accepted', responded_at = now()
   where id = v_offer;

  return 'geaccepteerd';
end $$;

grant execute on function public.crm_respond_to_offer_whatsapp(uuid, text, boolean) to service_role;

notify pgrst, 'reload schema';
