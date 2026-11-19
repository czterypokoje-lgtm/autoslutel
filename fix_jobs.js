const fs = require('fs');
const file = 'src/app/admin/jobs/jobs.module.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/border-left: 3px solid var\(--crm-rule2\);/g, 'border-left: none;\n  box-shadow: var(--crm-shadow);');

fs.writeFileSync(file, content);
