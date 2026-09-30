const fs = require('fs');
const file = 'src/app/admin/vandaag/vandaag.module.css';
let content = fs.readFileSync(file, 'utf8');

// Replace card border
content = content.replace(/\.card\s*\{[\s\S]*?\}/, `.card {
  background: var(--crm-panel);
  border: 1px solid var(--crm-rule);
  border-radius: var(--crm-r-lg);
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: var(--crm-shadow);
}`);

fs.writeFileSync(file, content);
