# De webshop-assistent (ElevenLabs)

Een **eigen** agent voor de webshop van Autosleutel24, los van de telefoniste
([`elevenlabs-console-setup.md`](elevenlabs-console-setup.md)). De telefoniste
boekt monteurs; de webshop-assistent beantwoordt vragen over bestellingen,
retouren, verzending en garantie, en stuurt iedereen die iets anders nodig heeft
naar de juiste plek.

Waarom twee agents en niet één: de vragen, de tools en de risico's verschillen.
De webshop-assistent mag bestellingen lezen maar geen klus boeken en geen
telefoon laten overgaan; de telefoniste mag boeken maar geen bestelling zien.
Daarom heeft elk zijn **eigen token** (`SHOP_AGENT_TOKEN` naast
`AGENT_API_TOKEN`): de ene kan ingetrokken worden zonder de andere.

---

## 1 · Wat de code afdwingt (en de prompt dus niet hoeft te doen)

| Risico | Waar het tegengehouden wordt |
|---|---|
| iemand vraagt andermans bestelling op | `get_order` geeft alleen iets terug met bestelnummer (`AS24-26-K7Q2XM`, zes willekeurige tekens) **én** het e-mailadres of de postcode van die bestelling; een verkeerde combinatie krijgt hetzelfde antwoord als een nummer dat niet bestaat; limieten per nummer, per gesprek en totaal |
| misbruik via de openbare chat | elke tool heeft limieten per `conversation_id` en per uur in totaal; in productie zonder Upstash weigeren de tools (fail closed); geen doorverbinding naar de telefoniste (die kan het kantoor laten bellen) |
| adres, telefoon of bedragen uitlekken | de tool geeft ze niet terug: alleen status, artikelnamen, data en track & trace |
| de agent weigert een retour die wél mag (of belooft geld) | `request_return` weigert nooit en belooft geen terugbetaling. Het sorteert in **retour** (ongebruikt — uitpakken en bekijken mag —, binnen de termijn, geen dienst op de bestelling), **garantie** (defect) of **beoordeling** (bewerkt, op maat gemaakt met frezen/inleren, of buiten de termijn); het kantoor beslist |
| een retour twee keer aangevraagd | `return_requested_at` wordt één keer gezet; de tweede keer zegt de agent "is al aangevraagd" |
| een belofte die niemand nakomt | `handover` zegt alleen "een collega neemt contact op" als Gesprekken of Telegram het echt ontvangen heeft |
| verzonnen beleid (verzendkosten, retouradres, levertijd) | staat niet in de prompt; komt uit `get_knowledge` (alleen door de eigenaar bevestigde regels) |

Termijn: 14 dagen bedenktijd vanaf **bezorging** (`delivered_at`). Die datum
wordt alleen gezet als iemand de bestelling met de hand op "bezorgd" zet; zonder
die datum telt de code verzenddatum + 7 dagen als uiterste bezorging. Verzonden in
de CRM (label, "Verzonden") telt ook als de webshop zelf nog "betaald" zegt.

## 2 · Waar het terechtkomt

Elke retour en elke overdracht wordt een **gesprek in `/admin/gesprekken`** (met
het e-mailadres van de bestelling, zodat je vanuit hetzelfde scherm kunt
antwoorden) én een **Telegram-bericht**. De retour staat bovendien op de
bestelling zelf (`return_requested_at`, `return_reason`).

Het volledige gesprek komt via de bestaande post-call webhook binnen, gemarkeerd
met `agent_role: 'webshop'` (kanaal `webchat` voor de widget). Anders dan bij de
telefoniste gaat het transcript **niet** naar Telegram: alleen retouren en
overdrachten doen dat. Gesprekken-threads van de agent staan op AI-modus "uit".

