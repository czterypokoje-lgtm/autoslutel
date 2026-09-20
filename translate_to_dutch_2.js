const fs = require('fs');

function replaceDict(filePath, dict) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [tr, nl] of Object.entries(dict)) {
    content = content.split(tr).join(nl);
  }
  fs.writeFileSync(filePath, content);
}

replaceDict('src/app/admin/overzicht/OfficeOverview.tsx', {
  'Düşük stok uyarısı': 'Lage voorraad waarschuwing',
  'teknisyende eksik': 'monteur tekort',
  'Stok Detayları': 'Voorraad details',
  'Şimdi Ara': 'Nu bellen',
  'Teknisyen Ata': 'Monteur Toewijzen',
  'Ödeme Yap': 'Uitbetalen'
});

console.log('Action center translated.');
