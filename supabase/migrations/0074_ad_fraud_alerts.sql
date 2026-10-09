-- ============================================================================
-- CRM fase 74: één melding per adres, niet één per keer dat je kijkt.
--
-- Run after 0073_ad_visits_click_fraud.sql. Idempotent.
--
-- 0073 legt het bewijs vast, maar iemand moest /admin/klikfraude openen om
-- het te zien. Een scherm dat je moet onthouden, vertelt je niets: de
-- klikfraude begint op een woensdag en je ziet het de maandag erna.
--
-- Deze tabel is het geheugen waarmee "nieuw" ook echt nieuw betekent. Zonder
-- hem zou de cron elke nacht dezelfde adressen opnieuw melden, en na drie
-- nachten leest niemand de melding meer -- wat erger is dan geen melding,
-- omdat het de dag dat er wél iets nieuws gebeurt ook onzichtbaar maakt.
--
-- EEN ADRES WORDT ÉÉN KEER GEMELD, OOIT. Ook als het daarna erger wordt: het
-- scherm houdt de details bij, de melding is alleen het tikje op de schouder.
-- ============================================================================

create table if not exists public.ad_fraud_alerts (
  /* Het adres zelf is de sleutel: dat is precies wat "al gemeld" betekent. */
  ip                text primary key,
  first_alerted_at  timestamptz not null default now(),

  /* Het oordeel op het moment van melden. Niet om op te zoeken -- dat doet
     clickFraud.ts bij het lezen -- maar zodat later te zien is waarvoor er
     destijds gewaarschuwd is, als iemand vraagt waarom dit adres is
     uitgesloten. */
  points            integer,
  visits            integer,
  reasons           text
);

comment on table public.ad_fraud_alerts is
  'Welke IP-adressen al als klikfraude zijn gemeld, zodat de cron niet elke nacht dezelfde adressen opnieuw meldt. Geen beoordeling: die staat in src/lib/clickFraud.ts en wordt bij het lezen berekend.';

alter table public.ad_fraud_alerts enable row level security;

/* Alleen de cron schrijft, met de service-role-key. Kantoor leest, zodat op
   het scherm te zien is wat er al gemeld is. Geen insert-policy voor
   authenticated: wie zelf rijen kon bijschrijven, kon een melding
   onderdrukken door het adres alvast als "gemeld" te markeren. */
drop policy if exists ad_fraud_alerts_read on public.ad_fraud_alerts;
create policy ad_fraud_alerts_read on public.ad_fraud_alerts
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

revoke all on public.ad_fraud_alerts from authenticated;
grant select on public.ad_fraud_alerts to authenticated;

notify pgrst, 'reload schema';
