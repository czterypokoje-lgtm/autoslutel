// ============================================================
// SITE CONFIG — Autosleutel Expert
// Update with real business data before launch
// ============================================================

export const SITE_CONFIG = {
  name: 'Autosleutel24',
  fullName: 'Autosleutel24 Utrecht',
  tagline: 'Mobiele Sleutelprogrammering — Alle Merken',
  domain: 'https://www.autosleutel24.nl', // primary

  phone: '06 11 75 12 31',
  phoneTel: '+31611751231',
  whatsapp: '31611751231',
  email: 'info@autosleutel24.nl',

  address: {
    street: 'Stationsplein 11', // Example central Utrecht address for HQ
    city: 'Utrecht',
    region: 'Utrecht',
    postal: '3511 ED',
    country: 'NL',
  },
  geo: { lat: '52.0907', lng: '5.1214' },
  serviceArea: {
    lat: '52.0907',
    lng: '5.1214',
    radiusMeters: '50000', // 50km serving area around Utrecht HQ
  },

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  responseTime: '30–60 minuten',

  kvk: '81726354',
  btw: 'NL817263540B01',
  rating: '4.9',
  reviewCount: '247',

  social: {
    facebook: 'https://www.facebook.com/autosleutel24utrecht',
    instagram: 'https://www.instagram.com/autosleutel24',
    google: 'https://g.page/r/CNX3_review',  // Base GBP URL (no /review suffix — that redirects to review form)
    marktplaats: 'https://www.marktplaats.nl/u/autosleutel24/60076348/',
  },
} as const;

export const WHATSAPP_URL = '/whatsapp';
