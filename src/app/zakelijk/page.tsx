import type { Metadata } from 'next';
import Link from 'next/link';
import { ZAKELIJK_SEGMENTS } from '@/config/zakelijk';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Zakelijke Sleutelservice | Garages, Autobedrijven & Wagenparken',
  description:
    'Autosleutels voor garages, autobedrijven, import & export en wagenparken. Wij komen naar uw werkplaats of terrein, meerdere voertuigen per bezoek, één factuur.',
  alternates: { canonical: `${SITE_CONFIG.domain}/zakelijk` },
};

export default function ZakelijkHub() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span>/</span> <span>Zakelijk</span>
          </nav>
          <h1>
            Sleutelwerk uitbesteden,
            <br />
            <span className={styles.accent}>zonder de auto weg te geven.</span>
          </h1>
          <p className={styles.lead}>
            Sleutelprogrammering vraagt merkspecifieke apparatuur en licenties
            die voor een handvol klussen per jaar nooit uit kan. Wij rijden naar
            uw werkplaats, showroom, loods of standplaats en doen het werk daar —
            meerdere voertuigen per bezoek, één factuur achteraf.
          </p>
          <div className={styles.ctas}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone}>
              Bel {SITE_CONFIG.phone}
            </a>
            <Link href="/zakelijk/garages" className={styles.btnOutline}>
              Bekijk voor garages
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2>Voor wie wij werken</h2>
          <p className={styles.sub}>
            Vier soorten bedrijven, vier verschillende redenen. Kies wat op u van
            toepassing is.
          </p>
          <div className={styles.grid}>
            {ZAKELIJK_SEGMENTS.map((s) => (
              <Link key={s.slug} href={`/zakelijk/${s.slug}`} className={styles.card}>
                <strong>{s.label}</strong>
                <span className={styles.cardTitle}>{s.title}</span>
                <span className={styles.cardText}>{s.metaDesc}</span>
                <span className={styles.cardLink}>Lees verder &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={styles.inner}>
          <h2>Wat wij niet kunnen</h2>
          <p className={styles.sub}>
            Belangrijker dan de lijst met wat wél kan, want dit bepaalt of u ons
            moet bellen of niet. Wij zeggen het liever vooraf dan bij uw klant in
            de werkplaats.
          </p>
          <ul className={styles.limits}>
            <li>
              <strong>Mercedes met FBS4</strong> — grofweg vanaf bouwjaar
              2013/2014. Sleutel bijmaken én alle sleutels kwijt kan hier alleen
              de merkdealer.
            </li>
            <li>
              <strong>Auto&rsquo;s van vóór 2000</strong> — de apparatuur voor die
              oudere systemen voeren wij niet meer.
            </li>
            <li>
              <strong>Volkswagen, alle sleutels kwijt, vanaf 2014</strong> — dat
              kunnen wij wél, maar de sleutel moet als origineel onderdeel
              besteld worden. Reken op 2 tot 4 werkdagen; dezelfde dag lukt niet.
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2>Zelf monteur?</h2>
          <p className={styles.sub}>
            Wij breiden uit en zoeken zelfstandige autosleutelspecialisten — op
            dit moment vooral in Noord-Brabant en Limburg.
          </p>
          <Link href="/monteur-worden" className={styles.btnOutline}>
            Bekijk wat wij bieden
          </Link>
        </div>
      </section>
    </main>
  );
}
