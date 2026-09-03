const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('src/lib/catalog.json', 'utf8'));

let csv = 'Title;Category;Subcategory;Brand;Makes;Price;Main_Image;All_Images\n';

for (const p of catalog.products) {
  const title = `"${p.title.replace(/"/g, '""')}"`;
  const category = `"${p.category || ''}"`;
  const subcategory = `"${p.subcategory || ''}"`;
  const brand = `"${p.manufacturer || 'A-Key'}"`;
  const makes = `"${(p.makes || []).join(', ')}"`;
  const price = p.costPrice || 0;
  
  // Images
  const mainImage = `"${p.image || ''}"`;
  const allImages = `"${(p.images || []).join(', ')}"`;
  
  csv += `${title};${category};${subcategory};${brand};${makes};${price};${mainImage};${allImages}\n`;
}

fs.writeFileSync('/Users/ik/.gemini/antigravity/brain/b17f5bff-4af2-435f-812b-032459690c96/akey_products_with_images.csv', csv);
console.log("CSV created!");
