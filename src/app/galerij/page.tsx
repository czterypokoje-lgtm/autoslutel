import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import GallerySlider from '@/components/GallerySlider/GallerySlider';
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';

export const metadata: Metadata = {
  title: `Galerij | ${SITE_CONFIG.name}`,
  description: 'Galerij van autosleutel werkzaamheden. 26 echte praktijk projecten: BMW, Mercedes, VW, Audi, Porsche, Toyota met GPS geolocatie.',
  alternates: { canonical: `${SITE_CONFIG.domain}/galerij` },
};

export default function GalerijPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Galerij', item: `${SITE_CONFIG.domain}/galerij` },
    ],
  };

  // Real photographs of completed jobs — the strongest "Experience" signal we
  // have for E-E-A-T, and eligible for Google Images once the image sitemap is
  // announced in robots.txt.
  const gallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${SITE_CONFIG.domain}/galerij#gallery`,
    name: 'Uitgevoerde autosleutel projecten',
    description:
      'Foto\'s van door Autosleutel24 uitgevoerde opdrachten: sleutels bijmaken, transponders programmeren en schadevrij openen op locatie.',
    isPartOf: { '@id': `${SITE_CONFIG.domain}/#website` },
    associatedMedia: REAL_GALLERY_PROJECTS.map((p) => ({
      '@type': 'ImageObject',
      contentUrl: `${SITE_CONFIG.domain}${p.src}`,
      caption: p.alt,
    })),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gallerySchema) }}
      />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">GALERIJ & PROJECTEN</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Ons Werk in Beelden</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 650, margin: '0 auto' }}>
          Bekijk onze 26 recente sleutelreparaties, sleutel programmeringen en smart key inleerprojecten op locatie in <Link href="/steden/utrecht" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Utrecht</Link>, <Link href="/steden/amsterdam" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amsterdam</Link>, <Link href="/steden/arnhem" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Arnhem</Link>, <Link href="/steden/den-haag" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Den Haag</Link>, <Link href="/steden/almere" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Almere</Link> en heel Nederland.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {/* Werkplaats Section */}
        <div style={{ marginBottom: '4rem', background: 'var(--color-bg-alt)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-label" style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em' }}>UTRECHT WERKPLAATS & MOBIELE SERVICE</span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Professionele Autosleutel Specialist</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                Onze professionele werkplaats in Utrecht en onze volledig uitgeruste mobiele servicebus zijn voorzien van de modernste OEM diagnose- en programmeertools. Van BMW FEM/BDC en Mercedes EIS tot Volkswagen SFD en Porsche smart keys — wij programmeren sleutels voor alle merken op locatie.
              </p>
            </div>
            <div>
              <img 
                src="/autosleutel24-sleutelbijmaken-utrecht.webp" 
                alt="Sleutelmaker werkplaats met soldeerbouten en gereedschap" 
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} 
              />
            </div>
          </div>
        </div>

        {/* 26 REAL PHOTOS SHOWCASE */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', textAlign: 'center' }}>Alle 26 Projectfoto&apos;s uit Onze Praktijk</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Bekijk alle praktijkprojecten uit Utrecht, Amsterdam, Almere, Amersfoort en heel Nederland.
          </p>
          <GallerySlider 
            images={REAL_GALLERY_PROJECTS.map(p => ({ src: p.src, caption: p.alt }))} 
            title="" 
          />
        </div>
      </div>
    </main>
  );
}