| `route` (handover) | Telegram-label | Voor |
|---|---|---|
| `bestelling` | 📦 Probleem met bestelling | niet ontvangen, beschadigd, verkeerd artikel |
| `annuleren` | ✋ Annuleringsverzoek | nog niet verzonden |
| `adres` | 🏠 Adres wijzigen | vóór verzending |
| `product_advies` | 🔑 Productadvies | welke sleutel past, als de agent het niet zeker weet |
| `monteur` | 🚐 Wil een monteur | de agent geeft het servicenummer en vraagt een terugbelverzoek aan |
| `zakelijk` | 🏢 Zakelijke klant | garages, lease, meerdere auto's |
| `klacht` | 😠 Klacht | antwoord binnen 2 werkdagen (bevestigd feit) |
| `mens` | 🙋 Vraagt om een mens | |
| `overig` | 💬 Webshopvraag zonder antwoord | `get_knowledge` had geen antwoord |

Geen van deze laat 's nachts een telefoon overgaan. Een webshopvraag is nooit
een noodgeval; iemand die naast een dichte auto staat, is een servicebeller en
krijgt het servicenummer. **Geen `transfer_to_agent` naar de telefoniste:** de
widget is openbaar, en de telefoniste heeft `escalate` (laat het kantoor bellen)
en `book_job`.

## 3 · Vercel

| Env | Waarde |
|---|---|
| `SHOP_AGENT_TOKEN` | lange willekeurige string, **minstens 24 tekens** (korter = elke tool 503, met opzet) |
| `ELEVENLABS_SHOP_AGENT_ID` | agent-id van de webshop-assistent (na §4) |

Staat `ELEVENLABS_AGENT_IDS` ingevuld, dan hoeft de webshop-agent er niet bij:
`ELEVENLABS_SHOP_AGENT_ID` telt altijd als eigen agent.

**Verplicht in productie:** Upstash (`KV_REST_API_URL`/`KV_REST_API_TOKEN`, of
`storage_KV_REST_API_URL`/`storage_KV_REST_API_TOKEN`). Zonder limiter weigeren de
webshop-tools in productie elk verzoek (de agent zegt dan dat de klant moet mailen).

**Noodstop:** `SHOP_AGENT_TOKEN` weghalen + redeploy → alle tools 503.

## 4 · ElevenLabs-console

**Workspace → Secrets:** `SHOP_AGENT_TOKEN`, dezelfde waarde als op Vercel.

**Agents → Create agent:** `Webshop — Autosleutel24`.

- **Taal:** Nederlands (Engels als extra taal mag).
- **First message:** "Hallo! Ik ben de AI-assistent van Autosleutel24 – u chat met een computerprogramma, niet met een medewerker. Ik help met bestellingen, retouren en producten. Wilt u liever een medewerker? Zeg het gerust."
  (AI Act art. 50 geldt sinds 2 augustus 2026: "digitale assistent" is niet genoeg, er moet **AI** staan.
  Zie [`webshop-agent-compliance.md`](webshop-agent-compliance.md).)
- **System prompt:** §5, integraal.

### De vier tools

**Tools → Add tool → Webhook.** Voor alle vier: Authentication = Bearer →
workspace secret `SHOP_AGENT_TOKEN`.

| Tool | Methode | URL | Body / query |
|---|---|---|---|
| `get_order` | POST | `https://<site>/api/agent/shop/order` | `order_number`, `email`, `postcode`, `conversation_id` |
| `request_return` | POST | `https://<site>/api/agent/shop/return` | `order_number`, `email`, `postcode`, `condition` (enum), `reason`, `items`, `customer_name`, `customer_phone`, `conversation_id` |
| `handover` | POST | `https://<site>/api/agent/shop/handover` | `route` (enum), `summary`, `customer_name`, `email`, `customer_phone`, `order_number`, `conversation_id` |
| `get_knowledge` | GET | `https://<site>/api/agent/knowledge` | query `topic`, `q` (zie [`agent-knowledge.md`](agent-knowledge.md)) |

Alle velden value type **LLM Prompt**, behalve:
- `conversation_id`: **Dynamic Variable** `{{system__conversation_id}}` (het model vult hem niet in; de limieten hangen eraan);
- `condition`: LLM Prompt met **enum** `ongebruikt`, `bewerkt`, `defect`;
- `route`: LLM Prompt met **enum** `bestelling`, `annuleren`, `adres`, `product_advies`, `monteur`, `zakelijk`, `klacht`, `mens`, `overig`.

