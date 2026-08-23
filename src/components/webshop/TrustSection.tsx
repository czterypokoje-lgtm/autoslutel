'use client';
import React from 'react';
import Link from 'next/link';

export default function TrustSection() {
  return (
    <section style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Why customers trust us (White bg) */}
      <div style={{ background: '#fff', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '3rem' }}>
            Waarom klanten ons vertrouwen
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
            <div style={{ borderRight: '1px solid #e5e5e5', paddingRight: '2rem' }}>
              <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>10</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, textDecoration: 'underline', marginBottom: '0.25rem' }}>
                jaar ervaring
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                met deskundig advies & support
              </div>
            </div>

            <div style={{ borderRight: '1px solid #e5e5e5', paddingRight: '2rem' }}>
              <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>4.8</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, textDecoration: 'underline', marginBottom: '0.25rem' }}>
                score op Trustpilot
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                uit 2.000+ reviews
              </div>
            </div>

            <div style={{ borderRight: '1px solid #e5e5e5', paddingRight: '2rem' }}>
              <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>5</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, textDecoration: 'underline', marginBottom: '0.25rem' }}>
                jaar op rij
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Beste Service Award
              </div>
            </div>

            <div>
              <div style={{ color: '#c2410c', fontSize: '2.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>A+</div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, textDecoration: 'underline', marginBottom: '0.25rem' }}>
                gecertificeerd
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                door Webshop Keurmerk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Trustpilot Reviews (Light gray bg) */}
      <div style={{ background: '#f5f5f5', padding: '3rem 0', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          
          {/* Trustpilot Logo Area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Excellent</div>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '0.25rem' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ background: '#00b67a', color: '#fff', padding: '2px 4px', fontSize: '12px' }}>★</div>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem' }}>
              Gebaseerd op <span style={{fontWeight: 700, textDecoration: 'underline'}}>2.000 reviews</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800, fontSize: '1.1rem' }}>
              <span style={{ color: '#00b67a', fontSize: '1.4rem' }}>★</span> Trustpilot
            </div>
          </div>

          {/* Reviews Carousel Mock */}
          <div style={{ display: 'flex', gap: '1.5rem', overflow: 'hidden', flex: 1, position: 'relative' }}>
            {[
              { name: 'Jan de Vries', title: 'Supersnelle levering!', desc: 'Gister besteld, vandaag al in huis. De sleutel programmeren was zo gepiept.' },
              { name: 'Peter B.', title: 'Perfecte pasvorm', desc: 'Mijn oude sleutel was kapot, deze behuizing past perfect. Ziet er weer als nieuw uit.' },
              { name: 'S. Klaassen', title: 'Goede service', desc: 'Ik had de verkeerde sleutel besteld, maar werd super netjes en snel geholpen met ruilen.' },
              { name: 'Anoniem', title: 'Precies wat ik zocht', desc: 'Na lang zoeken eindelijk de juiste batterij en behuizing gevonden voor mijn Audi.' }
            ].map((review, i) => (
              <div key={i} style={{ flex: '1', minWidth: '200px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                  {[1,2,3,4,5].map(j => (
                    <div key={j} style={{ background: '#00b67a', color: '#fff', padding: '1px 3px', fontSize: '9px' }}>★</div>
                  ))}
                  <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Geverifieerd
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  {review.name}, 2 dagen geleden
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {review.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                  {review.desc}
                </div>
              </div>
            ))}
          </div>
          
          <button style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'transparent',
            border: '1px solid #cbd5e1',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      {/* 3. Bottom Section (White bg with images) */}
      <div style={{ background: '#fff', padding: '4rem 0 0 0' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            De specialist sinds 2014
          </h2>
          <Link href="/over-ons" style={{ fontSize: '0.9rem', color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Lees meer over ons <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
        </div>

        {/* Edge to Edge Image Row */}
        <div style={{ display: 'flex', width: '100%', height: '220px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ flex: 1, borderRight: i !== 6 ? '2px solid #fff' : 'none' }}>
              <img 
                src={`https://placehold.co/400x300/e2e8f0/475569?text=Lifestyle+${i}`} 
                alt="Lifestyle" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
