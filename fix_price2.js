const fs = require('fs');

let buyBox = fs.readFileSync('src/components/webshop/ProductBuyBox.tsx', 'utf8');
buyBox = "import { formatPrice } from '@/lib/catalog';\n" + buyBox;
fs.writeFileSync('src/components/webshop/ProductBuyBox.tsx', buyBox);

let page = fs.readFileSync('src/app/webshop/product/[slug]/page.tsx', 'utf8');
page = page.replace(/price=\{sellPrice\}/g, "price={sellPrice || 0}");
fs.writeFileSync('src/app/webshop/product/[slug]/page.tsx', page);
