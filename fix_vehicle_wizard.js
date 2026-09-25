const fs = require('fs');

let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

// 1. We need a success step for the wizard.
content = content.replace("type WizardStep = 'kenteken' | 'details' | 'quote';", 
  "type WizardStep = 'kenteken' | 'details' | 'quote' | 'success';");

// 2. Remove the WhatsApp redirect in handleSubmit
content = content.replace(/\/\/ Synchronous, inside the click's call stack[\s\S]*?window\.location\.href = buildWhatsAppMessage\(\);\n/g, 'setStep(\'success\');\n');

// 3. Render success step at the bottom
const successRender = `        {step === 'success' && (
          <div className={styles.successState} style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>Aanvraag Ontvangen!</h3>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>Bedankt voor uw aanvraag. We bellen u binnen 5 minuten met de exacte prijs en beschikbaarheid.</p>
          </div>
        )}
      </div>`;

content = content.replace(/      <\/div>\n    <\/div>\n  \);\n\}\n/g, successRender + '\n    </div>\n  );\n}\n');

// Also remove the `window.uetq.push('event', 'click_to_whatsapp'` logic in handleSubmit since we don't redirect to WhatsApp anymore.
content = content.replace(/\/\*[\s\S]*?window\.uetq\.push\('event', 'click_to_whatsapp', \{ event_category: 'whatsapp' \}\);\n/g, '');

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
