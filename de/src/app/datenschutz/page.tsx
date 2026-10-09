import type { Metadata } from 'next';
import { SITE, isReady } from '@/config/site';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Welche Daten wir verarbeiten, wozu, und welche Rechte Sie haben.',
  alternates: { canonical: `${SITE.domain}/datenschutz` },
};

/**
 * Datenschutzerklärung.
 *
 * Bewusst so geschrieben, wie die Seite heute tatsächlich funktioniert: keine
 * Analyse, kein Tracking, keine Einbettungen, keine Cookies außer technisch
 * notwendigen. Darum steht hier auch kein Cookie-Banner — ein Banner, das nach
 * Einwilligung für nichts fragt, ist selbst ein Problem.
 *
 * Das ist der Stand, der zu prüfen ist, sobald jemand ein Analyse-Werkzeug
 * oder eine Karte einbaut. Wer das tut, muss diese Seite und die Einwilligung
 * mit ändern, sonst wird sie zu einer Behauptung.
 */
export default function DatenschutzPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Datenschutz', path: '/datenschutz' }])} />
      <section className="section">
        <div className="wrap prose">
          <h1>Datenschutzerklärung</h1>

          <h2>Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist der im{' '}
            <a href="/impressum">Impressum</a> genannte Anbieter.
          </p>

          <h2>Was diese Website erhebt</h2>
          <p>
            Diese Website setzt keine Analyse- oder Tracking-Dienste ein, bindet keine
            fremden Inhalte ein und speichert keine Cookies außer solchen, die für den
            Betrieb technisch erforderlich sind. Es wird kein Nutzungsprofil erstellt.
          </p>
          <p>
            Beim Aufruf einer Seite werden, wie bei jedem Webserver, technisch
            notwendige Daten verarbeitet: IP-Adresse, Zeitpunkt, aufgerufene Adresse,
            übertragene Datenmenge und der verwendete Browser. Rechtsgrundlage ist
            Art. 6 Abs. 1 lit. f DSGVO — das berechtigte Interesse am sicheren Betrieb
            der Website. Diese Daten werden nicht mit anderen Quellen zusammengeführt.
          </p>

          <h2>Wenn Sie uns anrufen oder schreiben</h2>
          <p>
            Rufen Sie an oder schreiben Sie uns, verarbeiten wir die Angaben, die Sie
            dabei machen — Name, Telefonnummer, Fahrzeug, Ort — um Ihre Anfrage zu
            bearbeiten und den Auftrag auszuführen. Rechtsgrundlage ist Art. 6 Abs. 1
            lit. b DSGVO (Vertrag oder Vertragsanbahnung).
          </p>

          <h2>Weitergabe an den Partnerbetrieb</h2>
          <p>
            Der Auftrag wird von einem Partnerbetrieb in Ihrer Stadt ausgeführt. Dazu
            geben wir die Daten weiter, die er für die Ausführung braucht: Ihren Namen,
            die Telefonnummer, die Adresse des Fahrzeugs und die Fahrzeugdaten. Die
            vollständige Adresse erhält der Partner erst, wenn er den Auftrag
            angenommen hat — vorher sieht er nur Ort und Postleitzahl, weil er für die
            Entscheidung nicht mehr braucht.
          </p>

          <h2>Speicherdauer</h2>
          <p>
            Auftragsdaten bewahren wir so lange auf, wie es für die Abwicklung, die
            Gewährleistung und die steuerlichen Aufbewahrungsfristen erforderlich ist.
            Anfragen, aus denen kein Auftrag wird, löschen wir, sobald sie erledigt sind.
          </p>

          <h2>Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich dazu an
            die im Impressum genannten Kontaktdaten
            {isReady(SITE.email) ? (
              <>
                {' '}
                oder an <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </>
            ) : null}
            . Außerdem haben Sie das Recht, sich bei einer
            Datenschutz-Aufsichtsbehörde zu beschweren.
          </p>
        </div>
      </section>
    </>
  );
}
