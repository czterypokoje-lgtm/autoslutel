const fs = require('fs');
let content = fs.readFileSync('src/app/api/admin/jobs/[id]/route.ts', 'utf8');

const fields = [
  'revenue_callout', 'revenue_materials', 'revenue_labor', 'revenue_discount',
  'cost_materials', 'cost_technician', 'cost_travel', 'cost_payment_fee', 'cost_other'
];

let addedLines = [];
for (const field of fields) {
  addedLines.push(`
  if ('${field}' in body) {
    const value = price(body.${field});
    if (value === 'invalid') {
      return NextResponse.json({ error: 'Ongeldig bedrag voor ${field}' }, { status: 400 });
    }
    patch.${field} = value;
  }
`);
}

content = content.replace(
  "  if ('final_price' in body) {",
  addedLines.join('') + "\n  if ('final_price' in body) {"
);

// Also add to the returning select
content = content.replace(
  "'id, status, technician_id, scheduled_date, slot_start, slot_end, final_price, notes, started_at, completed_at'",
  "'id, status, technician_id, scheduled_date, slot_start, slot_end, final_price, notes, started_at, completed_at, gross_margin'"
);

fs.writeFileSync('src/app/api/admin/jobs/[id]/route.ts', content);
