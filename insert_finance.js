const fs = require('fs');

let overview = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

// The start of the kpiStrip
const startToken = '<div className={styles.kpiStrip}>';
const startIdx = overview.indexOf(startToken);

// Finding the end of this particular kpiStrip is tricky with regex.
// The next section is:
// <div className={styles.kpiStrip}>
//   <Card className={styles.actionCenterCard}>
const nextSectionIdx = overview.indexOf('<Card className={styles.actionCenterCard}>', startIdx);
// The </div> closing the first kpiStrip should be right before `nextSectionIdx`
const endIdx = overview.lastIndexOf('</div>', nextSectionIdx);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  const replacement = `
      {/* 1. Top KPI Row (5 Cards) */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px'}}>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><Target size={16} color="var(--crm-ok)"/></div> Leads
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{last7}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#F3E5F5', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#9C27B0"/></div> Quotes
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>12</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 3 deze week</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><Briefcase size={16} color="#2196F3"/></div> Jobs
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{jobsToday.length}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{jobsToday.length - doneToday.length} in uitvoering</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#2196F3"/></div> Invoices
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>14</div>
          <div style={{fontSize: '12px', color: 'var(--crm-stop)'}}>↓ 6 openstaand</div>
        </div></Card>
        <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><CheckCircle size={16} color="var(--crm-ok)"/></div> Betaald
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€4.320</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 12% deze maand</div>
        </div></Card>
      </div>

      {/* 2. Financieel Overzicht */}
      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <div>
            <h2 style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>Financieel Overzicht</h2>
            <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>1 - 26 Feb 2025</div>
          </div>
          <select style={{fontSize: '13px', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--crm-rule)', background: 'var(--crm-bg)'}}>
            <option>Deze maand</option>
          </select>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px'}}>
          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Openstaand</div>
              <FileText size={14} color="var(--crm-warn)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.156</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>12 facturen</div>
          </div></Card>
          
          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Vervallen</div>
              <Clock size={14} color="var(--crm-stop)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€3.420</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>6 facturen</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Omzet (Deze maand)</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€12.480</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 18% tov vorige maand</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Uitgaven</div>
              <div style={{background: '#E8F5E9', padding: '2px 4px', borderRadius: '4px'}}><Target size={12} color="var(--crm-ok)"/></div>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€2.830</div>
            <div style={{fontSize: '11px', color: 'var(--crm-ok)'}}>↑ 6% tov vorige maand</div>
          </div></Card>

          <Card padded><div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: '12px', color: 'var(--crm-muted)', fontWeight: 600}}>Brutowinst</div>
              <Euro size={14} color="var(--crm-ok)"/>
            </div>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€9.650</div>
            <div style={{fontSize: '11px', color: 'var(--crm-muted)'}}>77% marge</div>
          </div></Card>
        </div>
      </div>
      <div className={styles.kpiStrip}>
`;

  overview = overview.substring(0, startIdx) + replacement + overview.substring(nextSectionIdx);
  fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', overview);
  console.log('Replaced correctly!');
} else {
  console.log('Could not find boundaries.', { startIdx, endIdx, nextSectionIdx });
}
