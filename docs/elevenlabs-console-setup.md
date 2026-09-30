# ElevenLabs-console: doorverbinden naar jou

Wat er in de ElevenLabs-console geklikt moet worden zodat de telefoniste-agent
een beller **naar jou doorverbindt** en **jou belt** als een van jouw regels
raakt. Telefoon, verder niets: monteurs lopen via Telegram en de CRM.

De systeemprompt van de telefoniste staat in [`agent-prompt.md`](agent-prompt.md).

Twee agents, en de tweede is klein:

| # | Agent | Praat met | Prompt |
|---|---|---|---|
| 1 | **Telefoniste** | de beller | [`agent-prompt.md`](agent-prompt.md) |
| 2 | **Briefing** | jou, bij een uitgaand belletje | §7 |

De vier soorten werk (`bijmaken`, `alle_sleutels_kwijt`, `reparatie`, `slot`)
zijn géén vier agents: het verschil zit in prijs en duur, en die komen uit
`/quote` en `/slots`. Eén agent, vier antwoorden.

**Twee manieren om jou te bereiken, en het verschil is belangrijk:**

| | Wat er gebeurt | Wanneer |
|---|---|---|
| **Doorverbinden** | de beller komt bij jou aan de lijn, jij hoort eerst waaróm | een regel uit §6 raakt, tijdens het gesprek |
| **Jou bellen** | jouw telefoon gaat, een agent leest de situatie voor | doorverbinden lukte niet, of niemand nam op |

Doorverbinden is een ingebouwde tool — geen code. Bellen loopt via
`/api/agent/escalate` en is al gebouwd.

---

## 1 · Volgorde

Elke stap is voorwaarde voor de volgende. Een agent die je aanmaakt vóór zijn
tools bestaan, moet je twee keer langs.

1. Workspace secret (§2)
2. Post-call webhook (§3)
3. Telefoonnummer — **Twilio-import, geen native nummer** (§4)
4. De vijf tools (§5)
5. Agent 1, de telefoniste (§5)
6. De transfer rules — jouw regels (§6)
7. Agent 2, de briefing-agent (§7)
8. Testen (§8)

## 2 · Workspace secret

**Workspace → Secrets.** Eén stuk:

| Secret | Waarde |
|---|---|
| `AGENT_API_TOKEN` | exact dezelfde string als op Vercel |

Zet hem nooit als losse constante in een tool-header: een secret is de enige
plek waar hij niet in een screenshot terechtkomt. Is hij korter dan 24 tekens,
dan weigert `src/lib/agentAuth.ts` élk verzoek met 503 — met opzet.

## 3 · Post-call webhook

**Workspace → Webhooks → Create webhook.**

- URL: `https://<site>/api/elevenlabs/webhook`
- Events: **post_call_transcription** — die ene, de rest leest deze route niet
- Het **signing secret** dat je terugkrijgt → Vercel als `ELEVENLABS_WEBHOOK_SECRET`

Zonder dat secret in Vercel antwoordt de route 401 op alles, ook op echte
verzoeken (`src/lib/elevenlabsWebhook.ts` faalt dicht). Hierna landt elk gesprek
in `/admin/gesprekken` én in Telegram, inclusief het transcript. Dat is je
vangnet: zelfs een gesprek dat helemaal misliep, kun je nalezen.

## 4 · Telefoonnummer — hier kan het stilvallen

**Phone numbers → Import from Twilio.**

Dit is de stap die het verschil maakt tussen opnemen en wéten waarover het gaat.
Een **warme** overdracht — de agent die eerst tegen jóu zegt waarom hij
doorverbindt, vóórdat de beller erop komt — bestaat alleen bij een
**Twilio-nummer dat in ElevenLabs geïmporteerd is**.

| Transfer type | Werkt met | Hoor jij eerst waarom? |
|---|---|---|
| **Conference** (standaard) | Twilio-import of SIP | alleen bij Twilio-import |
| **Blind** | alleen Twilio-import | nee |
| **SIP REFER** | alleen SIP-trunk | nee |

Draait je nummer nu als ElevenLabs-native nummer: **eerst migreren**. Doe je dit
als laatste, dan werkt doorverbinden wel, maar neem je op zonder te weten wat er
aan de hand is — en dat merk je voor het eerst bij een noodgeval.

Het `phone_number_id` van het nummer waarmee er **uit**gebeld wordt → Vercel als
`ELEVENLABS_OUTBOUND_PHONE_NUMBER_ID`.

## 5 · De vijf tools en agent 1

**Agents → (de telefoniste) → Tools → Add tool → Webhook**, vijf keer. Voor alle
vijf hetzelfde:

