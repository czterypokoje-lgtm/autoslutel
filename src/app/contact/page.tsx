import { Metadata } from 'next';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Neem Contact Op | Autosleutel24',
  description: 'Neem contact op met Autosleutel24. Wij zijn 24/7 bereikbaar voor spoedhulp bij autosleutel problemen.',
  // Without this the page inherits the root layout's canonical (the homepage),
  // which told Google /contact was a duplicate and kept it out of the index.
  alternates: { canonical: `${SITE_CONFIG.domain}/contact` },
};

export default function ContactPage() {
  return (
    <main className={styles.main}>
      {/* ── HERO SECTION ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Contact Autosleutel24</h1>
          <h2 className={styles.heroSubtitle}>Snel & Eenvoudig een Nieuwe Autosleutel</h2>
          <p className={styles.heroText}>
            Heeft u een reservesleutel nodig? Autosleutel24 maakt het eenvoudig om op locatie een nieuwe autosleutel te laten bijmaken. Wij komen naar u toe, zodat u weer snel en veilig de weg op kunt.
          </p>
          <p className={styles.heroTextBold}>
            Vind een monteur in de buurt of start uw aanvraag online.
          </p>
          <p className={styles.heroText}>
            Bent u uw enige sleutel kwijt of heeft u een spoedgeval? <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{color: '#111827', fontWeight: 'bold'}}>Bel ons direct</a> voor onmiddellijke assistentie.
          </p>
        </div>
        <div className={styles.heroImageContainer}>
          <div className={styles.heroImageWrapper}>
            <div className={styles.heroImageInner}>
              <iframe
                src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
                style={{
                  border: 'none',
                  width: '100%',
                  height: 'calc(100% + 65px)',
                  marginTop: '-65px',
                  display: 'block',
                  objectFit: 'cover'
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Autosleutel24 Servicegebied Utrecht en omstreken"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <section className={styles.trustBanner}>
        <h2 className={styles.trustTitle}>24/7 Spoedservice in heel Nederland</h2>
        <div className={styles.trustRatingRow}>
          <span className={styles.trustText}>{SITE_CONFIG.rating}</span>
          <div className={styles.trustStars}>★★★★★</div>
          <span className={styles.trustText}>Meer dan 150+ Google Reviews</span>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section className={styles.servicesSection}>
        <h2 className={styles.servicesTitle}>Onze Diensten</h2>
        <div className={styles.cardsContainer}>
          
          {/* Card 1: Locked out */}
          <div className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <Image 
                src="/images/autosleutel-bijmaken-utrecht.webp" 
                alt="Auto openen zonder sleutel" 
                width={140} 
                height={140} 
                className={styles.cardImage}
              />
            </div>
            <h3 className={styles.cardTitle}>Bent u buitengesloten?</h3>
            <p className={styles.cardText}>
              Vul ons formulier in of bel direct. We sturen zo snel mogelijk een expert naar uw locatie om uw auto schadevrij te openen.
            </p>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.cardBtn}>
              Neem contact op
            </a>
          </div>

          {/* Card 2: Extra key */}
          <div className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <Image 
                src="/images/autosleutel-bijmaken-amsterdam.webp" 
                alt="Nieuwe autosleutel bestellen" 
                width={140} 
                height={140} 
                className={styles.cardImage}
              />
            </div>
            <h3 className={styles.cardTitle}>Nieuwe autosleutel nodig?</h3>
            <p className={styles.cardText}>
              Vraag eenvoudig een prijsopgave aan via kenteken. Wij maken de sleutel voor u bij op locatie, met of zonder afstandsbediening.
            </p>
            <a href="/autosleutel-bestellen-op-kenteken" className={styles.cardBtn}>
              Vraag prijs op
            </a>
          </div>

        </div>
      </section>

      {/* ── FLOATING CALL BUTTON ── */}
      <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.floatingCallBtn}>
        <div className={styles.callBtnIconWrapper}>
          <svg className={styles.callBtnIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <div className={styles.callBtnText}>
          <span className={styles.callBtnLabel}>CALL NOW</span>
          <span className={styles.callBtnNumber}>{SITE_CONFIG.phone}</span>
        </div>
      </a>

    </main>
  );
}
