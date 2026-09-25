const fs = require('fs');

let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

const regex = /const win = window\.open\(buildWhatsAppUrl\(\), '_blank', 'noopener,noreferrer'\);\n\s*if \(\!win\) window\.location\.href = buildWhatsAppUrl\(\);\n/g;

content = content.replace(regex, 'setStep(\'success\');\n');
content = content.replace(/window\.dataLayer = window\.dataLayer \|\| \[\];\n\s*window\.dataLayer\.push\(\{ event: 'click_to_whatsapp', link_url: 'form_handoff' \}\);\n\s*window\.uetq = window\.uetq \|\| \[\];\n\s*window\.uetq\.push\('event', 'click_to_whatsapp', \{ event_category: 'whatsapp' \}\);\n/g, '');

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
