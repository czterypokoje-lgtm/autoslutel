import { exiftool } from 'exiftool-vendored';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE = '/Users/mac/Documents/start-stop-portal-1278555686.jpeg';
const DEST_NAME = 'smart-key-keyless-programmeren-autosleutel24-utrecht.webp';
const DEST = path.join(__dirname, '..', 'public', 'images', 'seo', DEST_NAME);

const SEO_ALT = 'Smart key en keyless-go start-stop knop programmeren en inleren door Autosleutel24 mobiele specialist in Utrecht - push-to-start reparatie alle merken';
const DESCRIPTION = 'Smart key keyless-go start-stop portaal programmering en inleren door Autosleutel24 Utrecht. Mobiele specialist voor BMW, Mercedes, Audi, Volkswagen en alle merken. 24/7 service.';

// Utrecht GPS coordinates
const GPS = {
  GPSLatitude: 52.0907,
  GPSLatitudeRef: 'N',
  GPSLongitude: 5.1214,
  GPSLongitudeRef: 'E',
};

async function run() {
  console.log('📸 Adding EXIF GPS + SEO metadata...');
  
  // First inject EXIF into source file (needs a temp copy to work with exiftool)
  const tempPath = SOURCE.replace('.jpeg', '_temp_seo.jpeg');
  
  await exiftool.write(SOURCE, {
    ...GPS,
    ImageDescription: SEO_ALT,
    Description: DESCRIPTION,
    Subject: ['Smart Key', 'Keyless Go', 'Start Stop', 'Autosleutel', 'Utrecht', 'Autosleutel24', 'Push to Start'],
    Keywords: 'smart key programmeren, keyless go inleren, start stop knop, autosleutel bijmaken utrecht, Autosleutel24',
    Copyright: 'Autosleutel24 Utrecht © 2025',
    Artist: 'Autosleutel24',
    City: 'Utrecht',
    Country: 'Netherlands',
    XPTitle: SEO_ALT,
    XPComment: DESCRIPTION,
  }, { writeArgs: ['-overwrite_original'] });
  
  console.log('✅ EXIF metadata written');

  // Convert to WebP with good quality
  await sharp(SOURCE)
    .webp({ quality: 85 })
    .toFile(DEST);

  console.log(`✅ Converted to WebP: ${DEST_NAME}`);
  console.log('🎉 Done! Ready to use in website.');
}

run().catch(console.error).finally(() => exiftool.end());
