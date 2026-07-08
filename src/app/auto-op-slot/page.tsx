import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Auto Op Slot? Sleutel Vergeten? | Schadevrij Openen | 24/7 Mobiel',
  description: `Auto op slot en sleutels erin vergeten? Wij openen uw auto schadevrij. 24/7 mobiel. Reactietijd ${SITE_CONFIG.responseTime}. Bel: ${SITE_CONFIG.phone}`,
  keywords: ['auto op slot', 'sleutel vergeten in auto', 'auto openen sleutels erin', 'autoslotenmaker schadevrij', 'auto openen 24 uur'],
  alternates: {
    canonical: `${SITE_CONFIG.domain}/auto-op-slot`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/auto-op-slot`,
      'x-default': `${SITE_CONFIG.domain}/auto-op-slot`,
    },
  },
};

const faqItems = [
  { q: 'Beschadigt u mijn auto bij het openen?', a: 'Nee. Wij gebruiken professionele Lock Pick sets en Long Reach tools die geen beschadiging veroorzaken aan uw portier, rubber of lak. Schadevrij openen is onze standaard.' },
  { q: 'Hoe snel kunt u mijn auto openen?', a: `Gemiddeld ${SITE_CONFIG.responseTime} na uw belletje. In Utrecht soms al binnen 20 minuten.` },
  { q: 'Werkt u ook midden in de nacht?', a: 'Ja. Wij zijn 24 uur per dag, 7 dagen per week beschikbaar. Nacht toeslag van +25% buiten kantooruren (na 20:00 en voor 08:00).' },
  { q: 'Kan ik bewijzen dat het mijn auto is?', a: 'Ja, wij vragen om een rijbewijs of kentekenbewijs op naam. Dit is verplicht voor onze veiligheidsprotocollen.' },
  { q: 'Vergoedt mijn verzekering dit?', a: 'Soms, afhankelijk van uw polis. Wij geven altijd een gespecificeerde factuur die u kunt indienen.' },
];

const steps = [
  { n:'1', title: 'Bel direct', desc: `Bel ${SITE_CONFIG.phone}. Geef uw locatie en automerk door. Wij geven direct een vaste prijs.` },
  { n:'2', title: 'Wij komen naar u toe', desc: `Gemiddeld ${SITE_CONFIG.responseTime} bij u. Geen sleepkosten — volledig mobiel.` },
  { n:'3', title: 'Schadevrij openen', desc: 'Professionele Long Reach tools en Lock Picks. Geen krassen, geen deuken, geen beschadigde rubbers.' },
  { n:'4', title: 'Optioneel: reservesleutel', desc: 'Wil u direct een reservesleutel laten maken? Dat kan ter plaatse.' },
];

const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Auto Op Slot', item: `${SITE_CONFIG.domain}/auto-op-slot` },
  ],
};

export default function AutoOpSlot() {
  return (
    <>
      <Script id="autos-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="autos-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Emergency call strip */}
        <section style={{ background: 'var(--color-danger)', padding: '1.75rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>SLEUTELS VERGETEN — DIRECT HULP BESCHIKBAAR</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} id="slot-emergency-phone"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: 'var(--color-danger)', padding: '0.9rem 2.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '1.3rem', textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            Bel Nu: {SITE_CONFIG.phone}
          </a>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.75rem', marginBottom: 0 }}>Gemiddeld {SITE_CONFIG.responseTime} · Schadevrij · 24/7</p>
        </section>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '3rem 2rem' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', marginBottom: '1rem' }}>
              Auto Op Slot — Sleutels Vergeten? Wij Openen Schadevrij, 24/7
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              Sleutels in de auto afgesloten? Geen paniek. Wij openen uw auto professioneel en schadevrij
              met dealer-niveau tools. Geen beschadigingen aan uw portier, rubber of lak.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id="slot-hero-phone">{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }} id="slot-hero-wa">WhatsApp</a>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container">
            <h2>Wat Wij Doen — 4 Stappen</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {steps.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '6px', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.n === '1' ? 'var(--color-danger)' : 'var(--navy-800)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem', color: 'var(--gray-900)' }}>{s.title}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.55 }}>{s.desc}</span>
                    {s.n === '1' && <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-block', marginTop: '0.5rem', background: 'var(--color-danger)', color: '#fff', padding: '0.35rem 0.875rem', borderRadius: '3px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }} id="slot-step1-phone">Bel Nu</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section style={{ padding: '3.5rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2>Waarom Schadevrij Openen?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {[
                { title: 'Geen Schade aan Portier', desc: 'Onze Long Reach tools passeren het raam zonder krassen of deuken in uw portier.' },
                { title: 'Geen Beschadigde Rubbers', desc: 'Professionele techniek voorkomt dat deur- en raamrubbers worden beschadigd of verscheurd.' },
                { title: 'Geen Inbraak-look', desc: 'Uw auto ziet er na onze service exact hetzelfde uit als daarvoor. Geen tekenen van opening.' },
                { title: 'Alle Merken', desc: 'Van Fiat 500 tot Range Rover — wij hebben de juiste tools voor elk merk en model.' },
              ].map(item => (
                <div key={item.title} style={{ padding: '1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)' }}>{item.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <h2>Veelgestelde Vragen — Auto Op Slot</h2>
            {faqItems.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ background: 'var(--color-danger)', padding: '3rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Auto Op Slot? Bel Direct</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>Schadevrij openen. Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--color-danger)', padding: '1rem 2.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} id="slot-bottom-phone">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', padding: '1rem 2rem', borderRadius: '4px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }} id="slot-bottom-wa">WhatsApp</a>
          </div>
        </section>

        <section style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div className="container">
            <p>Meer problemen oplossen: <Link href="/autosleutel-kwijt">Autosleutel Kwijt</Link> · <Link href="/spoedhulp-autosleutel">24/7 Spoedhulp</Link> · <Link href="/auto-openen-zonder-sleutel">Auto Openen Zonder Sleutel</Link></p>
          </div>
        </section>
      </main>
    </>
  );
}
