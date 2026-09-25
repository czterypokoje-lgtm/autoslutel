const fs = require('fs');
const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.faqSection h2 \{/, ".faqSection h2 {\n  color: #ffffff !important;");

fs.writeFileSync(file, css);
