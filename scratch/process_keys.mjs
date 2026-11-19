import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = '/Users/ik/Desktop/logos/keys';
const outputDir = path.join(process.cwd(), 'public', 'images', 'keys');

// Create output dir if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  const files = fs.readdirSync(inputDir);
  const brandCounters = {};

  for (const file of files) {
    if (file.startsWith('.')) continue; // skip hidden files

    // Extract brand name. Examples: 'AUDI.webp', 'BMW1.png', 'PEUGEOT 2.jpg', 'land rover.jpg', '126-500x500.webp'
    const parsed = path.parse(file);
    let baseName = parsed.name.toLowerCase();
    
    // Some special cases: '126-500x500.webp' -> fiat
    if (baseName === '126-500x500') {
      baseName = 'fiat';
    }

    // Let's remove any numbers and trailing/leading spaces or hyphens.
    let brandName = baseName.replace(/[0-9]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
    
    if (brandName.endsWith('-')) {
      brandName = brandName.slice(0, -1);
    }
    
    // Fix up some brand names if they are slightly off
    if (brandName === 'citreon') brandName = 'citroen';
    if (brandName === 'land-rover' || brandName === 'landrover' || brandName === 'land') brandName = 'land-rover';
    if (brandName === 'vw') brandName = 'volkswagen';
    if (brandName === 'alfa') brandName = 'alfa-romeo';

    if (!brandName || brandName === '-x') continue; // Skip if empty

    if (!brandCounters[brandName]) {
      brandCounters[brandName] = 1;
    } else {
      brandCounters[brandName]++;
    }

    const newFilename = `${brandName}-autosleutel-bijmaken-${brandCounters[brandName]}.webp`;
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, newFilename);

    try {
      await sharp(inputPath)
        .resize(600, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      console.log(`✅ Processed: ${file} -> ${newFilename}`);
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }
}

main();
