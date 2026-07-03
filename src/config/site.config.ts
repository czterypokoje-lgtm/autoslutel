// ============================================================
// SITE CONFIG — Autosleutel Expert
// Update with real business data before launch
// ============================================================

export const SITE_CONFIG = {
  name: 'Autosleutel24',
  fullName: 'Autosleutel24 Utrecht',
  tagline: 'Mobiele Sleutelprogrammering — Alle Merken',
  domain: 'https://www.autosleutel24.nl', // primary

  phone: '06 38 22 24 24',
  phoneTel: '+31638222424',
  whatsapp: '31638222424',
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
    google: 'https://g.page/r/CNX3_review/review',
  },
} as const;

export const WHATSAPP_URL = `https://wa.me/${SITE_CONFIG.whatsapp}?text=Hallo%2C%20ik%20heb%20hulp%20nodig%20met%20mijn%20autosleutel.%20Automerk%20en%20model%3A%20`;
