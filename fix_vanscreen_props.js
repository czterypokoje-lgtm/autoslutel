const fs = require('fs');
let content = fs.readFileSync('src/app/admin/vandaag/VanScreen.tsx', 'utf8');

content = content.replace(
  "  technicianName,\n  today,\n  vanStock,\n}: {",
  "  technicianName,\n  today,\n  pimProducts,\n}: {"
);

fs.writeFileSync('src/app/admin/vandaag/VanScreen.tsx', content);
