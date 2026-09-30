const fs = require('fs');
const file = 'src/app/admin/theme.css';
let content = fs.readFileSync(file, 'utf8');

// eBay Kleinanzeigen PRO look:
// Super flat, no shadows on cards, very faint borders, white or extremely light grey background.
content = content.replace(/--crm-bg: #[0-9a-fA-F]+;/, '--crm-bg: #fcfcfc;');
content = content.replace(/--crm-shadow: .*;/, '--crm-shadow: none;');
content = content.replace(/--crm-shadow-lg: .*;/, '--crm-shadow-lg: none;');
content = content.replace(/--crm-rule: #[0-9a-fA-F]+;/, '--crm-rule: #e5e7eb;');
content = content.replace(/--crm-rule2: #[0-9a-fA-F]+;/, '--crm-rule2: #d1d5db;');

fs.writeFileSync(file, content);
