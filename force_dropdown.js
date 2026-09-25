const fs = require('fs');
let form = fs.readFileSync('src/app/admin/facturen/InvoiceForm.tsx', 'utf8');

const oldSelect = `{previousClients && previousClients.length > 0 && (
                  <select onChange={handleClientSelect} style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#334155', maxWidth: 200 }}>
                    <option value="">-- Kies bekende klant --</option>
                    {previousClients.map((c, i) => (
                      <option key={i} value={c.client_name}>{c.client_name}</option>
                    ))}
                  </select>
                )}`;

const newSelect = `<select 
                  onChange={handleClientSelect} 
                  disabled={!previousClients || previousClients.length === 0}
                  style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#334155', maxWidth: 200, opacity: (!previousClients || previousClients.length === 0) ? 0.5 : 1 }}
                >
                  {(!previousClients || previousClients.length === 0) ? (
                    <option value="">-- Geen eerdere klanten gevonden --</option>
                  ) : (
                    <>
                      <option value="">-- Kies bekende klant --</option>
                      {previousClients.map((c, i) => (
                        <option key={i} value={c.client_name}>{c.client_name}</option>
                      ))}
                    </>
                  )}
                </select>`;

form = form.replace(oldSelect, newSelect);
fs.writeFileSync('src/app/admin/facturen/InvoiceForm.tsx', form);
