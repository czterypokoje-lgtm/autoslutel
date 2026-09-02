const fs = require('fs');

let scraper = fs.readFileSync('scripts/a-key-scraper/scrape-akey.mjs', 'utf8');

const newCategories = `
  '/Boards-fuer-Funkschluessel-PCB',
  '/Funkschluessel-Gehaeuse',
  '/Autoschluesselblatt-Spitze',
  '/Autoschluessel-ohne-Wegfahrsperre',
  '/Garagenoeffner',
  '/IEA-Universal-Fernbedienung',
  '/Microtaster-Antenne',
  '/Notschluessel',
  '/Transponder',
  '/Transponderschluessel',
  '/Zubehoer-Werkzeug',
`;

scraper = scraper.replace(
  "  '/Batterien'\n]",
  `  '/Batterien',\n${newCategories}]`
);

fs.writeFileSync('scripts/a-key-scraper/scrape-akey.mjs', scraper);
