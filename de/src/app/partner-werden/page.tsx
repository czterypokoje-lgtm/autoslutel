import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/site.config';
import B2BForm from '@/components/B2BForm/B2BForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  /*
   * Partnergewinnung, keine Leistung. Auf der niederländischen Seite stand
   * diese Seite in der Sitemap neben den Geldseiten und konkurrierte um
   * Crawl-Budget, das sie nicht zurückzahlen kann: null Impressionen in drei
   * Monaten. Partner finden sie über einen Link oder ein Gespräch.
   */
  robots: { index: false, follow: true },
  // Basis unter 44 Zeichen halten: das Layout hängt die Marke an.
  title: 'Partnerbetrieb werden',
  description:
    'Selbstständiger Autoschlüssel-Fachbetrieb? Wir suchen Partner außerhalb von Berlin, Hamburg, München und Frankfurt. Aufträge, CRM und Abrechnung sind schon gebaut.',
  alternates: { canonical: `${SITE_CONFIG.domain}/partner-werden` },
};

/*
 * Die Partnerseite.
 *
 * Absichtlich unbestimmt beim Geld und genau bei allem anderen. Was ein
 * Partner verdient und was er zahlt, ist ein Gespräch und keine Landingpage —
 * die Stufen existieren im CRM, aber sie hier zu nennen würde aus einer
 * Verhandlung ein Ultimatum machen, und sie stehen nicht fest genug, um
 * veröffentlicht zu werden.
 *
 * Genau sein kann die Seite bei dem, was Bewerber wirklich wissen wollen: wo
 * die Aufträge herkommen, was gestellt wird und was erwartet wird.
 *
 * ZWEI DEUTSCHE RECHTSFRAGEN, DIE VOR DEM START GEKLÄRT SEIN MÜSSEN
 *
 * 1. Scheinselbständigkeit. Dieses Modell — ein Netzwerk, das Aufträge
 *    zuweist, die Abrechnung macht und das CRM stellt — ist in Deutschland
 *    genau die Konstellation, die die Deutsche Rentenversicherung prüft. Wird
 *    ein Partner als abhängig beschäftigt eingeordnet, werden Beiträge bis zu
 *    vier Jahre rückwirkend nachgefordert, und zwar von uns. Was dagegen
 *    spricht, muss echt sein und nicht nur auf dieser Seite stehen: eigene
 *    Kunden neben unseren, eigene Preisgestaltung, freie Annahme oder Ablehnung
 *    jedes Auftrags, eigene Geräte, eigenes Fahrzeug, keine Weisungen zur
 *    Arbeitszeit. Darum sagt der Text unten "Sie wählen aus, welche Aufträge
 *    Sie annehmen" — das ist nicht Werbung, das ist das Merkmal. Vor der
 *    ersten Zusammenarbeit von einem Fachanwalt für Arbeitsrecht prüfen und
 *    gegebenenfalls ein Statusfeststellungsverfahren einleiten.
 *
 * 2. Handwerksordnung. Ob diese Tätigkeit in die Anlage A fällt und damit eine
 *    Eintragung bei der Handwerkskammer braucht, ist nicht geklärt (siehe
 *    app/impressum). Die Anforderung unten verlangt daher vom Partner, dass
 *    seine Gewerbeanmeldung und, falls nötig, seine Handwerkskammer-Eintragung
 *    vorliegen — das ist ohnehin seine Pflicht, und es ist die ehrliche Stelle,
 *    an der diese Frage auftaucht.
 */
