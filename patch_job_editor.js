const fs = require('fs');
let content = fs.readFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', 'utf8');

// Update JobDetail
const newFields = `
  revenue_callout: number | null;
  revenue_materials: number | null;
  revenue_labor: number | null;
  revenue_discount: number | null;
  cost_materials: number | null;
  cost_technician: number | null;
  cost_travel: number | null;
  cost_payment_fee: number | null;
  cost_other: number | null;
  gross_margin: number | null;
`;

content = content.replace('  completed_at: string | null;\n}', '  completed_at: string | null;' + newFields + '}');

fs.writeFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', content);
