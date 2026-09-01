const fs = require('fs');

const baseUrl = 'https://www.autosleutel24.nl';

const corePages = [
  '/',
  '/autosleutel-bestellen-op-kenteken',
  '/autosleutel-kwijt',
  '/contact',
  '/prijzen',
  '/veelgestelde-vragen',
  '/over-ons',
  '/diensten/autosleutel-bijmaken',
  '/diensten/auto-slotenmaker',
  '/diensten/auto-openen-zonder-sleutel'
];

const topCities = [
  'amsterdam', 'rotterdam', 'den-haag', 'utrecht', 'eindhoven',
  'almere', 'breda', 'nijmegen', 'apeldoorn', 'haarlem',
  'arnhem', 'amersfoort', 'zaandam', 'hilversum', 'purmerend',
  'lelystad', 'nieuwegein', 'woerden', 'zeist', 'houten',
  'leiden', 'dordrecht', 'ede', 'leeuwarden', 'zoetermeer',
  'zwolle', 'deventer', 'delft', 'alkmaar', 'heerlen',
  'venlo', 'oss', 'amstelveen', 'roosendaal',
  'spijkenisse', 'vlaardingen', 'gouda', 'capelle-aan-den-ijssel', 'katwijk', 'veenendaal'
];

const topBrands = [
  'volkswagen', 'bmw', 'mercedes', 'audi', 'toyota',
  'ford', 'peugeot', 'renault', 'opel', 'volvo',
  'fiat', 'seat', 'skoda', 'kia', 'hyundai',
  'nissan', 'mazda', 'honda', 'citroen', 'mini'
];

const topModels = [
  { brand: 'volkswagen', model: 'golf' },
  { brand: 'volkswagen', model: 'polo' },
  { brand: 'volkswagen', model: 'up' },
  { brand: 'volkswagen', model: 'passat' },
  { brand: 'volkswagen', model: 'transporter' },
  { brand: 'bmw', model: '1-serie' },
  { brand: 'bmw', model: '3-serie' },
  { brand: 'bmw', model: '5-serie' },
  { brand: 'audi', model: 'a3' },
  { brand: 'audi', model: 'a4' },
  { brand: 'audi', model: 'a6' },
  { brand: 'mercedes', model: 'c-klasse' },
  { brand: 'mercedes', model: 'a-klasse' },
  { brand: 'mercedes', model: 'sprinter' },
  { brand: 'toyota', model: 'aygo' },
  { brand: 'toyota', model: 'yaris' },
  { brand: 'ford', model: 'fiesta' },
  { brand: 'ford', model: 'focus' },
  { brand: 'peugeot', model: '208' },
  { brand: 'peugeot', model: '108' },
  { brand: 'renault', model: 'clio' },
  { brand: 'renault', model: 'twingo' },
  { brand: 'opel', model: 'corsa' },
  { brand: 'opel', model: 'astra' },
  { brand: 'fiat', model: '500' },
  { brand: 'skoda', model: 'octavia' },
  { brand: 'kia', model: 'picanto' },
  { brand: 'nissan', model: 'qashqai' },
  { brand: 'volvo', model: 'v40' },
  { brand: 'seat', model: 'ibiza' }
];

let urls = [];
corePages.forEach(p => urls.push(baseUrl + p));
topCities.forEach(c => urls.push(baseUrl + '/steden/' + c));
topBrands.forEach(b => urls.push(baseUrl + '/merken/' + b + '-autosleutel-bijmaken'));
topModels.forEach(m => urls.push(baseUrl + '/merken/' + m.brand + '-autosleutel-bijmaken/' + m.model + '-sleutel-bijmaken'));

urls = [...new Set(urls)].slice(0, 100);

console.log(urls.join('\n'));
