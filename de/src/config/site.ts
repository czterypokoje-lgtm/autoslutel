// ============================================================
// AUTOSCHLÜSSEL24 — Standortdaten der deutschen Seite
//
// Eigene Datei, kein Import aus ../../src. Wer hier etwas ändert, ändert
// nichts an autosleutel24.nl.
// ============================================================

/**
 * Steht für einen Wert, den nur das Büro liefern kann — eine Telefonnummer,
 * eine USt-IdNr., einen Preis.
 *
 * Kein geratener Wert und kein leerer String: beide gehen online. Ein Build,
 * der einen davon einem Kunden zeigen würde, startet stattdessen nicht.
 */
export const TBD = '__TBD__';

export const SITE = {
  name: 'Autoschlüssel24',
  tagline: 'Mobiler Autoschlüssel-Service — alle Marken',
  domain: 'https://www.autoschluessel24.de',
  locale: 'de-DE',
  htmlLang: 'de',
  ogLocale: 'de_DE',

  /*
   * Eine deutsche Nummer, keine niederländische.
   *
   * Eine +31-Nummer auf einer deutschen Seite kostet Vertrauen in einer
   * Branche, in der deutsche Kunden ohnehin genau hinsehen, und ein
   * Google-Unternehmensprofil lässt sich damit nicht bestätigen.
   */
  phone: TBD,
  phoneTel: TBD,
  whatsapp: TBD,
  email: TBD,

  /* Pflicht nach § 5 DDG für das Impressum. */
  legal: {
    company: TBD,
    /* GmbH, UG, e.K., Einzelunternehmen — bestimmt, was im Impressum stehen muss. */
    legalForm: TBD,
    street: TBD,
    postcode: TBD,
    city: TBD,
    /* Handelsregister und Registernummer, falls eingetragen. */
    register: TBD,
    vatId: TBD,
    /* Die nach § 18 Abs. 2 MStV verantwortliche Person. */
    responsible: TBD,
  },

  /*
   * Preise brutto, inkl. 19 % MwSt — nicht optional, sondern
   * Preisangabenverordnung. "zzgl. MwSt." vor einem Verbraucher ist in dieser
   * Branche der Lehrbuchfall einer Abmahnung.
   *
   * Diese Zahlen sollten am Ende nicht hier stehen: der Partner nennt, was ihm
   * der Auftrag wert ist, wir legen unsere Marge darauf, und daraus ergibt sich
   * der Ab-Preis je Stadt. Er bewegt sich also, wenn ein Partner dazukommt oder
   * seine Sätze ändert. Bis die Marge und die Partnersätze da sind: TBD.
   */
  prices: {
    nachmachen: TBD,
    funkschluessel: TBD,
    keylessGo: TBD,
    alleSchluesselVerloren: TBD,
    oeffnung: TBD,
    zuendschloss: TBD,
    note: 'Alle Preise inkl. 19 % MwSt.',
  },

  hours: 'Montag bis Sonntag, 00:00–24:00',
  hoursShort: '24/7 erreichbar',

  /*
   * Bewusst keine Bewertungszahl.
   *
   * Die niederländischen Bewertungen gehören der niederländischen Seite. Sie
   * hier zu übernehmen wäre falsch ausgezeichnet und riskiert eine manuelle
   * Maßnahme für die ganze Domain. Diese Seite fängt bei null an.
   */
  reviews: null as { rating: string; count: string } | null,

  /* Was ein deutscher Kunde erwartet. Kein iDEAL — das gibt es hier nicht. */
  paymentAccepted: ['Bargeld', 'EC-Karte', 'Kreditkarte', 'PayPal', 'Überweisung'],
} as const;

type Leaf = string | number | boolean | null | undefined | readonly unknown[];

/** Jedes Feld, das noch auf TBD steht, als Pfad. */
export function missingFields(value: unknown = SITE, path = ''): string[] {
  if (value === TBD) return [path];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, Leaf>).flatMap(([k, v]) =>
      missingFields(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

/**
 * Vorschaumodus: bauen, obwohl noch Platzhalter fehlen.
 *
 * Nur über eine ausdrücklich gesetzte Umgebungsvariable, damit niemand
 * versehentlich hineinrutscht. Gedacht für die Vorschau beim Entwickeln, nicht
 * für ein Deployment: in diesem Modus steht auf jeder Seite ein Hinweisband,
 * und jede Seite wird auf noindex gesetzt — eine Vorschau darf nicht in den
 * Index geraten, auch nicht aus Versehen.
 */
export const PREVIEW_WITH_PLACEHOLDERS =
  process.env.AUTOSCHLUESSEL_ALLOW_PLACEHOLDERS === '1';

/**
 * Bricht einen Build ab, der Platzhalter ausliefern würde.
 *
 * Wird aus dem Root-Layout aufgerufen, also auf jedem Weg, der eine Seite
 * rendert. Lieber hier scheitern, wo es nichts kostet, als mit einem geratenen
 * Preis oder einer fremden USt-IdNr. online gehen.
 *
 * Der Vorschaumodus hebt das auf — aber sichtbar, nicht still: das Band im
 * Layout und das noindex sind daran gekoppelt, sodass ein Build, der
 * Platzhalter enthält, nicht wie ein fertiger aussehen kann.
 */
export function assertSiteReady(): void {
  const missing = missingFields();
  if (missing.length === 0) return;

  const message =
    `autoschluessel24.de ist noch nicht vollständig konfiguriert. Es fehlen:\n` +
    missing.map((f) => `  - ${f}`).join('\n') +
    `\n\nSiehe de/README.md und EXPANSION-BE-DE-PLAN.md Abschnitt 10.`;

  if (PREVIEW_WITH_PLACEHOLDERS) {
    console.warn(`\n[Vorschau mit Platzhaltern — nicht veröffentlichen]\n${message}\n`);
    return;
  }
  throw new Error(message);
}

/** Ist diese Seite fertig konfiguriert? Steuert noindex und das Hinweisband. */
export const siteIsReady = (): boolean => missingFields().length === 0;

/** Ist dieser Wert echt, oder noch ein Platzhalter? */
export const isReady = (value: string): boolean => value !== TBD;
