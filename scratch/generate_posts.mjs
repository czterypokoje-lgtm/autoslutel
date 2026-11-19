import fs from 'fs';

const files = [
  'bmwreklam324.png', 'audirekalam2.png', 'audireklam24.png', 'audireklam243.png',
  'bmwreklam24.png', 'bmwreklam242.png', 'dsreklam24.png', 'fiatrekalm243.png',
  'fiatreklam24.png', 'fiatreklam242.png', 'fordreklam24.png', 'fordreklam243.png',
  'fordreklam334.png', 'hyundaireklam24.png', 'hyundaireklam242.png', 'jeepreklam24.png',
  'jeepreklam242.png', 'landrovereklam24.png', 'lexusreklam24.png', 'mazdareklam24.png',
  'mazdareklam242.png', 'mercedesreklam24.png', 'minireklam24.png', 'minireklam242.png',
  'nissanreklam24.png', 'nissanreklam242.png', 'opelreklam24.png', 'opelreklam243.png',
  'peugeotreklam24.png', 'rangeroverreklam24.png', 'renaultrekalm243.png', 'renaultreklam24.png',
  'renaultreklam242.png', 'saabreklam24.png', 'skodareklaam24.png', 'skodareklam24.png',
  'skodareklam242.png', 'skodareklam243.png', 'wwrekalam243.png', 'wwrekalm2434.png',
  'wwreklam24.png', 'wwreklam243.png', 'wwreklam2432.png', 'wwreklam342.png'
];

const cities = [
  { c: 'Amsterdam', r: 'Noord-Holland' }, { c: 'Rotterdam', r: 'Zuid-Holland' },
  { c: 'Utrecht', r: 'Utrecht' }, { c: 'Den Haag', r: 'Zuid-Holland' },
  { c: 'Haarlem', r: 'Noord-Holland' }, { c: 'Breda', r: 'Noord-Brabant' },
  { c: 'Almere', r: 'Flevoland' }, { c: 'Amersfoort', r: 'Utrecht' },
  { c: 'Arnhem', r: 'Gelderland' }, { c: 'Apeldoorn', r: 'Gelderland' },
  { c: 'Gouda', r: 'Zuid-Holland' }, { c: 'Leiden', r: 'Zuid-Holland' },
  { c: 'Dordrecht', r: 'Zuid-Holland' }, { c: 'Lelystad', r: 'Flevoland' },
  { c: 'Hilversum', r: 'Noord-Holland' }, { c: 'Amstelveen', r: 'Noord-Holland' }
];

const models = {
  bmw: ['1 Serie', '3 Serie', '5 Serie', 'X3', 'X5'],
  audi: ['A3', 'A4', 'A6', 'Q3', 'Q5'],
  ds: ['DS3', 'DS5', 'DS7 Crossback'],
  fiat: ['500', 'Panda', 'Ducato', 'Punto'],
  ford: ['Focus', 'Fiesta', 'Transit', 'Kuga'],
  hyundai: ['i10', 'i20', 'Tucson', 'Kona'],
  jeep: ['Renegade', 'Compass', 'Grand Cherokee'],
  landrover: ['Discovery', 'Defender', 'Evoque'],
  lexus: ['CT200h', 'NX', 'RX'],
  mazda: ['CX-5', 'Mazda3', 'Mazda2'],
  mercedes: ['A-Klasse', 'C-Klasse', 'Sprinter', 'Vito', 'E-Klasse'],
  mini: ['Cooper', 'Countryman', 'Clubman'],
  nissan: ['Qashqai', 'Micra', 'Juke'],
  opel: ['Corsa', 'Astra', 'Vivaro', 'Mokka'],
  peugeot: ['208', '308', '2008', 'Partner'],
  rangerover: ['Evoque', 'Sport', 'Velar'],
  renault: ['Clio', 'Captur', 'Megane', 'Trafic'],
  saab: ['9-3', '9-5'],
  skoda: ['Octavia', 'Fabia', 'Kodiaq', 'Superb'],
  ww: ['Polo', 'Golf', 'Transporter', 'Caddy', 'Up!'] // VW
};

