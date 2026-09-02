import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const AKEY_JSON = './scripts/a-key-scraper/a-key-products.json';
const SCRAPED_JSON = './src/lib/scraped_products.json';
const IMAGES_DIR = './public/images/products';

// Helper to download image
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function run() {
  if (!fs.existsSync(AKEY_JSON)) {
    console.error("No a-key-products.json found!");
    return;
  }
  
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const newProducts = JSON.parse(fs.readFileSync(AKEY_JSON, 'utf8'));
  const existingProducts = JSON.parse(fs.readFileSync(SCRAPED_JSON, 'utf8'));
  
  const startId = Math.max(...existingProducts.map(p => p.id || 0)) + 1;
  let addedCount = 0;
  
  console.log(`Found ${newProducts.length} new products to import...`);
  
  for (let i = 0; i < newProducts.length; i++) {
    const p = newProducts[i];
    
    // Check if we already added it based on title
    if (existingProducts.some(existing => existing.title === p.title)) {
      continue;
    }
    
    const id = startId + addedCount;
    
    // Parse price "34,51 €" -> "34.51"
    let priceMatch = p.price.match(/[\d,.]+/);
    let priceStr = priceMatch ? priceMatch[0].replace(',', '.') : '0.00';
    
    // Create unique filename
    const hash = crypto.createHash('md5').update(p.url).digest('hex').substring(0, 8);
    const ext = p.images[0] ? path.extname(p.images[0].split('?')[0]) || '.jpg' : '.jpg';
    const localFilename = `akey_${id}_${hash}${ext}`;
    const localPath = path.join(IMAGES_DIR, localFilename);
    const dbPath = `/images/products/${localFilename}`;
    
    // Download image if available
    let downloadedImages = [];
    if (p.images && p.images.length > 0) {
      for (let j = 0; j < p.images.length; j++) {
        const ext = path.extname(p.images[j].split('?')[0]) || '.jpg';
        const imgName = `akey_${id}_${hash}_${j}${ext}`;
        const localPath = path.join(IMAGES_DIR, imgName);
        const dbPath = `/images/products/${imgName}`;
        
        try {
          await downloadImage(p.images[j], localPath);
          downloadedImages.push(dbPath);
          process.stdout.write('.');
        } catch (e) {
          console.error(`Failed to download image for ${p.title}:`, e.message);
        }
      }
    }
    
    const tags = p.category.replace('/', '').replace(/-/g, ' ');
    
    existingProducts.push({
      id: id,
      brand: "A-Key",
      title: p.title,
      price: priceStr,
      description: p.description,
      tags: tags,
      imageLocalPath: downloadedImages[0] || null,
      images: downloadedImages,
      imageOriginalUrl: p.images[0] || null
    });
    
    addedCount++;
  }
  
  fs.writeFileSync(SCRAPED_JSON, JSON.stringify(existingProducts, null, 2));
  console.log(`\nImport complete! Added ${addedCount} products to scraped_products.json.`);
}

run();