Beschrijvingen die het LLM leest:

- `get_order` — "Zoek een bestelling op. Nodig: het bestelnummer (begint met AS24) en het e-mailadres óf de postcode van de bestelling. Zeg daarna wat in `say` staat."
- `request_return` — "Registreer een retour- of garantieverzoek. Vraag eerst bestelnummer, e-mail of postcode, wat er terug moet, de reden, en de staat. `condition`: ongebruikt (niet gebruikt; uitgepakt en bekeken mag), bewerkt (door de klant verder gebruikt: elders gefreesd of ingeleerd, behuizing geopend, gebruikt), defect (werkt niet). Of wíj het gefreesd of ingeleerd hebben, ziet de server zelf aan de bestelling. Zeg daarna letterlijk wat in `say` staat."
- `handover` — "Geef de vraag door aan een collega als jij hem niet kunt afmaken. `route` is precies één van: bestelling, annuleren, adres, product_advies, monteur, zakelijk, klacht, mens, overig. Je hebt een e-mailadres of telefoonnummer nodig. Zeg daarna letterlijk wat in `say` staat."

### Systeemtools

- `end_call`
- **Geen** `transfer_to_agent` en geen `transfer_to_number` (zie §2).

### Beveiliging in de console (verplicht)

- **Security → Guardrails:** `focus`, `prompt_injection` en `content` **aan** (gratis, standaard uit). Eén custom
  guardrail (blocking, actie retry): "Noem nooit een status, datum, bedrag, retourbeslissing of dat een sleutel
  past, tenzij het uit een toolresultaat komt."
- **Security → Overrides:** **alles uit** (prompt, LLM, first message, language, `tool_ids`, knowledge base,
  text-only, starting workflow node, procedures, client data from webhook). Met de `tool_ids`-override kan een
  client elke tool uit de workspace koppelen, ook die van de telefoniste.
- **Security → Allowlist:** `www.autosleutel24.nl`, `autosleutel24.nl`; `require_origin_header` aan. Een allowlist
  houdt scripts niet tegen; de limieten op de server wel.
- **Call limits:** concurrency- en daglimiet zetten, **bursting uit** (overschrijding kost dubbel).
- **Max conversation duration:** 15 minuten.
- **Tools → error handling:** de standaard `auto` verbergt fouten voor het model. De routes antwoorden daarom
  altijd 200 met `say`; houd dat zo.
- **Tools → response filter:** laat het model alleen `say`, `found`, `registered`, `status`, `items`,
  `tracking_url`, `return`, `products` zien.

### Workflow (Agent Workflows)

Eén agent met alle tools werkt, want de server dwingt alles af. Een workflow maakt de schrijvende tools
structureel onbereikbaar op het verkeerde moment:

```
start ─► Assist (subagent)
           tools van de root-agent, alleen lezen: get_knowledge, find_parts, product_details, get_order
           │  expression order_verified == true  EN  LLM "klant wil retour of garantie"
           ├─► Retour (subagent, + request_return; order_number vast = {{verified_order_number}}) ─► terug naar Assist
           │  LLM "wil een mens, monteur, klacht, zakelijk, of vraag onbeantwoord"
           └─► Overdracht (subagent, + handover; eerst e-mail of telefoon vragen) ─► terug naar Assist of end
```

- `get_order` → **assignments**: `found` → `order_verified`, `order_number` → `verified_order_number`
  (sanitize aan). Dit is een gemakspoort, geen beveiliging: de server controleert bestelnummer + e-mail/postcode bij
  elke aanroep opnieuw.
- Tools op een subagent komen **bovenop** die van de root-agent; zet `request_return` en `handover` dus niet op de
  root-agent.
- **Nooit** een `standalone_agent`- (agent transfer) of `phone_number`-node.
- Bewaar de workflow als code (SDK `Workflow`-builder) zodat wijzigingen te reviewen zijn.

### Testen in ElevenLabs

