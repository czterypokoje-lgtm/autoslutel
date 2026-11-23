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
| iemand vraagt andermans bestelling op | `get_order` geeft alleen iets terug met bestelnummer **én** het e-mailadres of de postcode van die bestelling; een verkeerde combinatie krijgt hetzelfde antwoord als een nummer dat niet bestaat; max. 6 pogingen per nummer per uur |
| adres, telefoon of bedragen uitlekken | de tool geeft ze niet terug: alleen status, artikelnamen, data en track & trace |
| de agent weigert een retour die wél mag (of belooft geld) | `request_return` weigert nooit en belooft geen terugbetaling. Het sorteert in **retour** (ongebruikt, binnen 14 dagen), **garantie** (defect) of **beoordeling** (geopend/bewerkt of buiten de termijn); het kantoor beslist |
| een retour twee keer aangevraagd | `return_requested_at` wordt één keer gezet; de tweede keer zegt de agent "is al aangevraagd" |
| een belofte die niemand nakomt | `handover` zegt alleen "een collega neemt contact op" als Gesprekken of Telegram het echt ontvangen heeft |
| verzonnen beleid (verzendkosten, retouradres, levertijd) | staat niet in de prompt; komt uit `get_knowledge` (alleen door de eigenaar bevestigde regels) |

Termijn: 14 dagen bedenktijd vanaf **bezorging** (`delivered_at`). Verzonden maar
nog niet als bezorgd gemarkeerd = termijn nog niet begonnen = retour kan.

## 2 · Waar het terechtkomt

Elke retour en elke overdracht wordt een **gesprek in `/admin/gesprekken`** (met
het e-mailadres van de bestelling, zodat je vanuit hetzelfde scherm kunt
antwoorden) én een **Telegram-bericht**. De retour staat bovendien op de
bestelling zelf (`return_requested_at`, `return_reason`).

Het volledige gesprek komt via de bestaande post-call webhook binnen, gemarkeerd
met `agent_role: 'webshop'` en kanaal `webchat` (widget) of `phone`.

| `route` (handover) | Telegram-label | Voor |
|---|---|---|
| `bestelling` | 📦 Probleem met bestelling | niet ontvangen, beschadigd, verkeerd artikel |
| `annuleren` | ✋ Annuleringsverzoek | nog niet verzonden |
| `adres` | 🏠 Adres wijzigen | vóór verzending |
| `product_advies` | 🔑 Productadvies | welke sleutel past, als de agent het niet zeker weet |
| `monteur` | 🚐 Wil een monteur | alleen als doorverbinden naar de telefoniste niet lukt (§4) |
| `zakelijk` | 🏢 Zakelijke klant | garages, lease, meerdere auto's |
| `klacht` | 😠 Klacht | antwoord binnen 2 werkdagen (bevestigd feit) |
| `mens` | 🙋 Vraagt om een mens | |
| `overig` | 💬 Webshopvraag zonder antwoord | `get_knowledge` had geen antwoord |

Geen van deze laat 's nachts een telefoon overgaan. Een webshopvraag is nooit
een noodgeval; iemand die naast een dichte auto staat, is een servicebeller en
gaat naar de telefoniste.

## 3 · Vercel

| Env | Waarde |
|---|---|
| `SHOP_AGENT_TOKEN` | lange willekeurige string, **minstens 24 tekens** (korter = elke tool 503, met opzet) |
| `ELEVENLABS_SHOP_AGENT_ID` | agent-id van de webshop-assistent (na §4) |

Staat `ELEVENLABS_AGENT_IDS` ingevuld, dan hoeft de webshop-agent er niet bij:
`ELEVENLABS_SHOP_AGENT_ID` telt altijd als eigen agent.

Optioneel maar aanbevolen: Upstash (`KV_REST_API_URL`/`KV_REST_API_TOKEN`) voor
de limiet per bestelnummer. Zonder Upstash werkt alles, maar zonder die limiet.

## 4 · ElevenLabs-console

**Workspace → Secrets:** `SHOP_AGENT_TOKEN`, dezelfde waarde als op Vercel.

**Agents → Create agent:** `Webshop — Autosleutel24`.

- **Taal:** Nederlands (Engels als extra taal mag).
- **First message:** "Hallo, u spreekt met de digitale assistent van Autosleutel24. Heeft u een vraag over een bestelling, een retour of een product?"
  (de AI-melding is regel `rule.disclose_ai`.)
- **System prompt:** §5, integraal.

### De vier tools

**Tools → Add tool → Webhook.** Voor alle vier: Authentication = Bearer →
workspace secret `SHOP_AGENT_TOKEN`.

| Tool | Methode | URL | Body / query |
|---|---|---|---|
| `get_order` | POST | `https://<site>/api/agent/shop/order` | `order_number`, `email`, `postcode` |
| `request_return` | POST | `https://<site>/api/agent/shop/return` | `order_number`, `email`, `postcode`, `condition`, `reason`, `items`, `customer_name`, `customer_phone` |
| `handover` | POST | `https://<site>/api/agent/shop/handover` | `route`, `summary`, `customer_name`, `email`, `customer_phone`, `order_number` |
| `get_knowledge` | GET | `https://<site>/api/agent/knowledge` | query `topic`, `q` (zie [`agent-knowledge.md`](agent-knowledge.md)) |

Alle velden value type **LLM Prompt**, behalve `customer_phone` bij een
telefoongesprek: Dynamic Variable `{{system__caller_id}}`.

