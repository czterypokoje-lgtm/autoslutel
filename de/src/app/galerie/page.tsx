import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import GallerySlider from '@/components/GallerySlider/GallerySlider';
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';

export const metadata: Metadata = {
  title: `Galerie | ${SITE_CONFIG.name}`,
  /* Counted, not typed: the flyers left this gallery (see lib/jobPhotos.ts)
     and a hand-written "26" was already wrong before they did. Brands named
     are only ones still pictured. */
  description: `Galerie unserer Arbeiten: ${REAL_GALLERY_PROJECTS.length} Aufträge aus dem Netzwerk — BMW, Audi, Mercedes und mehr. Schlüssel nachmachen, anlernen und Fahrzeuge schadenfrei öffnen, jeweils vor Ort.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/galerie` },
};

export default function GaleriePage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Galerie', item: `${SITE_CONFIG.domain}/galerie` },
    ],
  };

  // Real photographs of completed jobs — the strongest "Experience" signal we
  // have for E-E-A-T, and eligible for Google Images once the image sitemap is
  // announced in robots.txt.
  const gallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${SITE_CONFIG.domain}/galerie#gallery`,
    name: 'Erledigte Autoschlüssel-Aufträge',
    description:
      'Fotos von Aufträgen aus unserem Netzwerk: Schlüssel nachmachen, Transponder anlernen und Fahrzeuge schadenfrei öffnen — jeweils dort, wo das Fahrzeug stand.',
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
        <span className="section-label">GALERIE</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Ons Werk in Beelden</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 650, margin: '0 auto' }}>
          {/*
            * Hier standen auf der niederländischen Seite fünf Stadtlinks nach
            * Utrecht, Amsterdam, Arnhem, Den Haag und Almere. Die Städte
            * stehen jetzt in der Konfiguration, und die Fotos selbst nennen
            * ohnehin keine Stadt — sie sind in den Niederlanden entstanden,
            * und eine deutsche Stadt darunter zu schreiben wäre eine falsche
            * Angabe. Siehe config/gallery.ts.
            */}
          {REAL_GALLERY_PROJECTS.length} Arbeiten aus dem Netzwerk: Schlüssel nachgemacht und
          angelernt, Gehäuse getauscht, Fahrzeuge schadenfrei geöffnet. Dieselbe Arbeit erledigen
          unsere Partner in {SITE_CONFIG.serviceAreaString}.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {/* Werkplaats Section */}
        <div style={{ marginBottom: '4rem', background: 'var(--color-bg-alt)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span className="section-label" style={{ color: 'var(--orange-500)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em' }}>UTRECHT WERKPLAATS & MOBIELE SERVICE</span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '1rem' }}>Werkstatttechnik, mobil eingesetzt</h2>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                Die Fahrzeuge unserer Partner führen Diagnose- und Anlerntechnik für die gängigen Systeme mit: von BMW FEM/BDC und Mercedes EIS über die Online-Freigabe im VW-Konzern bis zu Keyless-Go-Schlüsseln bei Porsche. Gearbeitet wird dort, wo das Fahrzeug steht — nicht in einer Halle, in die es gebracht werden muss.
              </p>
            </div>
            <div>
              <img 
                src="/autoschluessel24-schluesselnachmachen.webp" 
                alt="Werkstatt für Autoschlüssel mit Lötstation und Werkzeug" 
                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} 
              />
            </div>
          </div>
        </div>

        {/* REAL PHOTOS SHOWCASE */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', textAlign: 'center' }}>Alle {REAL_GALLERY_PROJECTS.length} Fotos</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Aufträge aus dem Netzwerk, jeweils am Fahrzeug des Kunden erledigt.
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
