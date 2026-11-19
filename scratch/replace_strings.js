const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Service Area Replacements
  content = content.replace(/heel Nederland/g, 'Midden-Nederland en de Randstad');
  content = content.replace(/in Nederland/g, 'in Midden-Nederland en de Randstad');
  
  // Specifically fix grammatical issues caused by the above:
  content = content.replace(/door Midden-Nederland en de Randstad/g, 'in Midden-Nederland en de Randstad');
  content = content.replace(/de gehele Randstad en Midden-Nederland/g, 'Midden-Nederland en de Randstad');

  // 2. Response Time Replacements
  // Ensure we don't accidentally ruin React components
  content = content.replace(/15 tot 20 minuten/g, '30 tot 60 minuten');
  content = content.replace(/20 tot 30 minuten/g, '30 tot 60 minuten');
  content = content.replace(/15 tot 30 minuten/g, '30 tot 60 minuten');
  content = content.replace(/15–30 minuten/g, '30–60 minuten');
  content = content.replace(/20-30 minuten/g, '30-60 minuten');
  content = content.replace(/binnen 15 tot 30 minuten/g, 'binnen 30 tot 60 minuten');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
