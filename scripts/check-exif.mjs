import { ExifTool } from 'exiftool-vendored';

const exiftool = new ExifTool();

async function check() {
  const tags = await exiftool.read('public/images/merken/porsche-autosleutel-bijmaken-utrecht-25.webp');
  console.log('--- EXIF TAGS ---');
  console.log('GPS Latitude:', tags.GPSLatitude);
  console.log('GPS Longitude:', tags.GPSLongitude);
  console.log('Description:', tags.Description);
  console.log('Author:', tags.Author);
  await exiftool.end();
}

check().catch(console.error);
