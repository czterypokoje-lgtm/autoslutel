-- ============================================================================
-- CRM fase 68: gunnen vanaf de telefoon.
--
-- Run after 0067_office_may_offer_a_job.sql. Idempotent.
--
-- crm_award_offer (0066) weigert iedereen die geen owner of kantoor is, en
-- leest die rol uit de JWT. De Telegram-webhook heeft geen JWT: Telegram is
-- niemand die inlogt, dus die route draait op de service-role sleutel en
-- crm_role() geeft daar een lege string. Gunnen vanuit een chat gaf dus
-- altijd 'geen_toegang'.
--
-- De service-role erbij, zoals crm_visible() (0006) het ook doet. Dat
-- verplaatst de vraag "mag deze persoon dit" naar de webhook, en daar hoort
-- hij ook: die weet welke chat het is en kijkt die op in admin_telegram
-- voordat hij dit aanroept. De sleutel alleen is niet genoeg — hij zit in de
-- serveromgeving, niet in een telefoon.
-- ============================================================================

create or replace function public.crm_award_offer(p_offer uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job   uuid;
  v_tech  uuid;
  v_price numeric(10,2);
  v_date  date;
  v_start time;
  v_end   time;
begin
  /* Kantoor via de browser, of de webhook via de service-role sleutel. */
  if public.crm_role() not in ('owner', 'kantoor')
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    return 'geen_toegang';
  end if;

  select job_id, technician_id, bid_price, bid_date, bid_start, bid_end
    into v_job, v_tech, v_price, v_date, v_start, v_end
  from public.job_offers
  where id = p_offer and response is null
  for update;

  if not found then
    return 'niet_gevonden';
  end if;
  if v_price is null or v_date is null then
    return 'geen_bod';
  end if;

  update public.jobs
     set technician_id  = v_tech,
         scheduled_date = v_date,
         slot_start     = v_start,
         slot_end       = v_end,
         quoted_price   = v_price,
         updated_at     = now()
   where id = v_job;

  update public.job_offers
     set response = 'accepted', responded_at = now()
   where id = p_offer;

  update public.job_offers
     set response = 'declined', responded_at = now()
   where job_id = v_job and id <> p_offer and response is null;

  return 'ok';
end $$;

grant execute on function public.crm_award_offer(uuid) to authenticated;

notify pgrst, 'reload schema';
