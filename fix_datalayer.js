const fs = require('fs');

const path = 'src/components/ContactForm/ContactForm.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `        window.dataLayer.push({
          event: 'contact_form_submit',
          email: data.get('email') || undefined,
          phone_number: data.get('phone') || undefined,
        });`;

const newCode = `        window.dataLayer.push({
          event: 'contact_form_submit',
          email: data.get('email') || undefined,
          phone_number: data.get('phone') || undefined,
          // Facebook Pixel Advanced Matching expects these specific keys:
          user_data: {
            email_address: data.get('email') || undefined,
            phone_number: data.get('phone') || undefined,
            address: {
              postal_code: data.get('postcode') || undefined,
              city: data.get('location') || undefined,
            },
            external_id: data.get('email') || data.get('phone') || undefined
          }
        });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content);
  console.log('Fixed ContactForm.tsx');
} else {
  console.log('Old code not found.');
}
