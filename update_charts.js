const fs = require('fs');

let code = fs.readFileSync('src/app/admin/overzicht/OfficeOverview.tsx', 'utf8');

if (!code.includes('MixedChart')) {
  code = code.replace("import { LineChart, BarChart, RankedBars, chart } from '../_ui/charts';",
  "import { LineChart, BarChart, RankedBars, chart } from '../_ui/charts';\nimport { MixedChart } from './MixedChart';");

  // Create mock data for the MixedChart based on the screenshot
  const mockMixedData = `
  const mixedData = [
    { date: '1 Nis', revenue: 2200, calls: 18, conversion: 10 },
    { date: '2 Nis', revenue: 1200, calls: 17, conversion: 5 },
    { date: '3 Nis', revenue: 1400, calls: 20, conversion: 9 },
    { date: '4 Nis', revenue: 1300, calls: 16, conversion: 6 },
    { date: '5 Nis', revenue: 2300, calls: 19, conversion: 8 },
    { date: '6 Nis', revenue: 1800, calls: 23, conversion: 10 },
    { date: '7 Nis', revenue: 2100, calls: 27, conversion: 20 },
    { date: '8 Nis', revenue: 2000, calls: 26, conversion: 18 },
    { date: '9 Nis', revenue: 2480, calls: 30, conversion: 20 },
    { date: '10 Nis', revenue: 2000, calls: 22, conversion: 15 },
    { date: '11 Nis', revenue: 2300, calls: 24, conversion: 12 },
    { date: '12 Nis', revenue: 2050, calls: 25, conversion: 18 },
    { date: '13 Nis', revenue: 2200, calls: 26, conversion: 28 },
    { date: '14 Nis', revenue: 2600, calls: 16, conversion: 20 },
  ];
`;

  // Find where to insert mockData
  code = code.replace("return (", mockMixedData + "\n  return (");

  const oldChart = `<Card padded>
          <strong className={styles.cardLabel}>Gelir ve Performans</strong>
          <LineChart series={series} labels={MONTHS.slice(0, upTo)} format={euroShort} />
        </Card>`;
        
  const newChart = `<Card padded>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <strong className={styles.cardLabel} style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'}}>
              <span style={{color: 'var(--crm-accent)'}}>📊</span> Gelir, Aramalar ve Dönüşüm
            </strong>
            <select style={{fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--crm-rule)'}}>
              <option>Son 14 Gün</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: 'var(--crm-muted)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--crm-accent)', opacity: 0.5}}></div> Gelir (€)</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#2196F3'}}></div> Gelen Arama</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: '#4CAF50'}}></div> Lead Dönüşüm (%)</div>
          </div>
          <MixedChart data={mixedData} />
        </Card>`;

  code = code.replace(oldChart, newChart);

  fs.writeFileSync('src/app/admin/overzicht/OfficeOverview.tsx', code);
  console.log('Added MixedChart');
}
