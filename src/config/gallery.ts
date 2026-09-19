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

export const REAL_GALLERY_PROJECTS: GalleryProject[] = [
  /*
   * Zaandam, Purmerend en Hoofddorp. De bestanden stonden al in public/images
   * en werden door de stadspagina als hero-foto gebruikt, maar waren nooit in
   * deze lijst opgenomen — dus viel de galerij op die pagina's terug op
   * willekeurige BMW- en Audi-foto's uit andere steden.
   *
   * De stadsnaam staat bewust in de alt-tekst: de galerij op een stadspagina
   * filtert op precies dat, dus zonder de naam verschijnt de foto nooit op de
   * pagina waar hij voor gemaakt is.
   */
  {
    id: 105,
    src: '/images/autosleutel-bijmaken-zaandam.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Zaandam',
    width: 1376,
    height: 768
  },
  {
    id: 106,
    src: '/images/autosleutel-bijmaken-purmerend.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Purmerend',
    width: 1376,
    height: 768
  },
  {
    id: 107,
    src: '/images/autosleutel-bijmaken-hoofddorp.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Hoofddorp',
    width: 1376,
    height: 768
  },
  {
    id: 100,
    src: '/images/autosleutel-bijmaken-breda.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Breda',
    width: 1024,
    height: 1024
  },
  {
    id: 101,
    src: '/images/autosleutel-bijmaken-gouda.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Gouda',
    width: 1024,
    height: 1024
  },
  {
    id: 102,
    src: '/images/autosleutel-bijmaken-haarlem.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Haarlem',
    width: 1024,
    height: 1024
  },
  {
    id: 103,
    src: '/images/autosleutel-bijmaken-lelystad.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Lelystad',
    width: 1024,
    height: 1024
  },
  {
    id: 104,
    src: '/images/autosleutel-bijmaken-nieuwegein.webp',
    alt: 'Nieuwe autosleutel bijmaken en inleren op locatie in Nieuwegein',
    width: 1376,
    height: 768
  },
  {
    id: 1,
    src: '/images/gallery/autosleutel_ford_reservesleutel_bijmaken_utrecht_centrum.webp',
    alt: 'Ford autosleutel reservesleutel bijmaken en programmeren op locatie in Utrecht Centrum',
    width: 520,
    height: 423
  },
  {
    id: 2,
    src: '/images/gallery/autosleutel_hyundai_reservesleutel_programmeren_utrecht_zuid.webp',
    alt: 'Hyundai autosleutel bijmaken en keyless smart key inleren in Utrecht Zuid',
    width: 520,
    height: 414
  },
  {
    id: 3,
    src: '/images/gallery/autosleutel_specialist_mobiele_werkplaats_utrecht_leidsche_rijn.webp',
    alt: 'Autosleutel24 mobiele servicebus met diagnoseapparatuur op locatie in Utrecht Leidsche Rijn',
    width: 520,
    height: 693
  },
  {
    id: 4,
    src: '/images/gallery/autosleutel_audi_reservesleutel_inleren_utrecht_overvecht.webp',
    alt: 'Audi smart key autosleutel inleren op locatie Utrecht Overvecht',
    width: 520,
    height: 402
  },
  {
    id: 5,
    src: '/images/gallery/autosleutel_audi_smartkey_programmeren_utrecht_west.webp',
    alt: 'Audi smartkey reservesleutel programmeren en transponder inleren Utrecht West',
    width: 520,
    height: 340
  },
  {
    id: 6,
    src: '/images/gallery/autosleutel_bmw_reservesleutel_bijmaken_utrecht_oost.webp',
    alt: 'BMW autosleutel reservesleutel bijmaken en programmeren op locatie Utrecht Oost',
    width: 520,
    height: 269
  },
  {
    id: 7,
    src: '/images/gallery/autosleutel_bmw_sleutel_programmeren_amsterdam_centrum.webp',
    alt: 'BMW sleutel programmeren op locatie mobiele service Amsterdam Centrum',
    width: 520,
    height: 385
  },
  {
    id: 8,
    src: '/images/gallery/autosleutel_ford_transit_focus_sleutel_amsterdam_zuid.webp',
    alt: 'Ford Transit bedrijfswagen reservesleutel bijmaken Amsterdam Zuid',
    width: 520,
    height: 689
  },
  {
    id: 9,
    src: '/images/gallery/autosleutel_jeep_reservesleutel_amsterdam_noord.webp',
    alt: 'Jeep autosleutel en keyless entry afstandsbediening programmeren Amsterdam Noord',
    width: 520,
    height: 399
  },
  {
    id: 10,
    src: '/images/gallery/autosleutel_kia_smartkey_bijmaken_amsterdam_west.webp',
    alt: 'Kia smart key autosleutel bijmaken en transponder inleren Amsterdam West',
    width: 520,
    height: 421
  },
  {
    id: 11,
    src: '/images/gallery/autosleutel_mercedes_eis_reservesleutel_amsterdam_oost.webp',
    alt: 'Mercedes EIS contactslot chromen autosleutel bijmaken en inleren Amsterdam Oost',
    width: 520,
    height: 309
  },
  {
    id: 12,
    src: '/images/merken/bmw-autosleutel-bijmaken-b5165f.webp',
    alt: 'Bmw autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 13,
    src: '/images/merken/audi-autosleutel-bijmaken-07ac03.webp',
    alt: 'Audi autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 14,
    src: '/images/merken/audi-autosleutel-bijmaken-bf7dac.webp',
    alt: 'Audi autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 15,
    src: '/images/merken/audi-autosleutel-bijmaken-7ecca1.webp',
    alt: 'Audi autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 16,
    src: '/images/merken/bmw-autosleutel-bijmaken-fdf1ef.webp',
    alt: 'Bmw autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 17,
    src: '/images/merken/bmw-autosleutel-bijmaken-bdf66a.webp',
    alt: 'Bmw autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 18,
    src: '/images/merken/ds-autosleutel-bijmaken-e28ce1.webp',
    alt: 'Ds autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 19,
    src: '/images/merken/fiat-autosleutel-bijmaken-e23cae.webp',
    alt: 'Fiat autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 20,
    src: '/images/merken/fiat-autosleutel-bijmaken-0d206b.webp',
    alt: 'Fiat autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 21,
    src: '/images/merken/fiat-autosleutel-bijmaken-565810.webp',
    alt: 'Fiat autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 22,
    src: '/images/merken/ford-autosleutel-bijmaken-39f551.webp',
    alt: 'Ford autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 23,
    src: '/images/merken/ford-autosleutel-bijmaken-a8b252.webp',
    alt: 'Ford autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 24,
    src: '/images/merken/ford-autosleutel-bijmaken-9ab5b5.webp',
    alt: 'Ford autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 25,
    src: '/images/merken/hyundai-autosleutel-bijmaken-9e16c3.webp',
    alt: 'Hyundai autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 26,
    src: '/images/merken/hyundai-autosleutel-bijmaken-69c0a1.webp',
    alt: 'Hyundai autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 27,
    src: '/images/merken/jeep-autosleutel-bijmaken-9633a7.webp',
    alt: 'Jeep autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 28,
    src: '/images/merken/jeep-autosleutel-bijmaken-cadb75.webp',
    alt: 'Jeep autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 29,
    src: '/images/merken/land-rover-autosleutel-bijmaken-0aef21.webp',
    alt: 'Land rover autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 30,
    src: '/images/merken/lexus-autosleutel-bijmaken-f15d0b.webp',
    alt: 'Lexus autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 31,
    src: '/images/merken/mazda-autosleutel-bijmaken-033fff.webp',
    alt: 'Mazda autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 32,
    src: '/images/merken/mazda-autosleutel-bijmaken-310866.webp',
    alt: 'Mazda autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 33,
    src: '/images/merken/mercedes-autosleutel-bijmaken-b7cab1.webp',
    alt: 'Mercedes autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 34,
    src: '/images/merken/mini-autosleutel-bijmaken-c87127.webp',
    alt: 'Mini autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 35,
    src: '/images/merken/mini-autosleutel-bijmaken-f3469c.webp',
    alt: 'Mini autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 36,
    src: '/images/merken/nissan-autosleutel-bijmaken-62802a.webp',
    alt: 'Nissan autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 37,
    src: '/images/merken/nissan-autosleutel-bijmaken-8e067f.webp',
    alt: 'Nissan autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 38,
    src: '/images/merken/opel-autosleutel-bijmaken-f47842.webp',
    alt: 'Opel autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 39,
    src: '/images/merken/opel-autosleutel-bijmaken-d3966c.webp',
    alt: 'Opel autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 40,
    src: '/images/merken/peugeot-autosleutel-bijmaken-529b14.webp',
    alt: 'Peugeot autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 41,
    src: '/images/merken/land-rover-autosleutel-bijmaken-b3e980.webp',
    alt: 'Land rover autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 42,
    src: '/images/merken/renault-autosleutel-bijmaken-0413b2.webp',
    alt: 'Renault autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 43,
    src: '/images/merken/renault-autosleutel-bijmaken-8d2b51.webp',
    alt: 'Renault autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 44,
    src: '/images/merken/renault-autosleutel-bijmaken-ab3194.webp',
    alt: 'Renault autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 45,
    src: '/images/merken/saab-autosleutel-bijmaken-803122.webp',
    alt: 'Saab autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 46,
    src: '/images/merken/skoda-autosleutel-bijmaken-2ffc72.webp',
    alt: 'Skoda autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 47,
    src: '/images/merken/skoda-autosleutel-bijmaken-c8d995.webp',
    alt: 'Skoda autosleutel bijmaken en inleren op locatie',
    width: 940,
    height: 788
  },
  {
    id: 48,
    src: '/images/merken/skoda-autosleutel-bijmaken-1fad80.webp',
    alt: 'Skoda autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 49,
    src: '/images/merken/skoda-autosleutel-bijmaken-0b4b09.webp',
    alt: 'Skoda autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 50,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-7193be.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 51,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-cb109c.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 52,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-9def1d.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 53,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-f07ca9.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 54,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-77fa20.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  },
  {
    id: 55,
    src: '/images/merken/volkswagen-autosleutel-bijmaken-c05d49.webp',
    alt: 'Volkswagen autosleutel bijmaken en inleren op locatie',
    width: 1200,
    height: 1006
  }
];
