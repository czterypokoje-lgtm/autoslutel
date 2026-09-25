const fs = require('fs');
let content = fs.readFileSync('src/app/admin/facturen/InvoiceForm.tsx', 'utf8');

const originalField = '<Field label="Naam / bedrijf *" value={clientName} onChange={setClientName} autoFocus={!isEdit} />';

const newField = `
            <div className={styles.field} style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className={styles.fieldLabel} htmlFor="cn" style={{ margin: 0 }}>Naam / Bedrijf *</label>
                <select 
                  onChange={handleClientSelect} 
                  disabled={!previousClients || previousClients.length === 0}
                  style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#334155', maxWidth: 200, opacity: (!previousClients || previousClients.length === 0) ? 0.5 : 1 }}
                >
                  {(!previousClients || previousClients.length === 0) ? (
                    <option value="">-- Geen eerdere klanten --</option>
                  ) : (
                    <>
                      <option value="">-- Kies bekende klant --</option>
                      {previousClients.map((c, i) => (
                        <option key={i} value={c.client_name}>{c.client_name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <input
                id="cn"
                className={styles.control}
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                autoFocus={!isEdit}
              />
            </div>
`;

content = content.replace(originalField, newField);
fs.writeFileSync('src/app/admin/facturen/InvoiceForm.tsx', content);
