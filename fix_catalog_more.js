const fs = require('fs');
let content = fs.readFileSync('src/lib/catalog.ts', 'utf8');

content = content.replace(
  'if (f.subcategory && p.subcategory !== f.subcategory) return false;',
  'if (f.subcategory && p.subcategory?.toLowerCase() !== f.subcategory.toLowerCase()) return false;'
);

content = content.replace(
  'if (f.manufacturer && p.manufacturer !== f.manufacturer) return false;',
  'if (f.manufacturer && p.manufacturer?.toLowerCase() !== f.manufacturer.toLowerCase()) return false;'
);

content = content.replace(
  'if (f.condition && p.condition !== f.condition) return false;',
  'if (f.condition && p.condition?.toLowerCase() !== f.condition.toLowerCase()) return false;'
);

content = content.replace(
  'if (f.frequency && p.frequency !== f.frequency) return false;',
  'if (f.frequency && p.frequency?.toLowerCase() !== f.frequency.toLowerCase()) return false;'
);

fs.writeFileSync('src/lib/catalog.ts', content);