const formatBrand = (brand) => {
  if (brand === 'ww') return 'Volkswagen';
  if (brand === 'ds') return 'DS Automobiles';
  if (brand === 'bmw') return 'BMW';
  if (brand === 'audi') return 'Audi';
  if (brand === 'jeep') return 'Jeep';
  if (brand === 'mini') return 'MINI';
  if (brand === 'landrover') return 'Land Rover';
  if (brand === 'rangerover') return 'Range Rover';
  return brand.charAt(0).toUpperCase() + brand.slice(1);
};

let output = `# Google My Business Posts - Autosleutel24\n\n`;
output += `Hier zijn ${files.length} SEO-geoptimaliseerde posts, klaar om in te plannen!\n\n---\n\n`;

files.forEach((file, index) => {
  let rawBrand = file.replace(/rek(a?)la(a?)m.*/, '').replace(/[0-9]+/, '').replace('.png', '');
  if(!models[rawBrand]) rawBrand = Object.keys(models).find(k => file.startsWith(k)) || 'ww';
  
  const brandName = formatBrand(rawBrand);
  const modelOptions = models[rawBrand];
  const model = modelOptions[index % modelOptions.length];
  const cityObj = cities[index % cities.length];
  const year = 2012 + (index % 10);
  
  const templates = [
    `Vandaag op locatie in **${cityObj.c}**: een nieuwe autosleutel geprogrammeerd voor deze **${brandName} ${model}**, in slechts 30 minuten. Geen dealerwachttijd, geen sleepkosten — wij komen naar u toe, in heel ${cityObj.c} en de regio ${cityObj.r}.\n\n1 jaar garantie op elke sleutel. Sleutel kwijt of kapot? Bel ons direct voor een vaste prijs.`,
    
    `**${brandName}** sleutel kwijt of buitengesloten in **${cityObj.c}**? Wij maken direct op locatie een nieuwe sleutel. Geen sleepkosten, 25 min service. Bel 24/7!\n\nWeer een tevreden klant geholpen in ${cityObj.c}! Heeft u een nieuwe sleutel nodig voor uw ${brandName} (zoals deze ${model} uit ${year})? Bespaar dure sleepkosten naar de dealer. Autosleutel24 is direct ter plaatse en programmeert binnen 25 minuten een compleet nieuwe smart key. Inclusief 1 jaar garantie! Staat u stil? Gebruik de 'Bel Nu' knop voor directe hulp.`,
    
    `Sleutelprobleem met uw **${brandName}** in **${cityObj.c}**? 🚗 Autosleutel24 is uw mobiele slotenmaker voor auto's. Vandaag hebben we de eigenaar van deze **${brandName} ${model}** direct weer op weg geholpen.\n\n✅ Snel ter plaatse in regio ${cityObj.r}\n✅ Dealer kwaliteit, maar veel sneller\n✅ Vaste prijs vooraf en 1 jaar garantie\n\nHeeft u ook een nieuwe autosleutel nodig? Bel of WhatsApp ons 24/7!`,
    
    `Nieuwe sleutel nodig voor uw **${brandName}**? 🔑 In **${cityObj.c}** hebben we vandaag succesvol een nieuwe transpondersleutel ingeleerd voor deze **${brandName} ${model}**. Waarom weken wachten bij de dealer als het ook in 30 minuten op locatie kan?\n\nWij zijn 24/7 actief in ${cityObj.c} en omstreken. Bel ons voor een directe prijsopgave en we komen meteen naar u toe!`
  ];
  
  const body = templates[index % templates.length];
  
  output += `### Post ${index + 1}\n`;
  output += `- **Foto (Görsel):** \`${file}\`\n`;
  output += `- **Post Title (Başlık):** ${brandName} ${model} (${year}) sleutel bijmaken in ${cityObj.c} ✅\n`;
  output += `- **Button (Aksiyon):** Bel Nu / Call Now (06 11 75 12 31)\n\n`;
  output += `**Post Text (Açıklama):**\n> ${body}\n\n`;
  output += `---\n\n`;
});

fs.writeFileSync('/Users/ik/.gemini/antigravity/brain/b17f5bff-4af2-435f-812b-032459690c96/google_posts.md', output);
console.log('Done');
