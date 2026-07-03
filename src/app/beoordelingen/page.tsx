import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Beoordelingen | ${SITE_CONFIG.name}`,
  description: `Klantbeoordelingen van ${SITE_CONFIG.fullName}. 4.9/5 sterren op Google. 127 tevreden klanten.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/beoordelingen` },
};

const reviews = [
  { author: 'Mark V.', city: 'Utrecht', car: 'BMW X5', stars: 5, text: 'Alle sleutels kwijt van mijn BMW X5. Dealer wilde €1.800 en 2 weken. Deze jongens kwamen in 45 minuten, had me binnen 2 uur rijdend. €650. Ongelooflijk.' },
  { author: 'Sarah T.', city: 'Veldhoven', car: 'Toyota Corolla Hybrid', stars: 5, text: 'Toyota hybride, 2021, alle sleutels kwijt. Toyota zei "onmogelijk zonder origineel." Deze jongens gebruikten een bypass kabel en maakten een nieuwe sleutel in 3 uur. €900 bespaard.' },
  { author: 'Peter M.', city: 'Best', car: 'VW Golf 8', stars: 5, text: 'VW Golf 8, SFD geblokkeerd. Dealer kon 3 weken niet helpen. Deze jongens ontgrendelden het op dezelfde dag. Echte professionals.' },
  { author: 'Thomas K.', city: 'Tilburg', car: 'Audi A4', stars: 5, text: 'Sleutel van mijn Audi kwijt op Tilburg station. Gebeld om 20:00, ze waren er om 20:35. Nieuwe sleutel geprogrammeerd om 21:30. Ongelooflijke service.' },
  { author: 'Sandra L.', city: 'Den Bosch', car: 'Mercedes C-klasse', stars: 5, text: 'Mercedes sleutel kapot op de A2. Binnen 35 minuten stond de bus naast me. Nieuwe sleutel ter plaatse. Fantastisch.' },
  { author: 'Rob de B.', city: 'Venlo', car: 'Ford Transit', stars: 5, text: 'Ford Transit sleutels verloren in Venlo. Super snel geholpen, vaste prijs, geen verrassingen. Top service.' },
];

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ color: '#f59e0b', fontSize: '1.1rem', letterSpacing: '2px' }}>{'★'.repeat(r.stars)}</div>
              <p style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.92rem', margin: 0, flex: 1 }}>&quot;{r.text}&quot;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{r.author[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.author}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{r.city} — {r.car}</div>
                </div>
              </div>
            </div>
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
