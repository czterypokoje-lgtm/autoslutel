export interface GalleryProject {
  id: number;
  src: string;
  alt: string;
  /*
   * The photograph's real pixel dimensions, read off the files in /public by a
   * one-off script rather than typed by hand. The marquee lays tiles out at a
   * fixed row height and lets each one take the width its own shape asks for —
   * a portrait shot stays narrow, a wide one stays wide — which is what stops
   * the row reading as a grid of identical boxes. That needs the aspect ratio
   * at render time, before the browser has the file.
   */
  width: number;
  height: number;
}

/*
 * Every photograph in public/images/marken, with its real dimensions read off
 * the file. These are the Dutch operation's job photos: the work is identical
 * (same tooling, same makes), so they are honest illustrations of the service,
 * and the alt text says what is happening rather than claiming a German city.
 *
 * No city name appears in any alt text. On the Dutch site the city-page
 * gallery filters on the city in the alt text; here a German city in an alt
 * text would assert that the photo was taken there, which is not true of a
 * single one of these files. The city pages therefore draw from the whole
 * pool — see staedte/[citySlug]/page.tsx.
 *
 * Replace these with photos from the German partners as they come in; that is
 * the one change that makes this gallery better than honest.
 */
export const REAL_GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: 1,
    src: '/images/marken/audi-autoschluessel-nachmachen-1.webp',
    alt: 'Audi Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 2,
    src: '/images/marken/audi-autoschluessel-nachmachen-2.webp',
    alt: 'Audi Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 3,
    src: '/images/marken/bmw-auto-oeffnen-ohne-schluessel-1.webp',
    alt: 'BMW schadenfrei ohne Schlüssel geöffnet — vor Ort beim Fahrzeug',
    width: 1000,
    height: 1333
  },
  {
    id: 4,
    src: '/images/marken/bmw-autoschluessel-nachmachen-2.webp',
    alt: 'BMW Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 5,
    src: '/images/marken/citroen-autoschluessel-nachmachen-1.webp',
    alt: 'Citroën Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 1333
  },
  {
    id: 6,
    src: '/images/marken/ds-autoschluessel-nachmachen-1.webp',
    alt: 'DS Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 7,
    src: '/images/marken/ds-autoschluessel-nachmachen-2.webp',
    alt: 'DS Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 8,
    src: '/images/marken/fiat-autoschluessel-nachmachen-1.webp',
    alt: 'Fiat Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 9,
    src: '/images/marken/fiat-autoschluessel-nachmachen-2.webp',
    alt: 'Fiat Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 10,
    src: '/images/marken/ford-autoschluessel-nachmachen-1.webp',
    alt: 'Ford Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 11,
    src: '/images/marken/ford-autoschluessel-nachmachen-2.webp',
    alt: 'Ford Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 12,
    src: '/images/marken/hyundai-autoschluessel-nachmachen-1.webp',
    alt: 'Hyundai Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 13,
    src: '/images/marken/hyundai-autoschluessel-nachmachen-2.webp',
    alt: 'Hyundai Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 14,
    src: '/images/marken/jeep-autoschluessel-nachmachen-1.webp',
    alt: 'Jeep Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 15,
    src: '/images/marken/jeep-autoschluessel-nachmachen-2.webp',
    alt: 'Jeep Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 16,
    src: '/images/marken/kia-autoschluessel-nachmachen-1.webp',
    alt: 'Kia Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 808
  },
  {
    id: 17,
    src: '/images/marken/kia-autoschluessel-nachmachen-2.webp',
    alt: 'Kia Autoschlüssel nachmachen und anlernen vor Ort',
    width: 960,
    height: 720
  },
  {
    id: 18,
    src: '/images/marken/land-rover-autoschluessel-nachmachen-1.webp',
    alt: 'Land Rover Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 19,
    src: '/images/marken/land-rover-autoschluessel-nachmachen-2.webp',
    alt: 'Land Rover Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 20,
    src: '/images/marken/lexus-autoschluessel-nachmachen-1.webp',
    alt: 'Lexus Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 21,
    src: '/images/marken/lexus-autoschluessel-nachmachen-2.webp',
    alt: 'Lexus Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 22,
    src: '/images/marken/mazda-autoschluessel-nachmachen-1.webp',
    alt: 'Mazda Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 23,
    src: '/images/marken/mazda-autoschluessel-nachmachen-2.webp',
    alt: 'Mazda Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 24,
    src: '/images/marken/mercedes-autoschluessel-nachmachen-1.webp',
    alt: 'Mercedes-Benz Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 25,
    src: '/images/marken/mercedes-autoschluessel-nachmachen-2.webp',
    alt: 'Mercedes-Benz Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 26,
    src: '/images/marken/mini-autoschluessel-nachmachen-1.webp',
    alt: 'Mini Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 27,
    src: '/images/marken/mini-autoschluessel-nachmachen-2.webp',
    alt: 'Mini Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 28,
    src: '/images/marken/mitsubishi-autoschluessel-nachmachen-1.webp',
    alt: 'Mitsubishi Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 1333
  },
  {
    id: 29,
    src: '/images/marken/nissan-autoschluessel-nachmachen-1.webp',
    alt: 'Nissan Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 30,
    src: '/images/marken/nissan-autoschluessel-nachmachen-2.webp',
    alt: 'Nissan Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 31,
    src: '/images/marken/opel-autoschluessel-nachmachen-1.webp',
    alt: 'Opel Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 32,
    src: '/images/marken/opel-autoschluessel-nachmachen-2.webp',
    alt: 'Opel Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 33,
    src: '/images/marken/peugeot-autoschluessel-nachmachen-1.webp',
    alt: 'Peugeot Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 34,
    src: '/images/marken/peugeot-autoschluessel-nachmachen-2.webp',
    alt: 'Peugeot Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 35,
    src: '/images/marken/porsche-autoschluessel-nachmachen-1.webp',
    alt: 'Porsche Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 889
  },
  {
    id: 36,
    src: '/images/marken/porsche-autoschluessel-nachmachen-2.webp',
    alt: 'Porsche Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 889
  },
  {
    id: 37,
    src: '/images/marken/renault-autoschluessel-nachmachen-1.webp',
    alt: 'Renault Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 38,
    src: '/images/marken/renault-autoschluessel-nachmachen-2.webp',
    alt: 'Renault Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 39,
    src: '/images/marken/saab-autoschluessel-nachmachen-1.webp',
    alt: 'Saab Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 40,
    src: '/images/marken/saab-autoschluessel-nachmachen-2.webp',
    alt: 'Saab Autoschlüssel nachmachen und anlernen vor Ort',
    width: 2938,
    height: 2463
  },
  {
    id: 41,
    src: '/images/marken/skoda-auto-oeffnen-ohne-schluessel-1.webp',
    alt: 'Škoda schadenfrei ohne Schlüssel geöffnet — vor Ort beim Fahrzeug',
    width: 720,
    height: 960
  },
  {
    id: 42,
    src: '/images/marken/skoda-autoschluessel-nachmachen-2.webp',
    alt: 'Škoda Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 43,
    src: '/images/marken/suzuki-autoschluessel-nachmachen-1.webp',
    alt: 'Suzuki Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 1333
  },
  {
    id: 44,
    src: '/images/marken/toyota-autoschluessel-nachmachen-1.webp',
    alt: 'Toyota Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 984
  },
  {
    id: 45,
    src: '/images/marken/toyota-autoschluessel-nachmachen-2.webp',
    alt: 'Toyota Autoschlüssel nachmachen und anlernen vor Ort',
    width: 960,
    height: 720
  },
  {
    id: 46,
    src: '/images/marken/volkswagen-autoschluessel-nachmachen-1.webp',
    alt: 'Volkswagen Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 47,
    src: '/images/marken/volkswagen-autoschluessel-nachmachen-2.webp',
    alt: 'Volkswagen Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1200,
    height: 1006
  },
  {
    id: 48,
    src: '/images/marken/volvo-autoschluessel-nachmachen-1.webp',
    alt: 'Volvo Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 1333
  },
  {
    id: 49,
    src: '/images/marken/volvo-autoschluessel-nachmachen-2.webp',
    alt: 'Volvo Autoschlüssel nachmachen und anlernen vor Ort',
    width: 1000,
    height: 1574
  }
];
