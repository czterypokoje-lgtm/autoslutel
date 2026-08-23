import React from 'react';
import Link from 'next/link';

export default function WebshopFeatureBlocks() {
  return (
    <section style={{ padding: '6rem 0', background: '#fff' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '6rem' }}>
        
        {/* Block 1: Find a Trusted Locksmith (Image Left, Text Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', alignItems: 'center' }} className="md:grid-cols-2">
          {/* Image */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: '0.5rem' }}>
             {/* Using a placeholder map image */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#f1f5f9' }}>
               <img 
                 src="https://placehold.co/800x600/e2e8f0/64748b?text=Map+Location" 
                 alt="Vind een slotenmaker in de buurt"
                 style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
               />
            </div>
          </div>
          
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--webshop-dark)', lineHeight: 1.2 }}>
              Vind een betrouwbare slotenmaker
            </h2>
            <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Het vinden van een betrouwbare en eerlijke slotenmaker is zojuist eenvoudiger geworden met onze slotenmaker locator tool. Vul eenvoudig uw stad, provincie of postcode in (of alle 3) om een lijst van slotenmakers in uw regio te bekijken. U kunt ook uw resultaten verfijnen door de service aan te vinken die u zoekt.
            </p>
            <Link href="/webshop/partners" style={{ background: '#1e293b', color: '#fff', padding: '0.8rem 2rem', fontWeight: 700, borderRadius: '4px', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
              Zoek Nu
            </Link>
          </div>
        </div>

        {/* Block 2: Buy Replacement Keys (Text Left, Image Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', alignItems: 'center' }} className="md:grid-cols-2">
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', order: 2 }} className="md:order-1">
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--webshop-dark)', lineHeight: 1.2 }}>
              Koop vervangende sleutels & afstandsbedieningen van de experts
            </h2>
            <div style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                Welkom bij Autosleutel24. Ons doel is om onze klanten de snelste en makkelijkste manier te bieden om een vervangende autosleutel voor hun voertuig te kopen. Of u nu een sleutel kwijt bent, hij kapot is of u gewoon een extra set autosleutels nodig heeft, wij kunnen helpen.
              </p>
              <p>
                Wij leveren autosleutels, smart keys, flip keys, afstandsbedieningen en meer. We verkopen fabrieks OEM sleutel vervangingen voor tot 80% onder de dealerprijzen en bieden programmeerbegeleiding voor alle geleverde sleutels.
              </p>
            </div>
          </div>
          
          {/* Image */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', order: 1 }} className="md:order-2">
             <img 
               src="https://placehold.co/800x600/e2e8f0/64748b?text=Handing+Over+Car+Keys" 
               alt="Sleutel overdracht"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             />
          </div>
        </div>

      </div>
    </section>
  );
}
