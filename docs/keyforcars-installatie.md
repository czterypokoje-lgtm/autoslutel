# KeyForCars op autosleutel-crm-erp — installatie, go-live en terugrol

_Opgesteld 21 november 2026. Achtergrond en analyse: [keyforcars-gecis-analizi.md](keyforcars-gecis-analizi.md) (Turks)._

KeyForCars (winkel + WooCommerce-webshops, geen monteurs) stapt over van de oude fork
`czterypokoje-lgtm/keyforcars-crm` naar deze repository `uroborosoftware/autosleutel-crm-erp`,
met `CRM_INSTALL=keyforcars` en `CRM_WAREHOUSE=1`. De oude fork is een strikt oudere subset:
migraties 0001–0105 zijn byte-voor-byte gelijk. De KeyForCars-database staat op **0105**.

| | Autosleutel24 | KeyForCars |
|---|---|---|
| Supabase-project | `utctfircycpjmpjqmtmm` | `lzdwxkhlscsitstxdgar` |
| `CRM_INSTALL` | _(leeg)_ | `keyforcars` |
| Vercel-project | (Autosleutel24) | `keyforcars-crm` |

> **Harde regel:** de data van de twee bedrijven mengt nooit. De code dwingt dat nu af (zie §1);
> deze handleiding zorgt dat ook de database en Vercel kloppen.

---

## 1. Wat de code al doet

**Database-scheiding (install guard).** `src/lib/supabase/installGuard.ts`
- Het projectref in elke Supabase-URL (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `storage_SUPABASE_URL`)
  moet bij `CRM_INSTALL` horen: `keyforcars ↔ lzdwxkhlscsitstxdgar`, `autosleutel24 ↔ utctfircycpjmpjqmtmm`.
- Testprojecten (bijv. ERP-test `ysrebelulbmnbzyvnsic`, of `127.0.0.1` voor lokale Supabase) mogen alleen via
  `CRM_SUPABASE_TEST_PROJECTS` (komma-gescheiden). Het live project van **de andere** installatie wordt
  altijd geweigerd, ook als iemand het in die lijst zet.
- Gecontroleerd bij serverstart (`src/instrumentation.ts`), bij elk verzoek (`src/proxy.ts` → 503 voor
  alles, ook webhooks en de publieke site) en in de client-factories (`admin.ts`, `server.ts`, `env.ts`).
- Tweede slot in de database: migratie **0133** maakt een tabel `crm_install` met één rij. Staat daar
  een andere waarde dan `CRM_INSTALL`, dan weigert de app (cache 5 minuten per serverinstantie).
  Met `CRM_REQUIRE_INSTALL_MARKER=1` is een ontbrekende rij ook een fout.

