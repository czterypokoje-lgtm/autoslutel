const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('src/lib/catalog.json', 'utf8'));

// We only want A-Key products (we can assume all products in catalog are a-key for now, 
// or if we have other brands, filter them. Actually, all scraped products right now are a-key).
// Let's create CSV content
let csv = 'Title;Category;Subcategory;Brand;Makes;Price\n';

for (const p of catalog.products) {
  // Replace quotes to prevent CSV breaking, or just properly escape them
  const title = `"${p.title.replace(/"/g, '""')}"`;
  const category = `"${p.category || ''}"`;
  const subcategory = `"${p.subcategory || ''}"`;
  const brand = `"${p.manufacturer || 'A-Key'}"`;
  const makes = `"${(p.makes || []).join(', ')}"`;
  const price = p.costPrice || 0;
  
  csv += `${title};${category};${subcategory};${brand};${makes};${price}\n`;
}

fs.writeFileSync('/Users/ik/.gemini/antigravity/brain/b17f5bff-4af2-435f-812b-032459690c96/akey_products_updated.csv', csv);
console.log("CSV created!");
