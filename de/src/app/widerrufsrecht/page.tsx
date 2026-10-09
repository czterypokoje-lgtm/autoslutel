import type { Metadata } from 'next';
import { SITE } from '@/config/site';
import { JsonLd, breadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Widerrufsrecht',
  description: 'Widerrufsbelehrung für Verbraucher und der Hinweis zum vorzeitigen Erlöschen bei Eilaufträgen.',
  alternates: { canonical: `${SITE.domain}/widerrufsrecht` },
};

/**
 * Widerrufsrecht.
 *
 * Diese Seite allein genügt nicht.
 *
 * Bei einem Eilauftrag — Schlüssel verloren, Fahrzeug steht — soll vor Ort
 * gearbeitet werden, bevor die vierzehn Tage um sind. Damit das Widerrufsrecht
 * dafür erlischt, muss der Kunde die sofortige Ausführung ausdrücklich
 * verlangen und bestätigen, dass er damit sein Widerrufsrecht verliert. Das ist
 * ein Schritt im Auftragsablauf, nicht ein Absatz auf einer Rechtsseite: es
 * gehört in das Formular und auf den Auftragsschein, den der Partner vor Ort
 * bestätigen lässt.
 *
 * Solange dieser Schritt nicht gebaut ist, ist diese Seite die Belehrung — und
 * die Lücke ist hier benannt, damit sie nicht vergessen wird.
 */
export default function WiderrufPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: 'Widerrufsrecht', path: '/widerrufsrecht' }])} />
      <section className="section">
        <div className="wrap prose">
          <h1>Widerrufsrecht</h1>

          <h2>Widerrufsbelehrung</h2>
          <p>
            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
            Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag
            des Vertragsabschlusses.
          </p>
          <p>
            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen
            Erklärung — zum Beispiel per Brief, Telefon oder E-Mail — über Ihren
            Entschluss informieren, diesen Vertrag zu widerrufen. Zur Wahrung der Frist
            reicht es, dass Sie die Mitteilung vor Ablauf der Frist absenden.
          </p>

          <h2>Folgen des Widerrufs</h2>
          <p>
            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir
            von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen
            ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns
            eingegangen ist.
          </p>

          <h2>Vorzeitiges Erlöschen bei Eilaufträgen</h2>
          <p>
            Wenn Sie wünschen, dass wir mit der Dienstleistung vor Ablauf der
            Widerrufsfrist beginnen — was bei einem verlorenen Schlüssel in der Regel
            der Fall ist, weil das Fahrzeug sonst stehen bleibt — bitten wir Sie, dies
            ausdrücklich zu verlangen.
          </p>
          <p>
            Ihr Widerrufsrecht erlischt bei einer Dienstleistung, wenn wir diese
            vollständig erbracht haben und mit der Ausführung erst begonnen haben,
            nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig Ihre
            Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei
            vollständiger Vertragserfüllung verlieren.
          </p>
          <p>
            Diese Zustimmung wird vor Beginn der Arbeiten eingeholt und auf dem
            Auftragsschein bestätigt. Ohne sie beginnen wir nicht mit der Ausführung.
          </p>
        </div>
      </section>
    </>
  );
}