Beschrijvingen die het LLM leest:

- `get_order` — "Zoek een bestelling op. Nodig: het bestelnummer (begint met AS24) en het e-mailadres óf de postcode van de bestelling. Zeg daarna wat in `say` staat."
- `request_return` — "Registreer een retour- of garantieverzoek. Vraag eerst bestelnummer, e-mail of postcode, wat er terug moet, de reden, en de staat: ongebruikt, geopend, bewerkt (gefreesd/geprogrammeerd) of defect. Zeg daarna letterlijk wat in `say` staat."
- `handover` — "Geef de vraag door aan een collega als jij hem niet kunt afmaken. `route` is precies één van: bestelling, annuleren, adres, product_advies, monteur, zakelijk, klacht, mens, overig. Je hebt een e-mailadres of telefoonnummer nodig. Zeg daarna letterlijk wat in `say` staat."

### Systeemtools

- `end_call`
- **`transfer_to_agent`** → de telefoniste. Voorwaarde: *"De klant wil dat er een monteur komt, staat bij een auto die niet open of niet start, of wil een sleutel laten bijmaken of inleren op locatie."* Zo komt een servicevraag in de webshop-chat bij de agent die kan boeken, zonder dat de klant opnieuw hoeft te beginnen.
- `transfer_to_number` alleen als de webshop-assistent ook aan een telefoonnummer hangt; anders weglaten.

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

1. Vraag het bestelnummer (staat in de bevestigingsmail, begint met AS24).
2. Vraag het e-mailadres van de bestelling. Weet de klant dat niet, vraag de
   postcode van het bezorgadres.
3. Roep get_order aan. Zeg `say`. Is er een trackingcode: in de chat geef je
   `tracking_url`; aan de telefoon noem je de vervoerder en dat de code in de
   verzendmail staat.
4. `found: false`: zeg `say`. Na twee mislukte pogingen: handover, route
   bestelling, met wat de klant wel weet.
5. Niet ontvangen terwijl het als bezorgd staat, beschadigd, of verkeerd
   artikel: handover, route bestelling.

## Retour of defect

1. Bestelnummer en e-mail of postcode, zoals hierboven.
2. Vraag welk artikel terug moet en waarom.
3. Vraag de staat: nog ongebruikt in de verpakking, geopend, al gefreesd of
   geprogrammeerd, of defect.
4. Roep request_return aan en zeg `say` letterlijk. Zeg erbij dat de klant
   niets terugstuurt voordat er een e-mail van ons is.
5. Wil de klant annuleren en is er nog niets verzonden: handover, route
   annuleren. Adres wijzigen: handover, route adres.

## Doorsturen

- De klant wil een monteur, staat bij een auto die niet open of niet start, of
  wil een sleutel laten bijmaken of inleren op locatie: transfer_to_agent naar
  de telefoniste. Lukt dat niet: handover, route monteur, met telefoonnummer.
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
  -d '{"order_number":"AS24-2026-00042","email":"klant@voorbeeld.nl"}'
```

```bash
curl -s -X POST https://<site>/api/agent/shop/return \
  -H "Authorization: Bearer $SHOP_AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"order_number":"AS24-2026-00042","email":"klant@voorbeeld.nl","condition":"ongebruikt","reason":"past niet","dry_run":true}'
```

```bash
curl -s -X POST https://<site>/api/agent/shop/handover \
  -H "Authorization: Bearer $SHOP_AGENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"route":"bestelling","summary":"test","email":"test@voorbeeld.nl","dry_run":true}'
```

`dry_run: true` controleert alles en schrijft niets. Daarna in de widget: een
echte bestelling opvragen, een retour aanvragen (staat het in Gesprekken, in
Telegram, en op de bestelling?), en "ik wil dat er iemand komt" (komt de
telefoniste aan de lijn?).

## 8 · Waar het stukloopt

| Symptoom | Oorzaak |
|---|---|
| elke tool 503 | `SHOP_AGENT_TOKEN` ontbreekt op Vercel of is korter dan 24 tekens |
| elke tool 401 | token in de console ≠ die op Vercel |
| agent valt stil na een vraag | Vercel Deployment Protection: de tool krijgt een inlogpagina |
| `get_knowledge` 401 | de tool stuurt een ander token dan `SHOP_AGENT_TOKEN` of `AGENT_API_TOKEN` (beide worden geaccepteerd) |
| bestelling "niet gevonden" terwijl hij bestaat | e-mail of postcode wijkt af van de bestelling; of het nummer is anders dan `AS24-JJJJ-NNNNN` |
| gesprekken staan als `extern` | `ELEVENLABS_SHOP_AGENT_ID` ontbreekt of klopt niet |
| geen trackingcode terwijl er een label is | label buiten de CRM gemaakt en de code nergens ingevuld |

## 9 · Bewust nog niet gebouwd

- **Productzoeker** ("past deze sleutel op mijn Golf 2015?"): de catalogus heeft
  fitment-data, maar een agent die "past" zegt zonder controle is precies regel
  `rule.no_milling_claims`. Eerst met de eigenaar afspreken wat de agent daarover
  mag zeggen; tot die tijd is het `handover` met route `product_advies`.
- **Bestelnummer kwijt**: opzoeken op alleen e-mail zou iedereen die een
  e-mailadres kent alle bestellingen laten zien. Nu: handover.
