# Offertes: gewonnen en verloren prijzen, en het leadrapport

Status: **ontwerp, 23 nov 2026**. Niets gebouwd. Beslissing van de eigenaar nodig op de
vier vragen onderaan.

**Özet (Türkçe):** Bugün CRM her teklifi tek bir sayı olarak tutuyor (`leads.quoted_price`),
sonucunu ve sebebini tutmuyor; raporlar marka ve bölgeye göre ciroyu gösteriyor ama "hangi
fiyatta kaybediyoruz" sorusunu cevaplayamıyor. Öneri: her teklif bir satır olur (araç, senaryo,
fiyat, kanal, sonuç, kayıp sebebi), wacli sunucusu sohbetlerden çıkardığını **öneri** olarak
gönderir, bir insan onaylar, rapor onaylı satırlardan çıkar. Yanlış lead'e bağlanma riskine
karşı tek kural: telefon numarası E.164 tam eşleşmezse bağlanmaz, "bağlı değil" kalır.

## 1. Wat er al is (niet opnieuw bouwen)

| Bestaat | Waar | Dekt |
|---|---|---|
| Server leest WhatsApp, stuurt per **advertentie**-chat een beoordeling (code, auto, prijsnotitie, nummer) | `POST /api/ops/ad-reviews`, tabel `whatsapp_ad_reviews`, scherm `/admin/whatsapp-advertenties` | Alleen chats met een `ref`-code uit een advertentie. De eigenaar kiest `gedaan`/`geen_job` + bedrag. Gaat als conversie naar Google. |
| Eerste WhatsApp-bericht maakt een lead, één per nummer, chat wordt nooit opgeslagen | `POST /api/ops/whatsapp-lead`, `ensureWhatsappLead`, `toE164NL` | Lead bestaat; koppeling op E.164 |
| Prijsvoorstel voor één lead uit Tarieven | `GET /api/ops/lead-quote/[id]` | Alleen lezen |
| Weekcijfers, vandaag, wie wacht op ons | `GET /api/ops/weekly`, `today`, `followups` | Aantallen, geen prijsuitkomst |
| Rapporten per merk, bron, dienst, regio, reactietijd | `crm_report_*` views, `/admin/rapport`, `/admin/rapportage` | Omzet en annuleringen van **klussen**; niets over offertes die geen klus werden |
| Eén prijsveld per lead | `leads.quoted_price`, `sale_price`, `status sold/rejected` | Geen historie, geen reden, geen kanaal |

## 2. Wat ontbreekt

1. **Een offerte als feit.** Nu: één getal op de lead, overschreven bij een tweede prijs.
2. **De uitkomst en de reden.** `rejected` zegt niet of het te duur was, de concurrent sneller, of
   dat niemand meer reageerde. Dat is precies het rapport dat je wilt.
3. **Organische WhatsApp-chats.** De beoordeling loopt alleen voor advertentie-chats met code.
4. **Historie.** De oude chats op de wacli-server zijn nooit uitgelezen.

## 3. Ontwerp, zo klein mogelijk

### 3.1 Eén tabel: `lead_quotes`

```sql
create table public.lead_quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,   -- null = niet gekoppeld
  phone_e text,                      -- E.164, waarop gekoppeld werd
  channel text not null check (channel in ('whatsapp','phone','form','agent','crm')),
  make text, model text, year int, scenario public.job_scenario,
  quoted_price numeric(10,2) not null check (quoted_price > 0),
  quoted_at timestamptz not null,
  outcome text not null default 'open' check (outcome in ('open','won','lost','no_reply')),
  outcome_at timestamptz,
  lost_reason text check (lost_reason in ('te_duur','concurrent','geen_reactie','zelf_opgelost','niet_mogelijk','anders')),
  won_price numeric(10,2),
  status text not null default 'proposed' check (status in ('proposed','confirmed','rejected')),
  source text not null check (source in ('server','agent','crm')),
  evidence_ref text,                 -- chat-code of conversation-id, nooit de chat zelf
  evidence_quote text,               -- de ene zin met het bedrag, max 160 tekens, geredigeerd
  confidence numeric(3,2),
  reviewed_by uuid references auth.users (id), reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, evidence_ref, quoted_price)   -- idempotent: dezelfde chat twee keer sturen voegt niets toe
);
-- RLS: owner/kantoor lezen en schrijven; grant select/insert/update to authenticated (les van 0003 en 0106).
```

Regels die in **code** staan, niet in een prompt:

- **Koppelen alleen op exact E.164.** `toE164NL` → `leads.phone_e`. Eén lead: koppelen. Nul leads:
  `lead_id null`, en pas bij bevestiging een lead maken (zoals `ensureWhatsappLead`). Twee of meer
  leads (zelfde nummer, duplicaten): **niet koppelen**, flag `ambiguous`; een mens kiest. Nooit op
  naam, nooit op laatste 4 cijfers, nooit op "lijkt op".
