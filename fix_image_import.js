const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import Image from 'next/image';")) {
  content = content.replace("import { Anton } from 'next/font/google';", "import { Anton } from 'next/font/google';\nimport Image from 'next/image';");
  fs.writeFileSync(file, content);
}
