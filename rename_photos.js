const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(require('os').homedir(), 'Desktop', 'autosleutel24');
const TARGET_DIR = path.join(process.cwd(), 'public', 'images', 'merken');

const CITIES = ['amsterdam', 'rotterdam', 'den-haag', 'utrecht', 'eindhoven', 'tilburg', 'almere', 'groningen', 'breda', 'nijmegen'];

// Mapping of file prefixes to valid brand slugs
const BRAND_MAPPING = {
  'audi': 'audi',
  'bmw': 'bmw',
  'ds': 'ds',
  'fiat': 'fiat',
  'ford': 'ford',
  'hyundai': 'hyundai',
  'jeep': 'jeep',
  'landrover': 'land-rover',
  'lexus': 'lexus',
  'mazda': 'mazda',
  'mercedes': 'mercedes',
  'mini': 'mini',
  'nissan': 'nissan',
  'opel': 'opel',
  'peugeot': 'peugeot',
  'rangerover': 'land-rover',
  'renault': 'renault',
  'saab': 'saab',
  'skoda': 'skoda',
  'ww': 'volkswagen',
};

async function processPhotos() {
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.match(/\.(png|jpe?g)$/i));
  
  // Group files by brand
  const brandFiles = {};
  
  for (const file of files) {
    let matchedBrand = null;
    const lowerFile = file.toLowerCase();
    
    for (const [prefix, slug] of Object.entries(BRAND_MAPPING)) {
      if (lowerFile.startsWith(prefix)) {
        matchedBrand = slug;
        break;
      }
    }
    
    if (matchedBrand) {
      if (!brandFiles[matchedBrand]) {
        brandFiles[matchedBrand] = [];
      }
      brandFiles[matchedBrand].push(file);
    }
  }
  
  // Process up to 3 photos per brand
  for (const [brandSlug, files] of Object.entries(brandFiles)) {
    const toProcess = files.slice(0, 3);
    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      
      const sourcePath = path.join(SOURCE_DIR, file);
      const ext = path.extname(file);
      const targetFilename = `${brandSlug}-autosleutel-bijmaken-${city}-${i + 1}${ext}`;
      const targetPath = path.join(TARGET_DIR, targetFilename);
      
      console.log(`Copying ${file} -> ${targetFilename}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
  
  console.log('Done processing photos.');
}

processPhotos();
