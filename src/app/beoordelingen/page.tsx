import type { Metadata } from 'next';
import Link from 'next/link';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Klantbeoordelingen (5.0★) | Autosleutel24',
  },
  description: `Klantbeoordelingen van ${SITE_CONFIG.fullName}. Lees onze reviews rechtstreeks op ons Google-bedrijfsprofiel.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/beoordelingen` },
};

export default function BeoordelingenPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">BEOORDELINGEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Klantbeoordelingen</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f59e0b' }}>{SITE_CONFIG.rating}</span>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '4px' }}>★★★★★</div>
            
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <GoogleReviewsCta />

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href={SITE_CONFIG.social.google} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" id="all-google-reviews">
            Schrijf uw beoordeling op Google →
          </a>
        </div>
      </div>
    </main>
  );
}
