const fs = require('fs');
let content = fs.readFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', 'utf8');

const costingUI = `
        <h2 style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>ERP: Financiën & Kosten (Job Costing)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Omzet (Revenue)</h3>
            
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Oproep / Voorrijkosten (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revCallout} onChange={e => setRevCallout(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Materialen (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revMaterials} onChange={e => setRevMaterials(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Arbeid / Programmeren (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revLabor} onChange={e => setRevLabor(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.fieldLabel}>Korting (€)</label>
              <input className={styles.control} type="number" step="0.01" value={revDiscount} onChange={e => setRevDiscount(e.target.value)} />
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8 }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 12 }}>Kosten (Costs)</h3>
            
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Kostprijs Materialen (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costMaterials} onChange={e => setCostMaterials(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Monteur / Loon (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costTech} onChange={e => setCostTech(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Reis / Brandstof (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costTravel} onChange={e => setCostTravel(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 8 }}>
              <label className={styles.fieldLabel}>Transactiekosten (Mollie/Pin) (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costFee} onChange={e => setCostFee(e.target.value)} />
            </div>
            <div className={styles.field} style={{ marginBottom: 0 }}>
              <label className={styles.fieldLabel}>Overige Kosten (€)</label>
              <input className={styles.control} type="number" step="0.01" value={costOther} onChange={e => setCostOther(e.target.value)} />
            </div>
          </div>
        </div>

        {job.gross_margin !== null && (
          <div style={{ background: job.gross_margin > 0 ? '#ecfdf5' : '#fef2f2', border: '1px solid', borderColor: job.gross_margin > 0 ? '#10b981' : '#ef4444', padding: 16, borderRadius: 8, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: job.gross_margin > 0 ? '#065f46' : '#991b1b' }}>Gross Margin (Brutowinst)</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: job.gross_margin > 0 ? '#059669' : '#dc2626' }}>
              {job.gross_margin > 0 ? '+' : ''}€{Number(job.gross_margin).toFixed(2)}
            </span>
          </div>
        )}
`;

content = content.replace(
  "        <div className={styles.actions}>",
  costingUI + "\n        <div className={styles.actions}>"
);

fs.writeFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', content);
