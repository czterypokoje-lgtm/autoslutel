-- ============================================================================
-- CRM fase 67: kantoor mag een klus aanbieden.
--
-- Run after 0066_offer_bids.sql. Idempotent.
--
-- 0013 gaf `authenticated` alleen select en update op job_offers. Dat was
-- destijds genoeg: aanbiedingen werden uitsluitend aangemaakt door de
-- spraakassistent, en die draait op de service-role sleutel die RLS en
-- grants allebei overslaat.
--
-- Sinds er een knop "Stuur naar monteurs" op het klusscherm staat, maakt een
-- ingelogd mens ze aan — en die liep tegen een insert waar geen recht op zat.
-- De fout die kantoor zag was "Aanbieden mislukt", wat alles kan betekenen.
--
-- De service-role client was de kortere weg geweest, maar src/lib/supabase/
-- admin.ts zegt zelf waarvoor die bestaat: "a caller who is not a person".
-- Kantoor is wel een persoon, dus hoort dit recht hier thuis en niet in een
-- sleutel die alles mag.
-- ============================================================================

grant insert on public.job_offers to authenticated;

do $$
begin
  /*
   * Alleen kantoor, en alleen aanmaken. Reageren blijft van de monteur
   * (job_offers_respond, 0013) en gunnen gaat via crm_award_offer (0066),
   * dat security definer is omdat het in één statement ook de klus omzet.
   */
  if not exists (select 1 from pg_policies where policyname = 'job_offers_office_insert') then
    create policy job_offers_office_insert on public.job_offers
      for insert
      with check (public.crm_role() in ('owner', 'kantoor'));
  end if;
end $$;

notify pgrst, 'reload schema';
