-- ============================================================================
-- CRM fase 73: bewijs verzamelen tegen klikfraude op Google Ads.
--
-- Run after 0072_disconnect_telegram.sql. Idempotent.
--
-- EERST HET ONGEMAK: een klik op een advertentie is al betaald voordat deze
-- tabel bestaat. Google rekent af in zijn eigen veiling, op zijn eigen
-- servers, voordat onze DNS is opgezocht. Niets wat op autosleutel24.nl
-- draait kan die afrekening tegenhouden. Een "klikbot-blokkade" op de site
-- is dus toneel.
--
-- Wat het geld wél raakt, zijn twee dingen, en het zijn beide lijstjes met
-- IP-adressen en datums:
--
--   1. IP-uitsluitingen in Google Ads  -> stopt de VOLGENDE klik.
--   2. Een claim voor ongeldige klikken -> geeft de VORIGE klikken terug.
--
-- Beide vragen bewijs, geen blokkade. Daarom legt deze tabel alleen vast wat
-- er werkelijk gebeurde bij elke betaalde landing, en wordt er niets
-- geweigerd: een betaalde landing weigeren kost alleen de klant, nooit de
-- fraudeur (zie handlePaidLanding in src/proxy.ts).
--
-- WAT ER BEWUST NIET IN STAAT: een score. Geen kolom `score`, geen kolom
-- `is_bot`. Een oordeel dat in de rij staat, is een oordeel van de dag dat de
-- rij werd geschreven, en bij de eerste bijstelling van de drempels is de
-- geschiedenis onvergelijkbaar met vandaag. De score wordt berekend bij het
-- lezen (src/lib/clickFraud.ts), zodat een betere drempel ook het verleden
-- opnieuw beoordeelt.
--
-- PRIVACY: hier staan IP-adressen van bezoekers, en dat is een
-- persoonsgegeven. Daarom 90 dagen en niet langer (crm_prune_ad_visits
-- hieronder), alleen leesbaar voor kantoor, en met één doel vastgelegd in
-- het commentaar op de tabel: fraudebestrijding op eigen advertentiebudget.
-- ============================================================================

create table if not exists public.ad_visits (
  id uuid primary key,
  created_at timestamptz not null default now(),

  /* Door het platform gezien, niet door de client beweerd. Zie getClientIp()
     in src/lib/rateLimit.ts: x-forwarded-for[0] is wat de bezoeker zelf heeft
     meegestuurd, en daarmee zou dit hele bestand waardeloos bewijs zijn. */
  ip text,
  country text,
  user_agent text,
  path text,

  /* Om welke betaalde klik het ging. De gclid is wat Google-support vraagt;
     zonder die string is een claim niet te onderbouwen. */
  gclid text,
  wbraid text,
  gbraid text,
  msclkid text,
  campaign_id text,
  keyword text,

  /* Gezet door /api/ad-visit, dus door een echte browser die JavaScript heeft
     uitgevoerd. js_ran = false op een betaalde landing betekent dat iets de
     pagina heeft opgehaald en is vertrokken. In z'n eentje zegt dat niets --
     een trage verbinding, een adblocker, iemand die meteen wegklikt. In
     aantal, van één IP, is het het sterkste signaal dat er is. */
  js_ran boolean not null default false,
  interacted boolean not null default false,

  /* navigator.webdriver: true betekent een automatiseringsdriver, op eigen
     verklaring van de browser. Te omzeilen, dus afwezigheid bewijst niets --
     aanwezigheid des te meer. */
  webdriver boolean,

  /* Schermmaat, aantal kernen, tijdzone, talen. Een datacenter-headless
     browser valt hier op: 0 kernen, 800x600, tijdzone UTC. */
  client_signals jsonb
);

comment on table public.ad_visits is
  'Betaalde advertentielandingen met het door de server geziene IP, 90 dagen bewaard, om IP-uitsluitingen in Google Ads op te bouwen en claims voor ongeldige klikken te onderbouwen. Geen blokkeerlijst: de klik is al betaald wanneer deze rij wordt geschreven.';

/* De enige twee vragen die dit bestand krijgt: "alles van dit IP" (het
   oordeel) en "alles van de laatste N dagen" (het overzicht). */
create index if not exists ad_visits_ip_idx
  on public.ad_visits (ip, created_at desc);
create index if not exists ad_visits_recent_idx
  on public.ad_visits (created_at desc);

alter table public.ad_visits enable row level security;

/*
 * Geschreven door proxy.ts en /api/ad-visit met de service-role-key, die RLS
 * voorbijgaat. Er is dus met opzet GEEN insert- of update-policy voor
 * `authenticated`: kantoor leest, en verder niemand.
 *
 * Zou een browser hier wel mogen schrijven, dan kon degene die de fraude
 * pleegt zijn eigen landingen bijschrijven of op 'menselijk' zetten, en is
 * het bewijs niets meer waard.
 */
drop policy if exists ad_visits_read on public.ad_visits;
create policy ad_visits_read on public.ad_visits
  for select
  using (public.crm_role() in ('owner', 'kantoor'));

/* Least privilege op tabelniveau, naast de policy -- zelfde aanpak als
   0060_public_technicians_least_privilege.sql. Een monteur heeft hier niets
   te zoeken en hoeft het recht niet te hebben om het te proberen. */
revoke all on public.ad_visits from authenticated;
grant select on public.ad_visits to authenticated;

/*
 * Opruimen. Een IP-adres is een persoonsgegeven en 90 dagen is precies zo
 * lang als Google's eigen klikvenster voor offline conversies (zie
 * src/lib/adClickId.ts) -- langer bewaren dient geen enkel doel meer, want
 * een claim over een klik van vier maanden terug neemt support niet aan.
 *
 * Security definer omdat de cron-route geen sessie heeft. Niet gegrant aan
 * authenticated: een browser hoort geen bewijs te kunnen wissen.
 */
create or replace function public.crm_prune_ad_visits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.ad_visits where created_at < now() - interval '90 days';
  get diagnostics removed = row_count;
  return removed;
end $$;

revoke all on function public.crm_prune_ad_visits() from public;

notify pgrst, 'reload schema';
