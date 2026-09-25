const fs = require('fs');

let content = fs.readFileSync('src/components/KentekenForm/HorizontalKentekenForm.tsx', 'utf8');

// Replace the WhatsApp build and href logic
content = content.replace(/const buildWhatsappUrl = \(\) => \{[\s\S]*?\};\n\n/g, '');

content = content.replace(/const \[isFetching, setIsFetching\] = useState\(false\);/, 
  'const [isFetching, setIsFetching] = useState(false);\n  const [isSubmitted, setIsSubmitted] = useState(false);\n  const [isSubmitting, setIsSubmitting] = useState(false);');

// Replace handleSubmit
const oldHandleSubmit = `  const handleSubmit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!kenteken) {
      e.preventDefault();
      alert('Vul alstublieft minimaal uw kenteken in om een exacte prijs te ontvangen.');
      return;
    }
    
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: vehicle ? vehicle.merk : 'KENTEKEN AANVRAAG',
        model: vehicle ? \`\${kenteken} - \${vehicle.model}\` : kenteken,
        year: vehicle ? vehicle.bouwjaar : 'N/A',
        service: quote ? \`Prijsopgave via kenteken — \${quote.service}\` : 'Prijsopgave via kenteken',
        // phone and postcode as their own fields: postcode is what routes a
        // lead to the right partner, phone is what deduplicates it.
        location: postcode,
        postcode,
        phone,
        photoUrl: '',
        source: 'kenteken_form',
        scenario: quote?.scenario ?? null,
        quotedPrice: quote ? quote.from : null,
        gclid: getCookie('gclid'),
        wbraid: getCookie('wbraid'),
        gbraid: getCookie('gbraid'),
        msclkid: getCookie('msclkid'),
      }),
      keepalive: true
    }).catch(err => console.error("Error saving lead", err));

    reportLeadConversion({
      source: 'kenteken_form',
      phone,
      postcode,
    });
    window.oaiq?.('track', 'lead_created', { content_name: 'kenteken_form' });

    (e.currentTarget as HTMLAnchorElement).href = buildWhatsappUrl();
  };`;

const newHandleSubmit = `  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!kenteken || !phone) {
      alert('Vul alstublieft uw kenteken en telefoonnummer in.');
      return;
    }
    
    setIsSubmitting(true);
    
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: vehicle ? vehicle.merk : 'KENTEKEN AANVRAAG',
          model: vehicle ? \`\${kenteken} - \${vehicle.model}\` : kenteken,
          year: vehicle ? vehicle.bouwjaar : 'N/A',
          service: quote ? \`Prijsopgave via kenteken — \${quote.service}\` : 'Prijsopgave via kenteken',
          location: postcode,
          postcode,
          phone,
          photoUrl: '',
          source: 'kenteken_form',
          scenario: quote?.scenario ?? null,
          quotedPrice: quote ? quote.from : null,
          gclid: getCookie('gclid'),
          wbraid: getCookie('wbraid'),
          gbraid: getCookie('gbraid'),
          msclkid: getCookie('msclkid'),
        }),
      });

      reportLeadConversion({
        source: 'kenteken_form',
        phone,
        postcode,
      });
      window.oaiq?.('track', 'lead_created', { content_name: 'kenteken_form' });
      
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error saving lead", err);
      alert('Er ging iets mis. Probeer het opnieuw of bel ons direct.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

content = content.replace(oldHandleSubmit, newHandleSubmit);

const oldActionGroup = `<div className={styles.actionGroup}>
          <a
            href={\`https://wa.me/\${SITE_CONFIG.whatsapp}\`}
            onClick={handleSubmit}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={styles.btnSubmit}
          >
            Prijs opvragen
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>`;

const newActionGroup = `<div className={styles.actionGroup}>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.btnSubmit}
            disabled={isSubmitting}
            style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: '1rem', fontWeight: 600 }}
          >
            {isSubmitting ? 'Verzenden...' : 'Prijs opvragen'}
            {!isSubmitting && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
          </button>
        </div>`;

content = content.replace(oldActionGroup, newActionGroup);

const successReturn = `  if (isSubmitted) {
    return (
      <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-navy-surface)' }}>Aanvraag Ontvangen!</h3>
        <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>Bedankt voor uw aanvraag. We hebben uw gegevens ontvangen en bellen u binnen 5 minuten met de exacte prijs.</p>
      </div>
    );
  }

  return (`;

content = content.replace('  return (', successReturn);

fs.writeFileSync('src/components/KentekenForm/HorizontalKentekenForm.tsx', content);
