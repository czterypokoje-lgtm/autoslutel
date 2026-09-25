const fs = require('fs');

// Update InvoiceForm.tsx
let form = fs.readFileSync('src/app/admin/facturen/InvoiceForm.tsx', 'utf8');

// Add props
form = form.replace(
  "  initial?: InvoiceFormValues;\n}) {",
  "  initial?: InvoiceFormValues;\n  previousClients?: any[];\n}) {"
);

const onClientSelect = `
  function handleClientSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!val) return;
    const client = previousClients?.find(c => c.client_name === val);
    if (client) {
      setClientName(client.client_name || '');
      setClientStreet(client.client_street || '');
      setClientPostcode(client.client_postcode || '');
      setClientCity(client.client_city || '');
      setClientEmail(client.client_email || '');
      setClientPhone(client.client_phone || '');
      setClientBtw(client.client_btw || '');
    }
  }
`;

form = form.replace(
  "  const isEdit = Boolean(invoiceId);",
  "  const isEdit = Boolean(invoiceId);\n" + onClientSelect
);

// Add the selector to the UI
const clientNameInput = `
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className={styles.fieldLabel} htmlFor="cn" style={{ margin: 0 }}>Naam / Bedrijf *</label>
                {previousClients && previousClients.length > 0 && (
                  <select onChange={handleClientSelect} style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#334155', maxWidth: 200 }}>
                    <option value="">-- Kies bekende klant --</option>
                    {previousClients.map((c, i) => (
                      <option key={i} value={c.client_name}>{c.client_name}</option>
                    ))}
                  </select>
                )}
              </div>
              <input
                id="cn"
                className={styles.control}
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
`;

form = form.replace(
  /<div className=\{styles\.field\} style=\{\{ gridColumn: '1 \/ -1' \}\}>\s*<label className=\{styles\.fieldLabel\} htmlFor="cn">Naam \/ Bedrijf \*<\/label>\s*<input\s*id="cn"\s*className=\{styles\.control\}\s*required\s*value=\{clientName\}\s*onChange=\{\(e\) => setClientName\(e\.target\.value\)\}\s*\/>\s*<\/div>/g,
  clientNameInput
);

fs.writeFileSync('src/app/admin/facturen/InvoiceForm.tsx', form);


// Update facturen/nieuw/page.tsx
let nieuwPage = fs.readFileSync('src/app/admin/facturen/nieuw/page.tsx', 'utf8');

const fetchClients = `
  const { data: clients } = await supabase
    .from('sales_invoices')
    .select('client_name, client_street, client_postcode, client_city, client_email, client_phone, client_btw')
    .not('client_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  const uniqueClients = Array.from(new Map(
    (clients || []).map(c => [c.client_name, c])
  ).values());
`;

nieuwPage = nieuwPage.replace(
  "const technicians =",
  fetchClients + "\n\n  const technicians ="
);

nieuwPage = nieuwPage.replace(
  "          iban: SITE_CONFIG.iban,\n        }}",
  "          iban: SITE_CONFIG.iban,\n        }}\n        previousClients={uniqueClients}"
);

fs.writeFileSync('src/app/admin/facturen/nieuw/page.tsx', nieuwPage);
