import type { Metadata } from 'next';
import Link from 'next/link';
import { DIENSTEN } from '@/config/diensten';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Alle Autosleutel Diensten 24/7 | Autosleutel24',
  },
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

        {/* ── COMPREHENSIVE DIENSTEN SEO GUIDE ARTICLE ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="seo-article-block" style={{ marginTop: 0 }}>
            <h2>Compleet Overzicht van Onze Mobiele Autosleutel &amp; Slotenmaker Diensten</h2>
            <p>
              Als gespecialiseerd auto slotenmaker biedt <strong>{SITE_CONFIG.name}</strong> een totaaloplossing voor elk type autosleutelprobleem. Of u nu uw sleutel in de auto heeft laten liggen, te maken heeft met een afgebroken sleutelbaard, een defect contactslot of een lege batterij van uw smart key: onze mobiele monteurs staan 24/7 voor u klaar om u ter plaatse te helpen.
            </p>
            <h3>1. Schadevrij Autodeur Openen &amp; Noodopeningen</h3>
            <p>
              Is uw autodeur dichtgevallen met de sleutel nog op het contact of op de stoel? Wij openen uw auto 100% schadevrij met geavanceerde Lishi lock decoders. In tegenstelling tot traditionele openbreekmethodes blijft uw fabrieksslot volledig intact.
            </p>
            <h3>2. Autosleutel Bijmaken &amp; Programmeren op Locatie</h3>
            <p>
              Wij snijden mechanische sleutelbladen direct met onze mobiele CNC-lasersnijders en lezen uw startonderbreker (immobiliser) uit via de OBD2-diagnosepoort. Wij leveren en programmeren originele transponderchips en keyless go sleutels voor meer dan 38 automerken.
            </p>
            <h3>3. All Keys Lost (AKL) — Alle Sleutels Kwijt</h3>
            <p>
              Bent u al uw autosleutels verloren? Geen paniek. Waar een dealer u verplicht om uw auto te laten wegslepen en vaak complete slotensets vervangt, genereren wij ter plaatse een compleet nieuwe sleutel en wissen wij de oude, verloren sleutels uit het geheugen van uw boordcomputer.
            </p>
          </div>
        </section>

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
