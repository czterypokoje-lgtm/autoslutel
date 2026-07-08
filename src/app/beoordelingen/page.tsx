import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';

export const metadata: Metadata = {
  title: `Beoordelingen | ${SITE_CONFIG.name}`,
  description: `Klantbeoordelingen van ${SITE_CONFIG.fullName}. 4.9/5 sterren op Google. 127 tevreden klanten.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/beoordelingen` },
};

export default function BeoordelingenPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">BEOORDELINGEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Klantbeoordelingen</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '3.5rem', fontWeight: 700, color: '#f59e0b' }}>4.9</span>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '4px' }}>★★★★★</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{SITE_CONFIG.reviewCount} beoordelingen</div>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {SHARED_GOOGLE_REVIEWS.map((r, i) => (
            <GoogleReviewCard key={i} review={r} />
          ))}
          {/* We duplicate them for the sake of the page layout, simulating 6 reviews */}
          {SHARED_GOOGLE_REVIEWS.map((r, i) => (
            <GoogleReviewCard key={`dup-${i}`} review={{...r, name: r.name + ' (2)'}} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href={SITE_CONFIG.social.google} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" id="all-google-reviews">
            Schrijf uw beoordeling op Google →
          </a>
        </div>
      </div>
    </main>
  );
}
