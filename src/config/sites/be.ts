// ============================================================
// SITE — Belgium (autosleutel24.be)
//
// NOT deployable yet: assertSiteComplete() in ./types.ts fails the build while
// any TBD is still here.
//
// Belgium is the cheap half of the expansion because Flanders reads the same
// language — but "the same language" is not "the same words". A Flemish
// customer says nummerplaat, not kenteken, and we have a whole page and a form
// component built on the Dutch word. See EXPANSION-BE-DE-PLAN.md section 8.
//
// The domain is unconfirmed; the office has not said whether it is registered.
// ============================================================

import { TBD, type SiteConfig } from './types';

export const BE_SITE = {
  name: 'Autosleutel24',
  fullName: 'Autosleutel24',
  tagline: 'Mobiele Sleutelprogrammering — Alle Merken',
  domain: 'https://www.autosleutel24.be',

  /* A Belgian number: +32. Same reasoning as de.ts — a foreign number costs
     trust and will not verify a Google Business Profile. */
  phone: TBD,
  phoneTel: TBD,
  whatsapp: TBD,
  email: TBD,

  address: {
    street: TBD,
    city: TBD,
    region: TBD,
    postal: TBD,
    country: 'BE',
  },
  geo: { lat: TBD, lng: TBD },
  serviceArea: { lat: TBD, lng: TBD, radiusMeters: TBD },
  serviceAreaString: TBD,

  /* Incl. 21% btw — see `vat`. Not the Dutch ex-btw numbers relabelled. */
  prices: {
    unlock: TBD,
    transponder: TBD,
    klapsleutel: TBD,
    remote: TBD,
    smartKey: TBD,
    allKeysLost: TBD,
    casing: TBD,
    ignition: TBD,
    exVatDisclaimer: 'incl. btw',
  },

  siteId: 'be',
  country: 'BE',
  /*
   * Dutch is the default and French is served under a /fr prefix.
   *
   * Brussels is bilingual and has to be reachable in both, so neither language
   * can be treated as the fallback for the other.
   */
  htmlLang: 'nl',
  hreflang: 'nl-BE',
  isXDefault: false,
  /** Belgian postcodes are four digits, like Dutch ones — dispatch works as-is. */
  postcodeDigits: 4,
  vat: { rate: 21, pricesAreGross: true },
  geoRegion: 'BE',
  countryName: 'België',
  ogLocale: 'nl_BE',
  /* Dutch and French: Brussels is bilingual and neither is a fallback. */
  availableLanguage: ['nl', 'fr'],
  serviceAreaMapUrl: null,
  schemaDescription:
    'Mobiele autosleutelspecialist voor alle merken en modellen. Autosleutel bijmaken, transponder programmeren, smart key inleren en auto openen zonder schade — onze partner komt naar uw voertuig.',
  /* Empty until there are Belgian partners: areaServed is a claim about where
     somebody can come out, not a list of cities we would like to serve. */
  areaServedCities: [],
  /** Belgian BTW/TVA: BE + 0 + 9 digits. */
  vatNumberPattern: '^BE0\\d{9}$',
  /* Bancontact is the default way Belgians pay. iDEAL is not used there. */
  paymentAccepted: ['Cash', 'Bancontact', 'Credit Card', 'Bank Transfer'],

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  /* No number until the partner network makes one true — see de.ts. */
  responseTime: TBD,

  /** Ondernemingsnummer (KBO/BCE). */
  kvk: TBD,
  /** Belgian BTW-nummer. */
  btw: TBD,
  iban: TBD,
  /* Starts at zero and earns its own — see the note in de.ts. */
  rating: '0',
  reviewCount: '0',

  social: {
    facebook: TBD,
    instagram: TBD,
    google: TBD,
    /* 2dehands.be is the Belgian Marktplaats, if the office wants a listing. */
    marktplaats: TBD,
  },

  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',
} as const satisfies SiteConfig;
