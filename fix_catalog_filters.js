const fs = require('fs');
let content = fs.readFileSync('src/components/webshop/CatalogFilters.tsx', 'utf8');

// For the chip finding logic:
content = content.replace(
  'const opt = facets[k]?.find((o) => o.value === v);',
  'const opt = facets[k]?.find((o) => o.value.toLowerCase() === v.toLowerCase());'
);

// For the checkbox checked logic:
content = content.replace(
  'const checked = active[key] === o.value;',
  'const checked = active[key]?.toLowerCase() === o.value.toLowerCase();'
);

// And we want setFilter to use the original case from o.value when toggled, which it already does:
// onChange={() => setFilter(key, o.value)}

fs.writeFileSync('src/components/webshop/CatalogFilters.tsx', content);
