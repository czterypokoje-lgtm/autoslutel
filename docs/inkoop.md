# Inkoop: een order afsluiten (rest komt niet)

## Wanneer gebruik je dit?

Een inkooporder staat op **Besteld**, maar de leverancier stuurt niet alles:

- een deel is geleverd en de rest komt niet meer (uitverkocht, uit het assortiment,
  te lang levertijd), of
- er is nog niets geleverd en de leverancier heeft de hele order geannuleerd.

Zo'n order kon vroeger nooit klaar. De rest bleef "onderweg" staan, het bestelvoorstel
rekende erop en de order bleef in elke lijst met open orders staan.

Een **concept** sluit je niet af: dat annuleer je (met **Annuleer**, daarna bevestigen).
Een order die helemaal binnen is, krijgt vanzelf **Ontvangen** en hoeft ook niet afgesloten te worden.

## Hoe

Inkoop → bij de bestelde order **Sluit order af (rest komt niet)**. Je ziet per regel
besteld / ontvangen / komt niet. Vul een **reden** in (verplicht) en bevestig met
**Order afsluiten**. Alleen kantoor kan dit.

## Wat het doet

- De order krijgt de status **Afgesloten**, met datum en reden zichtbaar. Hij staat
  daarna bij **Afgehandeld**.
- Wat ontvangen is, blijft op voorraad. Besteld en ontvangen per regel blijven zoals
  ze waren: de geschiedenis klopt.
- De rest telt nergens meer als onderweg: niet in de voorraadpositie, het
  bestelvoorstel, de webshopvoorraad, "In bestelling" bij de leverancier of de lijst
  met open inkoopregels.
- Op een afgesloten order kan niets meer ontvangen worden. Komt er toch nog iets,
  maak dan een nieuwe inkooporder.
- De inkoopfactuur kun je nog gewoon boeken op de afgesloten order.
- Afsluiten kan niet ongedaan gemaakt worden.

Techniek: migratie `0139_kfc_po_close.sql`, functie `kfc_close_purchase_order`.
