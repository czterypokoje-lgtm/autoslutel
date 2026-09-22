import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bijmaken of Kwijt? 24/7 Mobiele Service | Autosleutel24',
  },
  description: `Autosleutel bijmaken of alle sleutels kwijt? Onze mobiele monteurs komen direct naar u toe in de Randstad. Schadevrij openen & inleren. Bel direct!`,
  alternates: {
    canonical: SITE_CONFIG.domain,
  },
};

export default function Home() {
  return (
    <main>
      {/* 1. HERO DEADBOLT */}
      <section className={styles.heroDeadbolt}>
        <div className={styles.heroBg}>
          <Image 
            src="/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp" 
            alt="Autosleutel Service" 
            fill 
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroTopIndicator}>
            <div className={styles.dot}></div>
            JETZT ERREICHBAR – MOBILE HILFE IN STUTTGART (TEST) / DIRECT BESCHIKBAAR - MOBIELE HULP IN DE RANDSTAD
          </div>

          <h1 className={styles.heroTitle}>
            AUTOSLEUTEL KWIJT?<br />
            WIJ HELPEN<br />
            IN DE RANDSTAD.
          </h1>

          <div className={styles.heroInfoGrid}>
            <p className={styles.heroSubtitle}>
              Autosleutel reparatie, reserve sleutel of alles kwijt in Utrecht en omstreken.<br/>
              Prijs en tijd stemmen we vooraf duidelijk af.
            </p>
            <Link href="/diensten" className={styles.heroLink}>
              Diensten bekijken
            </Link>
          </div>
          
          <div className={styles.heroPhoneWrapper}>
            <a href="tel:0854014961" className={styles.heroPhone}>085 401 49 61</a>
          </div>
        </div>
      </section>

      {/* 2. 25 MIN SECTION */}
      <section className={styles.section25}>
        <div className={styles.section25Left}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-eyebrow-family)', fontSize: 12, fontWeight: 700, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>EINSATZGEBIET STUTTGART & UMLAND</span>
            <span>VON DER ANFRAGE BIS ZUR ANKUNFT</span>
          </div>
          <Image 
            src="/images/service_kwijt.webp" 
            alt="Sleutel maken" 
            width={600} 
            height={800} 
            className={styles.bigImage}
          />
          <span style={{ fontFamily: 'var(--font-eyebrow-family)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>MOBIL IN DER RANDSTAD UNTERWEGS</span>
          <div className={styles.huge25}>25 MIN</div>
        </div>
        
        <div className={styles.section25Right}>
          <h2 className={styles.section25Title}>
            VON DER ANFRAGE<br />
            BIS ZUR TÜR.
          </h2>
          <p className={styles.section25Text}>
            Wir prüfen Ihren Standort direkt und nennen Ihnen eine realistische Einschätzung, bevor jemand losfährt. So wissen Sie früh, woran Sie sind.
          </p>
        </div>
      </section>

      {/* 3. LEISTUNGEN (SERVICES) */}
      <section className={styles.servicesSection}>
        <h2 className={styles.servicesHeader}>LEISTUNGEN.</h2>
        <p className={styles.servicesSub}>
          Für Tür, Auto und Gewerbe – wir klären vorab, welcher Einsatz zu Ihrer Situation passt.<br/><br/>
          <Link href="/diensten" style={{ color: '#fff', textDecoration: 'underline' }}>Alle Leistungen</Link>
        </p>

        <Link href="/diensten/auto-openen-zonder-sleutel" className={styles.serviceRow}>
          <div className={styles.serviceCategory}>WOHNUNG<br/>& AUTO</div>
          <div className={styles.serviceTitle}>AUTO<br/>ÖFFNUNG</div>
          <div>
            <p className={styles.serviceDesc}>Schonende Öffnung nach Prüfung vor Ort. Buitengesloten zonder sleutel, 100% schadevrij.</p>
            <div className={styles.servicePriceLabel}>FROM</div>
            <div className={styles.servicePrice}>Auf Anfrage</div>
          </div>
          <div className={styles.serviceArrow}><ArrowUpRight size={24} /></div>
        </Link>

        <Link href="/diensten/autosleutel-bijmaken" className={styles.serviceRow}>
          <div className={styles.serviceCategory}>AUTO<br/>SLEUTEL</div>
          <div className={styles.serviceTitle}>RESERVE<br/>SLEUTEL</div>
          <div>
            <p className={styles.serviceDesc}>Nieuwe sleutel inleren op locatie inclusief startonderbreker en afstandsbediening.</p>
            <div className={styles.servicePriceLabel}>FROM</div>
            <div className={styles.servicePrice}>€125</div>
          </div>
          <div className={styles.serviceArrow}><ArrowUpRight size={24} /></div>
        </Link>

        <Link href="/diensten/alle-sleutels-kwijt-auto" className={styles.serviceRow}>
          <div className={styles.serviceCategory}>AUTO<br/>SLEUTEL</div>
          <div className={styles.serviceTitle}>ALLES<br/>KWIJT</div>
          <div>
            <p className={styles.serviceDesc}>Bent u alle sleutels kwijt? Wij maken een nieuwe sleutel en wissen de oude uit de boordcomputer.</p>
            <div className={styles.servicePriceLabel}>FROM</div>
            <div className={styles.servicePrice}>Auf Anfrage</div>
          </div>
          <div className={styles.serviceArrow}><ArrowUpRight size={24} /></div>
        </Link>

      </section>

    </main>
  );
}
