const fs = require('fs');

let buyBox = fs.readFileSync('src/components/webshop/ProductBuyBox.tsx', 'utf8');
buyBox = buyBox.replace("import { formatPrice } from '@/lib/catalog';\n'use client';\n", "'use client';\nimport { formatPrice } from '@/lib/catalog';\n");
fs.writeFileSync('src/components/webshop/ProductBuyBox.tsx', buyBox);
