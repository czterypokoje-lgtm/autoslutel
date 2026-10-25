import { isFlyer } from '@/lib/jobPhotos';

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
   * Real job photographs only (25 Oct 2026): the eight staged city images
   * (Breda, Gouda, Zaandam, ...) are out, the 15 job photos in
   * public/images/gallery that were never listed are in.
   */
  {
    id: 56,
    src: '/images/gallery/autosleutel_mercedes_benz_sleutel_programmeren_almere_centrum.webp',
    alt: 'Mercedes-Benz sleutel geprogrammeerd op locatie in Almere Centrum',
    width: 520,
    height: 425
  },
  {
    id: 57,
    src: '/images/gallery/autosleutel_nissan_qashqai_sleutel_bijmaken_almere_stad.webp',
    alt: 'Nissan Qashqai sleutel bijgemaakt op locatie in Almere Stad',
    width: 520,
    height: 385
  },
  {
    id: 58,
    src: '/images/gallery/autosleutel_nissan_reservesleutel_almere_poort.webp',
    alt: 'Nissan reservesleutel gemaakt op locatie in Almere Poort',
    width: 520,
    height: 385
  },
  {
    id: 59,
    src: '/images/gallery/autosleutel_opel_astra_reservesleutel_almere_buiten.webp',
    alt: 'Opel Astra reservesleutel gemaakt op locatie in Almere Buiten',
    width: 520,
    height: 399
  },
  {
    id: 60,
    src: '/images/gallery/autosleutel_opel_corsa_sleutel_bijmaken_almere_haven.webp',
    alt: 'Opel Corsa sleutel bijgemaakt op locatie in Almere Haven',
    width: 520,
    height: 385
  },
  {
    id: 61,
    src: '/images/gallery/autosleutel_porsche_911_macan_sleutel_amersfoort_vathorst.webp',
    alt: 'Porsche sleutel bijgemaakt op locatie in Amersfoort Vathorst',
    width: 520,
    height: 385
  },
  {
    id: 62,
    src: '/images/gallery/autosleutel_porsche_cayenne_sleutel_bijmaken_amersfoort_centrum.webp',
    alt: 'Porsche Cayenne sleutel bijgemaakt op locatie in Amersfoort Centrum',
    width: 520,
    height: 385
  },
  {
    id: 63,
    src: '/images/gallery/autosleutel_porsche_panamera_reservesleutel_amersfoort_noord.webp',
    alt: 'Porsche Panamera reservesleutel gemaakt op locatie in Amersfoort Noord',
    width: 520,
    height: 390
  },
  {
    id: 64,
    src: '/images/gallery/autosleutel_porsche_reservesleutel_amersfoort_zuid.webp',
    alt: 'Porsche reservesleutel gemaakt op locatie in Amersfoort Zuid',
    width: 520,
    height: 336
  },
  {
    id: 65,
    src: '/images/gallery/autosleutel_porsche_smartkey_bijmaken_amersfoort_west.webp',
    alt: 'Porsche smart key bijgemaakt op locatie in Amersfoort West',
    width: 520,
    height: 390
  },
  {
    id: 66,
    src: '/images/gallery/autosleutel_skoda_octavia_reservesleutel_hilversum.webp',
    alt: 'Skoda reservesleutel gemaakt op locatie in Hilversum',
    width: 520,
    height: 352
  },
  {
    id: 67,
    src: '/images/gallery/autosleutel_toyota_corolla_reservesleutel_zeist.webp',
    alt: 'Toyota Corolla reservesleutel gemaakt op locatie in Zeist',
    width: 520,
    height: 427
  },
  {
    id: 68,
    src: '/images/gallery/autosleutel_volkswagen_golf_reservesleutel_maarssen.webp',
    alt: 'Volkswagen Golf reservesleutel gemaakt op locatie in Maarssen',
    width: 520,
    height: 408
  },
  {
    id: 69,
    src: '/images/gallery/autosleutel_volkswagen_polo_sleutel_programmeren_houten.webp',
    alt: 'Volkswagen sleutel geprogrammeerd op locatie in Houten',
    width: 520,
    height: 390
  },
  {
    id: 70,
    src: '/images/gallery/autosleutel_volvo_xc60_v40_sleutel_bijmaken_nieuwegein.webp',
    alt: 'Volvo XC60 sleutel bijgemaakt op locatie in Nieuwegein',
    width: 520,
    height: 390
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
// Ids 12-55 are flyers, not photographs; see isFlyer.
].filter((p) => !isFlyer(p.src));