export default function PartnerWerdenPage() {
  const gains = [
    {
      title: 'Die Aufträge kommen zu Ihnen',
      text: 'Wir investieren in Sichtbarkeit und Anzeigen. Anfragen aus Ihrer Region werden Ihnen weitergeleitet, und Sie wählen aus, welche Sie annehmen — jede einzeln, ohne Begründung.',
    },
    {
      title: 'Kein eigenes Marketing nötig',
      text: 'Keine Website pflegen, kein Anzeigenbudget, keinen Angeboten nachlaufen. Diesen Teil machen wir, Sie machen die Arbeit, die Sie können.',
    },
    {
      title: 'CRM, Abrechnung und Kalender inklusive',
      text: 'Ihre Aufträge, Fotos, Materialverbrauch und Rechnungen an einer Stelle. Eine Rechnung sind zwei Klicks; die Buchhaltung läuft mit statt hinterher.',
    },
    {
      title: 'Sie bestimmen Ihre Zeiten',
      text: 'Sie bleiben selbstständiger Unternehmer. Kein Dienstplan, keine Bereitschaftspflicht, keine Weisung zur Arbeitszeit — Sie stellen sich verfügbar, wenn es Ihnen passt.',
    },
    {
      title: 'Kollegen für die schwierigen Fälle',
      text: 'Ein geschlossenes Netzwerk mit Spezialisten je Marke. Bleiben Sie an einem System hängen, das Sie noch nicht kennen, hat es jemand anders schon gemacht.',
    },
    {
      title: 'Wir sagen vorher, was nicht geht',
      text: 'Unsere Seiten nennen den Kunden vorab die Fälle, die wir nicht lösen können. Sie stehen also nicht vor einem Mercedes mit FBS4, mit dem niemand etwas anfangen kann.',
    },
  ];

  const expect = [
    'Sie arbeiten selbstständig, mit eigener Gewerbeanmeldung, eigener Betriebshaftpflicht und — falls für diese Tätigkeit erforderlich — eigener Handwerkskammer-Eintragung',
    'Sie haben Erfahrung im Anlernen von Schlüsseln und eigene Diagnosegeräte',
    'Sie arbeiten mobil: beim Kunden am Fahrzeug, nicht aus einer festen Werkstatt',
    'Sie reagieren schnell — bei dieser Arbeit ist Eile eher die Regel als die Ausnahme',
    'Sie haben eigene Kunden neben unseren Aufträgen und setzen Ihre Preise selbst',
  ];

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>{' '}
              <span>Partnerbetrieb werden</span>
            </nav>
            <p className={styles.eyebrow}>Wir bauen das Netzwerk aus</p>
            <h1>
              Autoschlüssel-Fachbetrieb in Köln, Stuttgart oder Leipzig?
              <br />
              <span className={styles.accent}>Wir suchen Sie.</span>
            </h1>
            <p className={styles.lead}>
              Wir bekommen Anfragen aus Städten, in denen noch kein Partner
              sitzt, und müssen sie heute ablehnen. Sind Sie selbstständiger
              Autoschlüssel-Fachbetrieb in einer davon, haben wir Arbeit für Sie —
              und das Drumherum ist bereits gebaut: Aufträge, CRM, Abrechnung.
            </p>
            <div className={styles.ctas}>
              <a href="#anmelden" className={styles.btnPhone}>
                Kennenlernen
              </a>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnOutline}>
                {SITE_CONFIG.phone} anrufen
              </a>
            </div>
          </div>
          <div className={styles.heroImage}>
            {/*
              * A specialist in company kit outside the branch, supplied for
              * this page. It recruits better than a workbench does: somebody
              * deciding whether to join looks for the person they would become,
              * not the tool they would hold.
              *
              * (The original pick here was a file whose name promised a
              * workshop and which turned out to be a 1024x139 crop of a badge
              * from this very site. Filenames are not captions — open the
              * image.)
              */}
            <Image
              src="/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp"
              alt="Autoschlüssel-Spezialist in Arbeitskleidung am Fahrzeug, Servicefahrzeug im Hintergrund"
              width={800}
              height={560}
              priority
              quality={80}
              sizes="(max-width: 992px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Was Sie von uns bekommen</h2>
          <div className={styles.grid}>
            {gains.map((g) => (
              <div key={g.title} className={styles.card}>
                <h3>{g.title}</h3>
                <p>{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.container}>
          <h2>Was wir von Ihnen erwarten</h2>
          <ul className={styles.expect}>
            {expect.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className={styles.note}>
            Über die Form der Zusammenarbeit und die Vergütung sprechen wir
            lieber persönlich als über eine Webseite — das hängt von Ihrer
            Region, Ihren Geräten und davon ab, wie viel Sie arbeiten wollen.
            Wir sind im ersten Gespräch deutlich, nicht erst hinterher. Sie
            bleiben dabei selbstständig: Sie nehmen jeden Auftrag einzeln an
            oder nicht, setzen Ihre Preise selbst und arbeiten auch für eigene
            Kunden.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2>Wo wir derzeit suchen</h2>
          <p className={styles.sub}>
            Anfragen aus diesen Städten können wir heute nicht oder nur schwer
            bedienen — in {SITE_CONFIG.serviceAreaString} sitzt schon ein
            Partner:
          </p>
          <div className={styles.regions}>
            <span>Köln</span>
            <span>Stuttgart</span>
            <span>Düsseldorf</span>
            <span>Leipzig</span>
            <span>Dortmund</span>
            <span>Essen</span>
            <span>Bremen</span>
            <span>Hannover</span>
            <span>Nürnberg</span>
            <span>Dresden</span>
          </div>
          <p className={styles.sub}>
            Ihre Stadt steht nicht dabei, aber Sie sehen in Ihrer Region Arbeit?
            Sagen Sie es uns — wir schauen gern mit.
          </p>
        </div>
      </section>

      <section id="anmelden" className={`${styles.section} ${styles.alt}`}>
        <div className={styles.formWrap}>
          <div>
            <h2>Kennenlernen?</h2>
            <p className={styles.sub}>
              Hinterlassen Sie Ihre Daten mit Ihrer Region und der Technik, mit
              der Sie arbeiten. Wir rufen innerhalb eines Werktags an — für ein
              offenes Gespräch darüber, was es einbringt und was es kostet.
            </p>
            <p className={styles.sub}>
              Lieber gleich anrufen?{' '}
              <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
            </p>
          </div>
          <B2BForm segment="partner" segmentLabel="Partnerbetrieb werden" />
        </div>
      </section>
    </main>
  );
}
