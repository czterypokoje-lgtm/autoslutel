import React from 'react';

export default function TrustpilotPlaceholder() {
  /*
   * Nothing until the account exists.
   *
   * The block renders "Excellent ★★★★★" in Trustpilot green above
   * "[XX,XXX] reviews". The brackets are honest scaffolding, but a visitor
   * skimming a live page sees a five-star rating we have not earned — which
   * is a misleidende handelspraktijk (BW 6:193c), the same reason the
   * invented reviews came off this site in the first place.
   *
   * Set NEXT_PUBLIC_TRUSTPILOT_ID once the profile is live and connected, and
   * this appears on its own.
   */
  if (!process.env.NEXT_PUBLIC_TRUSTPILOT_ID) return null;

  return (
    <section style={{ background: '#fff', paddingTop: '3rem', borderTop: '1px solid #e5e5e5', overflow: 'hidden' }}>
      <style>{`
        .tp-horizontal-scroll {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 1.5rem;
          padding-bottom: 1rem;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scrollbar-width: none; /* Firefox */
        }
        .tp-horizontal-scroll::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        .tp-scroll-item {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        
        /* Stats Specific */
        .tp-stat-item {
          width: 200px;
        }
        
        /* Reviews Specific */
        .tp-review-item {
          width: 280px;
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #f1f5f9;
        }

        @media (min-width: 1024px) {
          .tp-horizontal-scroll {
            justify-content: center;
            overflow-x: visible;
            flex-wrap: wrap;
          }
          .tp-review-item {
            width: calc(20% - 1.5rem);
            box-shadow: none;
            border: none;
            padding: 0;
            background: transparent;
          }
          .tp-stat-item {
            width: auto;
            flex: 1;
          }
          .tp-stat-item:not(:first-child) {
            border-left: 1px solid #e2e8f0;
            padding-left: 1.5rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '2.5rem' }}>
          Why customers trust us
        </h2>

        {/* Stats Row */}
        <div className="tp-horizontal-scroll" style={{ marginBottom: '2rem' }}>
          <div className="tp-scroll-item tp-stat-item">
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[XX]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>years of experience</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[your benefit]</div>
          </div>
          <div className="tp-scroll-item tp-stat-item">
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[X.X]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>rating on Trustpilot</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>from [XX]k+ reviews</div>
          </div>
          <div className="tp-scroll-item tp-stat-item">
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[XX]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>[Metric 3]</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[description]</div>
          </div>
          <div className="tp-scroll-item tp-stat-item">
            <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300 }}>[A+]</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>rating and accreditation</div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>[Organization]</div>
          </div>
        </div>
      </div>

      {/* Reviews Row */}
      <div style={{ background: '#f8f9fa', padding: '3rem 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
          <div className="tp-horizontal-scroll">
            
            {/* Overall Rating Block */}
            <div className="tp-scroll-item tp-review-item">
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Excellent</div>
              <div style={{ color: '#00b67a', fontSize: '1.5rem', margin: '0.5rem 0' }}>★★★★★</div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>Based on [XX,XXX] reviews</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem' }}>★ Trustpilot</div>
            </div>

            {/* Individual Reviews */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="tp-scroll-item tp-review-item">
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
      </div>
    </section>
  );
}
