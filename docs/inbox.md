# Inbox: WhatsApp, e-mail en websiteformulieren in één scherm

Status: gebouwd op branch `feat/inbox`, migratie `0105_inbox.sql`. Scherm: `/admin/gesprekken`
(zowel de oude console als de Studio-weergave). Dit document is de runbook voor het aanzetten.

## Wat het doet

- Elk kanaal wordt een **thread** (`inbox_threads`) met **berichten** (`inbox_messages`).
  WhatsApp: één thread per nummer. E-mail: op `References`/`In-Reply-To`, anders dezelfde
  afzender binnen 30 dagen. Formulier: één thread per inzending, gekoppeld aan de lead.
- De assistent (Claude, `src/lib/inbox/ai.ts`) werkt per thread in één van drie standen:
  - `off` — schrijft niets.
  - `draft` (standaard) — zet een concept klaar; een medewerker leest, past aan, verstuurt.
  - `auto` — verstuurt zelf, behalve als het zelf `needs_human` zegt (prijs niet bekend,
    klacht, annulering, betaling, boosheid, spam). Dan komt er een concept + Telegram-melding.
- **Human takeover zonder knop:** zodra een medewerker in een `auto`-thread antwoordt, valt de
  thread terug naar `draft`. De assistent praat nooit door een mens heen.
- De assistent gebruikt alleen feiten met status `confirmed` uit `agent_knowledge` (dezelfde
  tabel als de telefoonagent) en dezelfde harde regels: geen prijs die niet in de feiten
  staat, geen tijd beloven, geen monteursnaam, kenteken ≠ sleutelcode, frezen ≠ werkende sleutel.
- Elke inkomende boodschap: Telegram-melding naar het kantoor (`admin_telegram`), lead
  koppelen op nummer/e-mail, en voor een onbekend WhatsApp-nummer een `whatsapp`-lead zoals de
  oude listener dat deed (`src/lib/whatsappLead.ts`).

## Veiligheid en privacy, kort

| Vraag | Antwoord |
|---|---|
| Waar staan de gesprekken? | In onze eigen Supabase, tabellen met RLS: alleen `owner` en `kantoor` lezen en schrijven. Monteurs zien niets. |
| Wie mag de webhooks aanroepen? | Niemand zonder handtekening: Meta tekent met `META_APP_SECRET` (HMAC-SHA256), Resend met `RESEND_WEBHOOK_SECRET` (Svix). Ongetekend = 401, secret niet gezet = 503. |
| Kan een bericht dubbel binnenkomen? | Nee: het provider-id is uniek in `inbox_messages`; een retry is een no-op. |
| Kan de assistent iets kapotmaken? | Het model heeft geen tools. Het levert tekst + `needs_human`; `send.ts` is de enige plek die verzendt, en alleen in stand `auto`. Een menselijke reply zet `auto` uit. |
| Wat gaat naar derden? | Meta (WhatsApp-berichten, dat is inherent), Resend (de e-mail, al onze mailprovider), Anthropic (de gesprekstekst om een concept te maken; API-verkeer wordt niet gebruikt voor training). Zet alle drie in het verwerkingsregister; Meta's *WhatsApp Business Data Processing Terms* accepteer je in Business Manager. |
| Verwerkt de assistent bijlagen of media? | Nee. Foto's, audio en bijlagen worden genoteerd als `[image]` / bestandsnaam, niet opgehaald. |
| Onofficiële WhatsApp-koppelingen (WhatsApp Web, Baileys, `wacli`, OpenClaw-kanaal)? | Niet voor klantverkeer: in strijd met de WhatsApp-voorwaarden, bannable, en de sessie staat op een server die we niet controleren. De Cloud API is de officiële weg en kost niets voor service-gesprekken binnen 24 uur. |

## Aanzetten — stap voor stap

Alles kan los van elkaar. Formulieren werken na de migratie meteen.

### 0. Migratie

```bash
cd ~/keyforcars-crm   # of de worktree
npx supabase db push   # 0105_inbox.sql
```

Voor Autosleutel24 draait de CRM op het `autoslutel` Vercel-project; de migratie hoort op
*dat* Supabase-project (niet op KeyForCars).

### 1. Formulieren (geen configuratie)

`POST /api/leads` maakt na de lead een `form`-thread met de ingevulde velden. Antwoorden gaat
per e-mail als er een e-mailadres is ingevuld; anders staat er een wa.me-link voor de telefoon
(een nummer dat ons nooit heeft geappt mag je via de API alleen met een goedgekeurde template
berichten — die is er nog niet).

### 2. Assistent

Vercel → autoslutel → Environment Variables: `ANTHROPIC_API_KEY`. Zonder deze sleutel bestaat
de knop "AI-concept" wel maar antwoordt 503; alles verder werkt.

### 3. E-mail (Resend inbound + Gmail-doorsturen)

