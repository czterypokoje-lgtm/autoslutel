const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/\.statValue \{/, ".statValue {\n  color: #ffffff;");
css = css.replace(/\.heroDesc \{/, ".heroDesc {\n  color: #f1f5f9 !important;");

fs.writeFileSync(file, css);
