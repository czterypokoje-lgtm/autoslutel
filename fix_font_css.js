const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/font-family: 'Anton', sans-serif;/g, "");

fs.writeFileSync(file, css);
