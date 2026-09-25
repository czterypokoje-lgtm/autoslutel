const fs = require('fs');

const jsonPath = '/Users/ik/Downloads/styles-2026-09-22.json';
const jsonString = fs.readFileSync(jsonPath, 'utf8');
const theme = JSON.parse(jsonString);

let css = `/* GENERATED FROM FRAMER THEME (styles-2026-09-22.json) */\n\n:root {\n`;

// Helper to convert names like "Night Navy" to "night-navy"
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// 1. Colors
if (theme.colorStyles) {
  css += `  /* Colors */\n`;
  theme.colorStyles.forEach(c => {
    const slug = slugify(c.name);
    if (c.light) css += `  --color-${slug}: ${c.light};\n`;
    // We could add dark mode support later if c.dark exists
  });
}

// 2. Typography
let typoClasses = `\n/* Typography Classes */\n`;

// Assuming the other array is typographyStyles or similar. Let's find its key.
const keys = Object.keys(theme).filter(k => k !== 'colorStyles' && k !== 'metadata');
if (keys.length > 0) {
  const typoArray = theme[keys[0]]; // e.g. textStyles
  css += `\n  /* Typography Variables */\n`;
  
  typoArray.forEach(t => {
    const slug = slugify(t.name);
    css += `  --font-${slug}-family: "${t.font?.family || 'Inter'}", sans-serif;\n`;
    css += `  --font-${slug}-size: ${t.fontSize};\n`;
    css += `  --font-${slug}-weight: ${t.font?.weight || '400'};\n`;
    css += `  --font-${slug}-lh: ${t.lineHeight};\n`;
    
    // Generate utility class
    typoClasses += `.${slug} {\n`;
    typoClasses += `  font-family: var(--font-${slug}-family);\n`;
    typoClasses += `  font-size: var(--font-${slug}-size);\n`;
    typoClasses += `  font-weight: var(--font-${slug}-weight);\n`;
    typoClasses += `  line-height: var(--font-${slug}-lh);\n`;
    if (t.textTransform && t.textTransform !== 'none') typoClasses += `  text-transform: ${t.textTransform};\n`;
    if (t.colorStyleRef) {
       typoClasses += `  color: var(--color-${slugify(t.colorStyleRef.name)});\n`;
    } else if (t.color) {
       typoClasses += `  color: ${t.color};\n`;
    }
    typoClasses += `}\n\n`;
    
    // Media queries for breakpoints
    if (t.breakpoints && t.breakpoints.length > 0) {
      t.breakpoints.forEach(bp => {
        // Breakpoints in this JSON seem to be MAX-widths or MIN-widths?
        // Usually Framer breakpoints go desktop -> tablet -> mobile. Let's check minWidth.
        // Actually, let's just create raw responsive css if needed, or skip for now to keep it simple.
      });
    }
  });
}

css += `}\n` + typoClasses;

fs.writeFileSync('src/app/framer-theme.css', css);
console.log('Generated src/app/framer-theme.css!');
