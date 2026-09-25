const fs = require('fs');

let page = fs.readFileSync('src/app/admin/uitgaven/page.tsx', 'utf8');

// Remove MONEY from import
page = page.replace(
  "import { PageHead, Card, Badge, Empty, MONEY } from '../_ui';",
  "import { PageHead, Card, Badge, Empty } from '../_ui';"
);

// Add local MONEY definition
page = page.replace(
  "const CATEGORIES: Record<string, string> = {",
  "const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });\n\nconst CATEGORIES: Record<string, string> = {"
);

fs.writeFileSync('src/app/admin/uitgaven/page.tsx', page);
