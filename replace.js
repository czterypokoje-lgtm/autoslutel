const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
console.log(`Found ${files.length} files to scan.`);
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Service Area
  content = content.replace(/heel Nederland/g, 'Midden-Nederland en de Randstad');
  content = content.replace(/in Nederland/g, 'in Midden-Nederland en de Randstad');
  content = content.replace(/door Midden-Nederland en de Randstad/g, 'in Midden-Nederland en de Randstad');
  content = content.replace(/de gehele Randstad en Midden-Nederland/g, 'Midden-Nederland en de Randstad');
  content = content.replace(/Utrecht, Amsterdam, Almere, Amersfoort, Nederland/g, 'Utrecht, Amsterdam, Almere, Amersfoort');

  // 2. Response Time
  content = content.replace(/15 tot 20 minuten/g, '30 tot 60 minuten');
  content = content.replace(/20 tot 30 minuten/g, '30 tot 60 minuten');
  content = content.replace(/15 tot 30 minuten/g, '30 tot 60 minuten');
  content = content.replace(/15–30 minuten/g, '30–60 minuten');
  content = content.replace(/20-30 minuten/g, '30-60 minuten');
  content = content.replace(/20 tot 60 minuten/g, '30 tot 60 minuten');
  content = content.replace(/binnen 15 tot 30 minuten/g, 'binnen 30 tot 60 minuten');

  // 3. Pricing
  // Replace random 350 and 650 with SITE_CONFIG variables where possible, but it's hard to dynamically insert imports.
  // Instead we just replace the strings in blog posts that the user complained about
  content = content.replace(/€180/g, '€149');
  content = content.replace(/€125/g, '€149');
  content = content.replace(/€350/g, '€349'); // Using €349 as max for smart keys
  content = content.replace(/€650/g, '€480'); 

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
    count++;
  }
});
console.log(`Updated ${count} files.`);