- **Method:** POST
- **URL:** `https://<site>/api/agent/<pad>`
- **Authentication:** Bearer token → **workspace secret** `AGENT_API_TOKEN` (§2)
- **Body parameters:** value type **LLM Prompt**, tenzij er iets anders staat

| Tool | Pad | Body |
|---|---|---|
| `check_car` | `car` | `make`, `model`, `year` |
| `get_price` | `quote` | `make`, `model`, `year`, `working_key`, `keyless`, `postcode` |
| `get_slots` | `slots` | `make`, `model`, `year`, `working_key`, `postcode` |
| `book_job` | `book` | `make`, `model`, `year`, `working_key`, `postcode`, `city`, `street`, `customer_name`, `customer_phone`, `date`, `slot_start`, `notes` |
| `escalate` | `escalate` | zie onder |

`escalate` is de tool die jouw telefoon laat overgaan. Beschrijving die het LLM
leest:

> Gebruik deze tool als het antwoord een mens is. Kun je doorverbinden, doe dat
> dan eerst. Lukt dat niet, neemt er niemand op, of is er geen gesprek om over te
> dragen, dan deze tool. Zeg daarna letterlijk wat er in het veld `say` terugkomt.

| Veld | Value type | Waarde |
|---|---|---|
| `reason` | LLM Prompt | `noodgeval`, `mens_gevraagd` of `terugbelverzoek` — precies één van deze drie |
| `summary` | LLM Prompt | één of twee zinnen: auto, scenario, plaats, en wat de beller wil |
| `customer_name` | LLM Prompt | mag leeg |
| `customer_phone` | Dynamic Variable | `{{system__caller_id}}` |
| `channel` | Dynamic Variable | `{{system__call_type}}` |

**Of jouw telefoon overgaat, bepaalt de server — niet de agent:**

| `reason` | Belt jou | In Telegram |
|---|---|---|
| `noodgeval` | ja | 🚨 NOODGEVAL — kind of dier in de auto, of langs de weg |
| `mens_gevraagd` | ja | 🙋 Klant vraagt om een mens |
| `terugbelverzoek` | nee | 📋 Terugbelverzoek |

Een model dat over een prijs om te praten valt, valt ook over urgentie om te
praten. Daarom staat die tabel in `src/app/api/agent/escalate/route.ts` en niet
in een prompt: anders is "mijn sleutel is echt heel dringend" genoeg om je om
drie uur 's nachts te laten bellen.

### Agent 1 zelf

- **Systeemprompt:** [`agent-prompt.md`](agent-prompt.md), integraal.
- **Taal:** Nederlands. **TTS-model:** `eleven_flash_v2_5` (~75 ms) — of
  `eleven_v3_conversational` (~280 ms) als je de expressievere stem belangrijker
  vindt dan de wachttijd. Niet `eleven_turbo_v2_5`: afgeschreven.
- **First message:** één zin, en niet "waarmee kan ik u helpen" — de meeste
  bellers staan naast hun auto: *"Autosleutel24, u spreekt met de assistent —
  wat is er met de sleutel?"*
- **Tools:** de vijf hierboven, plus de systeemtools `end_call` en
  `transfer_to_number` (§6).
- **Analysis → Evaluation criteria:** twee stuks. **geboekt** — "Is er een klus
  geboekt, of een terugbelverzoek aangenomen?" (dit is wat `call_successful`
  betekent en dus wat je als ✅ in `/admin/gesprekken` ziet; "klant was
  vriendelijk" is géén succes). En **geen prijs verzonnen** — "Heeft de agent
  alleen bedragen genoemd die uit get_price kwamen?"
- **Analysis → Data collection:** `merk`, `model`, `scenario`, `postcode`,
  `reden_niet_geboekt`. Dat laatste is het enige veld waaruit je ziet wat je
  misloopt bij gesprekken die de code niet in `unmet_requests` schrijft.

## 6 · `transfer_to_number` — jouw regels

**Agent 1 → Tools → Add system tool → transfer_to_number.** Geen code, geen
endpoint. De `condition` is letterlijk waar jij op doorverbonden wilt worden — de
agent leest ze en kiest.

Deze vier komen uit de prompt die er al staat. Vul het nummer in, en zet erbij
wat jij verder nog wil:

