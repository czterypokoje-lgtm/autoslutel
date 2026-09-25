const fs = require('fs');

let content = fs.readFileSync('src/lib/leadTracking.ts', 'utf8');

const oldGtagCall = `if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', { event_category: lead.source });
    }`;

const newGtagCall = `if (typeof window.gtag === 'function') {
      // Send directly to Google Ads via the explicit gtag.js loaded in layout.tsx
      window.gtag('event', 'generate_lead', {
        event_category: lead.source,
        send_to: 'AW-18315813515',
        // Enhanced Conversions for Leads user data
        email: email,
        phone_number: phone
      });
    }`;

content = content.replace(oldGtagCall, newGtagCall);

fs.writeFileSync('src/lib/leadTracking.ts', content);
