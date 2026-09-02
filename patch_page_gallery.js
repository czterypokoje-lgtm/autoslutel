const fs = require('fs');

let page = fs.readFileSync('src/app/webshop/product/[slug]/page.tsx', 'utf8');

// Add import
if (!page.includes('ProductGallery')) {
  page = page.replace(
    /import ProductAccordions from '@\/components\/webshop\/ProductAccordions';/g,
    "import ProductAccordions from '@/components/webshop/ProductAccordions';\nimport ProductGallery from '@/components/webshop/ProductGallery';"
  );
}

// Replace simple img tag with ProductGallery
page = page.replace(
  /<div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>\s*{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/}\s*<img\s*src={entry\.image \?\? '\/images\/bmw-key-desktop\.png'}\s*alt={entry\.titleNl}\s*style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}\s*\/>\s*<\/div>/g,
  `<ProductGallery images={entry.images && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : ['/images/bmw-key-desktop.png'])} />`
);

fs.writeFileSync('src/app/webshop/product/[slug]/page.tsx', page);
