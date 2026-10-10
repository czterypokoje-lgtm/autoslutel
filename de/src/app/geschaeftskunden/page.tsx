import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/utils/schema';
import Link from 'next/link';
import { ZAKELIJK_SEGMENTS } from '@/config/geschaeftskunden';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  // Das Layout hängt ' | Autoschlüssel24' an (18 Zeichen), ein Basistitel über
  // 42 Zeichen wird in den Ergebnissen abgeschnitten. Die niederländische
  // Fassung lief auf 79.
  title: 'Autoschlüssel-Service für Geschäftskunden',
  description:
    'Autoschlüssel für Kfz-Werkstätten, Autohäuser, Import & Export und Fuhrparks. Wir kommen in Ihre Werkstatt oder auf Ihr Gelände, mehrere Fahrzeuge pro Termin, eine Rechnung.',
  alternates: { canonical: `${SITE_CONFIG.domain}/geschaeftskunden` },
};

export default function GeschaeftskundenHub() {
  return (
    <main>
      <script id="bc-zakelijk" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Geschäftskunden', path: '/geschaeftskunden' }])) }} />
      <section className={styles.hero}>
        <div className={styles.inner}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span> <span>Geschäftskunden</span>
          </nav>
          <h1>
            Schlüsselarbeit abgeben,
            <br />
            <span className={styles.accent}>ohne das Fahrzeug abzugeben.</span>
          </h1>
          <p className={styles.lead}>
            Schlüssel anlernen verlangt markenspezifische Geräte und Lizenzen,
            die sich für eine Handvoll Aufträge im Jahr nie rechnen. Wir fahren
            in Ihre Werkstatt, Ihren Ausstellungsraum, Ihre Halle oder auf Ihren
            Standplatz und arbeiten dort — mehrere Fahrzeuge pro Termin, eine
            Rechnung im Nachgang.
          </p>
          <div className={styles.ctas}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone}>
              {SITE_CONFIG.phone} anrufen
            </a>
            <Link href="/geschaeftskunden/kfz-werkstaetten" className={styles.btnOutline}>
              Für Kfz-Werkstätten
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2>Für wen wir arbeiten</h2>
          <p className={styles.sub}>
            Vier Betriebsarten, vier verschiedene Gründe. Wählen Sie, was auf
            Sie zutrifft.
          </p>
          <div className={styles.grid}>
            {ZAKELIJK_SEGMENTS.map((s) => (
              <Link key={s.slug} href={`/geschaeftskunden/${s.slug}`} className={styles.card}>
                <strong>{s.label}</strong>
                <span className={styles.cardTitle}>{s.title}</span>
                <span className={styles.cardText}>{s.metaDesc}</span>
                <span className={styles.cardLink}>Weiterlesen &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.inner}>
          <h2>Was wir nicht können</h2>
          <p className={styles.sub}>
            Wichtiger als die Liste dessen, was geht — denn daran entscheidet
            sich, ob Sie uns anrufen sollten. Wir sagen es lieber vorher als
            später bei Ihrem Kunden in der Werkstatt.
          </p>
          <ul className={styles.limits}>
            <li>
              <strong>Mercedes mit FBS4</strong> — etwa ab Baujahr 2013/2014.
              Schlüssel nachmachen und der Fall &quot;alle Schlüssel verloren&quot; können
              hier nur beim Vertragshändler erledigt werden.
            </li>
            <li>
              <strong>Fahrzeuge vor 2000</strong> — die Geräte für diese älteren
              Systeme führen wir nicht mehr mit.
            </li>
            <li>
              <strong>VW-Konzern, alle Schlüssel verloren, ab 2014</strong> — das
              können wir, aber der Hersteller verlangt eine Online-Freigabe und
              der Schlüssel muss als Originalteil bestellt werden. Rechnen Sie
              mit einigen Werktagen; am selben Tag geht es nicht.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2>Selbst Fachbetrieb?</h2>
          <p className={styles.sub}>
            Wir bauen das Netzwerk aus und suchen selbstständige
            Autoschlüssel-Fachbetriebe — derzeit vor allem außerhalb von Berlin,
            Hamburg, München und Frankfurt am Main, wo schon ein Partner sitzt.
          </p>
          <Link href="/partner-werden" className={styles.btnOutline}>
            Was wir bieten
          </Link>
        </div>
      </section>
    </main>
  );
}
