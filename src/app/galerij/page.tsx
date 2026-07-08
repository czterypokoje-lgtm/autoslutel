import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';
import RealGalleryShowcase from '@/components/RealGalleryShowcase/RealGalleryShowcase';

export const metadata: Metadata = {
  title: `Galerij | ${SITE_CONFIG.name}`,
  description: 'Galerij van autosleutel werkzaamheden. 26 echte praktijk projecten: BMW, Mercedes, VW, Audi, Porsche, Toyota met GPS geolocatie.',
  alternates: { canonical: `${SITE_CONFIG.domain}/galerij` },
};

export default function GalerijPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">GALERIJ & PROJECTEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Ons Werk in Beelden</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 650, margin: '0 auto' }}>
          Bekijk onze 26 recente sleutelreparaties, sleutel programmeringen en smart key inleerprojecten op locatie in Utrecht, Amsterdam, Almere en heel Nederland.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {/* Werkplaats Section */}
        <div style={{ marginBottom: '4rem', background: 'var(--color-bg-alt)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-label" style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em' }}>UTRECHT WERKPLAATS & MOBIELE SERVICE</span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Professionele Autosleutel Specialist</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                Onze professionele werkplaats in Utrecht en onze volledig uitgeruste mobiele servicebus zijn voorzien van de modernste OEM diagnose- en programmeertools. Van BMW FEM/BDC en Mercedes EIS tot Volkswagen SFD en Porsche smart keys — wij programmeren sleutels voor alle merken op locatie.
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

        {/* 26 REAL PHOTOS SHOWCASE */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', textAlign: 'center' }}>Alle 26 Projectfoto&apos;s uit Onze Praktijk</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Filter op automerk of bekijk alle praktijkprojecten met geolocatie GPS dekking.
          </p>
          <RealGalleryShowcase />
        </div>
      </div>
    </main>
  );
}
