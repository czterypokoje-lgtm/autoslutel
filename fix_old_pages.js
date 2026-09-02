const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /title=\{p\.title\}/g,
    'slug={require("@/lib/utils").slugify(p.title)}\n                title={p.title}'
  );
  fs.writeFileSync(path, content);
}

fixFile('src/app/webshop/merk/[merk]/page.tsx');
fixFile('src/app/webshop/categorie/[slug]/page.tsx');
