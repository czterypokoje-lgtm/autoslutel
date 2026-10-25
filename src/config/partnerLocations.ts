/*
 * Partner locations: a real garage or workshop, per city, that our technicians
 * work with. Each entry puts a "Autosleutel bijmaken in <city> bij <partner>"
 * section with an auto-loading Google map of the partner on that city page.
 *
 * Only real, public business addresses belong here -- never a technician's
 * home address, and never an address you do not actually work with. Calls and
 * appointments always go to Autosleutel24; the partner is named, not sold.
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
  telephone?: string;
  url?: string;
  /** schema.org type of the partner itself, e.g. 'AutoRepair'. */
  schemaType: string;
  /** One honest sentence on how the partnership works. */
  intro: string;
};

export const PARTNER_LOCATIONS: readonly PartnerLocation[] = [
  {
    citySlug: 'amsterdam',
    name: 'Garage NRD',
    street: 'Draaierweg 10',
    postalCode: '1032 KS',
    locality: 'Amsterdam',
    district: 'Amsterdam-Noord',
    telephone: '+31206362339',
    url: 'https://www.garage-nrd.nl/',
    schemaType: 'AutoRepair',
    intro:
      'Voor spoedgevallen in Amsterdam werken wij samen met Garage NRD, zodat onze monteur ook dicht bij het centrum snel ter plaatse kan zijn. Rechtstreeks contact met Autosleutel24 blijft de snelste weg naar een prijs en een afspraak.',
  },
];

export const partnerForCity = (slug: string) => PARTNER_LOCATIONS.find((p) => p.citySlug === slug);

/** The query Google Maps resolves to the exact place: name plus full address. */
export const partnerMapsQuery = (p: PartnerLocation) => `${p.name}, ${p.street}, ${p.postalCode} ${p.locality}`;
