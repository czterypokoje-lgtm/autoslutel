const fs = require('fs');
let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

const financeRow = `
      {/* Finance Overview */}
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <div>
            <h2 style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>Finance Overview</h2>
            <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>1 - 26 Feb 2025</div>
          </div>
          <select style={{fontSize: '13px', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--crm-rule)', background: 'var(--crm-bg)'}}>
            <option>This month</option>
          </select>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px'}}>
          <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Openstaand</div>
              <FileText size={14} color="var(--crm-warn)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.156</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>12 facturen</div>
          </Card>
          
          <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Vervallen</div>
              <Clock size={14} color="var(--crm-stop)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€3.420</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>6 facturen</div>
          </Card>

          <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Omzet (Deze maand)</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€12.480</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 18% tov vorige maand</div>
          </Card>

          <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Uitgaven</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€2.830</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 6% tov vorige maand</div>
          </Card>

          <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Brutowinst</div>
              <Euro size={14} color="var(--crm-ok)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.650</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>77% marge</div>
          </Card>
        </div>
      </div>
`;

code = code.replace('<div className={styles.layoutGrid}>', financeRow + '\n      <div className={styles.layoutGrid}>');

fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
console.log('Finance overview added.');
