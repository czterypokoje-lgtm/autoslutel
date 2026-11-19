import { exiftool } from 'exiftool-vendored';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'seo');

const GPS = {
  GPSLatitude: 52.0907,
  GPSLatitudeRef: 'N',
  GPSLongitude: 5.1214,
  GPSLongitudeRef: 'E',
};

const BASE = '/Users/mac/Desktop/Autosleutel Repartie';

const images = [
  {
    source: `${BASE}/WhatsApp Image 2026-07-03 at 22.12.20 2.jpeg`,
    outName: 'autosleutels-repareren-werkplaats-utrecht.webp',
    alt: 'Autosleutel repareren Utrecht – Autosleutel24 repareert defecte sleutelbehuizing, knoppen en transponder op locatie',
    description: 'Professionele autosleutel reparatie in Utrecht. Autosleutel24 repareert kapotte knoppen, gebroken behuizingen en defecte transponders van alle merken autosleutels.',
  },
  {
    source: `${BASE}/WhatsApp Image 2026-07-03 at 22.12.20 3.jpeg`,
    outName: 'autosleutels-repareren-inventaris-amsterdam.webp',
    alt: 'Autosleutel reparatie inventaris Utrecht Amsterdam – OEM behuizingen, transponders en reserveonderdelen op voorraad bij Autosleutel24',
    description: 'Grote voorraad OEM autosleutel onderdelen bij Autosleutel24. Behuizingen, knoppen, transponders en batteijen voor alle merken direct leverbaar in Utrecht en Amsterdam.',
  },
  {
    source: `${BASE}/WhatsApp Image 2026-07-03 at 22.12.29.jpeg`,
    outName: 'autosleutels-repareren-onderdelen-almere.webp',
    alt: 'Autosleutel repareren onderdelen Almere Utrecht – reserve sleuteldelen, printplaten en transponders bij Autosleutel24',
    description: 'Autosleutel24 repareert autosleutels met originele onderdelen. Mobiele service in Almere en Utrecht voor reparatie van sleutelbehuizingen en transponders.',
  },
  {
    source: `${BASE}/WhatsApp Image 2026-07-03 at 22.12.30.jpeg`,
    outName: 'autosleutels-repareren-service-amersfoort.webp',
    alt: 'Autosleutels repareren service Amersfoort Utrecht – Autosleutel24 mobiele sleutelreparatie ter plaatse 24/7',
    description: 'Mobiele autosleutel reparatie service in Amersfoort en Utrecht. Autosleutel24 repareert alle soorten autosleutels ter plaatse, ook 24/7 bij noodgevallen.',
  },
];

async function run() {
  for (const img of images) {
    console.log(`\n📸 Processing: ${img.source.split('/').pop()}`);

    await exiftool.write(img.source, {
      ...GPS,
      ImageDescription: img.alt,
      Description: img.description,
      Subject: ['autosleutel repareren', 'sleutel reparatie', 'behuizing', 'transponder', 'Utrecht', 'Autosleutel24'],
      Keywords: 'autosleutel repareren, autosleutel kapot, sleutelbehuizing, transponder reparatie, slotenmaker utrecht',
      Copyright: 'Autosleutel24 Utrecht © 2025',
      Artist: 'Autosleutel24',
      City: 'Utrecht',
      Country: 'Netherlands',
    }, { writeArgs: ['-overwrite_original'] });

    console.log(`  ✅ EXIF written`);

    const outPath = path.join(OUT_DIR, img.outName);
    await sharp(img.source).webp({ quality: 85 }).toFile(outPath);

    console.log(`  ✅ Saved: ${img.outName}`);
  }

  console.log('\n🎉 All 4 images done!');
}

run().catch(console.error).finally(() => exiftool.end());
