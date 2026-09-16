/*
 * WhatsApp equivalent of crm_respond_to_offer_telegram() (0026), for the
 * ElevenLabs Technician Agent's accept/decline tool. Same body, same
 * one-statement "two technicians can't both claim it" guarantee — kept as
 * a duplicate rather than a shared refactor, matching the existing pattern.
 *
 * Resolves the technician from their phone number instead of a Telegram
 * chat id, normalized the same way public.leads already normalizes phone
 * numbers (0001_leads_sellable.sql) so "0611751231", "+31611751231" and
 * "31611751231" all match the same stored value regardless of which format
 * WhatsApp hands back.
 *
 * Never granted to `authenticated` — only the service-role agent-tool route
 * may call it, gated by AGENT_API_TOKEN the same way every other /api/agent
 * route is (src/lib/agentAuth.ts).
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

  select job_id, expires_at into v_job, v_expires
  from public.job_offers
  where id = p_offer_id and technician_id = v_tech and response is null;

  if v_job is null then
    return 'niet_gevonden';
  end if;

  if v_expires < now() then
    update public.job_offers
       set response = 'expired', responded_at = now()
     where id = p_offer_id;
    return 'verlopen';
  end if;

  if not p_accept then
    update public.job_offers
       set response = 'declined', responded_at = now()
     where id = p_offer_id;
    return 'afgewezen';
  end if;

  select technician_id into v_taken from public.jobs where id = v_job for update;
  if v_taken is not null then
    update public.job_offers
       set response = 'expired', responded_at = now(), decline_note = 'al toegewezen'
     where id = p_offer_id;
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
   where id = p_offer_id;

  return 'geaccepteerd';
end $$;

grant execute on function public.crm_respond_to_offer_whatsapp(uuid, text, boolean) to service_role;

notify pgrst, 'reload schema';
