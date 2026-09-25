const fs = require('fs');
let content = fs.readFileSync('src/app/admin/rapportage/page.tsx', 'utf8');

// 1. Add to Promise.all
content = content.replace(
  "const [source, service, response, technician, region, make, makeRegion, commission, capabilityGap] = await Promise.all([",
  "const [source, service, response, technician, region, make, makeRegion, commission, capabilityGap, finance] = await Promise.all([\n    supabase.from('erp_report_finance_monthly').select('*').order('month', { ascending: false }).limit(12),"
);

// 2. Add to failed checks
content = content.replace(
  "    capabilityGap,\n  ].find((r) => r.error);",
  "    capabilityGap,\n    finance,\n  ].find((r) => r.error);"
);

// 3. Add to UI
const insertionPoint = "vijf getallen die een beslissing veranderen\n        </span>\n      </div>";

const financeSection = `
      <div className={styles.panel} style={{ marginBottom: 48, borderColor: '#0ea5e9' }}>
        <h2 style={{ color: '#0369a1' }}>ERP Financiële Rapportage (Job Costing)</h2>
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Maand</th>
                <th style={{ textAlign: 'right' }}>Afg. Klussen</th>
                <th style={{ textAlign: 'right' }}>Omzet</th>
                <th style={{ textAlign: 'right' }}>Kosten (Mat.)</th>
                <th style={{ textAlign: 'right' }}>Kosten (Loon)</th>
                <th style={{ textAlign: 'right' }}>Kosten (Overig)</th>
                <th style={{ textAlign: 'right', fontWeight: 700 }}>Brutowinst</th>
                <th style={{ textAlign: 'right', fontWeight: 700 }}>Marge %</th>
              </tr>
            </thead>
            <tbody>
              {(finance.data || []).map((row: any) => {
                const rev = Number(row.total_revenue) || 0;
                const margin = Number(row.total_gross_margin) || 0;
                const pct = rev > 0 ? Math.round((margin / rev) * 100) : 0;
                return (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td style={{ textAlign: 'right' }}>{row.completed_jobs}</td>
                    <td style={{ textAlign: 'right' }}>{MONEY.format(rev)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_material_cost)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_labor_cost)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{MONEY.format(row.total_travel_cost + row.total_other_costs)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: margin > 0 ? '#059669' : '#dc2626' }}>{MONEY.format(margin)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: pct >= 50 ? '#059669' : pct >= 30 ? '#d97706' : '#dc2626' }}>{pct}%</td>
                  </tr>
                );
              })}
              {(!finance.data || finance.data.length === 0) && (
                <tr><td colSpan={8} className={styles.empty}>Nog geen ERP-klussen met kostprijsgegevens.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
`;

content = content.replace(insertionPoint, insertionPoint + "\n" + financeSection);

fs.writeFileSync('src/app/admin/rapportage/page.tsx', content);
