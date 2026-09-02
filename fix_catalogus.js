const fs = require('fs');
const path = 'src/app/webshop/catalogus/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Import the horizontal card component
content = content.replace(
  "import {",
  "import ProductCardList from '@/components/webshop/ProductCardList';\nimport {"
);

// Replace the UL and mapping with ProductCardList
const replacement = `
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pageItems.map((p) => {
                const price = shelfPrice(p.costPrice);
                return (
                  <ProductCardList
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    title={p.titleNl || p.title}
                    category={p.category ? facetLabel('category', p.category) : 'Onderdeel'}
                    price={price ? price.toFixed(2) : '0.00'}
                    img={p.image || '/images/placeholder.png'}
                  />
                );
              })}
            </div>
`;

content = content.replace(
  /<ul[\s\S]*?<\/ul>/,
  replacement.trim()
);

fs.writeFileSync(path, content);
