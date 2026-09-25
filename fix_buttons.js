const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /Bel \{SITE_CONFIG\.phone\}/,
  'Bel {SITE_CONFIG.phone}'
);

fs.writeFileSync(file, content);
