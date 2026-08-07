import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG } from '@/config/site.config';
import Image from 'next/image';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bestellen op Kenteken? | Direct Prijs & Hulp op Locatie',
  },
  description: `Geen technisch gedoe! App uw kenteken naar Autosleutel24 en ontvang direct een vaste prijs. Wij komen op locatie in de Randstad. Inclusief 12 maanden garantie.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken`,
    },
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Autosleutel Bestellen op Kenteken', item: `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken` },
  ],
};

const faqItems = [
  { q: 'Hoe snel heb ik een prijs als ik mijn kenteken doorstuur?', a: 'Tijdens onze openingstijden reageren wij via WhatsApp of telefoon vrijwel direct (vaak al binnen 5 tot 10 minuten). U weet direct waar u aan toe bent.' },
  { q: 'Maken jullie sleutels voor alle automerken?', a: 'Ja! Omdat we op kenteken zoeken, kunnen we voor vrijwel elk merk een sleutel leveren en inleren. Of het nu gaat om een Volkswagen, BMW, Ford, Renault, of zelfs Amerikaanse merken zoals Jeep en Dodge. Ook voor moderne Keyless Go (smart keys) bent u bij ons aan het juiste adres.' },
  { q: 'Moet ik vooraf betalen?', a: 'Nee, bij Autosleutel24 betaalt u nooit vooraf. U betaalt pas op locatie (via Pin of contant) nadat wij de sleutel succesvol hebben ingeleerd en getest op uw auto.' },
  { q: 'Wat als ik al mijn autosleutels kwijt ben? Werkt het dan ook via kenteken?', a: 'Absoluut. Zelfs als u helemaal geen sleutel meer heeft, kunnen wij aan de hand van het kenteken en het chassisnummer (VIN) een compleet nieuwe sleutel "vanaf nul" genereren, frezen en inleren op de boordcomputer van uw auto.' }
];

