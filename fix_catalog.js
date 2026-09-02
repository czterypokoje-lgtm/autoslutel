const fs = require('fs');
let content = fs.readFileSync('src/lib/catalog.ts', 'utf8');

content = content.replace(
  'if (f.make && !p.makes.includes(f.make)) return false;',
  'if (f.make && !p.makes.some(m => m.toLowerCase() === f.make!.toLowerCase())) return false;'
);

content = content.replace(
  'if (f.category && p.category !== f.category) return false;',
  'if (f.category && p.category?.toLowerCase() !== f.category.toLowerCase()) return false;'
);

fs.writeFileSync('src/lib/catalog.ts', content);
