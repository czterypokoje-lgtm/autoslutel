const fs = require('fs');

let code = fs.readFileSync('src/app/admin/leads/LeadsTable.tsx', 'utf8');

const importToAdd = `import { getBrandLogo } from '@/lib/brandLogos';\n`;
if (!code.includes('getBrandLogo')) {
  code = code.replace("import styles from './leads.module.css';", importToAdd + "import styles from './leads.module.css';");
}

const rowPhotoOld = `<div style={{width: '40px', textAlign: 'center'}}><div className={styles.avatar}>{row.brand?.substring(0,3).toUpperCase() || 'OTO'}</div></div>`;

const rowPhotoNew = `<div style={{width: '40px', textAlign: 'center'}}>
                  {getBrandLogo(row.brand) ? (
                    <img src={getBrandLogo(row.brand)!} alt={row.brand || ''} style={{width: '32px', height: '32px', objectFit: 'contain'}} />
                  ) : (
                    <div className={styles.avatar}>{row.brand?.substring(0,3).toUpperCase() || 'OTO'}</div>
                  )}
                </div>`;

code = code.replace(rowPhotoOld, rowPhotoNew);

fs.writeFileSync('src/app/admin/leads/LeadsTable.tsx', code);
console.log('Fixed LeadsTable logo');