**KeyForCars is een winkel.** `src/config/install.ts` geeft 404 op (pagina's én hun `/api/admin/...`):
monteurs/netwerk/aanbod/biedingen/kas/tarieven/monteurtarieven/`mijn-*`, leads, jobs, live, kantoor,
WhatsApp-advertenties, WhatsApp-analyse, klikfraude, attributie, en de API's `technicians`,
`invite-technician`, `jobroom`, `offers`, `whatsapp-quotes`, `ad-campaigns`, `ad-reviews`, `profiel`,
`products`. Buiten de CRM open: `/api/woo`, `/api/cron/kfc-reconcile`, `/api/agent/workshop`,
`/api/webhooks/resend` (e-mail voor Gesprekken). **Meta WhatsApp (`/api/webhooks/whatsapp`) is dicht.**
Het menu (`KfcShell.tsx`) toont nooit een link naar een verborgen pagina.

**Werkplaats aan/uit.** Werkplaatsagenda (`/admin/agenda`) en de ElevenLabs-werkplaatsagent
(`/api/agent/workshop`) staan **aan**. Uitzetten: `KFC_WORKSHOP=0` in Vercel en opnieuw deployen
(waarde wordt bij de build ingebakken). Terug aan: variabele verwijderen en opnieuw deployen.

**Blijft aan voor KeyForCars:** Gesprekken (e-mail + formulieren) en Agentcentrum/botgesprekken
(beoordeling van ElevenLabs-telefoongesprekken, door KeyForCars zelf gebouwd).

Testen (geen database nodig): `npm run test:unit`.

---

## 2. Vooraf

1. **Alle parallelle branches gemerged in `main`** (0129 kassa, 0130 cariler, 0131 voorraadrapporten,
   0132 Woo-voorraadsync + retouren, 0133 installatiemarkering, 0134 productdata).
2. **Bundel opnieuw bouwen** en committen:
   ```bash
   node scripts/build-kfc-migration-bundle.mjs
   ```
   Controle dat hij actueel is:
   ```bash
   node scripts/build-kfc-migration-bundle.mjs --check
   ```
   De kop van `supabase/kfc_apply_0104z_0106-0134.sql` mag **geen** regel "NOT IN THIS BUNDLE" meer hebben.
   Het script weigert dubbele nummers en statements die niet in één transactie kunnen
   (`begin;`, `commit;`, `concurrently`, `alter type … add value`).
3. `npx tsc --noEmit` en `npm run test:unit` groen op `main`.
4. Beslissingen eigenaar (analyse §6): korte verkoopstop tijdens de omzetting? Werkplaats aan laten?
5. Nieuwe publieke route nodig (bijv. een Woo- of Sendcloud-webhook uit 0132)? Die moet in
   `KEYFORCARS_OUTSIDE` in `src/config/install.ts` én in `tests/unit/install-serves.test.mjs`,
   anders geeft hij 404 op KeyForCars.

---

## 3. Database (Supabase-project `lzdwxkhlscsitstxdgar`)

### 3.1 Back-up — eerst
- Supabase → project **lzdwxkhlscsitstxdgar** (controleer het ref in de adresbalk!) → Database → Backups:
  noteer de laatste dagelijkse back-up; met PITR: noteer het tijdstip.
- Plus een eigen dump. Neem de connection string over uit Supabase → Connect (Session pooler), het
  wachtwoord typ je zelf:
  ```bash
  pg_dump "<connection string van lzdwxkhlscsitstxdgar>" -Fc -f kfc-voor-0106.dump
  ```
  Bewaar het bestand buiten de repo.

### 3.2 Migraties — één keer, alles of niets
1. SQL Editor van **lzdwxkhlscsitstxdgar** → nieuwe query → hele inhoud van
   `supabase/kfc_apply_0104z_0106-0134.sql` plakken → Run.
2. Het bestand controleert eerst zelf of dit de juiste database is (0105 aanwezig; 0106 nog niet, tenzij
   de database al als `keyforcars` gemarkeerd is) en stopt anders. Faalt één statement, dan wordt
   **niets** gewijzigd.
3. `0104z` is op KeyForCars een no-op (het oude 0062-inboxschema bestaat daar niet).
4. Controle:
   ```sql
   select to_regclass('public.whatsapp_quotes') is not null as m0106,
          to_regclass('public.crm_install')     is not null as m0133;
   ```

### 3.3 Installatiemarkering
In **dezelfde** SQL Editor (KeyForCars):
```sql
insert into public.crm_install (profile) values ('keyforcars');
select public.crm_install_profile();   -- verwacht: keyforcars
```
Autosleutel24 (`utctfircycpjmpjqmtmm`), nadat 0133 daar via de eigen migratieroute is toegepast:
```sql
insert into public.crm_install (profile) values ('autosleutel24');
```
Nooit omgekeerd. Een tweede rij is onmogelijk (primary key). Daarna kan per Vercel-project
`CRM_REQUIRE_INSTALL_MARKER=1` aan.

---

## 4. Vercel-project `keyforcars-crm`

### 4.1 Omgevingsvariabelen (Production **en** Preview)

| Variabele | Waarde / opmerking |
|---|---|
| `CRM_INSTALL` | `keyforcars` |
| `CRM_WAREHOUSE` | `1` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lzdwxkhlscsitstxdgar.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key van lzdwxkhlscsitstxdgar |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key van lzdwxkhlscsitstxdgar |
| `WOO_KEYFORCARS_KEY` / `_SECRET` / `_WEBHOOK_SECRET` | keyforcars.nl |
| `WOO_KLAPSLEUTELS_KEY` / `_SECRET` / `_WEBHOOK_SECRET` | klapsleutels.nl |
| `WOO_REMKEYS_KEY` / `_SECRET` / `_WEBHOOK_SECRET` | remkeys.com |
| `SENDCLOUD_PUBLIC_KEY`, `SENDCLOUD_SECRET_KEY`, `SENDCLOUD_SHIPPING_METHOD_ID` | Sendcloud-account van KeyForCars |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`, `INBOX_EMAIL` | Resend van KeyForCars (Gesprekken) |
| `CRON_SECRET` | eigen geheim, niet dat van Autosleutel24 |
| `KFC_STOCK_STORE` | `supabase` (online is er geen schrijfbare schijf) |
| `KFC_WORKSHOP_AGENT_TOKEN` | als de werkplaatsagent aan blijft |
| `KFC_REVIEW_AGENT_IDS`, `ELEVENLABS_API_KEY` | ElevenLabs van KeyForCars (botgesprekken) |
| `ANTHROPIC_API_KEY` | alleen als de AI-functies (staff-assistent, inbox) gebruikt worden |
| `KFC_WORKSHOP` | _niet zetten_ = werkplaats aan; `0` = uit |
| `CRM_REQUIRE_INSTALL_MARKER` | `1`, pas na §3.3 |
| `CRM_SUPABASE_TEST_PROJECTS` | **alleen in Preview**, als die naar een testproject wijst |

Neem de bestaande waarden over uit het huidige `keyforcars-crm`-project en controleer dat elke
Supabase-variabele `lzdwxkhlscsitstxdgar` bevat. Een Preview die naar de live KeyForCars-database
wijst schrijft in echte data: test daar met orders/klanten die je daarna weggooit.

**Mogen NIET gezet zijn op KeyForCars** (Autosleutel24-only; de routes zijn daar dicht, maar de
geheimen horen er niet): `CRM_UI`, `NEXT_PUBLIC_CRM_READONLY`, `storage_SUPABASE_URL` /
`storage_SUPABASE_SERVICE_ROLE_KEY` (tenzij ook lzdwxkhlscsitstxdgar), `WHATSAPP_*`, `META_APP_SECRET`,
`TELEGRAM_*`, `MOLLIE_API_KEY`, `GOOGLE_ADS_*`, `BING_ADS_*`, `OPENAI_ADS_*`, `ADS_FEED_*`,
`EXPORT_SECRET`, `ADMIN_USER` / `ADMIN_PASSWORD`, `JOBROOM_*`, `LEAD_TOKEN_SECRET`, `LEAD_ALERT_EMAIL`,
`ELEVENLABS_TECHNICIAN_AGENT_ID`, `ELEVENLABS_JOB_OFFER_*`, `ELEVENLABS_BRIEFING_AGENT_ID`,
`ELEVENLABS_OUTBOUND_PHONE_NUMBER_ID`, `ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID`, `AGENT_API_TOKEN`,
`OPS_API_TOKEN`, `UPSTASH_*` / `KV_*` (klikfraude), `LP_ZONE_ORIGIN`, `SHOP_ZONE_ORIGIN`,
`GOOGLE_MAPS_API_KEY`, `FUEL_EUR_PER_KM`, `KFC_DEMO_MODE`, `KFC_SHIPPING_TEST`, `KFC_LOCAL_MODEL`,
`CRM_PREVIEW`, `PREVIEW_LAN_*`.

En omgekeerd: zet op het **Autosleutel24**-project nooit `CRM_INSTALL=keyforcars` of een
KeyForCars-sleutel. De guard laat zo'n deploy met 503 stoppen.

### 4.2 Git-bron omzetten
1. Vercel → `keyforcars-crm` → Settings → Git → **Disconnect** `czterypokoje-lgtm/keyforcars-crm`.
2. **Connect Git Repository** → `uroborosoftware/autosleutel-crm-erp` (de Vercel GitHub-app moet
   toegang hebben tot de organisatie `uroborosoftware`). Production Branch: `main`.
3. Gevolg: elke push naar `main` deployt **beide** projecten. Dat is de bedoeling; welke klant het is,
   bepaalt alleen `CRM_INSTALL`.
4. `vercel.json`-crons draaien op beide projecten; op KeyForCars antwoordt
   `/api/cron/openai-paid-jobs` met 404 (onschuldig), `/api/cron/kfc-reconcile` werkt.
5. Domeinen en Woo-webhook-URL's blijven ongewijzigd (zelfde Vercel-project).

---

## 5. Preview-testlijst

Deploy eerst een Preview (zonder promote) en loop dit af:

- [ ] Inloggen werkt; `/` en `/admin` gaan naar het Dashboard.
- [ ] Menu: geen Leads, WhatsApp, Klikfraude, Advertentieklikken, Live, Kantoor, monteurschermen.
- [ ] Verborgen geven 404: `/admin/leads`, `/admin/jobs`, `/admin/whatsapp-advertenties`,
      `/admin/klikfraude`, `/admin/monteurtarieven`, en de API's, bijvoorbeeld:
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" https://PREVIEW-URL/api/admin/monteurtarieven
      ```
      (ook `technicians`, `jobs`, `leads/by-phone`, `whatsapp-quotes`, `/api/webhooks/whatsapp`) → `404`.
- [ ] Bestellingen: Woo-orders zichtbaar; een testorder in een webshop komt binnen (`/api/woo/...`).
- [ ] Voorraad: zoeken, scannen (camera), mutatie boeken, Montage.
- [ ] Picklijst, Inkoop (ontvangst met scanner), Verzending (Sendcloud-label in testmodus).
- [ ] Kassa (0129), Klanten/Leveranciers (0130), Voorraadrapporten (0131), Woo-retour → voorraad (0132),
      Productdata/categorieën/gebruikers (0134) — volgens de testlijst van die branches.
- [ ] Facturen, Uitgaven, Bank, Financieel overzicht, Rapporten openen zonder fout.
- [ ] Gesprekken: een test-e-mail naar `INBOX_EMAIL` verschijnt.
- [ ] Werkplaatsagenda opent (of 404 bij `KFC_WORKSHOP=0`).
- [ ] Vercel-logs: geen regels met `[install-guard]`.

Bekend, geen blokkade: links in pagina's (niet het menu) naar verborgen schermen — bijv. "lead
openen" in Gesprekken, de knop "reistijden aanvullen" in Winst, koppelingen in Dashboard/Klanten —
eindigen op 404. Ze lezen geen data van Autosleutel24.

---

## 6. Go-live

1. Korte verkoopstop in winkel/webshops melden (als besloten).
2. §3 uitvoeren (back-up → bundel → markering).
3. §4 uitvoeren (variabelen → Git-bron) en de Preview volgens §5 laten slagen.
4. Promote naar Production. Direct controleren: inloggen, één Woo-order, één voorraadmutatie.
5. Volgende ochtend: `kfc-reconcile`-cron (03:00) zonder fouten in de logs.

## 7. Terugrollen

- **Code:** Vercel → Deployments → laatste deployment van de oude fork → **Instant Rollback**.
  Of de Git-bron terugzetten naar `czterypokoje-lgtm/keyforcars-crm`.
- **Database:** niet nodig voor een code-terugrol. De migraties 0104z–0134 voegen alleen toe;
  de oude code leest de nieuwe tabellen en `crm_install` niet.
- **Alleen bij beschadigde data:** herstel de back-up uit §3.1 (PITR of `pg_restore`). Let op: alles
  wat ná de back-up is geboekt (orders, voorraad) gaat dan verloren — eerst exporteren.

## 8. Onderhoud

- Nieuwe migratie gemerged vóór go-live → bundel opnieuw bouwen (§2.2).
- Na go-live: nieuwe migraties gaan per stuk (of in een nieuwe bundel vanaf het volgende nummer),
  niet door deze bundel nog eens te draaien.

---

## Türkçe kısa özet

- **Ayrım koruması:** Uygulama, Supabase proje ref'i `CRM_INSTALL` ile eşleşmezse çalışmaz
  (başlangıçta, her istekte 503, ve client fabrikalarında). `keyforcars ↔ lzdwxkhlscsitstxdgar`,
  `autosleutel24 ↔ utctfircycpjmpjqmtmm`. Test projeleri `CRM_SUPABASE_TEST_PROJECTS` ile açılır;
  diğer şirketin canlı veritabanı bu listeyle bile açılamaz. Ek kilit: `crm_install` tablosu (0133).
- **KeyForCars = mağaza:** leads, jobs, live, kantoor, WhatsApp, klikfraude, attributie ve teknisyen
  ekranları **ve API'leri** 404. Meta WhatsApp webhook kapalı, Resend (Gesprekken) açık.
  Atölye ajandası/ajanı açık; kapatmak için Vercel'de `KFC_WORKSHOP=0` + yeniden deploy.
- **Sıra:** tüm branch'ler `main`'e merge → `node scripts/build-kfc-migration-bundle.mjs` →
  Supabase yedeği → `supabase/kfc_apply_0104z_0106-0134.sql` dosyasını KeyForCars SQL Editor'da
  bir kez çalıştır (hepsi ya da hiçbiri) → `insert into public.crm_install (profile) values ('keyforcars');`
  → Vercel `keyforcars-crm` env'leri (§4.1) → Git kaynağını `uroborosoftware/autosleutel-crm-erp`
  yap → Preview test listesi (§5) → canlıya al.
- **Geri dönüş:** Vercel'de eski deployment'a Instant Rollback; migration'lar sadece ekleme yaptığı
  için veritabanını geri almak gerekmez.
