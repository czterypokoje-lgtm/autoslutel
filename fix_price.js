const fs = require('fs');

// 2. Update page.tsx
let page = fs.readFileSync('src/app/webshop/product/[slug]/page.tsx', 'utf8');
page = page.replace(/price={formatPrice\(sellPrice\)}/g, "price={sellPrice}");
page = page.replace(/oldPrice={oldPriceNum \? formatPrice\(oldPriceNum\) : ''}/g, "oldPrice={oldPriceNum || 0}");

fs.writeFileSync('src/app/webshop/product/[slug]/page.tsx', page);
