/*
 * The same accept/decline crm_respond_to_offer() already does from Aanbod
 * (0013_technician_platform.sql), reachable from a Telegram button tap
 * instead of a signed-in browser session.
 *
 * crm_respond_to_offer() resolves the acting technician from
 * my_technician_id() — i.e. auth.uid() — which does not exist for a webhook
 * call with no Supabase session. This is a separate function rather than a
 * change to that one: it resolves the technician from telegram_chat_id
 * instead, and is deliberately never granted to `authenticated` — only the
 * service-role webhook may call it, since a chat id must come from a
 * Telegram-verified request (the webhook's secret-token check), never from
 * something a browser session could hand in on its own.
 *
 * Body mirrors crm_respond_to_offer() exactly (same "one statement so two
 * technicians can't both claim it" guarantee) — kept as a duplicate rather
 * than a shared refactor of an already-relied-upon function.
 */
create or replace function public.crm_respond_to_offer_telegram(
  p_offer_id uuid,
  p_chat_id  text,
  p_accept   boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tech    uuid;
  v_job     uuid;
  v_expires timestamptz;
  v_taken   uuid;
  v_pct     numeric(5,2);
begin
  select id into v_tech from public.technicians where telegram_chat_id = p_chat_id;
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

  -- Claim the job only if nobody else already has.
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

grant execute on function public.crm_respond_to_offer_telegram(uuid, text, boolean) to service_role;

notify pgrst, 'reload schema';
