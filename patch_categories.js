const fs = require('fs');
let bld = fs.readFileSync('scripts/build-catalog.mjs', 'utf8');

bld = bld.replace(
  /\[\'behuizingen\', \'sleutelbehuizing\', \/\\bshell\\b\|\\bcase\\b\|housing\|behuizing\|\\bcover\\b\|casing\/i\],/g,
  "['behuizingen', 'sleutelbehuizing', /\\bshell\\b|\\bcase\\b|housing|behuizing|\\bcover\\b|casing|geh.use/i],\n  ['behuizingen', 'noodsleutel', /notschl.ssel|emergency key|schluesselblatt/i],\n  ['afstandsbedieningen', 'printplaat', /\\bpcb\\b|platine|board|tasten/i],"
);

fs.writeFileSync('scripts/build-catalog.mjs', bld);
