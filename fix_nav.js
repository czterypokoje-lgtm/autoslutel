const fs = require('fs');

let content = fs.readFileSync('src/components/webshop/WebshopNavigation.tsx', 'utf8');

// Add useCart hook import
if (!content.includes('useCart')) {
  content = content.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport { useCart } from '@/lib/cart';"
  );
}

// Convert component to Client Component to use useCart? No, it's already "use client" because of useState for mobile menu?
if (!content.includes("'use client'")) {
  content = "'use client';\n" + content;
}

// Add hook call inside WebshopNavigation
if (!content.includes('const { items } = useCart()')) {
  content = content.replace(
    'export default function WebshopNavigation() {',
    'export default function WebshopNavigation() {\n  const { items } = useCart();\n  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);'
  );
}

// Update the Cart link
content = content.replace(
  'href="/webshop/cart"',
  'href="/webshop/winkelmand"'
);

// Update the badge count
content = content.replace(
  '>{0}</span>',
  '>{cartCount}</span>'
);

fs.writeFileSync('src/components/webshop/WebshopNavigation.tsx', content);
