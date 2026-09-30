const fs = require('fs');
const path = 'src/config/cities.ts';
let code = fs.readFileSync(path, 'utf8');

const newCity = `  { slug:"dordrecht", city:"Dordrecht", region:"Zuid-Holland", country:"NL", lang:"NL", travelTime:"30-60 min", keyword:"autosleutel programmeren Dordrecht", nlSearches:120, priority:"P2", subAreas:["Dordrecht Centrum", "Sterrenburg", "Stadspolders", "Dubbeldam"], geo:{lat:"51.8133",lng:"4.6900"}, popularBrands:["Toyota","Peugeot","Renault"], commonJob:"Sleutel in auto laten liggen", localFact:"Dordrecht heeft een historisch centrum met krappe parkeerplaatsen. Wij kennen de weg en komen met onze mobiele service snel ter plaatse om uw deuren schadevrij te openen, gewoon op locatie.", avgJobDuration:"25-45 min" }`;

code = code.replace(/\];\s*$/, `,\n${newCity}\n];\n`);
fs.writeFileSync(path, code);
