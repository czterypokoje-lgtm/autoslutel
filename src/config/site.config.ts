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
    street: 'Kapelstraat 9C',
    city: 'Bussum',
    region: 'Noord-Holland',
    postal: '1404 HT',
    country: 'NL',
  },
  geo: { lat: '52.2740', lng: '5.1611' },
  serviceArea: {
    lat: '52.2740',
    lng: '5.1611',
    radiusMeters: '75000', // 75km serving area around Bussum HQ
  },

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  responseTime: '30–60 minuten',

  kvk: '42123555',
  btw: 'NL42123555B01',
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
