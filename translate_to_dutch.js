const fs = require('fs');

function replaceDict(filePath, dict) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [tr, nl] of Object.entries(dict)) {
    content = content.split(tr).join(nl);
  }
  fs.writeFileSync(filePath, content);
}

// 1. OfficeOverview.tsx
replaceDict('src/app/admin/overzicht/OfficeOverview.tsx', {
  'İyi Günler 👋': 'Goedendag 👋',
  'Bugünkü Operasyon Merkezi': 'Operatiecentrum Vandaag',
  'Operasyonlar normal seyrediyor.': 'Operaties verlopen normaal.',
  'aktif iş,': 'actieve klussen,',
  'yeni lead bekliyor.': 'nieuwe leads wachten.',
  'Nieuwe Leads': 'Nieuwe Leads',
  'Yeni Lead': 'Nieuwe Leads',
  'Dünden daha yüksek': 'Vergeleken met gisteren',
  'Bugünkü İş': 'Klussen Vandaag',
  'tamamlandı,': 'afgerond,',
  'bekliyor': 'wachten',
  'Gelir': 'Omzet',
  'Düne göre artış': 'Vergeleken met gisteren',
  'Müşteri Memnuniyeti': 'Klanttevredenheid',
  'Gerçek müşteri değerlendirmesi': 'Echte klantbeoordelingen',
  'Aksiyon Merkezi': 'Actiecentrum',
  'Tüm aksiyonları gör': 'Bekijk alle acties',
  'Bugünün İşleri': 'Klussen Vandaag',
  'Tümünü gör': 'Bekijk alles',
  'Canlı Teknisyenler': 'Live Monteurs',
  'Tüm ekibi gör': 'Bekijk het team',
  'Müsait': 'Beschikbaar',
  'Çevrimdışı': 'Offline',
  'Gelir, Aramalar ve Dönüşüm': 'Omzet, Oproepen & Conversie',
  'Son 14 Gün': 'Laatste 14 Dagen',
  'Gelen Arama': 'Oproepen',
  'Lead Dönüşüm (%)': 'Conversie (%)',
  'Top Teknisyenler': 'Top Monteurs',
  'Tamamlandı': 'Afgerond',
  'Devam Ediyor': 'In Behandeling',
  'Bekliyor': 'Wachtend',
  'Planlandı': 'Gepland'
});

// 2. LeadsTable.tsx
replaceDict('src/app/admin/leads/LeadsTable.tsx', {
  'Yeni Lead': 'Nieuw',
  'Devam Ediyor': 'In Behandeling',
  'Tamamlandı': 'Afgerond',
  'Dubbel': 'Dubbel',
  'dk önce': 'min geleden',
  'saat önce': 'uur geleden',
  'gün önce': 'dagen geleden',
  'Tahmini Değer': 'Geschatte waarde',
  'Akıllı anahtar kayıp': 'Smart key kwijt',
  'Haritada Gör': 'Bekijk op kaart',
  'Genel': 'Algemeen',
  'Müşteri & Araç': 'Klant & Voertuig',
  'Notlar': 'Notities',
  'Dosyalar': 'Bestanden',
  'Önerilen Teknisyen': 'Voorgestelde Monteur',
  'uzakta •': 'ver •',
  'Başarı Oranı': 'Slagingskans',
  'Uygun': 'Match',
  'Teknisyen Ata': 'Monteur Toewijzen',
  'Müşteriyi Ara': 'Klant Bellen',
  'Tümü': 'Alles',
  'Acil': 'Spoed',
  'Devam Eden': 'In Behandeling',
  'Atanmamış': 'Niet toegewezen',
  'uyum': 'match'
});

// 3. page.tsx (Leads)
replaceDict('src/app/admin/leads/page.tsx', {
  'Lead / İşler': 'Leads / Klussen',
  "Tüm lead'leri ve iş süreçlerini tek yerden yönetin.": "Beheer alle leads en klussen op één plek.",
  'Müşteri, plaka, araç, telefon veya iş no ile ara...': 'Zoek op klant, kenteken, auto, telefoon of klus nr...',
  '>Ara<': '>Zoeken<',
  'Liste': 'Lijst',
  'Tablo': 'Tabel',
  'Harita': 'Kaart'
});

console.log('Translation complete.');
