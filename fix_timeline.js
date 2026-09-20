const fs = require('fs');

let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

const importToAdd = `import { getBrandLogo } from '@/lib/brandLogos';\n`;
if (!code.includes('getBrandLogo')) {
  code = code.replace("import { createSupabaseServerClient }", importToAdd + "import { createSupabaseServerClient }");
}

// Ensure the JobRow type has the new fields
if (!code.includes('car_make?: string')) {
  code = code.replace(
    'problem: string | null;',
    'problem: string | null;\n  car_make?: string | null;\n  car_model?: string | null;\n  kenteken?: string | null;\n  service_type?: string | null;'
  );
  // Wait, I didn't declare a full JobRow type in OfficeOverview.tsx!
  // I only declared interface JobRow { final_price: ... quoted_price: ... }
}

const timelineOld = `jobsToday.map((job) => {
              const b = badgeProps(job.status);
              return (
                <div key={job.id} className={styles.timelineItem}>
                  <div className={styles.timelineTime}>{job.slot_start?.slice(0,5) || '09:00'}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineBrand}>{job.problem || 'Autosleutel'}</div>
                    <div className={styles.timelineDetails}><MapPin size={12} style={{display: 'inline', marginRight: '4px'}}/>{job.city || 'Onbekend'}</div>
                  </div>
                  <div className={styles.timelineBadge}>
                    <Badge tone={b.tone}>{b.label}</Badge>
                  </div>
                </div>
              );
            })`;

const timelineNew = `jobsToday.map((job: any) => {
              const b = badgeProps(job.status);
              const logo = getBrandLogo(job.car_make);
              const title = [job.car_make, job.car_model].filter(Boolean).join(' ') || 'Autosleutel Maken';
              const plateAndService = [job.kenteken, job.service_type || job.problem].filter(Boolean).join(' • ');

              return (
                <div key={job.id} className={styles.timelineItem}>
                  <div className={styles.timelineTime} style={{width: '45px', fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '3px', height: '14px', background: 'var(--crm-accent)', borderRadius: '2px', marginRight: '8px'}} />
                    {job.slot_start?.slice(0,5) || '09:00'}
                  </div>
                  
                  <div style={{width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {logo ? (
                      <img src={logo} alt={job.car_make || ''} style={{width: '28px', height: '28px', objectFit: 'contain'}} />
                    ) : (
                      <div className={styles.techAvatar} style={{width: '28px', height: '28px', fontSize: '10px'}}>{job.car_make?.substring(0,3).toUpperCase() || 'OTO'}</div>
                    )}
                  </div>
                  
                  <div className={styles.timelineContent} style={{flex: 1, paddingLeft: '8px'}}>
                    <div className={styles.timelineBrand} style={{fontWeight: 600, fontSize: '13px', color: 'var(--crm-ink)'}}>{title}</div>
                    <div className={styles.timelineDetails} style={{fontSize: '11px', color: 'var(--crm-muted)', marginTop: '2px'}}>{plateAndService}</div>
                    <div className={styles.timelineDetails} style={{fontSize: '11px', color: 'var(--crm-muted)'}}>{job.city || 'Onbekend'}</div>
                  </div>
                  
                  <div className={styles.timelineBadge}>
                    <Badge tone={b.tone}>{b.label}</Badge>
                  </div>
                </div>
              );
            })`;

code = code.replace(timelineOld, timelineNew);

fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
console.log('Fixed OfficeOverview timeline');
