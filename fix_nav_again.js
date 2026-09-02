const fs = require('fs');

let content = fs.readFileSync('src/components/webshop/WebshopNavigation.tsx', 'utf8');

content = content.replace(
  "import { useCart } from '@/lib/cart';",
  "import { readCart, CART_EVENT } from '@/lib/cart';\nimport { useEffect } from 'react';"
);

content = content.replace(
  "const { items } = useCart();\n  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);",
  "const [cartCount, setCartCount] = useState(0);\n  useEffect(() => {\n    const update = () => setCartCount(readCart().reduce((acc, i) => acc + i.quantity, 0));\n    update();\n    window.addEventListener(CART_EVENT, update);\n    return () => window.removeEventListener(CART_EVENT, update);\n  }, []);"
);

fs.writeFileSync('src/components/webshop/WebshopNavigation.tsx', content);
