import type { Metadata } from 'next';
import Link from 'next/link';
import { DIENSTEN } from '@/config/diensten';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `Alle Autosleutel Diensten | ${SITE_CONFIG.name}`,
  description: 'Overzicht van al onze autosleutel diensten: bijmaken, programmeren, reparatie en beveiliging. Mobiele service aan huis.',
  alternates: { canonical: `${SITE_CONFIG.domain}/diensten` },
};

export default function DienstenOverviewPage() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.label}>ONZE DIENSTEN</span>
          <h1>Professionele Autosleutel Services</h1>
          <p className={styles.heroSub}>
            Wij lossen elk autosleutel probleem ter plaatse op. Geen sleepkosten, geen lange wachttijden bij de dealer.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <h2 className={styles.tableTitle}>Diensten Overzicht</h2>
        <div className={styles.tableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>Dienst</th>
                <th>Wat wij doen</th>
                <th>Tijd</th>
                <th className={styles.actionCol}></th>
              </tr>
            </thead>
            <tbody>
              {DIENSTEN.map((s, i) => (
                <tr key={i}>
                  <td className={styles.serviceCell}>
                    <Link href={`/diensten/${s.slug}`} className={styles.serviceLink}>{s.title}</Link>
                  </td>
                  <td className={styles.descCell}>{s.intro.split('.')[0]}.</td>
                  <td className={styles.timeCell}>{s.duration || '30–60 min'}</td>
                  <td className={styles.actionCell}>
                    <Link href={`/diensten/${s.slug}`} className={styles.moreBtn}>Details →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cta}>
          <h2>Direct Hulp Nodig?</h2>
          <p>Bel of WhatsApp voor een prijsindicatie en planning.</p>
          <div className={styles.ctaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="diensten-overview-phone">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="diensten-overview-wa">WhatsApp</a>
          </div>
        </div>
      </div>
    </main>
  );
}
