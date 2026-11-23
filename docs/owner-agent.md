# De eigenaarsagent: taken en Google Calendar

Status: gebouwd op branch `feat/taken`, migratie `0106_crm_tasks_access.sql`. Scherm:
`/admin/taken`. Eén eigen tool: `/api/agent/tasks`. De agenda loopt niet door onze code.

**Özet (Türkçe):** Takvim için kod yazmadık: ElevenLabs'in yerleşik Google Calendar
entegrasyonu var, "Connect" deyip Google hesabını seçiyorsun, bitti. Görev listesi için
yerleşik bir şey yok; o yüzden tek küçük araç `crm_tasks` tablosuna yazıyor ve ofis bunu
`/admin/taken` ekranında görüyor. Açmak için: migration, bir env değişkeni, ElevenLabs'te
bir araç ve bir entegrasyon.

## Beslissing (23 nov 2026, na onderzoek)

| Onderdeel | Gekozen | Waarom |
|---|---|---|
| Agenda | **ElevenLabs → Integrations → Google Calendar** (ingebouwd, OAuth) | Lijst, maken, wijzigen, verwijderen en beschikbaarheid, zonder één regel bij ons. Een eigen service-account-koppeling was 250 regels en een extra geheim in Vercel; verwijderd. |
| Taken | **`crm_tasks` + `/api/agent/tasks`** (60 regels) | Geen ingebouwde Google Tasks-tool bij ElevenLabs. Composio of een Google-Tasks-MCP voegt een leverancier toe, en kantoor zou de taken niet in de CRM zien. |
| Spraak van de eigenaar zelf | Gemini op Android (gratis, Turks) schrijft al in Google Calendar | De ElevenLabs-agent leest dezelfde agenda. |

## Aanzetten

### 0. Migratie

```bash
cd ~/keyforcars-crm && npx supabase db push    # 0106 — KeyForCars
```

Autosleutel24: `supabase/migrations/0106_crm_tasks_access.sql` in de SQL-editor van project
`utctfircycpjmpjqmtmm` plakken (idempotent), tot dat project aan de CLI hangt.

### 1. Vercel → Environment Variables

| Variabele | Waarde |
|---|---|
| `OWNER_AGENT_TOKEN` | 32+ willekeurige tekens, bijvoorbeeld `openssl rand -hex 24` |

Redeploy.

### 2. Test zonder ElevenLabs

```bash
curl -sS -X POST https://<site>/api/agent/tasks -H "Authorization: Bearer $OWNER_AGENT_TOKEN" \
  -H 'Content-Type: application/json' -d '{"action":"add","description":"Testtaak","due":"morgen 10:00"}'
```

Verwacht `{"ok":true,"task":{...}}`; de taak staat daarna op `/admin/taken`.
503 = variabele mist, 401 = token klopt niet.

### 3. ElevenLabs-console

Eén nieuwe agent, **niet** de telefoniste, en **met authenticatie aan**: de Google
Calendar-tools kunnen elke afspraak wijzigen of verwijderen, dus deze agent mag alleen
door de eigenaar te bereiken zijn (eigen telefoonnummer of ingelogde widget).

1. **Integrations → Google Calendar → Connect**, kies het Google-account van de eigenaar.
   Zet op de agent de tools *list events*, *create event*, *check availability* aan;
   *update* en *delete* alleen als de agent echt alleen voor de eigenaar bereikbaar is.
   Docs: elevenlabs.io/docs/eleven-agents/customization/integrations/google_calendar
2. **Workspace → Secrets:** `OWNER_AGENT_TOKEN`.
3. Eén webhook-tool **`taken`**, `POST https://<site>/api/agent/tasks`, header
   `Authorization: Bearer {{secret}}`:

```json
{ "type": "object", "required": ["action"],
  "properties": {
    "action": { "type": "string", "enum": ["list", "add", "done"], "description": "list = open taken; add = nieuwe taak; done = taak afvinken" },
    "description": { "type": "string", "description": "Bij add: wat er moet gebeuren" },
    "due": { "type": "string", "description": "Bij add: wanneer. 'morgen 10:00', 'vandaag', '2026-11-24 14:30'. Leeg = morgen 09:00" },
    "id": { "type": "string", "description": "Bij done: het id uit list" } } }
```

Datums die de tool begrijpt: `2026-11-24`, `2026-11-24 14:30`, een ISO-tijdstip, of
`vandaag`/`morgen`/`today`/`tomorrow`/`bugün`/`yarın` met optioneel `HH:mm`. Zonder tijd
is het 09:00. Onbegrijpelijk → 400 "vraag de datum opnieuw", nooit een gok.

Systeemprompt, kern: *Je bent de persoonlijke assistent van de eigenaar. Begin elk gesprek
met `taken list` en de agenda van vandaag en morgen. Bij een nieuwe taak of afspraak:
herhaal datum en tijd en wacht op bevestiging voordat je iets aanmaakt. Krijg je "datum
onduidelijk" terug, vraag de datum opnieuw. Verzin nooit een afspraak die niet in de
agenda staat.*

## Niet gebouwd, bewust

- Een iCal-feed van CRM-klussen naar Google Calendar: `/api/agenda/[token]` bestaat per
  monteur; een kantoorvariant is klein. Toevoegen als de eigenaar klussen in zijn agenda wil.
- Herinnering in Telegram bij een taak die te laat is: `admin_telegram` bestaat al, één cron.
- Google Tasks in plaats van `crm_tasks`: pas als kantoor de taken niet meer hoeft te zien.

## Controle

```bash
node --experimental-strip-types scripts/check-owner-agent.mts
```
