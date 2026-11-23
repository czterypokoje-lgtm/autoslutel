# Review requests (WhatsApp)

**Türkçe özet (4 satır):** Bir işin tamamlanmasından 2–72 saat sonra müşteriye
WhatsApp üzerinden tek bir Google review talebi gönderilir. Mesaj Meta'nın
onayladığı bir şablon (`review_verzoek`, kategori UTILITY, dil `nl`) ile
gidiyor — aşağıdaki metni Meta Business Manager'da gönder. Dağıtım sırası:
şablon onaylansın → bir hafta `REVIEW_REQUESTS=dry` → `/admin/gesprekken` veya
cron yanıtını kontrol et → `REVIEW_REQUESTS=1`. Aynı müşteri 90 gün içinde
bir daha sorulmaz, saat 09:00–20:00 dışında hiç gönderilmez.

## Wat het doet

Een uurlijkse scan (`src/app/api/cron/review-requests/route.ts`, zoals
`openai-paid-jobs`) zoekt jobs met `status = 'afgerond'`, geen
`review_requested_at`, en `completed_at` 2–72 uur geleden. Voor elke klant die
nog niet in de laatste 90 dagen is gevraagd, stuurt hij **één** WhatsApp-bericht
via een goedgekeurd template. De scan is nodig omdat een job op meerdere
plekken wordt afgerond (verschillende schermen, de Telegram-bot): een enkele
hook zou de andere routes missen.

## De template

Business-initiated berichten buiten het 24-uurs servicevenster (zie
`withinServiceWindow` in `src/lib/inbox/whatsapp.ts`) mogen alleen met een
door Meta goedgekeurd template. Dien dit in bij Meta Business Manager:

- **Naam:** `review_verzoek`
- **Categorie:** UTILITY
- **Taal:** `nl`
- **Body** (geen variabelen — de review-link staat vast in de tekst, dat
  maakt goedkeuring eenvoudiger):

  ```
  Bedankt voor uw vertrouwen in Autosleutel24! Zou u ons willen helpen met
  een korte Google-review? Dat kan hier:
  https://search.google.com/local/writereview?placeid=ChIJdd4hrwug2EcRmSRUsedYDNk
  — Alvast bedankt! Wilt u geen berichten meer? Antwoord STOP.
  ```

## Env vars

- `REVIEW_REQUESTS` — `0`/onzet: telt alleen kandidaten, stuurt niets.
  `dry`: berekent alles, logt wie het bericht *zou* krijgen, stuurt niets.
  `1`: stuurt echt.
- `REVIEW_REQUESTS_DAILY_MAX` — hoeveel er per Amsterdamse kalenderdag écht
  verstuurd mogen worden, standaard 10. `0` zet het verzenden stil zonder de
  scan zelf uit te zetten (de cron-response blijft `sent_today_before` en
  `remaining_today` tonen).
- `WHATSAPP_REVIEW_TEMPLATE` — templatenaam bij Meta, standaard
  `review_verzoek`.

## Afmelden (STOP)

Een klant die op WhatsApp antwoordt met een expliciet afmeldwoord — `stop`,
`stoppen`, `afmelden`, `uitschrijven`, `unsubscribe`, `stop berichten` of
`geen berichten meer` (hoofdletterongevoelig, trailing leestekens genegeerd;
zie `isStopMessage` in `src/lib/reviewRequest.ts`) — wordt nooit meer
business-initiated benaderd, dus ook niet voor een volgende review-aanvraag.
`src/lib/inbox/handleInbound.ts` herkent dit vóór de AI-stap, zet het nummer
in `public.whatsapp_optouts` (migratie 0109) en schakelt `ai_mode` van het
gesprek uit. De cron hier laadt die tabel één keer per run en slaat elke job
van een afgemeld nummer over (`review_request_status = 'skipped'`,
`review_request_note = 'opt-out'`) — een tabel per telefoonnummer, omdat één
nummer meerdere jobs en leads kan hebben.

## Uitrol

1. Laat het template hierboven goedkeuren in Meta Business Manager.
2. Zet `REVIEW_REQUESTS=dry` en laat de cron een week draaien.
3. Controleer de cron-response (`would_send`, met gemaskeerde telefoonnummers)
   of `/admin/gesprekken` zodra er echt verstuurd wordt.
4. Zet `REVIEW_REQUESTS=1` met `REVIEW_REQUESTS_DAILY_MAX=10` (standaard).
   Verhoog dat aantal alleen zolang de WhatsApp Manager-kwaliteitsbeoordeling
   (quality rating) op groen blijft staan; zet hem op `0` om het verzenden
   meteen te pauzeren zonder de scan uit te zetten.

## Regels

- Eén bericht per klant per 90 dagen (over alle jobs van die klant heen).
- Alleen 2–72 uur na `completed_at`.
- Alleen tussen 09:00–20:00 Amsterdamse tijd.
- Hooguit `REVIEW_REQUESTS_DAILY_MAX` verzendingen per Amsterdamse
  kalenderdag, over alle runs van die dag heen.
- Een afgemeld nummer (zie "Afmelden" hierboven) wordt nooit meer benaderd.
- Een mislukte verzending wordt hooguit twee keer geprobeerd
  (`review_request_attempts`), daarna blijft de job op `failed` staan.

## Nog stil

Dit blijft stil totdat de WhatsApp Cloud API live staat. Het nummer draait
vandaag nog op de oude `wacli`-listener; `whatsappConfigured()` moet `true`
zijn (en `REVIEW_REQUESTS=1`) voordat er iets verstuurd wordt.
