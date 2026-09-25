const fs = require('fs');
let content = fs.readFileSync('src/app/admin/vandaag/VanScreen.tsx', 'utf8');

content = content.replace(
  "{vanStock.filter(s => s.quantity > 0).map(s => (",
  "{pimProducts.slice(0, 50).map(s => ("
);
content = content.replace(
  "<option key={s.id} value={s.description} />",
  "<option key={s.id} value={s.internal_sku} />"
);

fs.writeFileSync('src/app/admin/vandaag/VanScreen.tsx', content);
