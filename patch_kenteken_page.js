const fs = require('fs');
let page = fs.readFileSync('src/app/autosleutel-bestellen-op-kenteken/page.tsx', 'utf8');

// Replace the line with the reviews text
page = page.replace(
  /<span>4\.9\/5 gebaseerd op 150\+ reviews via Google<\/span>/g,
  ""
);
// Make sure to remove the trailing empty span or adjust layout.
// Actually let's look at the context of that line.
fs.writeFileSync('patch_kenteken_page_log', 'ok');
