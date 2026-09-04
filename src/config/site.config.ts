// ============================================================
// SITE CONFIG — Autosleutel Expert
// Update with real business data before launch
// ============================================================

export const SITE_CONFIG = {
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
    city: 'Midden-Nederland',
    region: 'Utrecht',
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
  serviceAreaString: 'Utrecht, Amsterdam en Midden-Nederland',

  prices: {
    unlock: '149',
    transponder: '149',
    remote: '220',
    smartKey: '249',
    allKeysLost: '299',
    casing: '35',
    ignition: '299',
    exVatDisclaimer: 'excl. btw',
  },

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
  rating: '5.0',
  reviewCount: '8', // actual Google review count — update as it grows

  social: {
    facebook: 'https://www.facebook.com/autosleutel24utrecht',
    instagram: 'https://www.instagram.com/autosleutel24',
    google: 'https://share.google/mpottPPXn3SbSYThD', // Linked to official GBP
    marktplaats: 'https://www.marktplaats.nl/u/autosleutel24/60076348/',
  },

  // Vercel Blob storage domain for uploaded lead photos (see /f/:filename* rewrite in next.config.ts)
  blobStorageDomain: 'https://omqnxprotjfbyqqq.public.blob.vercel-storage.com',
} as const;

export const WHATSAPP_URL = '/whatsapp';

/**
 * Whether the btw number is at least in the shape the Belastingdienst issues.
 *
 * Pages that print it check this first, so a placeholder can never end up on
 * an invoice or in the terms.
 */
export function isBtwConfigured(): boolean {
  return /^NL\d{9}B\d{2}$/.test(SITE_CONFIG.btw ?? '');
}
