import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, isBtwConfigured } from '@/config/site.config';
import { SHIPPING_COST, FREE_SHIPPING_FROM, VAT_RATE, formatPrice } from '@/lib/catalog';

/**
 * Algemene voorwaarden.
 *
 * The shop takes orders and, once a payment provider is connected, money — and
 * had no terms at all. BW 6:230m requires the trader's identity, the total
 * price, the delivery arrangements, the right of withdrawal and the complaints
 * procedure to be given before the order is placed, and Mollie will ask for
 * this page during onboarding as well.
 *
 * Deliberately short and readable. Everything here is either a legal default
 * or a number the code already applies; nothing is invented for effect.
 */

export const metadata: Metadata = {
  title: { absolute: 'Algemene voorwaarden | Autosleutel24' },
  description:
    'De voorwaarden waaronder Autosleutel24 autosleutels, onderdelen en montage aan huis levert.',
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
          {SITE_CONFIG.fullName}, mobiele autosleutelservice en webshop, werkzaam in{' '}
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
          Op elke bestelling in onze webshop en op elke opdracht aan onze monteur. Wijkt er iets
          af, dan leggen wij dat schriftelijk vast; dan gaat die afspraak voor.
        </p>

        <h2 style={h2}>3. Prijzen</h2>
        <p style={p}>
          Alle prijzen in de webshop zijn in euro&apos;s en inclusief {Math.round(VAT_RATE * 100)}%
          btw. Verzending kost {formatPrice(SHIPPING_COST)} en is gratis vanaf{' '}
          {formatPrice(FREE_SHIPPING_FROM)}. Wat u op de laatste stap van het bestelproces ziet
          staan, is het totaalbedrag dat wordt afgeschreven — daar komt niets bij.
        </p>

        <h2 style={h2}>4. De overeenkomst</h2>
        <p style={p}>
          De koop komt tot stand zodra wij uw bestelling bevestigen. Wij mogen een bestelling
          weigeren of annuleren wanneer een artikel niet meer leverbaar is of wanneer een prijs
          door een kennelijke fout verkeerd op de site stond; u krijgt dan binnen 14 dagen uw
          geld terug.
        </p>

        <h2 style={h2}>5. Levering</h2>
        <p style={p}>
          Wij leveren binnen 2 tot 3 werkdagen, en in elk geval binnen 30 dagen. Lukt dat niet,
          dan mag u de koop kosteloos ontbinden. Het risico van beschadiging of verlies ligt bij
          ons tot het moment dat u — of iemand die u aanwijst — het pakket ontvangt.
        </p>

        <h2 style={h2}>6. Bedenktijd en retour</h2>
        <p style={p}>
          U heeft 14 dagen bedenktijd. Op maat gemaakte artikelen zijn daarvan uitgezonderd: een
          sleutel die op uw auto is ingeleerd of waarvan de baard is gefreesd, is op uw voertuig
          toegesneden (BW 6:230p sub f). De volledige regeling staat op{' '}
          <Link href="/verzending-en-retour" style={{ color: '#b93c20' }}>verzending en retour</Link>.
        </p>

        <h2 style={h2}>7. Garantie en conformiteit</h2>
        <p style={p}>
          Wij geven 12 maanden garantie op elektronica. Daarnaast heeft u altijd recht op een
          product dat doet wat u ervan mag verwachten (BW 7:17); die wettelijke aanspraak
          vervalt niet door onze garantietermijn.
        </p>

        <h2 style={h2}>8. Werk aan uw voertuig</h2>
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

        <h2 style={h2}>9. Aansprakelijkheid</h2>
        <p style={p}>
          Onze aansprakelijkheid is beperkt tot het bedrag van de betreffende opdracht of
          bestelling. Deze beperking geldt niet bij opzet of bewuste roekeloosheid en evenmin
          waar de wet dwingend anders bepaalt.
        </p>

        <h2 style={h2}>10. Klachten en geschillen</h2>
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
