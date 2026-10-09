import type { Metadata } from 'next';
import { SITE, isReady } from '@/config/site';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung nach § 5 DDG.',
  alternates: { canonical: `${SITE.domain}/impressum` },
  /* Ein Impressum gehört in den Index — es muss findbar sein, auch über Google. */
  robots: { index: true, follow: true },
};

/**
 * Impressum.
 *
 * Pflicht nach § 5 DDG (Nachfolger des § 5 TMG) und von jeder Seite aus in zwei
 * Klicks erreichbar — darum steht der Link in der Fußzeile jeder Seite. Eine
 * deutsche Seite ohne Impressum ist der häufigste Abmahnungsgrund überhaupt,
 * und er ist der am einfachsten zu vermeidende.
 *
 * Die Angaben kommen aus SITE.legal. Solange dort Platzhalter stehen, startet
 * der Build gar nicht (assertSiteReady im Root-Layout) — diese Seite kann also
 * nie mit einer erfundenen Adresse online gehen.
 */
export default function ImpressumPage() {
  const l = SITE.legal;
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Impressum', path: '/impressum' }])} />
      <section className="section">
        <div className="wrap prose">
          <h1>Impressum</h1>

          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            {isReady(l.company) && (
              <>
                {l.company}
                <br />
              </>
            )}
            {isReady(l.legalForm) && (
              <>
                {l.legalForm}
                <br />
              </>
            )}
            {isReady(l.street) && (
              <>
                {l.street}
                <br />
              </>
            )}
            {isReady(l.postcode) && isReady(l.city) && (
              <>
                {l.postcode} {l.city}
                <br />
              </>
            )}
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            {isReady(SITE.phone) && (
              <>
                Telefon: <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
                <br />
              </>
            )}
            {isReady(SITE.email) && (
              <>
                E-Mail: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </>
            )}
          </p>

          {isReady(l.register) && (
            <>
              <h2>Registereintrag</h2>
              <p>{l.register}</p>
            </>
          )}

          {isReady(l.vatId) && (
            <>
              <h2>Umsatzsteuer-Identifikationsnummer</h2>
              <p>Gemäß § 27 a Umsatzsteuergesetz: {l.vatId}</p>
            </>
          )}

          {isReady(l.responsible) && (
            <>
              <h2>Verantwortlich für den Inhalt</h2>
              <p>Nach § 18 Abs. 2 MStV: {l.responsible}</p>
            </>
          )}

          <h2>Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht verpflichtet und nicht bereit, an einem
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte
            wir keinen Einfluss haben. Für diese fremden Inhalte können wir keine
            Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der
            jeweilige Anbieter oder Betreiber verantwortlich.
          </p>
        </div>
      </section>
    </>
  );
}
