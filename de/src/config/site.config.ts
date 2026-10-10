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

  /** Handelsregisternummer, z. B. 'HRB 123456 B' — Impressum. */
  hrb: TBD,
  /** USt-IdNr. — Impressum und jede Rechnung. */
  ustId: TBD,
  iban: TBD,
  /** Die nach § 18 Abs. 2 MStV verantwortliche Person. */
  responsible: TBD,
  /** Rechtsform, für das Impressum. */
  legalForm: TBD,
  /** Registergericht, z. B. 'Amtsgericht Berlin-Charlottenburg' — Impressum. */
  registerCourt: TBD,

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
    /*
     * Marktplaats war hier nicht sinnvoll: ein niederländischer Marktplatz,
     * auf dem diese Seite kein Profil hat. Das deutsche Gegenstück heißt
     * Kleinanzeigen; sobald es dort ein Profil gibt, kommt es hier hinein und
     * das Abzeichen im Footer erscheint von selbst.
     */
    kleinanzeigen: TBD,
  },

  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',

  /*
   * Das Formspree-Formular dieser Seite, als Endpunkt-ID.
   *
   * Beim Kopieren kam 'mgavvqvd' mit — das Formular der niederländischen
   * Seite. Es hätte funktioniert, und genau das ist das Problem: jede deutsche
   * Anfrage wäre im niederländischen Postfach gelandet, bei jemandem, der sie
   * nicht beantworten kann, und im CRM wäre sie nicht aufgefallen, weil der
   * Lead parallel ohnehin in die eigene Tabelle geht.
   *
   * null heißt: das Formular schickt nur an /api/leads, und das genügt — dort
   * landen alle Anfragen ohnehin. Ein eigener Formspree-Endpunkt ist eine
   * zusätzliche E-Mail-Benachrichtigung, kein Ersatz.
   */
  formspreeId: null as string | null,

  /*
   * Messung — eigene Konten, nicht die niederländischen.
   *
   * Beim Kopieren der Seite kamen GTM-PRT75SWX, AW-18315813515 und die
   * UET-ID 97270067 mit: die Konten der niederländischen Seite. Beide Fehler
   * wären teuer gewesen. Die Ladeskripte waren auf
   * window.location.hostname === 'autosleutel24.nl' abgefragt, also hätte auf
   * autoschluessel24.de überhaupt nichts gefeuert — und in Deutschland sind
   * Anzeigen der einzige schnelle Kanal, der Ausfall also genau dort, wo er
   * zählt. Hätte man nur den Hostnamen getauscht, lägen deutsche Klicks und
   * Conversions im niederländischen Konto und die Zuordnung wäre für beide
   * Märkte falsch.
   *
   * null heißt: das Skript wird nicht geladen. Keine Messung ist richtig,
   * solange kein eigenes Konto existiert; falsch gemessen ist schlimmer.
   */
  analytics: {
    /** Eigener GTM-Container für Deutschland, z. B. 'GTM-XXXXXXX'. */
    gtmId: null as string | null,
    /** Eigene Google-Ads-Conversion-ID, z. B. 'AW-XXXXXXXXXX'. */
    googleAdsId: null as string | null,
    /** Eigene Microsoft-Advertising-UET-ID. */
    bingUetId: null as string | null,
    /*
     * Eigener IndexNow-Schlüssel für diese Domain.
     *
     * Der Schlüssel muss unter der eigenen Domain als Textdatei liegen; der
     * niederländische Schlüssel liegt auf autosleutel24.nl und wäre für
     * autoschluessel24.de ungültig — die Einreichung würde abgelehnt. null
     * heißt: nicht einreichen, bis es einen eigenen gibt.
     */
    indexNowKey: null as string | null,
    /** GA4-Messstream dieser Seite, z. B. 'G-XXXXXXXXXX'. */
    ga4Id: null as string | null,
    /*
     * Conversion-Aktionen dieser Seite, je 'AW-XXXXXXXXXX/Label'.
     *
     * Beim Kopieren kamen die niederländischen Labels mit — Click to call,
     * WhatsApp-Klick und Formular-Lead. Das ist die gefährlichste der
     * Mitnahmen: sie hätten funktioniert. Deutsche Anrufe und Formulare wären
     * als niederländische Conversions gemeldet worden und hätten die
     * Gebotsoptimierung des niederländischen Kontos auf Traffic trainiert, der
     * nie ein niederländischer Kunde wird. Falsch gemessen ist teurer als
     * nicht gemessen.
     *
     * null heißt: dieses Ereignis wird nicht gemeldet.
     */
    conversions: {
      clickToCall: null as string | null,
      whatsappClick: null as string | null,
      leadForm: null as string | null,
    },
  },

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
export function isUstIdConfigured(): boolean {
  return new RegExp(SITE_CONFIG.vatNumberPattern).test(SITE_CONFIG.ustId ?? '');
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