De mailbox blijft bij Google Workspace; info@ verandert niet.

1. Resend → Domains → voeg een **subdomein** toe voor ontvangen, bv. `in.autosleutel24.nl`,
   en zet de MX-record die Resend toont (kopieer de waarde uit het dashboard, niet uit een
   voorbeeld) in de DNS. Dit raakt de bestaande MX van `autosleutel24.nl` niet.
2. Resend → Webhooks → endpoint `https://www.autosleutel24.nl/api/webhooks/resend`, event
   `email.received`. Kopieer het `whsec_…` secret naar `RESEND_WEBHOOK_SECRET`.
3. Zet `INBOX_EMAIL=crm@in.autosleutel24.nl` (documentatie; het adres zelf hoeft nergens
   geregistreerd, Resend accepteert elk adres op het subdomein).
4. Gmail (info@) → Instellingen → Doorsturen → voeg `crm@in.autosleutel24.nl` toe (Gmail
   stuurt een bevestigingscode; die komt in het CRM binnen als thread — lees de code daar).
   Maak dan een **filter**: alles doorsturen, behalve `from:(info@autosleutel24.nl)`.
5. Antwoorden vertrekken via Resend vanaf `MAIL_FROM` met `In-Reply-To`/`References`, dus ze
   staan in de klant z'n thread én de klant z'n antwoord komt via dezelfde doorstuurregel weer
   terug in dezelfde thread.

Uitzetten = het Gmail-filter verwijderen.

### 4. WhatsApp (Meta Cloud API)

Twee routes voor het nummer:

- **Coexistence (aanbevolen als het nummer nu in de WhatsApp Business-app zit):** via
  Embedded Signup kies je "bestaand WhatsApp Business-app nummer". De app blijft werken op de
  telefoon én de API krijgt alle berichten (beide kanten gesynchroniseerd, 20 berichten/s).
  Voorwaarde: de app is bijgewerkt en het nummer is niet eerder op de API geregistreerd.
- **Nummer migreren naar de API:** de app werkt dan niet meer op dat nummer; alles loopt via het CRM.

Stappen in Meta:

1. developers.facebook.com → App (type Business) → product **WhatsApp** toevoegen aan het
   bestaande Business-portfolio. Noteer **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
2. Business Settings → System Users → maak een systeemgebruiker (admin) → genereer een token
   met `whatsapp_business_messaging` + `whatsapp_business_management`, **zonder vervaldatum**
   → `WHATSAPP_ACCESS_TOKEN`. (Nooit het tijdelijke 24-uurs token uit de API Setup-pagina.)
3. App → Settings → Basic → **App Secret** → `META_APP_SECRET`.
4. Verzin een willekeurige string → `WHATSAPP_VERIFY_TOKEN`. Zet alle vier in Vercel en
   redeploy.
5. App → WhatsApp → Configuration → Webhook: callback
   `https://www.autosleutel24.nl/api/webhooks/whatsapp`, verify token = die string; "Verify and
   save". Daarna **Subscribe** op het veld `messages`.
6. Stuur een testbericht naar het nummer; het verschijnt in `/admin/gesprekken` onder WhatsApp.

Let op: als het nummer al via **ElevenLabs** aan de Cloud API hangt (de telefoonagent op
WhatsApp), is er al een WABA. Abonneer dan onze app op diezelfde WABA; twee apps mogen
webhooks ontvangen, maar twee assistenten op één nummer is onhandig — zet dan de ElevenLabs
WhatsApp-agent uit óf laat de CRM-assistent op `off`.

## Wat er bewust niet in zit

- WhatsApp-templates (berichten buiten 24 uur, of naar een nummer dat ons nooit schreef).
  Nodig zodra het kantoor vanuit het CRM een formulier-lead wil appen. Vraagt template-
  goedkeuring bij Meta + één extra `type: 'template'` tak in `sendWhatsAppText`.
- Media ophalen (foto van de sleutel via WhatsApp). Meta geeft een media-id; downloaden kan
  met hetzelfde token. Pas doen als de office erom vraagt, vanwege opslag van klantfoto's.
- Toewijzen aan een medewerker, snooze, interne notities op een thread. Notities bestaan al
  op de lead; de rest komt als er meer dan één persoon in de inbox werkt.
- Website-chatwidget. De drie gevraagde kanalen zijn er; een widget is een vierde webhook op
  dezelfde tabellen.

## Controle na deploy

```bash
# WhatsApp verify-handshake (verwacht: de challenge terug)
curl -s "https://www.autosleutel24.nl/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<WHATSAPP_VERIFY_TOKEN>&hub.challenge=ping"
# Ongetekende POST (verwacht: 401)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.autosleutel24.nl/api/webhooks/whatsapp -d '{}'
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://www.autosleutel24.nl/api/webhooks/resend -d '{}'
```
