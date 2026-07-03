export interface Location {
  slug: string;
  city: string;
  region: string;
  country: string;
  geo: { lat: string; lng: string };
  travelTime: string;
  subAreas: string[];
  reviewQuote: string;
  reviewAuthor: string;
  reviewCar: string;
}

export const LOCATIONS: Location[] = [
  {
    slug: 'autosleutel-bijmaken-utrecht',
    city: 'Utrecht',
    region: 'Utrecht',
    country: 'NL',
    geo: { lat: '52.0907', lng: '5.1214' },
    travelTime: '15-20 minuten',
    subAreas: ['Houten', 'Nieuwegein', 'IJsselstein', 'Vianen', 'Maarssen'],
    reviewQuote: 'BMW alle sleutels kwijt in Utrecht. Dealer wilde €1.400. Deze jongens deden het voor €580 en kwamen naar mij toe!',
    reviewAuthor: 'Niels',
    reviewCar: 'BMW 5-serie, Utrecht',
  },
  {
    slug: 'autosleutel-bijmaken-amsterdam',
    city: 'Amsterdam',
    region: 'Noord-Holland',
    country: 'NL',
    geo: { lat: '52.3676', lng: '4.9041' },
    travelTime: '45-60 minuten',
    subAreas: ['Amstelveen', 'Diemen', 'Ouder-Amstel', 'Zaandam', 'Haarlem'],
    reviewQuote: 'BMW alle sleutels kwijt in Amsterdam-Centrum. Ze kwamen uit Utrecht en losten alles op. Top service!',
    reviewAuthor: 'Marco',
    reviewCar: 'BMW X5, Amsterdam',
  },
];
