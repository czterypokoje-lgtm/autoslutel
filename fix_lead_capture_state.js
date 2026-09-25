const fs = require('fs');
let content = fs.readFileSync('src/components/LeadCaptureForm/LeadCaptureForm.tsx', 'utf8');

if (!content.includes('isSubmitted')) {
  content = content.replace('const [isSubmitting, setIsSubmitting] = useState(false);', 
    'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isSubmitted, setIsSubmitted] = useState(false);');

  content = content.replace('setIsSubmitting(true);', 'setIsSubmitting(true);');
  content = content.replace('}).finally(() => setIsSubmitting(false));', '}).then(() => setIsSubmitted(true)).finally(() => setIsSubmitting(false));');

  const returnStmt = '  return (\n    <div className={`${styles.container} ${theme === \'light\' ? styles.themeLight : styles.themeDark}`}>\n';
  
  const successState = `  if (isSubmitted) {
    return (
      <div className={\`\${styles.container} \${theme === 'light' ? styles.themeLight : styles.themeDark}\`} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: theme === 'light' ? '#0f172a' : '#fff' }}>Aanvraag Ontvangen!</h3>
        <p style={{ color: theme === 'light' ? '#475569' : '#cbd5e1', fontSize: '1.1rem' }}>Bedankt voor uw aanvraag. We hebben uw gegevens ontvangen en bellen u binnen 5 minuten met de exacte prijs.</p>
      </div>
    );
  }

`;
  content = content.replace(returnStmt, successState + returnStmt);
  fs.writeFileSync('src/components/LeadCaptureForm/LeadCaptureForm.tsx', content);
}
