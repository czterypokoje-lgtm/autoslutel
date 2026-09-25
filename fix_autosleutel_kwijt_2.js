const fs = require('fs');

const origContent = require('child_process').execSync('git show HEAD:src/app/autosleutel-kwijt/page.tsx').toString();

const importsAndFaqMatch = origContent.match(/([\s\S]*?)export default function AutosleutelKwijt\(\) \{/);
const importsAndFaq = importsAndFaqMatch ? importsAndFaqMatch[1] : '';

let currentContent = fs.readFileSync('src/app/autosleutel-kwijt/page.tsx', 'utf8');

// The currentContent starts with `import styles from './DeadboltTheme.module.css';`
currentContent = currentContent.replace("export default function AllKeysLost() {", "export default function AutosleutelKwijt() {");

fs.writeFileSync('src/app/autosleutel-kwijt/page.tsx', importsAndFaq + "\n" + currentContent);
