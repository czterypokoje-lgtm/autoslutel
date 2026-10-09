// ============================================================
// SITE — Germany (autoschluessel24.de)
//
// NOT deployable yet, on purpose. Every TBD below is a value only the office
// can supply, and assertSiteComplete() in ./types.ts fails the build while any
// of them is still here. What is filled in is filled in because it is a fact
// about the German market, not a preference: 19% MwSt, five-digit postcodes,
// and no iDEAL.
// ============================================================

import { TBD, type SiteConfig } from './types';

export const DE_SITE = {
  name: 'Autoschlüssel24',
  fullName: 'Autoschlüssel24',
  tagline: 'Mobiler Autoschlüssel-Service — Alle Marken',
  domain: 'https://www.autoschluessel24.de',

  /*
   * A German number, not the Dutch 06.
   *
   * A +31 number on a German page costs trust in a category German consumers
   * already screen hard, and a Google Business Profile will not verify against
   * a foreign number. See EXPANSION-BE-DE-PLAN.md section 3 — the partner GBPs
   * are the whole local-ranking strategy and they hang off this.
   */
  phone: TBD,
  phoneTel: TBD,
  whatsapp: TBD,
  email: TBD,

  /*
   * Required by §5 DDG for the Impressum, which is a launch blocker rather
   * than a nicety: a German site without one invites an Abmahnung.
   */
  address: {
    street: TBD,
    city: TBD,
    region: TBD,
    postal: TBD,
    country: 'DE',
  },
  /* Set these from where the partners actually are, not from the Dutch base. */
  geo: { lat: TBD, lng: TBD },
  serviceArea: { lat: TBD, lng: TBD, radiusMeters: TBD },
  serviceAreaString: TBD,

  /*
   * Gross prices, incl. 19% MwSt — see `vat` below.
   *
   * These should probably not be typed in here at all, and that follows from
   * how the German deal actually works: the partner names what the job is
   * worth to them, we add our margin, and that is what the customer is
   * quoted. So the "ab" price in a German city is a function of the cheapest
   * partner rate card in that market plus the margin — which moves when a
   * partner joins or reprices — and a hand-typed constant here would go stale
   * silently and be wrong in exactly the market where a wrong advertised
   * price is an Abmahnung.
   *
   * src/lib/technicianRates.ts and priceFor() in capability.ts already hold
   * the per-partner rate cards the Dutch side quotes from, so the machinery
   * exists. Until the margin and the German rate cards are in, these stay TBD
   * and the build refuses — see EXPANSION-BE-DE-PLAN.md section 10.
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

  siteId: 'de',
  country: 'DE',
  htmlLang: 'de',
  hreflang: 'de-DE',
  isXDefault: false,
  /*
   * Five, and this is the one finding in the whole expansion audit that breaks
   * the product rather than the presentation.
   *
   * parseWerkgebied() in src/lib/crmJobs.ts keeps only /^\d{4}(-\d{4})?$/, so
   * before this existed every German partner's werkgebied was silently dropped
   * and no German job could ever be routed to anybody.
   */
  postcodeDigits: 5,
  /*
   * Consumer prices in Germany must be shown gross under the
   * Preisangabenverordnung. This is not a display preference — "excl. btw" in
   * front of a German consumer is the textbook Abmahnung in this category.
   */
  vat: { rate: 19, pricesAreGross: true },
  geoRegion: 'DE',
  countryName: 'Deutschland',
  ogLocale: 'de_DE',
  /* German, and Dutch because the office behind the network speaks it. No
     English claim until somebody is actually on the phone in English. */
  availableLanguage: ['de', 'nl'],
  /* The Dutch My Maps shows a Dutch service area. Germany gets its own or none. */
  serviceAreaMapUrl: null,
  schemaDescription:
    'Mobiler Autoschlüssel-Service für alle Marken und Modelle. Autoschlüssel nachmachen, Transponder programmieren, Keyless-Go-Schlüssel anlernen und Fahrzeuge schadenfrei öffnen — unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt am Main.',
  /*
   * The four cities with a partner, and only those.
   *
   * areaServed is a claim about where somebody can actually come out, so it
   * tracks the partner network rather than the ambition. Köln and Düsseldorf
   * belong here the day a partner there does.
   */
  areaServedCities: [
    { name: 'Berlin', sameAs: 'https://en.wikipedia.org/wiki/Berlin' },
    { name: 'Hamburg', sameAs: 'https://en.wikipedia.org/wiki/Hamburg' },
    { name: 'München', sameAs: 'https://en.wikipedia.org/wiki/Munich' },
    { name: 'Frankfurt am Main', sameAs: 'https://en.wikipedia.org/wiki/Frankfurt' },
  ],
  /** USt-IdNr.: DE + 9 digits. */
  vatNumberPattern: '^DE\\d{9}$',
  /*
   * No iDEAL: it does not exist in Germany, and a partner who cannot take
   * payment on site cannot finish a job. Card, PayPal and SEPA are what a
   * German customer expects to be offered.
   */
  paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'],

  hours: 'Montag bis Sonntag 00:00–24:00',
  hoursShort: '24/7 erreichbar',
  /*
   * Deliberately vague until there is a partner network dense enough to make a
   * number true. The city pages already refuse to print an arrival time when
   * no technician distance is known (arrivalWindow in
   * src/app/steden/[citySlug]/page.tsx), which is the behaviour we want here.
   */
  responseTime: TBD,

  /** Handelsregister (HRB) — Impressum. */
  kvk: TBD,
  /** USt-IdNr. — Impressum and every invoice. */
  btw: TBD,
  iban: TBD,
  /*
   * Starts at zero and earns its own.
   *
   * Reusing the Dutch rating and review count on a German domain is a
   * structured-data violation and risks a manual action on the whole site. The
   * schema must omit aggregateRating entirely while reviewCount is '0' rather
   * than publish a rating of zero.
   */
  rating: '0',
  reviewCount: '0',

  social: {
    facebook: TBD,
    instagram: TBD,
    google: TBD,
    /* Marktplaats is Dutch. The German equivalent, if any, is eBay Kleinanzeigen. */
    marktplaats: TBD,
  },

  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',
} as const satisfies SiteConfig;
