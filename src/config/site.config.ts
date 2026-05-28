// ============================================================
// SITE CONFIG — Autosleutel Expert
// Update with real business data before launch
// ============================================================

export const SITE_CONFIG = {
  name: 'Autosleutel Expert',
  fullName: 'Autosleutel Expert Eindhoven',
  tagline: 'Mobiele Sleutelprogrammering — Alle Merken',
  domainNL: 'https://www.autosleutel-expert.nl',
  domainBE: 'https://www.autosleutel-expert.be',
  domain: 'https://www.autosleutel-expert.nl', // primary

  phone: '06-XX XX XX XX',
  phoneTel: '+31600000000',
  whatsapp: '31600000000',
  email: 'info@autosleutel-expert.nl',

  address: {
    street: 'Mobiele Service — Heel Nederland & België',
    city: 'Eindhoven',
    region: 'Noord-Brabant',
    postal: '5611',
    country: 'NL',
  },
  geo: { lat: '51.4416', lng: '5.4697' },

  hours: 'Maandag t/m Zondag 00:00–24:00',
  hoursShort: '24/7 Beschikbaar',
  responseTime: '30–60 minuten',

  kvk: 'XXXXXXXX',
  btw: 'NL000000000B01',
  rating: '4.9',
  reviewCount: '247',

  social: {
    facebook: 'https://www.facebook.com/autosleutelexperteindhoven',
    instagram: 'https://www.instagram.com/autosleutelexpert',
    google: 'https://g.page/r/XXXX/review',
  },
} as const;

export const WHATSAPP_URL = `https://wa.me/${SITE_CONFIG.whatsapp}?text=Hallo%2C%20ik%20heb%20hulp%20nodig%20met%20mijn%20autosleutel.%20Automerk%20en%20model%3A%20`;
