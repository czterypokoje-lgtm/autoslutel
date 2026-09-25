const fs = require('fs');

let content = fs.readFileSync('src/components/LeadCaptureForm/LeadCaptureForm.tsx', 'utf8');

// Remove window.location.href = buildWhatsappUrl();
content = content.replace(/window\.location\.href = buildWhatsappUrl\(\);\n/g, '');

// Also, the previous comment about WhatsApp sync handoff
content = content.replace(/\/\/ Open WhatsApp synchronously[\s\S]*?lost the user gesture\.\n/g, '');
content = content.replace(/\/\*[\s\S]*?reported no WhatsApp event at all\.\n[\s\S]*?\*\/\n\s*window\.dataLayer = window\.dataLayer \|\| \[\];\n\s*window\.dataLayer\.push\(\{ event: 'click_to_whatsapp', lead_source: 'city_form' \}\);\n\s*window\.uetq = window\.uetq \|\| \[\];\n\s*window\.uetq\.push\('event', 'click_to_whatsapp', \{ event_category: 'whatsapp' \}\);\n/g, '');

fs.writeFileSync('src/components/LeadCaptureForm/LeadCaptureForm.tsx', content);
