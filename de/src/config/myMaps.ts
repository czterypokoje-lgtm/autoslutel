/*
 * Die Google-My-Maps-Karte des Einsatzgebiets — für diese Domain noch keine.
 *
 * Die niederländische Seite hat eine ("Werkgebied Autosleutel24"): 62 Städte in
 * Utrecht, Noord-Holland, Zuid-Holland, Gelderland und Flevoland, nach Provinz
 * gefärbt. Diese Karten-ID ist beim Kopieren mitgekommen, und das wäre der
 * teuerste der harmlos aussehenden Fehler gewesen: ein deutscher Besucher
 * tippt auf "Karte ansehen" und bekommt eine Karte der Niederlande — und
 * dieselbe ID stand als `hasMap` in den strukturierten Daten, hätte also auch
 * Google gemeldet, das Einsatzgebiet dieses Unternehmens liege in den
 * Niederlanden.
 *
 * null heißt: die interaktive Einbettung wird nicht angeboten. Die Seite zeigt
 * stattdessen die statische Karte aus /api/service-map, die aus config/cities.ts
 * gezeichnet wird und damit immer das echte Gebiet trifft.
 *
 * Für eine eigene Karte: in Google My Maps eine Karte mit den deutschen
 * Partnerstädten anlegen, als "Jeder mit dem Link kann ansehen" freigeben und
 * die ID hier eintragen. Dann erscheint die Einbettung von selbst, und
 * site.config.ts serviceAreaMapUrl kann auf MY_MAPS_VIEWER_URL zeigen.
 */
export const MY_MAPS_ID: string | null = null;

export const MY_MAPS_EMBED_URL: string | null = MY_MAPS_ID
  ? `https://www.google.com/maps/d/embed?mid=${MY_MAPS_ID}&ehbc=2E312F`
  : null;

export const MY_MAPS_VIEWER_URL: string | null = MY_MAPS_ID
  ? `https://www.google.com/maps/d/viewer?mid=${MY_MAPS_ID}`
  : null;
