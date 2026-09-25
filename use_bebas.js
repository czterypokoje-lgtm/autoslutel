const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Anton with Bebas_Neue
content = content.replace("import { Anton } from 'next/font/google';", "import { Bebas_Neue } from 'next/font/google';");
content = content.replace("const anton = Anton({ weight: '400', subsets: ['latin'] });", "const anton = Bebas_Neue({ weight: '400', subsets: ['latin'] });");

fs.writeFileSync(file, content);
