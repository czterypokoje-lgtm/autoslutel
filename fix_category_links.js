const fs = require('fs');

function replaceInFile(file, replacer) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = replacer(content);
    fs.writeFileSync(file, content);
  }
}

replaceInFile('src/components/webshop/WebshopNavigation.tsx', (content) => {
  return content.replace(/\/webshop\/categorie\//g, '/webshop/catalogus?category=');
});

replaceInFile('src/components/UniversalRemotesSection/UniversalRemotesSection.tsx', (content) => {
  return content.replace(/\/webshop\/categorie\//g, '/webshop/catalogus?manufacturer=');
});

