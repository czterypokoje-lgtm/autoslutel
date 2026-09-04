import Link from 'next/link';
import PaymentMethods from '@/components/webshop/PaymentMethods';

export default function WebshopFooter() {
  return (
    <footer style={{ background: '#e2e8f0', color: '#1e293b', padding: '4rem 1.5rem', fontFamily: 'var(--font-sans)', marginTop: '4rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between' }}>
        
        {/* Columns Container */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', flex: '1 1 60%' }}>
          {/* Your Stuff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#0f172a' }}>Jouw Zaken</h4>
            <Link href="/webshop/orders" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Orderstatus</Link>
            <Link href="/webshop/account" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Account informatie</Link>
            <Link href="/webshop/rewards" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Spaarpunten</Link>
            <Link href="/webshop/retouren" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Retouren (60 dagen)</Link>
            <Link href="/webshop/betalen" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Betalen & Klarna</Link>
          </div>

          {/* Get In Touch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#0f172a' }}>Contact</h4>
            <Link href="/contact" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Neem contact op</Link>
            <Link href="/klantenservice" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Klantenservice</Link>
            <Link href="/faq" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Veelgestelde Vragen</Link>
            <Link href="/zakelijk" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Zakelijk / B2B</Link>
            <Link href="/gratis-support" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Gratis technische support</Link>
          </div>

          {/* Our Company */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#0f172a' }}>Ons Bedrijf</h4>
            <Link href="/over-ons" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Over ons</Link>
            <Link href="/waarom-autosleutel24" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Waarom Autosleutel24?</Link>
            <Link href="/monteurs" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Onze monteurs</Link>
            <Link href="/vacatures" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Werken bij ons</Link>
          </div>

          {/* Privacy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#0f172a' }}>Jouw Privacy</h4>
            <Link href="/privacy" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Privacybeleid</Link>
            <button style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: '#475569', fontSize: '0.95rem', cursor: 'pointer' }}>Cookie-instellingen</button>
            <Link href="/voorwaarden" style={{ color: '#475569', fontSize: '0.95rem', textDecoration: 'none' }}>Algemene Voorwaarden</Link>
          </div>
        </div>

        {/* Stay In The Know Box */}
        <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '12px', flex: '1 1 300px', minWidth: '320px', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h4 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: '#0f172a', textAlign: 'center' }}>Blijf op de hoogte</h4>
          <p style={{ textAlign: 'center', fontSize: '0.95rem', color: '#475569', marginBottom: '1.5rem', fontWeight: 500 }}>
            Ontvang de nieuwste deals<br/>
            <span style={{ fontSize: '0.85rem' }}>Plus, maak kans op €100 shoptegoed</span>
          </p>
          
          <div style={{ display: 'flex' }}>
            <input 
              type="email" 
              placeholder="Vul je e-mailadres in" 
              style={{ width: '100%', padding: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px 0 0 4px', fontSize: '0.95rem', outline: 'none' }}
            />
            <button style={{ background: '#b93c20', color: '#fff', border: 'none', padding: '0 1.25rem', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#94a3b8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </div>
            <div style={{ width: '40px', height: '40px', background: '#94a3b8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </div>
            <div style={{ width: '40px', height: '40px', background: '#94a3b8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </div>
          </div>
        </div>

      </div>

      {/* Payment methods and carrier, site-wide: the questions a first-time
          visitor has before they trust a shop they have not used before. */}
      <div style={{ maxWidth: '1400px', margin: '2.5rem auto 0', paddingTop: '1.75rem', borderTop: '1px solid #cbd5e1' }}>
        <PaymentMethods compact />
      </div>
    </footer>
  );
}
