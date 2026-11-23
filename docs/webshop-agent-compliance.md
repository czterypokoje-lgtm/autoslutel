# Webshop-assistent: wet en privacy

Onderzocht op 23 november 2026 door drie losse onderzoeksagenten (consumentenrecht, AVG/AI Act, ElevenLabs).
Kanttekening: eur-lex.europa.eu, wetten.overheid.nl en elevenlabs.io waren vanuit deze sessie niet bereikbaar.
De artikelnummers komen uit secundaire bronnen (ACM, Kamerstukken, advocatenkantoren) en kennis; de
ElevenLabs-feiten uit hun SDK en zoekresultaten. **Punten onder "jurist" moeten door een jurist of FG bevestigd
worden.** Dit document is geen juridisch advies.

## 1. Retourneren (Richtlijn 2011/83/EU, BW 6:230o–230s)

| Situatie | Wet | Code (`decideReturn`) |
|---|---|---|
| Ongebruikt, of uitgepakt en bekeken "zoals in een winkel" | 14 dagen bedenktijd vanaf ontvangst (laatste artikel), volledig geld terug incl. standaard verzendkosten, binnen 14 dagen (mag wachten op artikel of verzendbewijs) | `retour` |
| Verder gebruikt dan nodig om te bekijken (ook elders gefreesd/ingeleerd) | **Recht blijft**; klant betaalt de waardevermindering (art. 14(2), BW 6:230s). "Geopend = geen retour" is nietig en misleidend | `waardevermindering` |
| Door **ons** gefreesd, ingeleerd of overgezet op bestelling | Maatwerk (art. 16(c), BW 6:230p): in principe geen bedenktijd, mits vóór de koop gemeld | `maatwerk` → medewerker |
| Defect | Wettelijke garantie (BW 7:17–7:23; 1 jaar vermoeden), los van bedenktijd; onze 12 maanden is een extra garantie | `garantie` → medewerker; nooit geblokkeerd door een eerder retourverzoek |
| Na de termijn | Geen recht (tenzij de herroepingsinformatie ontbrak: +12 maanden) | `beoordeling` → medewerker |
| Zakelijke koper | Geen wettelijke bedenktijd | nog niet herkenbaar in de bestelling (open punt) |

- Een duidelijke herroeping in de chat **is geldig** (art. 11(1)). De agent registreert, de klant krijgt een
  bevestiging per e-mail met datum en tijd (`returnConfirmationMail`). De agent weigert nooit; alleen het kantoor
  beslist over uitzonderingen.
- `agent_knowledge` `returns.policy` en `rule.shop_vs_onsite` zijn bijgewerkt in migratie
  `0143_returns_policy_eu_law.sql` (de oude tekst "opened items cannot be returned" was onjuist).

**Ontbreekt nog in de webshop (boeterisico):** sinds **19 juni 2026** verplicht art. 11a CRD (Richtlijn
2023/2673, BW 6:230oa) een **herroepingsknop** op de website ("hier herroepen" of vergelijkbaar), met een
bevestigingsstap en een ontvangstbevestiging op een duurzame drager. De chat vervangt die knop niet.

**Ook nalopen:** de checkout moet vóór de koop melden dat frezen/inleren/overzetten het product maatwerk maakt en
de bedenktijd laat vervallen (art. 6(1)(k)); anders vervalt de uitzondering mogelijk. De garantietekst "12
maanden, excl. batterij…" moet zeggen dat de wettelijke rechten blijven (BW 7:6a).

**Jurist:** valt alleen inleren (zonder frezen) van een herprogrammeerbare sleutel onder 16(c); mag de
waardevermindering verrekend worden en hoeveel bij een elders gefreesde baard; voldoet chat + knop aan art. 11a.

## 2. AVG (GDPR)

**Rollen:** Autosleutel24 is verwerkingsverantwoordelijke; ElevenLabs (met LLM-subverwerker), Twilio, Supabase,
Vercel, Upstash, Resend en Anthropic zijn verwerkers. **Telegram heeft geen verwerkersovereenkomst**: daarom krijgt
Telegram van de webshop-agent alleen een label en het onderwerp, geen naam, e-mail, telefoon of klanttekst
(`tellOffice`), en geen transcripten (webhook).

**Grondslagen:** bestelling/retour/overdracht = uitvoering overeenkomst (6(1)(b)), herroeping ook wettelijke plicht
(6(1)(c)); bewaren van gesprekken voor klachten, kwaliteit en misbruik = gerechtvaardigd belang (6(1)(f), met
belangenafweging en recht van bezwaar).

### In de ElevenLabs-console (nu, zonder Enterprise)

1. Profiel → Terms and privacy → Data use → **"Improve the models for everyone" UIT**.
2. Elke agent → Advanced → Data retention: **30 dagen**, "apply to existing conversations" aan (standaard is 2 jaar).
3. Audio opslaan **uit** voor de webchat.
4. Kies het LLM bewust en schrijf op welke (en waar die draait).
5. Analysis → Data collection: geen velden met persoonsgegevens (geen e-mail, telefoon, naam).
6. Alleen met Enterprise: EU data residency, Zero Retention Mode, PII-redactie.

### In de eigen systemen

