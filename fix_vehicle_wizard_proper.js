const fs = require('fs');
let content = fs.readFileSync('src/components/VehicleWizard/VehicleWizard.tsx', 'utf8');

// Fix step type
content = content.replace('const [step, setStep] = useState(1);', 'const [step, setStep] = useState<number | \'success\'>(1);');

// Replace the window.open and window.location.href logic in submit()
const targetLogic = `    const win = window.open(buildWhatsAppUrl(), '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = buildWhatsAppUrl();
    setSending(false);
  }`;

const newLogic = `    setStep('success');
    setSending(false);
  }`;

content = content.replace(targetLogic, newLogic);

// Remove the dataLayer/uetq push for WhatsApp safely
const safeUetqRemove = `    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'click_to_whatsapp', link_url: 'form_handoff' });
    window.uetq = window.uetq || [];
    window.uetq.push('event', 'click_to_whatsapp', { event_category: 'whatsapp' });`;

content = content.replace(safeUetqRemove, '');

// Also remove the block comment just above it safely
const safeCommentRemove = `    // Synchronous, inside the click's call stack — a setTimeout here would be
    // treated as an unrequested popup and silently blocked on iOS Safari.
    /*
     * The WhatsApp handoff is opened programmatically, so the delegated
     * click listener in PhoneConversionTracker never sees it — it only
     * watches real anchor clicks. Without this the busiest WhatsApp path on
     * the site reported no WhatsApp event at all.
     */`;

content = content.replace(safeCommentRemove, '');

// Render success step at the bottom
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

fs.writeFileSync('src/components/VehicleWizard/VehicleWizard.tsx', content);
