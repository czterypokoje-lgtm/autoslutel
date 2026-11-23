# Offertes: gewonnen en verloren prijzen

**Vervallen op 23 nov 2026.** Het ontwerp is gebouwd en dezelfde dag weer verwijderd: een
andere sessie had al `whatsapp_quotes` (migratie `0106_whatsapp_quotes.sql`) met het scherm
`/admin/whatsapp-analyse`, de views `whatsapp_price_list`, `whatsapp_funnel` en
`whatsapp_loss_reasons`, en een lokale import van de WhatsApp-geschiedenis. Dat is rijker dan
wat hier stond (btw-soort, bezwaren, concurrentprijs, reactietijd, koppeling aan de klus).
Twee tabellen voor hetzelfde feit is precies de drift die we willen vermijden.

**Özet (Türkçe):** Teklif takibi için ikinci bir tablo yazmıştık; aynı gün sildik, çünkü
`whatsapp_quotes` ve `/admin/whatsapp-analyse` zaten var ve daha zengin. Tek sistem kalsın.

## Wat `whatsapp_quotes` nog niet dekt (open, klein)

1. **Doorlopende aanvoer vanaf de server.** De import is lokaal (Mac). Een `POST /api/ops/...`
   voor de wacli-server, met dezelfde koppelregel: alleen exact E.164 op `leads.phone_e164`,
   anders niet koppelen.
2. **Telefonist-offertes.** `/api/agent/quote` logt alleen weigeringen; elke gegeven prijs zou
   ook een rij moeten zijn (bron `agent`), zodat telefoon en WhatsApp in één rapport staan.
3. **Uitkomst door kantoor.** Kantoor verandert vandaag alleen de beoordeling (juist/onjuist);
   `outcome`/`lost_reason` komen uit de extractie. Een kleine actie om de uitkomst te zetten.
4. **Kwaliteitspoort vóór automatisch draaien:** 50 chats met de hand gelabeld, ≥ 95 % juiste
   bedragen, 0 verkeerde koppelingen.

Als de eigenaar daarvoor kiest, bouwen we die vier **op `whatsapp_quotes`**, niet ernaast.
