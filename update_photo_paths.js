const fs = require('fs');
let content = fs.readFileSync('src/app/autosleutel-kwijt/page.tsx', 'utf8');

content = content.replace('/images/transpondersleutel.jpg', '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp');
content = content.replace('/images/smartkey.jpg', '/images/seo/smart-key-keyless-programmeren-autosleutel24-utrecht.webp');
content = content.replace('/images/sleutels_hand.jpg', '/images/keys/volkswagen-autosleutel-bijmaken-2.webp');
content = content.replace('/images/sleutel_lederen.jpg', '/images/keys/mercedes-autosleutel-bijmaken-2.webp');

fs.writeFileSync('src/app/autosleutel-kwijt/page.tsx', content);
