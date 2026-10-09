import type { Metadata } from 'next';
import Link from 'next/link';
import { LEISTUNGEN, abPreis, FAQ } from '@/config/leistungen';
import { SITE, isReady } from '@/config/site';
import Faq from '@/components/Faq';
import { JsonLd, breadcrumbSchema, faqSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Preise — alle Beträge inkl. 19 % MwSt.',
  description:
    'Was ein Autoschlüssel kostet: Festpreis am Telefon, vor der Anfahrt. Alle Beträge brutto inkl. 19 % MwSt., ohne Anfahrts- oder Wochenendzuschlag.',
  alternates: { canonical: `${SITE.domain}/preise` },
};

/**
 * Preise.
 *
 * Die wichtigste Seite auf einem Markt, auf dem Schlüsseldienste seit Jahren
 * in der Verbraucherpresse stehen. Zwei Regeln bestimmen alles hier:
 *
 * 1. Brutto. Verbraucherpreise müssen nach der Preisangabenverordnung inklusive
 *    MwSt. genannt werden; "zzgl. MwSt." wäre hier abmahnfähig.
 * 2. Keine Zahl, die nicht stimmt. Solange ein Ab-Preis nicht hinterlegt ist,
 *    steht hier, dass er am Telefon genannt wird — und nicht ein Platzhalter,
 *    ein "ab 0 €" oder ein Strich, der wie ein Preis aussieht.
 */
export default function PreisePage() {
  const mitPreis = LEISTUNGEN.map((l) => ({ l, preis: abPreis(l) }));
  const alleOffen = mitPreis.every((row) => row.preis === null);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([{ name: 'Preise', path: '/preise' }]),
          faqSchema(FAQ),
        ]}
      />

      <section className="section">
        <div className="wrap">
          <h1>Preise</h1>
          <p className="lede">
            Sie hören den Preis am Telefon, bevor jemand losfährt — und er ändert sich
            vor Ort nicht. Alle Beträge sind Bruttopreise inklusive 19 % MwSt.
          </p>

          <div className="prose">
            <h2>Was nicht dazukommt</h2>
            <ul>
              <li>Keine Anfahrtspauschale</li>
              <li>Kein Nacht-, Sonntags- oder Feiertagszuschlag</li>
              <li>Kein Aufschlag, der erst am Fahrzeug genannt wird</li>
            </ul>
            <p>
              Zeigt sich am Fahrzeug, dass der Auftrag ein anderer ist als am Telefon
              beschrieben, hören Sie den neuen Preis, bevor gearbeitet wird — und können
              ablehnen, ohne dass etwas berechnet wird.
            </p>
          </div>

          {alleOffen ? (
            <p className="notice">
              Die Preisliste für Deutschland wird gerade mit den Partnerbetrieben
              festgelegt. Bis sie hier steht, nennen wir Ihnen den Festpreis für Ihr
              Fahrzeug am Telefon — mit Marke, Modell, Baujahr und Schlüsselart ist das
              eine Frage von einer Minute. Wir setzen hier keine Zahl hin, die wir
              nachher nicht halten.
            </p>
          ) : (
            <table className="table" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th scope="col">Leistung</th>
                  <th scope="col">ab (inkl. MwSt.)</th>
                  <th scope="col">Dauer vor Ort</th>
                </tr>
              </thead>
              <tbody>
                {mitPreis.map(({ l, preis }) => (
                  <tr key={l.slug}>
                    <td>
                      <Link href={`/leistungen/${l.slug}`}>{l.titel}</Link>
                    </td>
                    <td>{preis ? `ab ${preis} €` : 'auf Anfrage'}</td>
                    <td>{l.dauer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="btn-row">
            {isReady(SITE.phone) ? (
              <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
                {SITE.phone} — Festpreis erfragen
              </a>
            ) : (
              <Link className="btn btn-primary" href="/kontakt">
                Festpreis erfragen
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap prose">
          <h2>Häufige Fragen zum Preis</h2>
          <Faq items={FAQ} />
        </div>
      </section>
    </>
  );
}
