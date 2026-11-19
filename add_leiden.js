const fs = require('fs');
const path = 'src/config/cities.ts';
let code = fs.readFileSync(path, 'utf8');

const leidenObj = `  { slug:"leiden", city:"Leiden", region:"Zuid-Holland", country:"NL", lang:"NL", travelTime:"30-60 min", keyword:"autosleutel programmeren Leiden", nlSearches:130, priority:"P2", subAreas:["Leiden Centrum","Stevenshof","Merenwijk","Roomburg","Bio Science Park"], geo:{lat:"52.1601",lng:"4.4970"}, popularBrands:["Volkswagen","Toyota","BMW"], commonJob:"Sleutel kwijt na een dagje stad of werk", localFact:"Leiden is een drukke studenten- en kennisstad. Wij werken veel op het Leiden Bio Science Park en in de smalle straten van het historische centrum waar slepen bijna onmogelijk is. Wij lossen het probleem gewoon direct ter plaatse op.", avgJobDuration:"30-55 min" }`;

// insert before the last closing bracket
code = code.replace(/\];\s*$/, `,\n${leidenObj}\n];\n`);
fs.writeFileSync(path, code);
