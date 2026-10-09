import type { Metadata } from 'next';
import { SITE, isReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'So erreichen Sie uns — rund um die Uhr, auch am Wochenende.',
  alternates: { canonical: `${SITE.domain}/kontakt` },
};

export default function KontaktPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Kontakt', path: '/kontakt' }])} />
      <section className="section">
        <div className="wrap prose">
          <h1>Kontakt</h1>
          <p className="lede">
            Am schnellsten geht es telefonisch: mit Marke, Modell, Baujahr und Ihrem
            Standort können wir den Festpreis sofort nennen.
          </p>

          {isReady(SITE.phone) ? (
            <p>
              <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
                {SITE.phone}
              </a>
            </p>
          ) : (
            <p className="notice">
              Die deutsche Rufnummer wird gerade eingerichtet und erscheint hier, sobald
              sie geschaltet ist.
            </p>
          )}

          {isReady(SITE.email) && (
            <p>
              E-Mail: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
          )}

          <h2>Was wir wissen müssen</h2>
          <ul>
            <li>Marke, Modell und Baujahr des Fahrzeugs</li>
            <li>Welche Schlüsselart — normaler Schlüssel, Funkschlüssel, Keyless Go</li>
            <li>Ob noch ein Schlüssel vorhanden ist</li>
            <li>Wo das Fahrzeug steht: Ort, Postleitzahl, Straße oder Parkhaus</li>
          </ul>

          <h2>Erreichbarkeit</h2>
          <p>{SITE.hours}</p>

          <h2>Wo wir arbeiten</h2>
          <p>{STAEDTE.map((s) => s.stadt).join(' · ')}</p>
        </div>
      </section>
    </>
  );
}
