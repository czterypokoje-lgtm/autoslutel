-- ============================================================================
-- CRM fase 69: het bod van de monteur is een kostenpost, geen verkoopprijs.
--
-- Run after 0068_award_from_telegram.sql. Idempotent.
--
-- 0066 schreef het bod naar jobs.quoted_price. Dat was fout, en op een manier
-- die geld kost zonder dat iemand het ziet: quoted_price is wat de KLANT is
-- verteld, en het bod is wat de MONTEUR vraagt. Dat zijn twee verschillende
-- getallen in twee verschillende richtingen.
--
-- Gunnen deed dus twee dingen tegelijk: de klus toewijzen, en stilletjes de
-- verkoopprijs vervangen door de inkoop. Een klus die voor EUR 132,23 was
-- verkocht en waarop de monteur EUR 120 bood, stond daarna als EUR 120 in de
-- boeken — omzet weg, en een brutowinst van nul omdat opbrengst en kosten
-- hetzelfde getal waren geworden.
--
-- Het bod hoort in cost_technician. Daar leest gross_margin het al
-- (0059_gross_margin_reads_commission), en daar hoort het ook: het is wat
-- deze klus aan arbeid kost. De verkoopprijs blijft van kantoor.
--
-- Datum en tijdvak komen nog steeds uit het bod — die kiest de monteur wel.
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
     set technician_id   = v_tech,
         scheduled_date  = v_date,
         slot_start      = v_start,
         slot_end        = v_end,
         /* Wat deze monteur kost. quoted_price blijft onaangeroerd: dat is
            wat de klant is verteld, en daar gaat een bod niet over. */
         cost_technician = v_price,
         updated_at      = now()
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
