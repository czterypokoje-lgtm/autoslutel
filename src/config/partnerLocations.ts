/*
 * Partner locations: a real garage or workshop, per city, that our technicians
 * work with. Each entry puts an address card with an auto-loading Google map
 * on that city page. The partner's name stays out of the visible page.
 *
 * Only real, public business addresses belong here -- never a technician's
 * home address, and never an address you do not actually work with. Only our
 * own phone is shown; the partner's number never goes on the site.
 *
 * Add a partner: one object, listing the city slugs from src/config/cities.ts
 * whose pages show it -- its own city, plus nearby city pages when its own
 * town has no page. The card names the partner's own town, never the page's.
 */
export type PartnerLocation = {
  /** City slugs from CITIES whose pages show this partner, e.g. ['amsterdam']. */
  citySlugs: readonly string[];
  name: string;
  street: string;
  postalCode: string;
  locality: string;
  /** Shown after the address, e.g. 'Amsterdam-Noord'. */
  district?: string;
  url?: string;
  /** schema.org type of the partner itself, e.g. 'AutoRepair'. */
  schemaType: string;
  /** Coordinates of the address, for the partner's schema.org `geo`. */
  geo?: { lat: number; lng: number };
  /** The partner's Google Business Profile link, as schema.org `hasMap`. */
  googleMapsUrl?: string;
};

export const PARTNER_LOCATIONS: readonly PartnerLocation[] = [
  {
    citySlugs: ['amsterdam'],
    name: 'Garage NRD',
    street: 'Draaierweg 10',
    postalCode: '1032 KS',
    locality: 'Amsterdam',
    district: 'Amsterdam-Noord',
    url: 'https://www.garage-nrd.nl/',
    schemaType: 'AutoRepair',
  },
  {
    // Its own town first, then the nearest other city pages: Alkmaar (~6 km)
    // and Purmerend (~25 km).
    citySlugs: ['heerhugowaard', 'alkmaar', 'purmerend'],
    name: 'Key For Cars Autobedrijf sleutels hhw',
    street: 'Pascalstraat 27',
    postalCode: '1704 RE',
    locality: 'Heerhugowaard',
    district: 'regio Alkmaar',
    url: 'https://www.keyforcars.nl/',
    schemaType: 'AutoRepair',
    // Same point as the KeyForCars shipping origin (src/lib/kfcShippingTestModel.ts).
    geo: { lat: 52.6824279, lng: 4.82907106 },
    // Google profile link the owner sent (23 Nov 2026).
    googleMapsUrl: 'https://share.google/mQrj1NCPP5K68awH3',
  },
];

export const partnerForCity = (slug: string) => PARTNER_LOCATIONS.find((p) => p.citySlugs.includes(slug));

/** The address only, so Google's card shows the street address (owner's choice, 25 Oct 2026). */
export const partnerMapsQuery = (p: PartnerLocation) => `${p.street}, ${p.postalCode} ${p.locality}`;
