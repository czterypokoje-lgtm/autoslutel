const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = '/Users/ik/.gemini/antigravity/scratch/autosleutel/public/images/';
const files = fs.readdirSync(dir).filter(f => f.startsWith('autosleutel-bijmaken-') && (f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.png')));

async function processImages() {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const parsed = path.parse(file);
    const targetWebpPath = path.join(dir, parsed.name + '.webp');
    const tempPath = path.join(dir, 'temp_' + parsed.name + '.webp');
    
    console.log(`Processing ${file}...`);
    try {
      await sharp(fullPath)
        .webp({ quality: 75 })
        .toFile(tempPath);
      
      fs.renameSync(tempPath, targetWebpPath);
      if (fullPath !== targetWebpPath) {
        fs.unlinkSync(fullPath);
      }
      console.log(`Success: ${parsed.name}.webp`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

processImages();
