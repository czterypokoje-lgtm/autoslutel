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

const images = [
  {
    source: '/Users/mac/Desktop/Contanct repartie/WhatsApp Image 2026-07-03 at 22.12.19.jpeg',
    outName: 'contactslot-reparatie-werkplaats-utrecht.webp',
    alt: 'Contactslot reparatie Utrecht – demonteren en herstellen van defect contactslot door mobiele slotenmaker Autosleutel24',
    description: 'Professionele contactslot reparatie in Utrecht. Autosleutel24 repareert vastgelopen, defecte of kapotte contactsloten van alle automerken ter plaatse op locatie.',
  },
  {
    source: '/Users/mac/Desktop/Contanct repartie/WhatsApp Image 2026-07-03 at 22.12.20 2.jpeg',
    outName: 'contactslot-reparatie-mobiel-amsterdam.webp',
    alt: 'Contactslot reparatie mobiele service Utrecht Amsterdam – Autosleutel24 repareert vastgelopen contactslot op locatie 24/7',
    description: 'Mobiele contactslot reparatie Utrecht en Amsterdam. Autosleutel24 is 24/7 beschikbaar voor spoed contactslot reparatie en vervanging bij alle automerken.',
  },
];

async function run() {
  for (const img of images) {
    console.log(`\n📸 Processing: ${img.source}`);

    // Write EXIF to source (overwrite original)
    await exiftool.write(img.source, {
      ...GPS,
      ImageDescription: img.alt,
      Description: img.description,
      Subject: ['contactslot reparatie', 'contactslot vervangen', 'autosleutel', 'Utrecht', 'Autosleutel24', 'slotenmaker'],
      Keywords: 'contactslot reparatie, contactslot vervangen, autosleutel, slotenmaker utrecht, autosleutel24',
      Copyright: 'Autosleutel24 Utrecht © 2025',
      Artist: 'Autosleutel24',
      City: 'Utrecht',
      Country: 'Netherlands',
    }, { writeArgs: ['-overwrite_original'] });

    console.log(`  ✅ EXIF written`);

    // Convert to WebP
    const outPath = path.join(OUT_DIR, img.outName);
    await sharp(img.source).webp({ quality: 85 }).toFile(outPath);

    console.log(`  ✅ Saved: ${img.outName}`);
  }

  console.log('\n🎉 All done!');
}

run().catch(console.error).finally(() => exiftool.end());
