const fs = require('fs');

let cat = fs.readFileSync('src/lib/catalog.ts', 'utf8');

// Update getProducts to accept 'all'
cat = cat.replace(
  /export function getProducts\(audience: Audience = 'public'\): CatalogProduct\[\] \{/g,
  "export function getProducts(audience: Audience | 'all' = 'public'): CatalogProduct[] {"
);

cat = cat.replace(
  /return catalog\.products\.filter\(\(p\) => p\.audience === audience\);/g,
  "return audience === 'all' ? catalog.products : catalog.products.filter((p) => p.audience === audience);"
);

fs.writeFileSync('src/lib/catalog.ts', cat);
