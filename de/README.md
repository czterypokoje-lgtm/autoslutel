# Autoschlüssel24 — die deutsche Seite

Eine eigenständige Next-App für `autoschluessel24.de`. Sie teilt **keine
Dateien** mit der niederländischen Seite in `../src`: eigene `package.json`,
eigene Konfiguration, eigene Komponenten, eigene Texte.

## Warum getrennt

Auf Wunsch des Auftraggebers. Die Alternative wäre ein Build pro Land aus einem
gemeinsamen Code gewesen (`SITE_ID`, siehe `../src/config/sites/`), und der
Unterschied ist bewusst zu benennen: getrennt kann ein Fehler auf der deutschen
Seite die niederländische nicht erreichen, dafür muss jede Korrektur und jede
Verbesserung zweimal gemacht werden, und die beiden Seiten laufen mit der Zeit
auseinander. Das ist der Preis, und er ist bezahlt.

Was **nicht** doppelt existiert: das CRM. Partner aus allen Ländern arbeiten in
einem System (`../src/app/admin`), und dort ist die Sprache pro Person
eingestellt, nicht pro Build.

## Entwicklung

```
cd de
npm install
npm run dev     # http://localhost:3001
npm run build
```

Läuft auf Port 3001, damit beide Seiten gleichzeitig lokal laufen können.

## Deployment

Ein eigenes Vercel-Projekt mit **Root Directory = `de`**. Domain:
`autoschluessel24.de`. Eine eigene Search-Console-Property.

## Was noch fehlt

`src/config/site.config.ts` enthält Platzhalter (`TBD`) für alles, was nur das
Büro liefern kann — Telefonnummer, Impressumsdaten, USt-IdNr., Preise. Der
Build bricht ab, solange einer davon übrig ist, und nennt die fehlenden Felder
beim Namen (`assertSiteReady()`, `missingFields()`). Das ist Absicht: ein
geratener Preis oder eine fremde USt-IdNr. auf einer deutschen Seite ist eine
Abmahnung, kein vorläufiger Wert.

Zum Ansehen ohne diese Daten:

```
AUTOSCHLUESSEL_ALLOW_PLACEHOLDERS=1 npm run build
```

Dann rendert die Seite mit sichtbaren Platzhaltern. **Nicht** so deployen.

### Checkliste vor dem Livegang

1. **Telefonnummer und WhatsApp** (`phone`, `phoneTel`, `whatsapp`, `email`).
   Eine deutsche Nummer; eine niederländische Vorwahl kostet hier Anrufe.

2. **Ein deutsches Logo** (`logo.header`, `logo.footer`, beide `null`). Die
   beiden Dateien, die mitkopiert wurden, tragen deutsche Dateinamen, aber auf
   den Pixeln steht "Autosleutel24.nl" — in der Navigation jeder Seite und im
   Schema-Feld, aus dem Google das Firmenlogo nimmt. Bis ein Logo da ist,
   steht dort der Schriftzug als Text.

3. **Impressum nach §5 DDG** (`legalForm`, `address`, `hrb`, `registerCourt`,
   `ustId`, `responsible` nach §18 Abs. 2 MStV). Ohne diese Felder gibt es
   keine Impressumsseite, und ohne Impressumsseite droht die Abmahnung.

4. **Preise brutto, inkl. 19 % MwSt** (`prices.*`). Die
   Preisangabenverordnung verlangt Endpreise gegenüber Verbrauchern. Entweder
   die Bruttopreise direkt, oder die Marge plus die Sätze der vier Partner —
   dann rechnet das Büro sie einmal aus und sie stehen fest.

5. **Formspree-Formular-ID** (`formspreeId`, steht auf `null`). Die Anfrage
   kommt über `/api/leads` in der eigenen Tabelle an — das funktioniert auch
   ohne. Was fehlt, ist die E-Mail-Benachrichtigung dazu: solange die ID
   `null` ist, wird dieser Schritt übersprungen. Die niederländische ID darf
   hier nicht stehen, sonst gehen die Benachrichtigungen zu deutschen
   Anfragen in ein niederländisches Postfach.

6. **Messung und Werbung**: eigene GTM-, GA4-, Google-Ads- und
   Clarity-Properties, eigener IndexNow-Key, eigene Search-Console-Property.

7. **Google Business Profile** (`social.google`) — die Bewertungs-Schaltfläche
   auf `/ueber-uns` braucht die Place-ID des deutschen Profils.

8. **Karte** (`src/config/myMaps.ts`, steht auf `null`) — eine eigene My-Maps-ID
   für das deutsche Einsatzgebiet. Erst dann erscheinen Karte und `hasMap`.

9. **Migration** `supabase/migrations/0073_technician_country_and_locale.sql`
   muss vor dem Deployment laufen.

10. **Juristische Prüfung** von AGB (vor allem der Widerrufsbelehrung: §312g
    BGB mit der Ausnahme nach §356 Abs. 4 BGB für den dringenden Einsatz),
    Datenschutzerklärung und den beiden offenen Fragen
    Schein­selbständigkeit (Deutsche Rentenversicherung) und
    Handwerksordnung Anlage A.

11. **Echte Suchvolumina** für `src/config/keywords.ts` (Keyword-Planner- oder
    Ahrefs-Export: Stadt + Begriff + Volumen). Bis dahin ist die Rangfolge
    dort eine begründete Einschätzung und als solche markiert.

### Zwei Fragen an das Büro

Das Foto und der Name **Berkan Acarol** stehen als Gründer auf der Startseite
und auf /ueber-uns. Wenn hinter dem deutschen Betrieb dieselbe Person steht,
bleibt das so; wenn nicht, gehört dort die Person hin, die auch unter §18
Abs. 2 MStV im Impressum verantwortlich ist.

Und mit den vier Partnern zu klären: welche Motorradmarken sie vor Ort
anlernen können, und ob die markenweisen Hinweise auf
/motorradschluessel-nachmachen der Praxis entsprechen.

### Bewusst nicht dabei

Blog, Kennisbank und die rund 600 Markenseiten (`/marken`) sind nicht
übersetzt. Deshalb ist `BrandCard` ein `<div>` und kein `<Link>`: es gibt die
Zielseiten nicht, und 35 toten Links pro Seite ist schlechter als keiner.
Dasselbe gilt für `BLOG_POSTS`, `DEEP_DIVE` und `GHOST_ARTICLE` — leer, nicht
niederländisch.

Eine Kennzeichenabfrage gibt es nicht und kann es nicht geben: das
Kraftfahrt-Bundesamt gibt keine Halter- oder Fahrzeugdaten an Dritte heraus.
Wo die niederländische Seite das Kennzeichen beim RDW auflöst, fragt die
deutsche nach Marke und Baujahr — zwei Felder statt einem Versprechen, das
niemand einhalten kann.