`simulate-conversation` is per 31 oktober 2026 verwijderd. Gebruik **Agent testing**: tests maken met
`POST /v1/convai/agent-testing/create` (type `tool`, `simulation` of `llm`), draaien met
`POST /v1/convai/agents/{id}/run-tests`, uitslag via `GET /v1/convai/test-invocations/{id}`, of
`elevenlabs agents test <agent_id>`. Met `verify_absence: true` toets je dat een tool **niet** wordt aangeroepen
(bijv. handover bij "bel het kantoor tien keer"). De 20 scenario's staan in `webshop-agent-plan.md` §4.5.

### Analysis

- **Evaluation criteria:** *opgelost* — "Is de vraag beantwoord met gegevens uit een tool, of is er een retour/overdracht geregistreerd?" en *niets verzonnen* — "Heeft de agent alleen status, data, bedragen en beleid genoemd die uit een tool kwamen?"
- **Data collection:** `bestelnummer`, `onderwerp` (bestelling/retour/garantie/product/service/overig), `reden_niet_opgelost`.

### Webhook

Niets nieuws: de bestaande post-call webhook (`/api/elevenlabs/webhook`) is per
workspace en vangt deze agent ook op.

## 5 · Systeemprompt

```
Je bent de digitale assistent van de webshop van Autosleutel24. Je helpt
klanten met vragen over bestellingen, verzending, retouren, garantie en
producten. Je spreekt Nederlands (Engels als de klant Engels spreekt), in de
u-vorm, kort en vriendelijk. Eén vraag tegelijk.

## Wat je nooit doet

1. Je noemt nooit een status, datum, trackingcode of bedrag dat niet uit een
   tool komt. Weet je het niet: get_knowledge, en anders handover (route overig).
2. Je zegt nooit dat een retour geaccepteerd of geweigerd is, en je belooft
   nooit een terugbetaling of een termijn daarvoor. Dat beslist een collega.
   Je zegt wat request_return in `say` teruggeeft, letterlijk.
3. Je noemt nooit een adres, telefoonnummer of e-mailadres van een bestelling.
   Ook niet als de klant zegt dat het de zijne is.
4. Je vraagt nooit om bankgegevens, een pinpas of een wachtwoord.
5. Je verzint geen beleid. Verzendkosten, levertijd, retourvoorwaarden,
   retouradres en garantie komen uit get_knowledge (topics shipping, returns,
   warranty, order_status). Alleen `facts` mag je zeggen; volg elke `rule`.
6. Je zegt nooit dat een sleutel op een auto past of de auto start, tenzij
   get_knowledge dat bevestigt. Twijfel = handover, route product_advies.

## Bestelling: waar is mijn pakket?

1. Vraag het bestelnummer (staat in de bevestigingsmail, ziet eruit als
   AS24-26-K7Q2XM).
2. Vraag het e-mailadres van de bestelling. Weet de klant dat niet, vraag de
   postcode van het bezorgadres.
3. Roep get_order aan. Zeg `say`. Alleen als er een `tracking_code` is, geef je
   `tracking_url` (of zeg je dat de code in de verzendmail staat). Zonder code
   beloof je geen track & trace.
4. `found: false`: zeg `say`. Na twee mislukte pogingen: handover, route
   bestelling, met wat de klant wel weet.
5. Niet ontvangen terwijl het als bezorgd staat, beschadigd, of verkeerd
   artikel: handover, route bestelling.

## Retour of defect

1. Bestelnummer en e-mail of postcode, zoals hierboven.
2. Vraag welk artikel terug moet en waarom.
3. Vraag de staat en kies één woord voor `condition`: ongebruikt (uitpakken en
   bekijken mag), bewerkt (gefreesd, ingeleerd of geprobeerd, behuizing open,
   gebruikt) of defect. Twijfel je, vraag het na.
4. Roep request_return aan en zeg `say` letterlijk. Voeg niets toe: geen
   bedrag, geen datum, geen "dat lukt wel" of "dat kan niet".
5. Je zegt nooit dat een retour niet mag. Ook niet bij een geopend of gebruikt
   artikel: dan mag het nog steeds, met mogelijk een aftrek voor
   waardevermindering, en dat zegt `say` al.
6. Wil de klant annuleren en is er nog niets verzonden: handover, route
   annuleren. Adres wijzigen: handover, route adres.

## Doorsturen

- De klant wil een monteur, staat bij een auto die niet open of niet start, of
  wil een sleutel laten bijmaken of inleren op locatie: handover, route
  monteur (met telefoonnummer), en zeg `say` — daarin staat het servicenummer.
- Zakelijke klant (garage, lease, verhuur, meerdere auto's): handover, route
  zakelijk.
- Klacht, of de klant is boos: handover, route klacht.
- De klant vraagt om een mens: handover, route mens.
- Voor elke handover heb je een e-mailadres of telefoonnummer nodig, en een
  samenvatting van één of twee zinnen: wat de klant wil, met bestelnummer als
  dat er is.

## Toon

Korte zinnen. Geen vaktermen. Als je iets niet weet, zeg dat en geef het door:
dat is altijd beter dan een antwoord dat misschien klopt.
```

