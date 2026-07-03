import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Galerij | ${SITE_CONFIG.name}`,
  description: 'Galerij van autosleutel werkzaamheden. Voor/na, tools, klantmomenten, BMW, Mercedes, VW, Toyota.',
  alternates: { canonical: `${SITE_CONFIG.domain}/galerij` },
};

const categories = [
  { title: '🔑 Voor/Na Sleutels', items: 8 },
  { title: '🚐 Bus & Gereedschappen', items: 6 },
  { title: '🔵 BMW Klussen', items: 6 },
  { title: '⭐ Mercedes Klussen', items: 6 },
  { title: '🔧 VW/Audi Klussen', items: 6 },
  { title: '🔴 Toyota/Lexus Klussen', items: 6 },
  { title: '👻 Ghost Immobiliser', items: 4 },
  { title: '😊 Klantmomenten', items: 8 },
];

export default function GalerijPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">GALERIJ</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Ons Werk in Beelden</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Voor/na foto&apos;s, gereedschappen, klantmomenten. Voeg uw WebP foto&apos;s toe aan /public/gallery/
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        
        {/* Werkplaats Section */}
        <div style={{ marginBottom: '4rem', background: 'var(--color-bg-alt)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-label" style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em' }}>UTRECHT WERKPLAATS</span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Onze Professionele Werkplaats</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                Onze professionele, fysieke werkplaats in Utrecht is de plek waar wij geavanceerde sleutelreparaties en programmeringen uitvoeren. Van SMD microsolderen op printplaten tot het decoderen van complexe startblokkeringen en het uitlijnen van mechanische CNC sleutel-freesmachines — we hebben alle expertise in eigen huis.
              </p>
            </div>
            <div>
              <img 
                src="/autosleutel24-sleutelbijmaken-utrecht.jpg" 
                alt="Autosleutel24 professionele sleutelmaker werkplaats in Utrecht met transponder programmeertools en soldeerbouten" 
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} 
              />
            </div>
          </div>
        </div>

        {categories.map((cat) => (
          <div key={cat.title} style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--color-border)' }}>{cat.title}</h2>
            <div className="gallery-grid">
              {[...Array(cat.items)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div className="gallery-item-placeholder">
                    <span>📷</span>
                    <span>{cat.title}</span>
                    <small>Foto {i + 1}.webp</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