| # | Wat | Status |
|---|---|---|
| 1 | Eerste bericht zegt expliciet **AI** (AI Act art. 50, geldt sinds 2 aug 2026) | tekst hieronder; in de console zetten |
| 2 | Privacyverklaring: alinea over de AI-assistent en ElevenLabs; verwerkerslijst aanvullen (ElevenLabs, Twilio, Anthropic, Upstash, Telegram, OpenAI) | tekst hieronder; in de shop plaatsen |
| 3 | Melding bij de Chat-knop | tekst hieronder; in `ChatButton` |
| 4 | Telegram zonder klantgegevens | **gedaan** voor de webshop-agent; de telefoniste stuurt nog volledige transcripten |
| 5 | Bewaartermijn `agent_conversations` (webchat 6 mnd, telefoon 12 mnd) met automatisch opschonen | open: cron + migratie |
| 6 | Gesprekken van andere merken (`extern`) niet opslaan, of een overeenkomst | open: beslissing eigenaar |
| 7 | Verwerkingsregister (art. 30), belangenafweging, korte DPIA | open: tekst hieronder als basis |
| 8 | Inzage/verwijderen: zoeken in transcripten op e-mail/bestelnummer, ook bij ElevenLabs verwijderen | open |
| 9 | Widget-script zelf hosten in plaats van unpkg | open (shop) |
| 10 | Minimale tool-output, eigendomscheck, limieten, RLS, ondertekende webhook, AI-modus uit voor agent-threads | **gedaan** |

**Jurist/FG:** is een DPIA verplicht; rol onder de AI Act (aanbieder of gebruiksverantwoordelijke); Telegram als
ontvanger; relatie met de `extern`-merken.

### Teksten

**Eerste bericht webchat:**
"Hallo! Ik ben de AI-assistent van Autosleutel24 – u chat met een computerprogramma, niet met een medewerker. Ik
help met bestellingen, retouren en producten. Wilt u liever een medewerker? Zeg het gerust."

**Eerste bericht telefoon:**
"Autosleutel24, u spreekt met een AI-assistent; dit gesprek wordt vastgelegd. Wat is er met de sleutel?"

**Bij de Chat-knop:**
"U chat met een AI-assistent. Uw berichten worden verwerkt door ElevenLabs en hun AI-taalmodel en 6 maanden
bewaard. Zie ons privacybeleid."

**Privacyverklaring (nieuwe alinea):**
"Chat- en telefoonassistent (AI). Op onze webshop en aan de telefoon kunt u chatten of spreken met een
AI-assistent: een computerprogramma, geen medewerker. De assistent zoekt uw bestelling op met het bestelnummer en
uw e-mailadres of postcode, registreert retourverzoeken en geeft vragen door aan een collega. Wij verwerken
daarvoor wat u typt of zegt, uw bestelnummer, e-mailadres of postcode, en als u wilt dat wij contact opnemen uw
naam en telefoonnummer; bij een telefoongesprek ook uw nummer. Grondslag: uitvoering van de overeenkomst; het
bewaren van gesprekken voor klachtafhandeling, kwaliteit en misbruikpreventie doen wij op basis van ons
gerechtvaardigd belang, waartegen u bezwaar kunt maken. De assistent draait bij ElevenLabs (verwerker), die een
AI-taalmodel van een externe aanbieder gebruikt; zij gebruiken uw gegevens niet om eigen modellen te trainen.
Gegevens kunnen in de VS worden verwerkt op basis van het EU-VS-gegevensprivacykader of
standaardcontractbepalingen. Telefoongesprekken lopen via Twilio. De assistent neemt geen besluiten: over
retouren en terugbetalingen beslist altijd een medewerker. Gesprekken worden bij ElevenLabs na 30 dagen
verwijderd en bij ons na 6 maanden (telefoon: 12 maanden). Deel geen bankgegevens of wachtwoorden in de chat.
Inzage of verwijdering van een gesprek: mail ons met de datum en uw bestelnummer."

De termijnen in deze tekst kloppen pas als stap 2 in de console en punt 5 hierboven gedaan zijn.

**Verwerkingsregister (art. 30):**
"Klantenservice via AI-assistent (webchat en telefoon). Doel: bestelstatus, retouren, overdracht aan
medewerker, klachtafhandeling, kwaliteit en misbruikpreventie. Betrokkenen: (potentiële) klanten. Gegevens:
chat- en gesprekstekst, bestelnummer, e-mail, postcode, naam, telefoon, gespreksmetadata. Grondslag: art.
6(1)(b), (c) retouren, (f) bewaren. Ontvangers: ElevenLabs en LLM-subverwerker, Twilio, Supabase, Vercel,
Upstash, Resend, Anthropic (inbox), Telegram (alleen meldingen zonder klantgegevens). Doorgifte: VS via DPF/SCC.
Bewaartermijn: ElevenLabs 30 dagen; eigen database 6 maanden (chat) en 12 maanden (telefoon). Beveiliging: RLS,
ondertekende webhooks, tokens, rate limits, minimale tool-output."

## 3. Boetes, ter oriëntatie

AVG: tot € 20 mln of 4 % van de omzet (art. 83). AI Act art. 50: tot € 15 mln of 3 %; voor mkb geldt het lagere
bedrag (art. 99). Consumentenrecht: de ACM kan boetes opleggen voor misleidende retourvoorwaarden en een
ontbrekende herroepingsknop.