- **Een bedrag is alleen een bedrag als het in de tekst staat** (`€`, `euro`, of een getal direct
  naast "prijs/kost/voor"). De server stuurt de zin mee (`evidence_quote`); zonder zin wordt de rij
  geweigerd (400).
- **`proposed` telt nergens mee.** Rapporten lezen alleen `confirmed`. Dezelfde regel als
  `agent_knowledge`.
- **Uitkomst is nooit een gok.** `won` alleen met een `jobs`-rij (`afgerond`, zelfde lead) of een
  menselijke bevestiging. `lost` alleen met een reden. Anders `open`; na 14 dagen zonder antwoord
  zet een cron het op `no_reply` (dat is de enige automatische uitkomst, en hij is omkeerbaar).

### 3.2 Twee endpoints

- `POST /api/ops/quotes` (OPS-token): max 200 rijen, elk `{phone, at, channel, make, model, year,
  scenario, price, quote, ref, confidence, outcome?, lost_reason?}`. Schrijft `proposed`. Antwoord:
  per rij `linked | unlinked | ambiguous | duplicate | rejected(reason)`. Alles gelogd via `logOps`.
- `POST /api/admin/quotes/[id]` (sessie, office): `confirm` (met evt. correcties), `reject`,
  `outcome`. Eén scherm `/admin/offertes`, gebouwd als `/admin/whatsapp-advertenties`: rij per
  voorstel, auto, bedrag, de ene zin, knoppen. Tien seconden per rij.

De agent-telefoniste schrijft ook: `/api/agent/quote` logt vandaag alleen weigeringen; één regel
erbij logt elke gegeven prijs als `source='agent', status='confirmed'` (de prijs komt uit
Tarieven, die is al waar).

### 3.3 Het rapport: `/admin/rapportage` → sectie **Offertes**

Eén view `crm_report_quotes` over `status='confirmed'`:

| Dimensie | Kolommen |
|---|---|
| per merk × scenario | offertes, gewonnen, verloren, geen reactie, conversie %, mediaan gewonnen prijs, mediaan verloren prijs, Tarieven-prijs nu |
| per prijsband (€0–150, 150–250, 250–400, 400+) × scenario | zelfde kolommen → "boven welk bedrag verliezen we" |
| per kanaal (whatsapp / phone / form / agent) | conversie en reactietijd |
| per verliesreden | aantal, mediaan prijs, top-5 merken |

Plus één regel bovenaan: *"Laatste 30 dagen: X offertes, Y gewonnen (Z %), verloren op prijs: N,
mediaan verschil met Tarieven: € M."*

### 3.4 De server (wacli + assistent), buiten deze repo

Contract, geen implementatie hier:

1. **Historie, eenmalig.** Alle chats sinds dag één, per nummer gegroepeerd, in batches van 200
   door de extractor; post naar `/api/ops/quotes`. De eigenaar beoordeelt in `/admin/offertes`,
   nieuwste eerst.
2. **Doorlopend.** Elke nacht de chats van die dag. Zelfde pad.
3. **Extractor-regels** (gestructureerde uitvoer, JSON-schema, geen vrije tekst): alleen bedragen
   die letterlijk in de chat staan; `confidence` < 0,7 → niet sturen maar tellen; telefoon altijd
   het WhatsApp-id van de chat, nooit uit de tekst; geen namen, adressen of kentekens in
   `evidence_quote` (zelfde redactie als `ad-reviews`); één voorstel per (nummer, dag, bedrag).
4. **Kwaliteitspoort vóór automatisch draaien.** 50 chats met de hand gelabeld door de eigenaar
   (auto, bedrag, uitkomst). Extractor erop los; pas bij ≥ 95 % juiste bedragen en 0 verkeerde
   koppelingen gaat de nachtrun aan. Daaronder blijft het handwerk met voorstel.

## 4. Volgorde en omvang

| Stap | Wat | Omvang |
|---|---|---|
| 1 | Migratie `lead_quotes` + view + `/api/ops/quotes` + agent-quote logging | 1 dag |
| 2 | `/admin/offertes` beoordeelscherm + `/admin/rapportage` sectie | 1 dag |
| 3 | Server: extractor + 50-chat testset + eenmalige historie | 1–2 dagen, serverkant |
| 4 | Nachtrun aan, `no_reply`-cron, Telegram-melding "N voorstellen wachten" | halve dag |

Niet gebouwd, bewust: automatisch terugbellen of korting geven bij "te duur" (dat is een
beslissing, geen rapportregel); koppelen op naam; de chat zelf opslaan.

## 5. Vier vragen aan de eigenaar

1. Verliesredenen: zijn deze zes genoeg, of mis je er één? (`te_duur`, `concurrent`,
   `geen_reactie`, `zelf_opgelost`, `niet_mogelijk`, `anders`)
2. Prijsbanden: €0–150 / 150–250 / 250–400 / 400+ — kloppen die met hoe jij denkt?
3. Wie beoordeelt voorstellen: alleen jij, of ook kantoor?
4. Historie: alles sinds dag één, of de laatste 12 maanden?