```jsonc
[
  {
    "condition": "Er zit een kind of een dier in de auto, of de beller staat langs de snelweg of is in gevaar.",
    "transfer_destination": { "type": "phone", "phone_number": "+31…" },
    "transfer_type": "conference"
  },
  {
    "condition": "De beller vraagt om een mens, is boos, of blijkt niet de eigenaar van de auto te zijn.",
    "transfer_destination": { "type": "phone", "phone_number": "+31…" },
    "transfer_type": "conference"
  },
  {
    "condition": "De beller heeft een lopende klus en de monteur is al onderweg.",
    "transfer_destination": { "type": "phone", "phone_number": "+31…" },
    "transfer_type": "conference"
  },
  {
    "condition": "De beller wil zakelijk werk: een leasemaatschappij, een garage, een verhuurbedrijf of meerdere auto's tegelijk.",
    "transfer_destination": { "type": "phone", "phone_number": "+31…" },
    "transfer_type": "conference"
  }
]
```

Per aanroep vult de agent zelf drie velden in. Eén ervan doet het werk:

| Veld | Wie hoort het | Wat erin moet |
|---|---|---|
| `client_message` | de beller | "Ik verbind u door met een collega, een moment." |
| `agent_message` | **jij, vóór de beller erop komt** | auto, scenario, postcode, en waaróm hij doorverbindt |
| `reason` | het transcript | kort, voor later terugzoeken |

Zet in `agent_message` altijd de auto en de plaats. Dat is het verschil tussen
"met wie spreek ik?" en "ja, ik kom eraan". Werkt alleen op een Twilio-import
(§4).

**Neemt er niemand op, dan komt de agent terug in het gesprek.** Laat hem dán
`escalate` aanroepen — daar sluiten de twee mechanismen op elkaar aan, en dat is
ook precies wat er in de prompt staat.

### Een regel toevoegen, later

Eén regel bij in deze lijst, en klaar. Geen deploy, geen code. Dat is de reden
dat jouw regels hier staan en niet in de systeemprompt: een prompt moet je
opnieuw doorlezen, een lijst voorwaarden niet.

## 7 · Agent 2 — de briefing-agent

Dit is de agent die *jou* belt als doorverbinden niet lukte. Hij praat nooit met
een klant en hij doet één ding: voorlezen.

**Agents → Create agent.** Naam: `Briefing — kantoor`.

- **First message:** leeg. Een vast eerste bericht praat over jouw "hallo" heen.
- **Taal:** Nederlands.
- **Tools:** alleen `end_call`. Geen webhook-tools — hij leest voor, hij zoekt
  niets op.
- **Max conversation duration:** 120 seconden. Een briefing die langer duurt, is
  een gesprek dat een mens met een mens moet hebben.

### Eerst de dynamic variables, dan de prompt

**Agent → Dynamic variables.** Vier stuks, elk met een **default** — zonder
default weigert ElevenLabs het gesprek te starten als er één ontbreekt:

| Variabele | Default | Komt uit `escalate` |
|---|---|---|
| `samenvatting` | `geen samenvatting meegegeven` | `summary` |
| `klant_naam` | `onbekend` | `customer_name` |
| `klant_telefoon` | `onbekend` | `customer_phone` (E.164) |
| `kanaal` | `onbekend` | `channel` |

`src/lib/elevenlabsCall.ts` stuurt precies deze vier namen mee. Hernoem er één
en de briefing wordt stil over dat veld — niet luidruchtig, stil. Dat is het
soort fout dat je pas merkt als je een keer moet opnemen.

### Systeemprompt

```
Je belt een collega van Autosleutel24 om een gesprek over te dragen dat een mens
nodig heeft. Je bent geen klantenservice en je praat niet met de klant.

Je hebt vijftien seconden nuttige tijd. Gebruik ze zo:

1. Zeg in één zin wie je bent en waarom je belt:
   "Je spreekt met de assistent van Autosleutel24, ik heb een {{kanaal}}-gesprek
   dat iemand van jullie moet overnemen."
2. Lees de situatie voor: {{samenvatting}}
3. Geef de klant: {{klant_naam}}, telefoonnummer {{klant_telefoon}}. Zeg het
   nummer cijfer voor cijfer, in twee groepen, en herhaal het één keer.
4. Vraag: "Neem je het over?"
5. Bij ja: "Dankjewel, ik laat het hierbij." → end_call.
   Bij nee of twijfel: "Dan bel ik de volgende." → end_call.
   Bij een vraag die je niet uit de vier velden hierboven kunt beantwoorden:
   "Dat staat er niet bij — het hele gesprek staat in Telegram." → end_call.

## Wat je nooit doet

1. Je verzint niets bij. Je weet exact vier dingen: het kanaal, de samenvatting,
   de naam en het telefoonnummer. Alles daarbuiten is "dat staat er niet bij".
2. Je noemt geen prijs, geen tijdslot en geen monteur, ook niet als erom
   gevraagd wordt. Je hebt die gegevens niet en je schat ze niet.
3. Je belt de klant niet en je verbindt niemand door. Jij bent één kant van één
   telefoontje.
4. Je vraagt niet wie je spreekt en je controleert niets. Neemt er iemand op die
   dit niet hoort te horen, dan is dat een verkeerd nummer in OFFICE_PHONE, niet
   iets dat jij kunt repareren.
5. Je probeert het gesprek niet te rekken. Is punt 4 beantwoord, dan hang je op.

## Toon

Een collega die je om 3 uur 's nachts wakker belt en dat weet. Rustig, kort,
geen verontschuldigingen, geen "sorry dat ik stoor". Eerst wát er is, dan de
details — iemand die net opneemt onthoudt de eerste zin en de laatste.

Cijfers zeg je los: "nul zes — één één, zeven vijf — één twee, drie één."
```

