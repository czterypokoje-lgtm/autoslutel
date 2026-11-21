# De kassa: zo gaat een dag

De kassa staat in het beheer onder **Kassa** (`/admin/kassa`). Alles wat je daar doet, wordt meteen goed geboekt: de bon, de voorraad en het geld, in één keer. Gaat er halverwege iets mis (internet weg, dubbel geklikt), dan wordt niets dubbel geboekt. Druk gewoon nog een keer op de knop.

## 1. Openen

- Tel het wisselgeld in de la.
- Vul het **startbedrag** in (bijvoorbeeld `100,00`) en druk op **Kassa openen**.
- Er kan maar één kassa tegelijk open staan.

## 2. Verkopen

- Scan de barcode of zoek het artikel op naam. Met de camera-knop kun je ook een foto van het etiket maken.
- Pas het aantal aan met − en +.
- Kies de betaalwijze: **Contant**, **PIN** of **Overig**. Bij contant laat de kassa het wisselgeld zien.
- Druk op **Afrekenen** en print de bon.
- De voorraad gaat van een **schap** af. Artikelen die alleen in een bus of in quarantaine liggen, kun je niet aan de kassa verkopen: zet ze eerst op een schap.
- **Prijs en korting**: alleen kantoor en de eigenaar kunnen de prijs veranderen of korting geven. Voor het magazijn geldt altijd de prijs uit de artikellijst. Heeft een artikel nog geen prijs, dan moet kantoor die eerst invullen.

## 3. Retour

Alleen **kantoor of de eigenaar** mag een retour boeken.

- Druk op **Retour** en vul het bonnummer in (bijvoorbeeld `I-00042`, of alleen `42`). Een bon uit de lijst "Laatste bonnen" kun je ook direct openen met het pijltje.
- Kies per artikel hoeveel er terug komt. Er kan nooit meer terug dan er op de bon stond (ook niet als je het in twee keer doet).
- Kies hoe het geld terug gaat: **contant** of **PIN**. Contant kan alleen als er genoeg geld in de la zit.
- Kies waar het artikel terug komt. Kapot? Kies dan de **quarantaine**-locatie, dan wordt het niet opnieuw verkocht.
- Druk op **Retour boeken**. Je krijgt een retourbon met een min-bedrag, gekoppeld aan de oorspronkelijke bon.
- Een retour kan alleen als de kassa open is.

## 4. Kas in / kas uit

Voor geld dat zonder verkoop in of uit de la gaat, bijvoorbeeld wisselgeld halen of geld naar de bank brengen.

- Druk op **Kas in/uit**, kies **Kas in** of **Kas uit**, vul het bedrag en een **reden** in (verplicht).
- **Kas in** mag iedereen die de kassa gebruikt. **Kas uit** mag alleen kantoor of de eigenaar.
- Je kunt niet meer uit de la halen dan er volgens de kassa in hoort te zitten.

## 5. Sluiten (Z-rapport)

- Druk op **Kassa sluiten (Z)**.
- Tel het **contante geld** in de la, inclusief het startbedrag, en vul het in.
- Neem het **dagtotaal van de pinautomaat** over (0 als er niet gepind is).
- De kassa rekent uit wat er had moeten zijn en laat het verschil zien:
  - contant verwacht = startbedrag + contante verkopen − contant terugbetaald + kas in − kas uit
  - PIN verwacht = PIN-verkopen − PIN terugbetaald
- Druk op **Sluiten en Z-rapport maken**. Het Z-rapport krijgt een volgnummer (Z 1, Z 2, Z 3, …, zonder gaten) en wordt bewaard.
- Print het Z-rapport voor de administratie.

## 6. Oude Z-rapporten

- Onder **Kassa → Oude Z-rapporten** (`/admin/kassa/sessies`) staan alle gesloten kassadagen met datum, kassier, Z-nummer en de verschillen.
- Open er een om het rapport precies zo te zien als bij het sluiten, en print het opnieuw.
- Kassadagen van vóór deze versie hebben geen Z-nummer en alleen de contante telling.

## Wie mag wat

| Wat | Eigenaar | Kantoor | Magazijn |
|---|---|---|---|
| Kassa openen, verkopen, sluiten | ja | ja | ja |
| Kas in | ja | ja | ja |
| Prijs of korting aanpassen | ja | ja | nee |
| Retour boeken | ja | ja | nee |
| Kas uit | ja | ja | nee |
| Oude Z-rapporten bekijken | ja | ja | ja |
