const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = '/Users/ik/.gemini/antigravity/scratch/autosleutel/public/images/';
const files = fs.readdirSync(dir).filter(f => f.startsWith('autosleutel_bijmaken_') && f.endsWith('.jpg'));

async function processImages() {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    // Parse city name from e.g. autosleutel_bijmaken_amsterdam_oost_v3_1786583083471.jpg
    const match = file.match(/^autosleutel_bijmaken_(.+?)_v\d+_\d+\.jpg$/);
    if (!match) continue;
    
    const citySlug = match[1].replace(/_/g, '-');
    const newFileName = `autosleutel-bijmaken-${citySlug}.webp`;
    const newPath = path.join(dir, newFileName);
    
    console.log(`Processing ${file} -> ${newFileName}...`);
    try {
      await sharp(fullPath)
        .webp({ quality: 80 })
        .toFile(newPath);
      
      // Delete the original jpg
      fs.unlinkSync(fullPath);
      console.log(`Success: ${newFileName}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

processImages();
