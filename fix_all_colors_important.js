const fs = require('fs');
const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

// Ensure stats are white
css = css.replace(/\.statValue \{\n  color: #ffffff;/g, ".statValue {\n  color: #ffffff !important;");

// Ensure description text has correct color
css = css.replace(/\.transponderText \{/g, ".transponderText {\n  color: #cbd5e1 !important;");
css = css.replace(/\.priceCardText \{/g, ".priceCardText {\n  color: #94a3b8 !important;");
css = css.replace(/\.photoDesc \{/g, ".photoDesc {\n  color: #94a3b8 !important;");
css = css.replace(/\.brandsDisclaimer \{/g, ".brandsDisclaimer {\n  color: #64748b !important;");

fs.writeFileSync(file, css);
