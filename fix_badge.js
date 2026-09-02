const fs = require('fs');
let content = fs.readFileSync('src/components/webshop/WebshopNavigation.tsx', 'utf8');

content = content.replace(
  '>0</span>',
  '>{cartCount}</span>'
);

fs.writeFileSync('src/components/webshop/WebshopNavigation.tsx', content);
