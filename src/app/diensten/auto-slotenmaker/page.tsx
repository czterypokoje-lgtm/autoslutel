import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Auto Slotenmaker | 24/7 Mobiele Service in de Buurt | Vaste Prijs',
  description: `Spoed auto slotenmaker nodig? Wij openen uw auto schadevrij, maken nieuwe sleutels bij en herstellen inbraakschade op locatie. 24/7 mobiel. Bel: ${SITE_CONFIG.phone}`,
  keywords: ['auto slotenmaker', 'auto slotenmaker in de buurt vinden', 'wat kost een auto slotenmaker', 'goedkope auto slotenmaker', 'auto slotenmaker spoed', 'autoslot vervangen', 'auto openen zonder sleutel'],
  alternates: {
    canonical: `${SITE_CONFIG.domain}/diensten/auto-slotenmaker`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/diensten/auto-slotenmaker`,
      'x-default': `${SITE_CONFIG.domain}/diensten/auto-slotenmaker`,
    },
  },
};

const faqItems = [
  { q: 'Hoe vind ik een auto slotenmaker in de buurt?', a: `Omdat Autosleutel24 volledig mobiel opereert, zijn wij de snelste auto slotenmaker in uw regio (Midden-Nederland). Wij komen direct naar u toe met onze servicebus.` },
  { q: 'Wat kost een auto slotenmaker voor het openen van een deur?', a: `De kosten voor een noodopening starten vanaf €75. U krijgt bij ons altijd vooraf een eerlijke, vaste prijsopgave zonder verrassingen.` },
  { q: 'Kan een auto slotenmaker ook nieuwe sleutels bijmaken?', a: 'Ja, Autosleutel24 is een volledige automotive specialist. Na het openen van uw auto kunnen wij direct ter plekke een nieuwe transpondersleutel frezen en programmeren.' },
  { q: 'Hoe werkt schadevrij openen door een auto slotenmaker?', a: 'Wij gebruiken geen breekijzers of stalen draden, maar gespecialiseerd Lishi-gereedschap. Hiermee manipuleren we de cilinder veilig en 100% schadevrij.' },
  { q: 'Vervangen jullie autosloten na inbraak?', a: 'Ja, bij inbraakschade kunnen wij uw sloten direct vervangen en aanpassen op uw huidige sleutel, zodat u veilig verder kunt rijden.' },
];

const steps = [
  { n:'1', title: 'Bel direct', desc: `Bel onze 24/7 meldkamer op ${SITE_CONFIG.phone}. Wij geven direct een vaste prijs.` },
  { n:'2', title: 'Wij komen naar u toe', desc: `Onze mobiele auto slotenmaker is gemiddeld binnen ${SITE_CONFIG.responseTime} ter plaatse.` },
  { n:'3', title: 'Deur Openen & Repareren', desc: 'Wij openen uw deuren schadevrij of vervangen defecte sloten direct op straat.' },
  { n:'4', title: 'Nieuwe Sleutels', desc: 'Indien gewenst frezen en programmeren we direct vervangende sleutels.' },
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
    { '@type': 'ListItem', position: 2, name: 'Auto Slotenmaker', item: `${SITE_CONFIG.domain}/diensten/auto-slotenmaker` },
  ],
};

export default function AutoSlotenmaker() {
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
              De Mobiele Auto Slotenmaker in de Buurt (24/7 Service)
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              Sleutels kwijt, in de auto vergeten, of inbraakschade aan het slot? Als professionele auto slotenmaker komen wij naar uw locatie toe om deuren schadevrij te openen, sloten te repareren én direct nieuwe sleutels in te leren. Goedkoper en sneller dan de autodealer!
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
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

        <section style={{ padding: '3.5rem 0', background: '#f5f7fa' }}>
          <div className="container">
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Diensten van uw Auto Slotenmaker</h2>
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>Schadevrij Auto Openen</h3>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Auto in het slot gevallen en sleutel op de bijrijdersstoel of in de kofferbak? 
                  Wij forceren niets en buigen geen deuren krom. Met speciaal lockpick-gereedschap openen wij uw deuren 100% veilig.
                </p>
                <Link href="/auto-op-slot" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Meer over auto openen &rarr;</Link>
              </div>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>Autoslot Vervangen & Repareren</h3>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Na een inbraakpoging is uw deurslot of contactslot vaak verwoest. Wij kunnen cilinders repareren of compleet 
                  vervangen. Vaak passen wij het nieuwe slot direct aan op uw bestaande sleutel!
                </p>
                <Link href="/diensten/contactslot-reparatie" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Meer over slot reparatie &rarr;</Link>
              </div>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>Nieuwe Sleutels Bijmaken</h3>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Een gewone pechhulp kan u alleen weer uw auto in helpen, wij gaan verder. Onze mobiele werkplaats is uitgerust 
                  met CNC-freesmachines en transponderapparatuur. Wij maken en inleren direct een nieuwe smartkey.
                </p>
                <Link href="/diensten/sleutel-bijmaken" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Meer over sleutels bijmaken &rarr;</Link>
              </div>

            </div>
          </div>
        </section>
        {/* FAQ */}
        <section style={{ padding: '3.5rem 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <h2>Veelgestelde Vragen — Auto Slotenmaker</h2>
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
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Auto Slotenmaker Nodig? Bel Direct</h2>
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