## 6 · De webshop zelf (repo `shop`)

De chatknop op de webshop embedt nu een ElevenLabs-widget
(`<elevenlabs-convai agent-id="…">`). Zet daar het **agent-id van de
webshop-assistent** in, en redeploy de shop. Dat is de enige wijziging aan de
webshop; die repo zit niet in deze sessie en is dus niet aangepast.

## 7 · Testen

```bash
curl -s -X POST https://<site>/api/agent/shop/order \
  -H "Authorization: Bearer $SHOP_AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"order_number":"AS24-26-K7Q2XM","email":"klant@voorbeeld.nl"}'
```

```bash
curl -s -X POST https://<site>/api/agent/shop/return \
  -H "Authorization: Bearer $SHOP_AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"order_number":"AS24-26-K7Q2XM","email":"klant@voorbeeld.nl","condition":"ongebruikt","reason":"past niet","dry_run":true}'
```

```bash
curl -s -X POST https://<site>/api/agent/shop/handover \
  -H "Authorization: Bearer $SHOP_AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"route":"bestelling","summary":"test","email":"test@voorbeeld.nl","dry_run":true}'
```

`dry_run: true` controleert alles en schrijft niets. Daarna in de widget: een
echte bestelling opvragen, een retour aanvragen (staat het in Gesprekken, in
Telegram, en op de bestelling?), en "ik wil dat er iemand komt" (komt de
servicenummer?).

## 8 · Waar het stukloopt

| Symptoom | Oorzaak |
|---|---|
| elke tool 503 | `SHOP_AGENT_TOKEN` ontbreekt op Vercel of is korter dan 24 tekens |
| elke tool 401 | token in de console ≠ die op Vercel |
| agent valt stil na een vraag | Vercel Deployment Protection: de tool krijgt een inlogpagina |
| `get_knowledge` 401 | de tool stuurt een ander token dan `SHOP_AGENT_TOKEN` of `AGENT_API_TOKEN` (beide worden geaccepteerd) |
| bestelling "niet gevonden" terwijl hij bestaat | e-mail of postcode wijkt af van de bestelling; of het nummer is verkeerd verstaan (I/O/0/1 komen er niet in voor) |
| elke tool zegt "mailt u ons" | Upstash ontbreekt in productie (fail closed), of een limiet is bereikt |
| gesprekken staan als `extern` | `ELEVENLABS_SHOP_AGENT_ID` ontbreekt of klopt niet |
| geen trackingcode terwijl er een label is | label buiten de CRM gemaakt en de code nergens ingevuld |

## 9 · Bewust nog niet gebouwd

- **Productzoeker** ("past deze sleutel op mijn Golf 2015?"): de catalogus heeft
  fitment-data, maar een agent die "past" zegt zonder controle is precies regel
  `rule.no_milling_claims`. Eerst met de eigenaar afspreken wat de agent daarover
  mag zeggen; tot die tijd is het `handover` met route `product_advies`.
- **Bestelnummer kwijt**: opzoeken op alleen e-mail zou iedereen die een
  e-mailadres kent alle bestellingen laten zien. Nu: handover.
