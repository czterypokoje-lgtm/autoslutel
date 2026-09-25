const fs = require('fs');
const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.statValue\.orange \{\n  color: #f97316;\n\}/g, ".statValue.orange {\n  color: #f97316 !important;\n}");

fs.writeFileSync(file, css);
