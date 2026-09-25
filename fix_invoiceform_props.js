const fs = require('fs');
let content = fs.readFileSync('src/app/admin/facturen/InvoiceForm.tsx', 'utf8');

content = content.replace(
  "  invoiceId,\n  initial,\n}: {",
  "  invoiceId,\n  initial,\n  previousClients,\n}: {"
);

fs.writeFileSync('src/app/admin/facturen/InvoiceForm.tsx', content);
