const { exiftool } = require('exiftool-vendored');
async function main() {
  await exiftool.write('public/autosleutel-utrecht-specialist-mobiel.webp', {
    GPSLatitude: 52.0907,
    GPSLatitudeRef: 'N',
    GPSLongitude: 5.1214,
    GPSLongitudeRef: 'E',
  });
  await exiftool.end();
  console.log('Done!');
}
main();
