// ============================================================
// SITE — Netherlands (autosleutel24.nl)
//
// The original site.config.ts, moved here unchanged when Belgium and Germany
// were added. It is also the reference shape: SiteConfig in ./types.ts is
// written to match this file, and be.ts and de.ts must satisfy it.
// ============================================================

import type { SiteConfig } from './types';

export const NL_SITE = {
  name: 'Autosleutel24',
  fullName: 'Autosleutel24',
  tagline: 'Mobiele Sleutelprogrammering — Alle Merken',
  domain: 'https://www.autosleutel24.nl', // primary

  phone: '06 11 75 12 31',
  phoneTel: '+31611751231',
  whatsapp: '31611751231',
  email: 'info@autosleutel24.nl',

  address: {
    street: '', // Mobile service-area business — no storefront shown
    // Matches the base city on the real Google Business Profile — "Midden-
    // Nederland" isn't a real place Google can match NAP data against, and
    // a mismatch here works against local ranking, not for it.
    city: 'Bussum',
    region: 'Noord-Holland',
    postal: '',
    country: 'NL',
  },
  // Service area: 75km radius centred on Bussum/Gooi HQ
  geo: { lat: '52.2740', lng: '5.1611' },
  serviceArea: {
    lat: '52.2740',
    lng: '5.1611',
    radiusMeters: '75000', // 75km serving area around Bussum HQ
  },
  serviceAreaString: 'Utrecht, Amsterdam, Den Haag, Rotterdam, Alkmaar en Midden-Nederland',

  prices: {
    unlock: '149',
    /*
     * Bijmaken starts at 125, not 149.
     *
     * These two were the same number and are not the same job: `unlock` is
     * opening a car you are locked out of, `transponder` is cutting and
     * programming a spare. Every "vanaf" on the site reads from here, so the
     * meta titles, the wizard, the quote engine and the price table move
     * together -- the EUR 190 that once sat in a FAQ while the wizard said
     * EUR 299 is what happens when one of them is typed by hand instead.
     */
    transponder: '125',
    /* Klap-/flipsleutel with remote: the step above a plain transponder. */
    klapsleutel: '149',
    remote: '220',
    smartKey: '249',
    allKeysLost: '299',
    casing: '35',
    ignition: '299',
    exVatDisclaimer: 'excl. btw',
  },

  // ── Country identity (added with the BE/DE split) ──────────
  siteId: 'nl',
  country: 'NL',
  htmlLang: 'nl',
  /** This site's own hreflang, and whether it is the x-default of the cluster. */
  hreflang: 'nl-NL',
  isXDefault: true,
  /*
   * How many leading digits a postcode has here.
   *
   * Dispatch matches technician werkgebied on this (src/lib/crmJobs.ts), and
   * NL and BE use four while DE uses five. It lives next to the country rather
   * than in the matcher so that adding a fourth country is one file.
   */
  postcodeDigits: 4,
  /*
   * Whether the prices above are gross.
   *
   * NL shows ex-btw and says so. Germany may not: the Preisangabenverordnung
   * requires consumer prices incl. MwSt, so de.ts sets pricesAreGross true and
   * carries its own numbers rather than these with a different label.
   */
  vat: { rate: 21, pricesAreGross: false },
  /** Shape of a valid VAT id here — guards printing a placeholder on an invoice. */
  vatNumberPattern: '^NL\\d{9}B\\d{2}$',
  /** Drives schema paymentAccepted and the monteur's payment panel. */
  paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'iDEAL', 'Pin'],

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  responseTime: '30-60 minuten',

  kvk: '42123555',
  /*
   * VERIFY BEFORE INVOICING. This reads as the KvK number with "NL" and "B01"
   * around it, and that is not how a Dutch btw-identificatienummer is issued —
   * eenmanszaken get a randomly assigned number, a BV's is built on its RSIN.
   * A number that belongs to someone else on an invoice is their problem and
   * ours. Replace it with the number on your own btw-aangifte.
   */
  btw: 'NL42123555B01',
  /*
   * VERIFY BEFORE INVOICING — same placeholder problem as kvk/btw above. A
   * factuur with someone else's bank account on it is a mistake, not just a
   * blank field. Replace with the real account before this is used to bill
   * anyone; the invoice form lets each factuur override it anyway.
   */
  iban: 'NL00BANK0123456789',
  rating: '5.0',
  reviewCount: '10', // actual Google review count — update as it grows

  social: {
    facebook: 'https://www.facebook.com/autosleutel24utrecht',
    instagram: 'https://www.instagram.com/autosleutel24',
    google: 'https://share.google/mpottPPXn3SbSYThD', // Linked to official GBP
    marktplaats: 'https://www.marktplaats.nl/u/autosleutel24/60076348/',
  },

  // Vercel Blob storage domain for uploaded lead photos (see /f/:filename* rewrite in next.config.ts)
  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',
} as const satisfies SiteConfig;
