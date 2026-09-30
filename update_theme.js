const fs = require('fs');
const file = 'src/app/admin/theme.css';
let content = fs.readFileSync(file, 'utf8');

// Update variables for a flat, modern eBay-style UI
content = content.replace(/--crm-bg:\s*#[0-9a-fA-F]+;/, '--crm-bg: #ffffff;');
content = content.replace(/--crm-sidebar:\s*#[0-9a-fA-F]+;/, '--crm-sidebar: #ffffff;');
content = content.replace(/--crm-panel:\s*#[0-9a-fA-F]+;/, '--crm-panel: #ffffff;');
content = content.replace(/--crm-sunk:\s*#[0-9a-fA-F]+;/, '--crm-sunk: #f8f9fa;');
content = content.replace(/--crm-raised:\s*#[0-9a-fA-F]+;/, '--crm-raised: #ffffff;');

content = content.replace(/--crm-rule:\s*#[0-9a-fA-F]+;/, '--crm-rule: #f1f3f5;');
content = content.replace(/--crm-rule2:\s*#[0-9a-fA-F]+;/, '--crm-rule2: #e9ecef;');

content = content.replace(/--crm-shadow:\s*0 1px 2px rgba\(16, 24, 40, 0\.05\);/, '--crm-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);');
content = content.replace(/--crm-shadow-lg:\s*0 8px 24px -8px rgba\(16, 24, 40, 0\.14\);/, '--crm-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.05);');

content = content.replace(/--crm-r:\s*10px;/, '--crm-r: 12px;');
content = content.replace(/--crm-r-lg:\s*14px;/, '--crm-r-lg: 16px;');

fs.writeFileSync(file, content);
