import { CITIES } from '../src/data/cities.ts';
import { BRANDS } from '../src/data/brands.ts';
import { DIENSTEN } from '../src/data/diensten.ts';

let count = 0;
for (const city of CITIES) {
  if (city.priority === 'P1') {
    for (const brand of BRANDS) {
      if (brand.priority === 'P1' || brand.priority === 'P2') {
        count++;
      }
    }
  }

  const coreSlugs = ['alle-sleutels-kwijt-auto', 'sleutel-bijmaken', 'transponder-programmeren', 'smart-key-programmeren', 'contactslot-reparatie'];
  const services = city.priority === 'P1'
    ? DIENSTEN
    : DIENSTEN.filter(s => coreSlugs.includes(s.slug));

  for (const service of services) {
    count++;
  }
}
console.log(count);
