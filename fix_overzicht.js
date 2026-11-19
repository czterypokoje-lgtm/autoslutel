const fs = require('fs');
const file = 'src/app/admin/overzicht/overzicht.module.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/border-left: 4px solid var\(--hero-accent, var\(--crm-rule\)\);/g, 'border-left: none;\n  box-shadow: var(--crm-shadow);');

fs.writeFileSync(file, content);