const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function KentekenBestellenPage() {
  const whatsappMsg = "Hallo, wat kost een nieuwe sleutel voor mijn auto? Mijn kenteken is: ";
  const customWhatsAppUrl = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <>
      <Script id="kenteken-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="kenteken-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* HERO SECTION */}
        <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem 4rem', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '800px' }}>
            <span className="section-label" style={{ color: 'var(--color-primary)' }}>SNEL & EENVOUDIG</span>
            <h1 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Autosleutel Bestellen op Kenteken: <br/><span style={{ color: 'var(--orange-500)' }}>Binnen 1 Minuut de Exacte Prijs</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span>⭐⭐⭐⭐⭐ 4.9/5 Gemiddelde beoordeling</span>
              <span>🚐 100% Mobiele Service</span>
              <span>🛡️ 12 Maanden Garantie</span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Heeft u een nieuwe autosleutel, reservesleutel of smart key nodig, maar weet u niet precies welk type transponder, frequentie of sleutelprofiel uw auto gebruikt? Geen enkel probleem. Bij {SITE_CONFIG.name} maken we het u graag makkelijk.
            </p>
          </div>
        </section>

        <section style={{ padding: '4rem 2rem' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            
            <div style={{ marginBottom: '3rem', fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--gray-700)' }}>
              <p>
                U kunt bij ons eenvoudig uw <strong>autosleutel bestellen op kenteken</strong>. Aan de hand van uw kenteken kunnen wij in onze dealerkaliber database exact zien welke sleutel bij uw voertuig hoort. U hoeft niets uit te zoeken, wij regelen alles en komen direct naar uw locatie!
              </p>
            </div>

            {/* THE MAIN WHATSAPP CTA BOX */}
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              borderLeft: '5px solid #22c55e', 
              borderRight: '1px solid #dcfce7',
              borderTop: '1px solid #dcfce7',
              borderBottom: '1px solid #dcfce7',
              borderRadius: '0 8px 8px 0',
              padding: '2.5rem', 
              marginBottom: '4rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ color: '#166534', marginBottom: '1.5rem', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" style={{ color: '#22c55e' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                📱 Hoe Werkt Het? (Snel & Zonder Gedoe)
              </h2>
              <ol style={{ lineHeight: 1.8, color: '#14532d', fontSize: '1.1rem', marginLeft: '1.5rem', marginBottom: '2rem' }}>
                <li style={{ marginBottom: '1rem' }}>Sla ons nummer op of klik op de WhatsApp knop: <strong style={{ color: '#166534' }}>{SITE_CONFIG.phone}</strong></li>
                <li style={{ marginBottom: '1rem' }}>Stuur een appje met <strong>uw kenteken</strong> (en eventueel een foto van uw huidige sleutel).</li>
                <li style={{ marginBottom: '1rem' }}>Wij kijken in onze database en sturen u direct een <strong>vaste, scherpe prijsopgave</strong>. Geen verborgen kosten!</li>
                <li>Akkoord? Wij komen met onze mobiele servicebus naar uw locatie om de sleutel direct te frezen en in te leren.</li>
              </ol>
              
              <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                backgroundColor: '#25D366',
                color: '#fff',
                padding: '1.25rem 2rem',
                borderRadius: '8px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                boxShadow: '0 4px 6px -1px rgba(37, 211, 102, 0.2), 0 2px 4px -1px rgba(37, 211, 102, 0.1)',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                width: '100%'
              }}>
                💬 Stuur direct uw kenteken via WhatsApp
              </a>
            </div>

            {/* DEALER VS AUTOSLEUTEL24 TABLE */}
            <div style={{ marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>Waarom Kiezen Voor {SITE_CONFIG.name} in plaats van de Dealer?</h2>
              <p style={{ color: 'var(--gray-700)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                Veel mensen denken bij een verloren of defecte autosleutel direct aan de officiële merkdealer. Maar wist u dat dit vaak onnodig duur is en veel tijd kost?
              </p>
              <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--navy-900)', color: '#fff' }}>
                    <tr>
                      <th style={{ padding: '1.25rem', borderBottom: '2px solid var(--navy-800)' }}>Wat u verwacht</th>
                      <th style={{ padding: '1.25rem', borderBottom: '2px solid var(--navy-800)' }}>De Merkdealer ❌</th>
                      <th style={{ padding: '1.25rem', borderBottom: '2px solid var(--navy-800)', background: 'var(--color-primary)' }}>{SITE_CONFIG.name} ✅</th>
                    </tr>
                  </thead>
                  <tbody style={{ background: '#fff' }}>
                    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--navy-800)' }}>Locatie</td>
                      <td style={{ padding: '1.25rem', color: 'var(--gray-700)' }}>U moet de auto (laten) wegslepen naar de garage.</td>
                      <td style={{ padding: '1.25rem', color: 'var(--navy-800)', fontWeight: 500, background: 'rgba(59, 130, 246, 0.05)' }}>Wij komen met onze servicebus naar ú toe.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--navy-800)' }}>Snelheid</td>
                      <td style={{ padding: '1.25rem', color: 'var(--gray-700)' }}>Vaak 1 tot 2 weken wachttijd op de nieuwe sleutel.</td>
                      <td style={{ padding: '1.25rem', color: 'var(--navy-800)', fontWeight: 500, background: 'rgba(59, 130, 246, 0.05)' }}>Meestal dezelfde dag of direct de volgende dag geregeld.</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--navy-800)' }}>Prijs</td>
                      <td style={{ padding: '1.25rem', color: 'var(--gray-700)' }}>Hoofdprijzen plus verborgen inleerkosten.</td>
                      <td style={{ padding: '1.25rem', color: 'var(--navy-800)', fontWeight: 500, background: 'rgba(59, 130, 246, 0.05)' }}>Tot 50% goedkoper met een transparante, vaste prijs vooraf.</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--navy-800)' }}>Garantie</td>
                      <td style={{ padding: '1.25rem', color: 'var(--gray-700)' }}>Standaard fabrieksgarantie.</td>
                      <td style={{ padding: '1.25rem', color: 'var(--navy-800)', fontWeight: 500, background: 'rgba(59, 130, 246, 0.05)' }}>12 maanden garantie én een officiële BTW-factuur.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRIVACY SECTION */}
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '12px', border: '1px solid var(--gray-200)', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>Veilig & Vertrouwd: Wat doen wij met uw kenteken?</h2>
              <p style={{ color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                Privacy en veiligheid staan bij ons voorop. Wanneer u uw kenteken aan ons doorgeeft, gebruiken wij dit uitsluitend om technische voertuiggegevens op te vragen (zoals het bouwjaar, model en type startonderbreker/immobilizer).
              </p>
              <p style={{ color: 'var(--gray-700)', fontSize: '1.05rem', lineHeight: 1.7 }}>
                <strong>Wij hebben geen inzicht in uw persoonlijke gegevens, NAW-gegevens of verzekeringsdetails.</strong> U loopt dus geen enkel risico.
              </p>
            </div>

            <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
              <Image 
                src="/autosleutel_kenteken_1_1785882845475.jpg" 
                alt="Autosleutel bestellen op kenteken via WhatsApp - direct prijs" 
                width={800} 
                height={500} 
                style={{ borderRadius: '12px', boxShadow: 'var(--shadow-md)', width: '100%', height: 'auto' }}
              />
            </div>

            {/* FAQ */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--navy-900)' }}>💡 Veelgestelde Vragen (FAQ)</h2>
              <div className="faq-container">
                {faqItems.map((f, i) => (
                  <details key={i} className="faq-item">
                    <summary className="faq-question">
                      {f.q}
                      <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                    </summary>
                    <p className="faq-answer">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
