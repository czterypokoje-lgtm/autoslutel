import React from 'react';
import type { ShopProduct } from '@/lib/shopCatalog';

/**
 * The detail blocks under the fold.
 *
 * The specification table used to be four fixed rows — "Merk: Aftermarket",
 * "Conditie: Nieuw", "Geschikt voor: Universeel / Diverse modellen" and
 * "Keurmerk: CE gecertificeerd" — identical on every product, reading
 * `product.brand`, a field that does not exist on a catalogue entry. Nothing
 * on the page said 433 MHz or PCF7947, which are the two things that decide
 * whether the key can be made to work.
 *
 * It now renders `product.specs`, which scripts/build-catalog.mjs fills from
 * A-Key's own published specification block.
 *
 * The CE claim is gone: we do not hold the declaration of conformity for these
 * parts, and stating a certification we cannot produce on request is not a
 * claim to make on 944 product pages.
 */

/** What is physically in the box, by what the product is. */
function boxContents(product: ShopProduct): string[] {
  const title = product.titleNl;

  switch (product.category) {
    case 'behuizingen':
      return [`1x ${title}`, 'Losse behuizing — zonder elektronica, transponder of batterij'];
    case 'printplaten':
      return [`1x ${title}`, 'Losse printplaat — zonder behuizing en zonder sleutelbaard'];
    case 'sleutelbaarden':
      return [`1x ${title}`, 'Ongefreesde sleutelbaard — moet op uw slot worden gefreesd'];
    case 'transponders':
      return [`1x ${title}`, 'Losse transponder — moet op uw auto worden ingeleerd'];
    case 'noodsleutels':
      return [`1x ${title}`];
    default:
      return [
        `1x ${title}`,
        'Batterij geplaatst',
        'Moet op uw auto worden ingeleerd (programmeren)',
      ];
  }
}

/** The programming question, answered for what this product actually is. */
function programmingAnswer(product: ShopProduct): string {
  switch (product.category) {
    case 'behuizingen':
      return 'Nee. U zet de elektronica uit uw huidige sleutel over in deze behuizing; ' +
        'de auto merkt geen verschil. Alleen de sleutelbaard moet nog worden gefreesd.';
    case 'sleutelbaarden':
      return 'Nee, maar de baard moet wel op uw slot worden gefreesd.';
    case 'printplaten':
      return 'Ja. Een printplaat is nieuwe elektronica en moet op uw auto worden ingeleerd.';
    default:
      return 'Ja. De transponder in deze sleutel moet op uw auto worden ingeleerd door ' +
        'een specialist. Wij doen dat ter plaatse, of u laat het elders doen.';
  }
}

export default function ProductAccordions({ product }: { product: ShopProduct }) {
  const containerStyle = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    overflow: 'hidden',
    marginBottom: '1rem',
  };

  const titleStyle = { fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'inherit' };

  const specs = product.specs ?? [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* Specificaties */}
      <details style={containerStyle} open>
        <summary className="faq-question" style={{ padding: '1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={titleStyle}>Specificaties</h2>
          <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div style={{ padding: '1.5rem 2rem 2rem' }}>
          {specs.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <tbody>
                {specs.map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th
                      scope="row"
                      style={{ padding: '0.85rem 0', fontWeight: 600, width: '34%', color: '#334155', textAlign: 'left' }}
                    >
                      {label}
                    </th>
                    <td style={{ padding: '0.85rem 0', color: '#0f172a' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#475569', margin: 0 }}>
              Onze leverancier publiceert voor dit artikel geen technische specificaties.
              Bel of app ons met uw kenteken — dan zoeken wij uit welke uitvoering u nodig heeft.
            </p>
          )}

          <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Specificaties zoals opgegeven door de fabrikant. Twijfelt u of dit de juiste
            uitvoering is? Vergelijk de frequentie en de transponder met uw huidige sleutel,
            of stuur ons uw kenteken.
          </p>
        </div>
      </details>

      {/* Beschrijving */}
      <details style={containerStyle}>
        <summary className="faq-question" style={{ padding: '1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={titleStyle}>Productinformatie</h2>
          <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div style={{ padding: '2rem' }}>
          <p style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
            {product.descriptionNl || 'Geen uitgebreide beschrijving beschikbaar voor dit product.'}
          </p>
        </div>
      </details>

      {/* Wat zit er in de doos */}
      <details style={containerStyle}>
        <summary className="faq-question" style={{ padding: '1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={titleStyle}>Wat zit er in de doos</h2>
          <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div style={{ padding: '2rem' }}>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: 1.8, fontSize: '0.95rem', color: '#334155', margin: 0 }}>
            {boxContents(product).map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>12 maanden garantie</li>
          </ul>
        </div>
      </details>

      {/* Q&A */}
      <details style={containerStyle}>
        <summary className="faq-question" style={{ padding: '1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={titleStyle}>Veelgestelde vragen</h2>
          <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '1rem' }}>
              Moet dit artikel nog geprogrammeerd worden?
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0 }}>{programmingAnswer(product)}</p>
          </div>

          {product.frequency && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '1rem' }}>
                Hoe weet ik of {product.frequency} de juiste frequentie is?
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0 }}>
                De frequentie staat meestal op de printplaat in uw huidige sleutel, of in het
                typegoedkeuringsnummer op de achterkant. Wijkt hij af, dan werkt de
                afstandsbediening niet — stuur ons bij twijfel uw kenteken.
              </p>
            </div>
          )}

          <div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem', fontSize: '1rem' }}>
              Kan ik dit ook door jullie laten monteren?
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#334155', margin: 0 }}>
              Ja. Kies bij het bestellen voor een monteurbezoek; wij komen naar u toe en
              programmeren de sleutel ter plaatse op uw auto.
            </p>
          </div>
        </div>
      </details>

    </div>
  );
}
