import fs from 'fs';

const SCRAPED_JSON = './src/lib/scraped_products.json';

const TRANSLATIONS = {
  'Anzahl der knoppen:': 'Aantal knoppen:',
  'Anzahl der Tasten:': 'Aantal knoppen:',
  'für Automerk:': 'voor automerk:',
  'für Fahrzeugmarke:': 'voor automerk:',
  'hochwertiger Kunststoff / Metall': 'hoogwaardig kunststof / metaal',
  'hochwertiger Kunststoff/Metall': 'hoogwaardig kunststof/metaal',
  'ohne Emblem': 'zonder embleem',
  'zonder Emblem': 'zonder embleem',
  'schwarz / silber': 'zwart / zilver',
  'silber': 'zilver',
  'mit': 'met',
  'und': 'en',
  'inkl.': 'incl.',
  'inklusive': 'inclusief',
  'Originalschlüssel': 'originele sleutel',
  'Kein': 'Geen',
  'kein': 'geen',
  'z.B:': 'bijv:',
  'z.B.:': 'bijv:'
};

function translate(text) {
  if (!text) return text;
  let translated = text;
  
  for (const [de, nl] of Object.entries(TRANSLATIONS)) {
    const regex = new RegExp(de, 'gi');
    translated = translated.replace(regex, nl);
  }
  
  return translated;
}

function run() {
  const currentProducts = JSON.parse(fs.readFileSync(SCRAPED_JSON, 'utf8'));
  
  for (const p of currentProducts) {
    p.title = translate(p.title);
    p.description = translate(p.description);
  }
  
  fs.writeFileSync(SCRAPED_JSON, JSON.stringify(currentProducts, null, 2));
  console.log("Refined translations!");
}
run();
