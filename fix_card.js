const fs = require('fs');
const path = 'src/components/webshop/ProductCardList.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('id: string;', 'id: string;\n  slug: string;');
content = content.replace(
  'export default function ProductCard({ id, title, category, price, oldPrice, img, isBestOf }: ProductCardProps) {',
  'export default function ProductCard({ id, slug, title, category, price, oldPrice, img, isBestOf }: ProductCardProps) {'
);
content = content.replace(/slugify\(title\)/g, 'slug');
fs.writeFileSync(path, content);
