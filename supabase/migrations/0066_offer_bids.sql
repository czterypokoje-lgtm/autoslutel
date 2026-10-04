-- ============================================================================
-- CRM fase 61: de monteur noemt zijn prijs en zijn moment.
--
-- Run after 0065_ad_campaign_names.sql. Idempotent.
--
-- Tot nu was een aanbod een ja/nee vraag: kantoor bepaalde de prijs en de
-- monteur mocht hem aannemen of laten lopen. job_offers heeft daardoor nooit
-- een regel gehad — nul, over de hele looptijd.
--
-- Nu biedt de monteur: een bedrag en wanneer hij kan. Kantoor gunt er een.
-- Dat is bewust geen veiling die zichzelf beslist: wat de klant betaalt blijft
-- een beslissing van het bedrijf, en een tik van de snelste monteur is geen
-- beslissing.
--
-- De drie velden vullen in deze volgorde, en dat is ook de staat van het
-- gesprek in Telegram — er is geen aparte sessietabel nodig:
--
--   bid_date gezet, bid_price leeg  -> we wachten op een bedrag
--   alle drie gezet                 -> er ligt een bod
--   response gezet                  -> kantoor heeft beslist
-- ============================================================================

alter table public.job_offers add column if not exists bid_price  numeric(10,2);
alter table public.job_offers add column if not exists bid_date   date;
alter table public.job_offers add column if not exists bid_start  time;
alter table public.job_offers add column if not exists bid_end    time;
alter table public.job_offers add column if not exists bid_at     timestamptz;

comment on column public.job_offers.bid_price is
  'Wat deze monteur voor de klus vraagt. Null zolang hij nog geen bedrag heeft gestuurd.';
comment on column public.job_offers.bid_date is
  'Wanneer hij kan. Samen met bid_price leeg betekent dit: het gesprek wacht op een bedrag.';

/* Het bod dat als eerste binnenkwam staat bovenaan; kantoor kiest zelf. */
create index if not exists job_offers_bids_idx
  on public.job_offers (job_id, bid_at)
  where bid_price is not null and response is null;

/*
 * Het ene bod dat een klus wordt.
 *
 * Eén statement, want de helft hiervan is niet terug te draaien: de klus komt
 * op naam van deze monteur te staan, de andere biedingen gaan dicht, en als
 * dat in twee stappen zou gebeuren kan een tweede tik er een tweede monteur
 * op zetten. De `response is null` in de where is de hele beveiliging: een
 * aanbod dat al beantwoord is, wordt niet nog eens gegund.
 */
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
  if public.crm_role() not in ('owner', 'kantoor') then
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
         /* Het geboden bedrag wordt de prijs. final_price blijft wat er
            werkelijk is afgerekend; dat is een ander getal en een ander
            moment. */
         quoted_price   = v_price,
         updated_at     = now()
   where id = v_job;

  update public.job_offers
     set response = 'accepted', responded_at = now()
   where id = p_offer;

  /* Iedereen die ook bood hoort het meteen; een aanbod dat blijft hangen is
     een monteur die zijn dag vrijhoudt voor een klus die hij niet krijgt. */
  update public.job_offers
     set response = 'declined', responded_at = now()
   where job_id = v_job and id <> p_offer and response is null;

  return 'ok';
end $$;

grant execute on function public.crm_award_offer(uuid) to authenticated;

notify pgrst, 'reload schema';
