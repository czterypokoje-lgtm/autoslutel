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

`src/config/site.ts` enthält Platzhalter (`TBD`) für alles, was nur das Büro
liefern kann — Telefonnummer, Impressumsdaten, USt-IdNr., Preise. Der Build
bricht ab, solange einer davon übrig ist, und nennt die fehlenden Felder beim
Namen. Das ist Absicht: ein geratener Preis oder eine fremde USt-IdNr. auf
einer deutschen Seite ist eine Abmahnung, kein vorläufiger Wert.