Agent-id → Vercel als `ELEVENLABS_BRIEFING_AGENT_ID`. Plus `OFFICE_PHONE`: het
nummer dat 's nachts moet overgaan.

## 8 · Testen, in deze volgorde

```bash
AGENT_API_TOKEN=… node scripts/test-agent.mjs https://<site>
```

Alle vijf stappen groen voordat je één veld in de console invult. Stap 5 test
`escalate` met `dry_run: true`: die bewijst de route en de urgentie-tabel zonder
je telefoon te laten gaan.

Daarna, in deze volgorde, omdat elke stap de vorige nodig heeft:

1. **Bel het nummer** en boek een testklus. Staat het gesprek in
   `/admin/gesprekken`, kwam het transcript in Telegram, staat de klus in de
   agenda? Zo niet: post-call webhook (§3), niet de agent.
2. **Zeg "ik wil een mens"** en laat je doorverbinden. Hoor je `agent_message`
   vóór de beller? Zo niet: het nummer is nog native (§4).
3. **Neem niet op.** Verwacht: de agent komt terug in het gesprek, roept
   `escalate` aan, jouw telefoon gaat met de briefing-agent.
4. **Zet `OFFICE_PHONE` leeg** en herhaal 3. Verwacht: Telegram wél, belletje
   niet, en de agent zegt "een collega belt u terug" — niet "ik heb iemand aan
   de lijn". Dat verschil is waarom `/escalate` teruggeeft wat er écht lukte.

## 9 · Wat waar hoort

| Vercel env | Waar je hem vindt |
|---|---|
| `ELEVENLABS_API_KEY` | Workspace → API keys |
| `ELEVENLABS_WEBHOOK_SECRET` | §3, signing secret van de webhook |
| `ELEVENLABS_BRIEFING_AGENT_ID` | §7, agent-id van de briefing-agent |
| `ELEVENLABS_OUTBOUND_PHONE_NUMBER_ID` | §4, phone number id van het uitgaande nummer |
| `OFFICE_PHONE` | geen console — het nummer dat 's nachts moet overgaan |
| `AGENT_API_TOKEN` | §2, óók als workspace secret |

De `ELEVENLABS_WHATSAPP_*` en `ELEVENLABS_TECHNICIAN_AGENT_ID` in
`.env.example` horen bij het WhatsApp-aanbod aan monteurs. Laat ze leeg: dan is
`src/lib/elevenlabsWhatsapp.ts` een stille no-op en lopen monteurs via Telegram
en de CRM, zoals bedoeld.

## 10 · Waar het stukloopt

| Symptoom | Oorzaak |
|---|---|
| agent valt stil na een vraag | tool geeft geen JSON — bijna altijd Vercel Deployment Protection: de agent krijgt een inlogpagina |
| elke tool 401 | `AGENT_API_TOKEN` in de console ≠ die op Vercel |
| elke tool 503 | token staat niet op Vercel, of is korter dan 24 tekens |
| geen transcript in Telegram | `ELEVENLABS_WEBHOOK_SECRET` ontbreekt of hoort bij een andere webhook → route antwoordt 401 |
| doorverbinden werkt, maar je hoort niet waarom | native nummer in plaats van Twilio-import (§4) |
| jouw telefoon gaat niet bij een noodgeval | `OFFICE_PHONE`, `ELEVENLABS_BRIEFING_AGENT_ID` of `ELEVENLABS_OUTBOUND_PHONE_NUMBER_ID` leeg — `escalate` geeft dan `called: false` terug |
| briefing-agent zegt "onbekend" bij alles | variabelenamen wijken af van de vier in §7 |
