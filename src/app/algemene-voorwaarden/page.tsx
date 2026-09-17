import React from 'react';
import type { Metadata } from 'next';
import { SITE_CONFIG, isBtwConfigured } from '@/config/site.config';
import { VAT_RATE } from '@/lib/catalog';

/**
 * Algemene voorwaarden.
 *
 * Mobiele autosleutelservice only — there is no webshop on this domain
 * anymore, so every clause here concerns the callout/repair service: identity,
 * pricing, the agreement, warranty, liability, complaints (BW 6:230m still
 * applies to a service agreed at a distance, e.g. by phone or WhatsApp).
 *
 * NOTE: this page was trimmed down from a version that also covered online
 * orders (distance-selling withdrawal rights, shipping, returns). That trim
 * removed the clauses that no longer apply now that nothing is sold online
 * from this domain, but it was not written or reviewed by a lawyer — have
 * this checked before relying on it.
 */

export const metadata: Metadata = {
  title: { absolute: 'Algemene voorwaarden | Autosleutel24' },
  description:
    'De voorwaarden waaronder Autosleutel24 een autosleutel bijmaakt of monteert aan huis.',
  alternates: { canonical: `${SITE_CONFIG.domain}/algemene-voorwaarden` },
};

const h2: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 800,
  color: '#0f172a',
  margin: '2.25rem 0 0.6rem',
};

const p: React.CSSProperties = { color: '#334155', lineHeight: 1.7, margin: '0 0 1rem' };

export default function TermsPage() {
  return (
    <main style={{ background: '#fff' }}>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(1.6rem, 5vw, 2.4rem)' }}>
          Algemene voorwaarden
        </h1>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 5rem' }}>
        <h2 style={{ ...h2, marginTop: 0 }}>1. Wie wij zijn</h2>
        <p style={p}>
          {SITE_CONFIG.fullName}, mobiele autosleutelservice, werkzaam in{' '}
          {SITE_CONFIG.serviceAreaString}.<br />
          E-mail: {SITE_CONFIG.email} · Telefoon: {SITE_CONFIG.phone}
          <br />
          KvK-nummer: {SITE_CONFIG.kvk}
          {isBtwConfigured() && (
            <>
              <br />
              Btw-identificatienummer: {SITE_CONFIG.btw}
            </>
          )}
        </p>

        <h2 style={h2}>2. Waarop deze voorwaarden gelden</h2>
        <p style={p}>
          Op elke opdracht aan onze monteur. Wijkt er iets af, dan leggen wij dat schriftelijk
          vast; dan gaat die afspraak voor.
        </p>

        <h2 style={h2}>3. Prijzen</h2>
        <p style={p}>
          Alle prijzen zijn in euro&apos;s en inclusief {Math.round(VAT_RATE * 100)}% btw. U krijgt
          de prijs voordat de monteur begint; wat is afgesproken is het bedrag dat wordt
          afgerekend — daar komt niets bij.
        </p>

        <h2 style={h2}>4. De overeenkomst</h2>
        <p style={p}>
          De opdracht komt tot stand zodra wij uw afspraak bevestigen. Bleek de eerder genoemde
          prijs door een kennelijke fout verkeerd, dan laten wij dat vóór aanvang van het werk
          weten; u bent dan niet aan die foutieve prijs gehouden.
        </p>

        <h2 style={h2}>5. Garantie en conformiteit</h2>
        <p style={p}>
          Wij geven 12 maanden garantie op ons werk en de ingebouwde elektronica. Daarnaast heeft
          u altijd recht op een resultaat dat doet wat u ervan mag verwachten (BW 7:17); die
          wettelijke aanspraak vervalt niet door onze garantietermijn.
        </p>

        <h2 style={h2}>6. Werk aan uw voertuig</h2>
        <p style={p}>
          Onze monteur werkt alleen aan een voertuig wanneer u kunt aantonen dat u eigenaar bent
          of daartoe gemachtigd. Wij vragen daarom om uw kenteken en een legitimatie. Wij openen
          of programmeren geen voertuig zonder dat bewijs — ook niet met spoed.
        </p>
        <p style={p}>
          Voor het inleren van een sleutel wordt met de boordelektronica van uw auto gewerkt. Wij
          zijn niet aansprakelijk voor gebreken die daar al waren, of voor gevolgschade door een
          storing die losstaat van ons werk.
        </p>

        <h2 style={h2}>7. Aansprakelijkheid</h2>
        <p style={p}>
          Onze aansprakelijkheid is beperkt tot het bedrag van de betreffende opdracht. Deze
          beperking geldt niet bij opzet of bewuste roekeloosheid en evenmin waar de wet dwingend
          anders bepaalt.
        </p>

        <h2 style={h2}>8. Klachten en geschillen</h2>
        <p style={p}>
          Meld een klacht binnen bekwame tijd bij {SITE_CONFIG.email}. Wij reageren binnen twee
          werkdagen. Op deze voorwaarden is Nederlands recht van toepassing. Komen wij er samen
          niet uit, dan kunt u terecht bij de bevoegde Nederlandse rechter of via het{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#b93c20' }}
          >
            Europese ODR-platform
          </a>
          .
        </p>

        <p style={{ ...p, marginTop: '2.5rem', fontSize: '.9rem', color: '#64748b' }}>
          Laatst bijgewerkt: september 2026.
        </p>
      </div>
    </main>
  );
}
