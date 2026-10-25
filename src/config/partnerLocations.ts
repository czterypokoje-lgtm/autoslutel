/*
 * Partner locations: a real garage or workshop, per city, that our technicians
 * work with. Each entry puts an address card with an auto-loading Google map
 * on that city page. The partner's name stays out of the visible page.
 *
 * Only real, public business addresses belong here -- never a technician's
 * home address, and never an address you do not actually work with. Only our
 * own phone is shown; the partner's number never goes on the site.
 *
 * Add a partner: one object, keyed by the city slug from src/config/cities.ts.
 */
export type PartnerLocation = {
  /** City slug from CITIES, e.g. 'amsterdam'. */
  citySlug: string;
  name: string;
  street: string;
  postalCode: string;
  locality: string;
  /** Shown after the address, e.g. 'Amsterdam-Noord'. */
  district?: string;
  url?: string;
  /** schema.org type of the partner itself, e.g. 'AutoRepair'. */
  schemaType: string;
};

export const PARTNER_LOCATIONS: readonly PartnerLocation[] = [
  {
    citySlug: 'amsterdam',
    name: 'Garage NRD',
    street: 'Draaierweg 10',
    postalCode: '1032 KS',
    locality: 'Amsterdam',
    district: 'Amsterdam-Noord',
    url: 'https://www.garage-nrd.nl/',
    schemaType: 'AutoRepair',
  },
];

export const partnerForCity = (slug: string) => PARTNER_LOCATIONS.find((p) => p.citySlug === slug);

/** The address only, so Google's card shows the street address (owner's choice, 25 Oct 2026). */
export const partnerMapsQuery = (p: PartnerLocation) => `${p.street}, ${p.postalCode} ${p.locality}`;
