const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const desktopDir = path.join(__dirname, '..', 'raw_images');
const outputDir = path.join(__dirname, 'public', 'images', 'merken');

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Brand mapping for weird names
const brandMapping = {
  'ww': 'volkswagen',
  'ds': 'ds', // Or ds-automobiles
  'landrover': 'land-rover',
  'rangerover': 'land-rover',
  'mini': 'mini',
  'audi': 'audi',
  'bmw': 'bmw',
  'fiat': 'fiat',
  'ford': 'ford',
  'hyundai': 'hyundai',
  'jeep': 'jeep',
  'lexus': 'lexus',
  'mazda': 'mazda',
  'mercedes': 'mercedes',
  'nissan': 'nissan',
  'opel': 'opel',
  'peugeot': 'peugeot',
  'renault': 'renault',
  'saab': 'saab',
  'skoda': 'skoda',
};

async function processImages() {
  const files = fs.readdirSync(desktopDir).filter(f => f.match(/\.(png|jpe?g)$/i));
  const newFiles = [];
  console.log(`Found ${files.length} images to process.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(desktopDir, file);
    
    // Extract brand from filename (e.g., 'audireklam24.png' -> 'audi')
    const lowerFile = file.toLowerCase().trim();
    let detectedBrand = null;
    
    for (const [key, slug] of Object.entries(brandMapping)) {
      if (lowerFile.startsWith(key)) {
        detectedBrand = slug;
        break;
      }
    }
    
    if (!detectedBrand) {
      console.log(`[${i+1}/${files.length}] Could not detect brand for ${file}, skipping.`);
      continue;
    }
    
    // Generate SEO friendly filename
    const uuid = crypto.randomBytes(3).toString('hex');
    const newFilename = `${detectedBrand}-autosleutel-bijmaken-${uuid}.webp`;
    const outputPath = path.join(outputDir, newFilename);
    
    console.log(`[${i+1}/${files.length}] Starting ${file} -> ${newFilename}`);
    
    // Process image
    await sharp(inputPath)
      .resize({ width: 1200, withoutEnlargement: true }) // resize to max 1200px width to speed it up
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`[${i+1}/${files.length}] Processed ${file} -> ${newFilename}`);
    
    const capitalizedBrand = detectedBrand.charAt(0).toUpperCase() + detectedBrand.slice(1).replace('-', ' ');
    newFiles.push({
      src: `/images/merken/${newFilename}`,
      alt: `${capitalizedBrand} autosleutel bijmaken en inleren op locatie`
    });
  }

  // Write the new gallery config additions to a temp file
  const outPath = path.join(__dirname, 'new_gallery_entries.json');
  fs.writeFileSync(outPath, JSON.stringify(newFiles, null, 2));
  console.log(`Successfully generated ${newFiles.length} images. Data saved to ${outPath}`);
}

processImages().catch(console.error);
