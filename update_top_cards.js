const fs = require('fs');

let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

const oldTopRow = /<div className=\{styles\.kpiGrid\}>[\s\S]*?<\/div>\s*<div className=\{styles\.layoutGrid\}>/m;

const newTopRow = `<div className={styles.kpiGrid} style={{gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '24px'}}>
        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><Target size={16} color="var(--crm-ok)"/></div> Leads
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{totalLeads}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 2 vandaag</div>
        </Card>
        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#F3E5F5', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#9C27B0"/></div> Quotes
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>12</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 3 deze week</div>
        </Card>
        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><Briefcase size={16} color="#2196F3"/></div> Jobs
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>{activeJobs}</div>
          <div style={{fontSize: '12px', color: 'var(--crm-muted)'}}>{Math.max(0, activeJobs - 2)} in uitvoering</div>
        </Card>
        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E3F2FD', padding: '6px', borderRadius: '50%'}}><FileText size={16} color="#2196F3"/></div> Invoices
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>14</div>
          <div style={{fontSize: '12px', color: 'var(--crm-stop)'}}>↓ 6 openstaand</div>
        </Card>
        <Card padded style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crm-muted)', fontSize: '13px', fontWeight: 600}}>
            <div style={{background: '#E8F5E9', padding: '6px', borderRadius: '50%'}}><CheckCircle size={16} color="var(--crm-ok)"/></div> Betaald
          </div>
          <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--crm-ink)'}}>€4.320</div>
          <div style={{fontSize: '12px', color: 'var(--crm-ok)'}}>↑ 12% deze maand</div>
        </Card>
      </div>

      <div className={styles.layoutGrid}>`;

code = code.replace(oldTopRow, newTopRow);

if (!code.includes('CheckCircle')) {
  code = code.replace("import { Users, Briefcase, Euro, Target", "import { Users, Briefcase, Euro, Target, CheckCircle");
}

fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
console.log('Top row replaced.');
