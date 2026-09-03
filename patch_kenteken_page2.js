const fs = require('fs');
let page = fs.readFileSync('src/app/autosleutel-bestellen-op-kenteken/page.tsx', 'utf8');

page = page.replace(
  /<span>4\.9\/5 gebaseerd op 150\+ reviews via Google<\/span>/g,
  ""
);

fs.writeFileSync('src/app/autosleutel-bestellen-op-kenteken/page.tsx', page);
