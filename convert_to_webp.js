const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = '/Users/ik/.gemini/antigravity/scratch/autosleutel/public/images/';
const files = fs.readdirSync(dir).filter(f => f.startsWith('autosleutel-bijmaken-') && f.endsWith('.webp'));

async function processImages() {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const tempPath = path.join(dir, 'temp_' + file);
    console.log(`Processing ${file}...`);
    try {
      await sharp(fullPath)
        .webp({ quality: 75 })
        .toFile(tempPath);
      
      fs.renameSync(tempPath, fullPath);
      console.log(`Success: ${file}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

processImages();
