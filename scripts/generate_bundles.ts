import fs from 'fs';
import path from 'path';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

// Our known inventory of batteries to match against
const BATTERY_INVENTORY = [
  { code: 'CR2032', title: 'Panasonic CR2032 3v Lithium Batteries 5 Pack' },
  { code: 'CR2025', title: 'Eunicell CR2025 3v Lithium Batteries 5 Pack' },
  { code: 'CR2016', title: 'Eunicell CR2016 3v Lithium Batteries 5 Pack' },
  { code: 'CR1620', title: 'Auto-XT CR1620 3v Lithium Batteries 5 Pack' },
  { code: 'CR1616', title: 'Eunicell CR1616 3v Lithium Batteries 5 Pack' },
  { code: 'CR2450', title: 'Panasonic CR2450 3v Lithium Batteries 5 Pack' },
  { code: 'CR1225', title: 'Eunicell CR1225 3v Lithium Batteries 5 Pack' },
  { code: 'VL2020', title: 'VL2020 PCB Battery for BMW (180 degrees)' },
  { code: 'VL2330', title: 'Genuine Panasonic Rechargeable Battery VL2330 Model 3V for Land Rover/ Ford Transit (180 Degrees)' },
];

const DEFAULT_BATTERY = BATTERY_INVENTORY[0]; // Fallback to CR2032

async function main() {
  const productsPath = path.join(__dirname, '../src/lib/scraped_products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  // First, let's index the batteries from scraped_products.json to get their price and image
  const batteryDb = new Map();
  for (const inv of BATTERY_INVENTORY) {
    const slug = slugify(inv.title);
    const prod = products.find((p: any) => slugify(p.title) === slug);
    if (prod) {
      batteryDb.set(inv.code, {
        slug: slug,
        title: prod.title,
        price: prod.price || 5.49,
        image: prod.imageOriginalUrl || prod.imageUrl || ''
      });
    } else {
      console.warn(`Warning: Battery product not found in scraped data for ${inv.title}`);
      batteryDb.set(inv.code, {
        slug: slug,
        title: inv.title,
        price: 5.49,
        image: ''
      });
    }
  }

  const bundleMapping: Record<string, any> = {};

  let matchedCount = 0;
  let defaultCount = 0;

  for (const product of products) {
    const slug = slugify(product.title);
    const desc = (product.description || '').toUpperCase();
    
    // Check if the product description mentions a battery
    let matchedBattery = null;
    for (const inv of BATTERY_INVENTORY) {
      if (desc.includes(inv.code)) {
        matchedBattery = batteryDb.get(inv.code);
        break;
      }
    }

    if (matchedBattery) {
      matchedCount++;
    } else {
      // If it's a key fob but doesn't mention battery, or we just want to offer one
      // We will default to CR2032
      matchedBattery = batteryDb.get('CR2032');
      defaultCount++;
    }

    bundleMapping[slug] = {
      battery: matchedBattery
    };
  }

  const outputPath = path.join(__dirname, '../src/lib/bundle_mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(bundleMapping, null, 2));

  console.log(`Successfully generated bundle mapping for ${products.length} products.`);
  console.log(`Matched explicit batteries: ${matchedCount}`);
  console.log(`Defaulted to CR2032: ${defaultCount}`);
}

main().catch(console.error);
