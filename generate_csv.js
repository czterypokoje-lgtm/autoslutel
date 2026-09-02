const fs = require('fs');

const products = JSON.parse(fs.readFileSync('src/lib/scraped_products.json', 'utf8'));

let csv = 'Title,Category,Make,Price\n';
products.forEach(p => {
  const title = (p.titleNl || p.title || '').replace(/,/g, '');
  const category = (p.category || '').replace(/,/g, '');
  const make = (p.make || '').replace(/,/g, '');
  const price = p.price || '';
  csv += `${title},${category},${make},${price}\n`;
});

fs.writeFileSync('/Users/ik/.gemini/antigravity/brain/b17f5bff-4af2-435f-812b-032459690c96/akey_products.csv', csv);
