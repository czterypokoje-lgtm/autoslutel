export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  brandSlug: string;
  category: 'key' | 'shell' | 'battery' | 'accessory';
  imageUrl: string;
  inStock: boolean;
  features?: string[];
}

export const WEBSHOP_PRODUCTS: Product[] = [
  {
    id: 'vw-golf-7-key',
    name: 'Volkswagen Golf 7 Smart Key (Origineel Model)',
    description: 'Volledige smart key inclusief transponder en afstandsbediening. Geschikt voor Volkswagen Golf 7 (2012-2020). Let op: deze sleutel moet nog worden ingeleerd op uw auto.',
    price: 89.95,
    brandSlug: 'volkswagen',
    category: 'key',
    imageUrl: '/images/autosleutel-bijmaken-volkswagen.webp',
    inStock: true,
    features: ['Inclusief batterij', '3 Knoppen', '434 MHz'],
  },
  {
    id: 'bmw-f-series-key',
    name: 'BMW F-Serie Smart Key',
    description: 'Nieuwe smart key voor BMW 1, 3, 5 serie (F-modellen). Vraagt om gespecialiseerde inleering.',
    price: 119.95,
    brandSlug: 'bmw',
    category: 'key',
    imageUrl: '/images/autosleutel-bijmaken-bmw.webp',
    inStock: true,
    features: ['Keyless Go', '4 Knoppen', 'PCF7953 Transponder'],
  },
  {
    id: 'mercedes-chrome-key',
    name: 'Mercedes-Benz Chrome Sleutelbehuizing',
    description: 'Lege behuizing voor Mercedes-Benz sleutels. Ideaal om uw versleten sleutel een nieuwe look te geven. Elektronica kunt u eenvoudig overzetten.',
    price: 24.95,
    brandSlug: 'mercedes-benz',
    category: 'shell',
    imageUrl: '/images/autosleutel-bijmaken-mercedes.webp',
    inStock: true,
    features: ['Chrome afwerking', 'Inclusief noodsleutel', 'Zonder elektronica'],
  },
  {
    id: 'audi-a3-shell',
    name: 'Audi A3/A4 Klapsleutel Behuizing',
    description: 'Vervangende behuizing voor Audi klapsleutels. Eenvoudig zelf te vervangen.',
    price: 19.95,
    brandSlug: 'audi',
    category: 'shell',
    imageUrl: '/images/autosleutel-bijmaken-audi.webp',
    inStock: true,
    features: ['3 Knoppen', 'Inclusief ongeslepen baard'],
  },
  {
    id: 'cr2032-battery',
    name: 'CR2032 Knoopcel Batterij (2-pack)',
    description: 'Hoogwaardige Panasonic CR2032 batterijen, geschikt voor de meeste moderne autosleutels.',
    price: 6.95,
    brandSlug: 'all',
    category: 'battery',
    imageUrl: '/images/icon_insurance.webp',
    inStock: true,
  }
];

export const WEBSHOP_BRANDS = [
  { slug: 'volkswagen', name: 'Volkswagen' },
  { slug: 'bmw', name: 'BMW' },
  { slug: 'audi', name: 'Audi' },
  { slug: 'mercedes-benz', name: 'Mercedes-Benz' },
  { slug: 'ford', name: 'Ford' },
  { slug: 'peugeot', name: 'Peugeot' },
  { slug: 'renault', name: 'Renault' },
  { slug: 'opel', name: 'Opel' },
  { slug: 'toyota', name: 'Toyota' }
];
