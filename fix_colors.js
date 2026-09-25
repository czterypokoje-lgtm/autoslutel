const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/DeadboltTheme.module.css';
let css = fs.readFileSync(file, 'utf8');

// Add color white to headers
css = css.replace(/\.heroTitle \{/, ".heroTitle {\n  color: #ffffff !important;");
css = css.replace(/\.sectionTitle \{/, ".sectionTitle {\n  color: #ffffff !important;");
css = css.replace(/\.priceTitle \{/, ".priceTitle {\n  color: #ffffff !important;");
css = css.replace(/\.photoTitle \{/, ".photoTitle {\n  color: #ffffff !important;");

fs.writeFileSync(file, css);
