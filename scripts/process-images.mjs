import { ExifTool } from 'exiftool-vendored';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const exiftool = new ExifTool();

const srcDir = '/Users/mac/Desktop/carss';
const destDirMerken = path.join(process.cwd(), 'public', 'images', 'merken');
const destDirDiensten = path.join(process.cwd(), 'public', 'images', 'diensten');

const UTRECHT_LAT = 52.0907;
const UTRECHT_LON = 5.1214;

// SEO Mapping
const BRAND_MAP = {
  porshe: 'porsche',
  proshe: 'porsche',
  mercedes: 'mercedes-benz',
  bmw: 'bmw',
  audi: 'audi',
  citroen: 'citroen',
  cittoren: 'citroen',
  ford: 'ford',
  hyundai: 'hyundai',
  suziki: 'suzuki',
  suzuki: 'suzuki',
  jeep: 'jeep',
  kia: 'kia',
  mitshubishi: 'mitsubishi',
  mitsubishi: 'mitsubishi',
  nissan: 'nissan',
  opel: 'opel',
  reanult: 'renault',
  renault: 'renault',
  skoada: 'skoda',
  skoda: 'skoda',
  toyota: 'toyota',
  toyoto: 'toyota',
  volvo: 'volvo',
  vw: 'volkswagen',
  volkswagen: 'volkswagen'
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function processImages() {
  await ensureDir(destDirMerken);
  await ensureDir(destDirDiensten);
  
  const files = await fs.readdir(srcDir);
  
  let i = 1;
  for (const file of files) {
    if (file === '.DS_Store') continue;
    
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
    
    const basename = path.basename(file, ext).toLowerCase();
    const srcPath = path.join(srcDir, file);
    
    // Determine brand
    let detectedBrand = null;
    for (const [key, val] of Object.entries(BRAND_MAP)) {
      if (basename.includes(key)) {
        detectedBrand = val;
        break;
      }
    }
    
    let seoName = '';
    let description = '';
    let destFolder = destDirMerken;
    
    if (detectedBrand) {
      if (basename.includes('autodoor openen') || basename.includes('openen')) {
        seoName = `${detectedBrand}-auto-openen-zonder-sleutel-utrecht-${i}.webp`;
        description = `${detectedBrand} auto schadevrij openen in Utrecht. Autosleutel24 Mobiele Service. Gecertificeerde noodhulp voor afgesloten ${detectedBrand} voertuigen.`;
      } else {
        seoName = `${detectedBrand}-autosleutel-bijmaken-utrecht-${i}.webp`;
        description = `${detectedBrand} autosleutel bijmaken en inleren op locatie in Utrecht. Autosleutel24 is dé specialist in reservesleutels voor alle ${detectedBrand} modellen.`;
      }
    } else {
      // General or equipment
      seoName = `autosleutel-specialist-uitrusting-utrecht-${i}.webp`;
      description = `Geavanceerde apparatuur voor het kopiëren en programmeren van autosleutels. Autosleutel24 Utrecht.`;
      destFolder = destDirDiensten;
    }
    
    const finalDestPath = path.join(destFolder, seoName);
    
    console.log(`Processing: ${file} -> ${seoName}`);
    
    // 1. Convert to WebP using sharp
    await sharp(srcPath)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(finalDestPath);
      
    // 2. Inject EXIF / GPS data into WebP
    await exiftool.write(finalDestPath, {
      GPSLatitude: UTRECHT_LAT,
      GPSLatitudeRef: 'N',
      GPSLongitude: UTRECHT_LON,
      GPSLongitudeRef: 'E',
      ImageDescription: description,
      'Description': description,
      Author: 'Autosleutel24',
      Copyright: 'Autosleutel24',
      Title: seoName.replace(/-/g, ' ').replace('.webp', '')
    });
    
    // Cleanup Exiftool backup file
    try {
      await fs.unlink(`${finalDestPath}_original`);
    } catch(e) {}
    
    i++;
  }
  
  await exiftool.end();
  console.log('All images processed and EXIF-injected!');
}

processImages().catch(console.error);
