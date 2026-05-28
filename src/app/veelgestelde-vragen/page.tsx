import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Veelgestelde Vragen | ${SITE_CONFIG.name}`,
  description: 'Antwoorden op veelgestelde vragen over autosleutels. Kosten, tijdsduur, verzekering, merken, en meer.',
  alternates: { canonical: `${SITE_CONFIG.domain}/veelgestelde-vragen` },
};

const faqs = [
  { q: 'Hoe snel kunt u mijn autosleutel vervangen?', a: 'Onze gemiddelde reactietijd in Eindhoven is 34 minuten. Buiten Eindhoven zijn wij doorgaans binnen 30-90 minuten bij u, afhankelijk van uw locatie.' },
  { q: 'Moet ik mijn auto naar u toe slepen?', a: 'Nee! Wij zijn volledig mobiel. Onze uitgeruste bus komt naar uw locatie — thuis, op het werk, op een parkeerplaats, of langs de weg. Geen sleepkosten.' },
  { q: 'Wordt mijn autosleutel vergoed door de verzekering?', a: 'De meeste All Risk polissen vergoeden gestolen autosleutels. Sommige polissen dekken ook verloren sleutels. Wij verstrekken altijd verzekeringsklare, gespecificeerde facturen.' },
  { q: 'Kunt u een sleutel maken als ik geen reserve heb?', a: 'Ja! Dit noemen wij AKL (Alle Sleutels Kwijt) service. Wij kunnen voor alle merken en modellen een nieuwe sleutel programmeren zonder originele sleutel aanwezig.' },
  { q: 'Met welke merken werkt u?', a: 'BMW, Mercedes-Benz, Audi, VW, Seat, Škoda, Toyota, Lexus, Volvo, Ford, Opel, Vauxhall, Hyundai, Kia, Porsche, Bentley, Lamborghini, en meer.' },
  { q: 'Werkt u ook buiten kantooruren?', a: '24/7! Nacht, weekend, feestdagen — wij zijn altijd bereikbaar. Voor spoed buiten kantooruren geldt een toeslag van 25%.' },
  { q: 'Wat kost een autosleutel bijmaken?', a: 'Prijzen starten vanaf €180 voor een eenvoudige sleutel. Complexe systemen (BMW BDC, VW MQB48) kosten meer. Altijd een vaste prijs afspreken vóór de werkzaamheden.' },
  { q: 'Welke garantie geeft u?', a: 'Wij geven 12 maanden garantie op alle sleutelprogrammering. Als de sleutel niet meer werkt door onze programmering, lossen wij het gratis op.' },
  { q: 'Kunnen jullie een Ghost Immobiliser installeren?', a: 'Ja! Wij installeren TASSA gecertificeerde Ghost Immobilisers voor alle merken. De installatie duurt 1,5-2 uur en wij verstrekken een certificaat voor uw verzekering.' },
  { q: 'Werken jullie ook in België en Duitsland?', a: 'Ja! Wij bedienen Antwerpen, Brussel, Leuven, Hasselt, Lommel en de Düsseldorf/Keulen/Aachen regio. Grensoverschrijdende service is geen probleem.' },
];

export default function FAQPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">FAQ</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Veelgestelde Vragen</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Heeft u een andere vraag? Bel of WhatsApp ons direct.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem', maxWidth: 900 }}>
        {faqs.map((faq, i) => (
          <details key={i} style={{ borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}>
            <summary style={{ fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              {faq.q}
              <span style={{ color: 'var(--color-primary)', flexShrink: 0, fontSize: '1.2rem' }}>+</span>
            </summary>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>{faq.a}</p>
          </details>
        ))}

        <div style={{ background: 'var(--color-primary)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', marginTop: '3rem' }}>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Nog een vraag?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Bel of WhatsApp — wij antwoorden direct.</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-primary)', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem', display: 'inline-block' }}>
            📞 {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    </main>
  );
}
