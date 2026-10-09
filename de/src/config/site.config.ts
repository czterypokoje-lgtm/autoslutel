// ============================================================
// SITE CONFIG — Autoschlüssel24 (autoschluessel24.de)
//
// Eigene Datei dieser App. Kein Import aus ../../src, keine SITE_ID-Umschaltung:
// diese App IST Deutschland, also steht hier direkt, was gilt.
// ============================================================

/**
 * Steht für einen Wert, den nur das Büro liefern kann.
 *
 * Kein geratener Wert und kein leerer String — beide gehen online. Ein Build,
 * der einen davon einem Kunden zeigen würde, startet stattdessen nicht
 * (assertSiteReady, aufgerufen im Root-Layout).
 */
export const TBD = '__TBD__';

export const SITE_CONFIG = {
  name: 'Autoschlüssel24',
  fullName: 'Autoschlüssel24',
  tagline: 'Mobiler Autoschlüssel-Service — alle Marken',
  domain: 'https://www.autoschluessel24.de',

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

  address: {
    street: TBD,
    city: TBD,
    region: TBD,
    postal: TBD,
    country: 'DE',
  },
  /* Berlin als Mittelpunkt, weil dort der erste Partner steht. */
  geo: { lat: '52.5200', lng: '13.4050' },
  serviceArea: { lat: '52.5200', lng: '13.4050', radiusMeters: '50000' },
  serviceAreaString: 'Berlin, Hamburg, München und Frankfurt am Main',

  /*
   * Bruttopreise, inkl. 19 % MwSt — Preisangabenverordnung, nicht Geschmack.
   * "zzgl. MwSt." vor einem Verbraucher ist in dieser Branche der Lehrbuchfall
   * einer Abmahnung.
   *
   * Dass diese Zahlen hier stehen, ist eine Zwischenlösung: der Partner nennt,
   * was ihm der Auftrag wert ist, wir legen die Marge darauf, und daraus ergibt
   * sich der Ab-Preis je Stadt. Er bewegt sich also mit dem Netzwerk.
   */
  prices: {
    unlock: TBD,
    transponder: TBD,
    klapsleutel: TBD,
    remote: TBD,
    smartKey: TBD,
    allKeysLost: TBD,
    casing: TBD,
    ignition: TBD,
    exVatDisclaimer: 'inkl. MwSt.',
  },

  hours: 'Montag bis Sonntag 00:00–24:00',
  hoursShort: '24/7 erreichbar',
  responseTime: TBD,

  /** Handelsregister (HRB) — Impressum. */
  kvk: TBD,
  /** USt-IdNr. — Impressum und jede Rechnung. */
  btw: TBD,
  iban: TBD,
  /** Die nach § 18 Abs. 2 MStV verantwortliche Person. */
  responsible: TBD,
  /** Rechtsform, für das Impressum. */
  legalForm: TBD,

  /*
   * Fängt bei null an.
   *
   * Die niederländischen Bewertungen gehören der niederländischen Seite. Sie
   * hier zu übernehmen wäre falsch ausgezeichnet und riskiert eine manuelle
   * Maßnahme für die ganze Domain.
   */
  rating: '0',
  reviewCount: '0',

  social: {
    facebook: TBD,
    instagram: TBD,
    google: TBD,
    marktplaats: TBD,
  },

  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',

  // ── Land und Sprache ──────────────────────────────────────
  siteId: 'de',
  country: 'DE' as const,
  htmlLang: 'de',
  hreflang: 'de-DE',
  isXDefault: false,
  locale: 'de-DE',
  ogLocale: 'de_DE',
  geoRegion: 'DE',
  countryName: 'Deutschland',
  /** Fünf Stellen. Deutsche Postleitzahlen sind nicht niederländische. */
  postcodeDigits: 5 as const,
  vat: { rate: 19, pricesAreGross: true },
  /** USt-IdNr.: DE + 9 Ziffern. */
  vatNumberPattern: '^DE\\d{9}$',
  /* Kein iDEAL — das gibt es in Deutschland nicht. */
  paymentAccepted: ['Bargeld', 'EC-Karte', 'Kreditkarte', 'PayPal', 'Überweisung'],
  availableLanguage: ['de', 'nl'],
  /* Die niederländische My-Maps-Karte zeigt ein niederländisches Gebiet. */
  serviceAreaMapUrl: null as string | null,
  schemaDescription:
    'Mobiler Autoschlüssel-Service für alle Marken und Modelle. Autoschlüssel nachmachen, Transponder programmieren, Keyless-Go-Schlüssel anlernen und Fahrzeuge schadenfrei öffnen — unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt am Main.',
  areaServedCities: [
    { name: 'Berlin', sameAs: 'https://en.wikipedia.org/wiki/Berlin' },
    { name: 'Hamburg', sameAs: 'https://en.wikipedia.org/wiki/Hamburg' },
    { name: 'München', sameAs: 'https://en.wikipedia.org/wiki/Munich' },
    { name: 'Frankfurt am Main', sameAs: 'https://en.wikipedia.org/wiki/Frankfurt' },
  ],
} as const;

export const WHATSAPP_URL = '/whatsapp';

/** Ist dieser Wert echt, oder noch ein Platzhalter? */
export const isReady = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value !== TBD && value.length > 0;

/**
 * Hat die USt-IdNr. die Form, die das Finanzamt vergibt?
 *
 * Seiten, die sie ausgeben, prüfen das zuerst, damit ein Platzhalter nie auf
 * einer Rechnung oder in den AGB landet.
 */
export function isBtwConfigured(): boolean {
  return new RegExp(SITE_CONFIG.vatNumberPattern).test(SITE_CONFIG.btw ?? '');
}

/** Jedes Feld, das noch auf TBD steht, als Pfad. */
export function missingFields(value: unknown = SITE_CONFIG, path = ''): string[] {
  if (value === TBD) return [path];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      missingFields(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

export const siteIsReady = (): boolean => missingFields().length === 0;

/**
 * Vorschaumodus: bauen, obwohl Angaben fehlen.
 *
 * Nur über eine ausdrücklich gesetzte Umgebungsvariable. In diesem Modus steht
 * auf jeder Seite ein Hinweisband, robots.txt sperrt alles, die Sitemap ist
 * leer und jede Seite ist auf noindex — eine Vorschau darf nicht in den Index
 * geraten, auch nicht aus Versehen. Sobald die Konfiguration vollständig ist,
 * schaltet das von selbst um.
 */
export const PREVIEW_WITH_PLACEHOLDERS =
  process.env.AUTOSCHLUESSEL_ALLOW_PLACEHOLDERS === '1';

export function assertSiteReady(): void {
  const missing = missingFields();
  if (missing.length === 0) return;
  const message =
    'autoschluessel24.de ist noch nicht vollständig konfiguriert. Es fehlen:\n' +
    missing.map((f) => `  - ${f}`).join('\n') +
    '\n\nSiehe de/README.md und EXPANSION-BE-DE-PLAN.md Abschnitt 10.';
  if (PREVIEW_WITH_PLACEHOLDERS) {
    console.warn(`\n[Vorschau mit Platzhaltern — nicht veröffentlichen]\n${message}\n`);
    return;
  }
  throw new Error(message);
}
