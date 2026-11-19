const fs = require('fs');
const specs = JSON.parse(fs.readFileSync('/Users/ik/Desktop/autosleutel24-repo/src/lib/vehicleSpecs.json'));

const make = 'volkswagen';
const model = 'golf';
const key = `${make}|${model}`;
console.log('Vehicle specs for VW Golf:', specs[key]);

const make2 = 'peugeot';
const model2 = '107';
const key2 = `${make2}|${model2}`;
console.log('Vehicle specs for Peugeot 107:', specs[key2]);
