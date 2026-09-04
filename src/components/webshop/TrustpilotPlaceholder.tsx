import React from 'react';

export default function TrustpilotPlaceholder() {
  return (
    <section style={{ background: '#fff', paddingTop: '3rem', borderTop: '1px solid #e5e5e5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '2.5rem' }}>
          Why customers trust us
        </h2>

        {/* Stats Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[XX]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>years of experience</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[your benefit]</div>
          </div>
          <div style={{ flex: '1', minWidth: '200px', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[X.X]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>rating on Trustpilot</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>from [XX]k+ reviews</div>
          </div>
          <div style={{ flex: '1', minWidth: '200px', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[XX]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>[Metric 3]</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[description]</div>
          </div>
          <div style={{ flex: '1', minWidth: '200px', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[A+]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>rating and accreditation</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[Organization]</div>
          </div>
        </div>
      </div>

      {/* Reviews Row */}
      <div style={{ background: '#f8f9fa', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          
          <div style={{ flex: '0 0 200px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Excellent</div>
            <div style={{ color: '#00b67a', fontSize: '1.5rem', margin: '0.5rem 0' }}>★★★★★</div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Based on [XX,XXX] reviews</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>★ Trustpilot</div>
          </div>

          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: '1', minWidth: '200px' }}>
              <div style={{ color: '#00b67a', fontSize: '1.2rem', marginBottom: '0.25rem' }}>★★★★★</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>[Customer Name], [Date]</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                [Review Title {i}]
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                [This is a placeholder for a real customer review that will be loaded from your Trustpilot account once connected.]
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
