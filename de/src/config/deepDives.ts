/*
 * Fachartikel je Marke — in dieser App leer.
 *
 * Auf der niederländischen Seite stehen hier drei Artikel (BMW BDC2, VAG SFD,
 * Ghost-Immobiliser), die die eigentliche technische Autorität der Domain
 * tragen. Sie sind auf Niederländisch geschrieben und liegen unter /blog, und
 * diese App hat weder die Übersetzungen noch die Route (siehe
 * config/services.ts). Ein Verweis von hier wäre ein Link auf eine 404.
 *
 * Die Struktur bleibt stehen, weil sie das Richtige tut, sobald es deutsche
 * Artikel gibt: ein Artikel wird nur dort verlinkt, wo er die Marke wirklich
 * beschreibt. BDC2 ist BMWs Bodycontroller, SFD die Online-Freigabe im
 * VW-Konzern. Eine Zuordnung, die jede Marke auf denselben Artikel zeigen
 * ließe, wäre die Linkfarm, die das hier verhindern soll.
 *
 * Deutsche Artikel also hier eintragen, nicht die niederländischen übersetzen
 * lassen — FBS4 und FEM/BDC heißen in deutschen Werkstattunterlagen so, und
 * danach wird auch gesucht.
 */
export const DEEP_DIVE: Record<string, { slug: string; title: string; blurb: string }> = {};

/**
 * Marken, die regelmäßig per Relay-Angriff auf das Keyless-System gestohlen
 * werden.
 *
 * Bleibt gefüllt, weil es eine Tatsache über die Fahrzeuge ist und nicht über
 * unsere Artikel: die Liste steuert, wo der Hinweis auf Keyless-Diebstahl
 * überhaupt sinnvoll ist. Verlinkt wird er erst, wenn GHOST_ARTICLE einen
 * deutschen Artikel hat.
 */
export const RELAY_THEFT_MAKES = new Set([
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Land Rover',
  'Lexus',
  'Toyota',
  'Volkswagen',
]);

/** Der Artikel zum Relay-Diebstahl. null, solange es keinen deutschen gibt. */
export const GHOST_ARTICLE: { slug: string; title: string } | null = null;
