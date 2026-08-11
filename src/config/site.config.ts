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
    street: '', // Mobile service - no physical location displayed
    city: 'Bussum',
    region: 'Noord-Holland',
    postal: '',
    country: 'NL',
  },
  geo: { lat: '52.2740', lng: '5.1611' },
  serviceArea: {
    lat: '52.2740',
    lng: '5.1611',
    radiusMeters: '75000', // 75km serving area around Bussum HQ
  },
  serviceAreaString: 'Utrecht, Amsterdam en Midden-Nederland',

  prices: {
    unlock: '125',
    transponder: '159',
    remote: '220',
    smartKey: '349',
    allKeysLost: '260',
    casing: '35',
    ignition: '350',
    exVatDisclaimer: 'excl. btw',
  },

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  responseTime: '30–60 minuten',

  kvk: '42123555',
  btw: 'NL42123555B01',
  rating: '5.0',
  reviewCount: '11',

  social: {
    facebook: 'https://www.facebook.com/autosleutel24utrecht',
    instagram: 'https://www.instagram.com/autosleutel24',
    google: 'https://share.google/mpottPPXn3SbSYThD', // Linked to official GBP
    marktplaats: 'https://www.marktplaats.nl/u/autosleutel24/60076348/',
  },
} as const;

export const WHATSAPP_URL = '/whatsapp';
