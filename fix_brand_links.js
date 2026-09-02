const fs = require('fs');

function replaceInFile(file, oldStr, newStr) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.split(oldStr).join(newStr);
    fs.writeFileSync(file, content);
  }
}

replaceInFile(
  'src/components/webshop/BrandMegaMenu.tsx',
  'href={`/webshop/merk/${brand.toLowerCase().replace(/ /g, \'-\')}`}',
  'href={`/webshop/catalogus?make=${brand.toLowerCase().replace(/ /g, \'-\')}`}'
);

replaceInFile(
  'src/app/webshop/merken/page.tsx',
  'href={`/webshop/merk/${brand.toLowerCase()}`}',
  'href={`/webshop/catalogus?make=${brand.toLowerCase()}`}'
);

replaceInFile(
  'src/components/webshop/MerkenHero.tsx',
  'href={`/webshop/merk/${selectedBrand.toLowerCase()}?model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`}',
  'href={`/webshop/catalogus?make=${selectedBrand.toLowerCase()}`}'
);

