const fs = require('fs');
let bld = fs.readFileSync('scripts/build-catalog.mjs', 'utf8');

bld = bld.replace(
  /image: p\.imageLocalPath \|\| null,/g,
  "image: p.imageLocalPath || null,\n    images: p.images || (p.imageLocalPath ? [p.imageLocalPath] : []),"
);

fs.writeFileSync('scripts/build-catalog.mjs', bld);

let catType = fs.readFileSync('src/lib/catalog.ts', 'utf8');
if (!catType.includes("images: string[]")) {
  catType = catType.replace(
    /image: string \| null;/g,
    "image: string | null;\n  images: string[];"
  );
  fs.writeFileSync('src/lib/catalog.ts', catType);
}
