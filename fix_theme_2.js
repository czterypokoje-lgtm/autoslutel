const fs = require('fs');
const file = 'src/app/admin/theme.css';
let content = fs.readFileSync(file, 'utf8');

// Ensure sidebar and bg contrast if needed, or both white. eBay PRO is often white-on-white with soft shadows.
// Let's use #f8f9fa for page background and #ffffff for cards, like modern UIs.
content = content.replace(/--crm-bg: #ffffff;/, '--crm-bg: #f8f9fa;');
content = content.replace(/--crm-sidebar: #ffffff;/, '--crm-sidebar: #ffffff;');
content = content.replace(/--crm-panel: #ffffff;/, '--crm-panel: #ffffff;');

// Subtler shadows
content = content.replace(/--crm-shadow: 0 1px 3px rgba\(0, 0, 0, 0\.04\);/, '--crm-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);');
content = content.replace(/--crm-shadow-lg: 0 4px 12px rgba\(0, 0, 0, 0\.05\);/, '--crm-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.06);');

// Accent can stay orange, but primary buttons can be more modern
// We don't touch accent colors as user says "our icons specially designed, keep our templates".

fs.writeFileSync(file, content);
