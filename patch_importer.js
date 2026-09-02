const fs = require('fs');
let imp = fs.readFileSync('scripts/import-akey.mjs', 'utf8');

imp = imp.replace(/require\('path'\)\.extname/g, 'path.extname');
imp = imp.replace(/require\('path'\)\.join/g, 'path.join');

fs.writeFileSync('scripts/import-akey.mjs', imp);
