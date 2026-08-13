import Image from 'next/image';
import styles from './HowItWorks.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

interface HowItWorksProps {
  cityName?: string;
  brandName?: string;
  variant?: 'default' | 'akl' | 'ignition' | 'lockout';
}

export default function HowItWorks({ cityName, brandName, variant = 'default' }: HowItWorksProps = {}) {
  const cityText = cityName ? ` in ${cityName}` : '';
  const cityTextLoc = cityName ? ` op locatie in ${cityName}` : ' op locatie';
  const brandText = brandName ? ` ${brandName}` : '';
  
  let steps = [];
  let sectionTitle = `Zo werkt Autosleutel24${brandText}${cityText} - in 3 stappen`;

  if (variant === 'akl') {
    sectionTitle = `Direct hulp bij verloren sleutels${cityText} - in 3 stappen`;
    steps = [
      {
        imgSrc: '/images/steps/akl_step1_1786439600179.jpg',
        alt: `Sleutels kwijt in ${cityName || 'Nederland'}`,
        step: 'Stap 1',
        title: 'Sleutels kwijt? Geen paniek',
        desc: `Check of uw auto veilig staat en neem contact met ons op via WhatsApp of telefoon. Wij geven u direct een prijs voor hulp${cityText}.`,
      },
      {
        imgSrc: '/images/steps/akl_step2_1786439617601.jpg',
        alt: `Monteur direct ter plaatse${cityTextLoc}`,
        step: 'Stap 2',
        title: `Monteur direct ter plaatse${cityTextLoc}`,
        desc: `Wij komen met onze uitgeruste servicebus naar uw locatie. U bespaart hoge sleepkosten, want uw auto hoeft niet weggesleept te worden.`,
      },
      {
        imgSrc: '/images/steps/akl_step3_1786439623637.jpg',
        alt: 'Nieuwe sleutel geprogrammeerd',
        step: 'Stap 3',
        title: 'Nieuwe sleutel & Oude gewist',
        desc: 'We openen uw auto schadevrij, maken een nieuwe sleutel en wissen de verloren sleutel direct uit het geheugen van de autocomputer voor uw veiligheid.',
      },
    ];
  } else if (variant === 'ignition') {
    sectionTitle = `Contactslot defect? Zo lossen we het op${cityText}`;
    steps = [
      {
        imgSrc: '/images/steps/ignition_step1_1786439640448.jpg',
        alt: `Sleutel draait niet in contactslot`,
        step: 'Stap 1',
        title: 'Sleutel draait niet meer?',
        desc: `Zit de sleutel vast of draait het contact niet meer door? Neem direct contact op en stuur de gegevens van uw auto.`,
      },
      {
        imgSrc: '/images/steps/ignition_step2_1786439648237.jpg',
        alt: `Reparatie contactslot op locatie`,
        step: 'Stap 2',
        title: `Reparatie${cityTextLoc}`,
        desc: `Onze specialist komt naar u toe en demonteert of repareert uw haperende of geblokkeerde contactslot professioneel ter plekke.`,
      },
      {
        imgSrc: '/images/steps/ignition_step3_1786439655474.jpg',
        alt: 'Weer veilig op weg met gerepareerd slot',
        step: 'Stap 3',
        title: 'Weer veilig op weg',
        desc: 'U krijgt een perfect werkend (nieuw of gereviseerd) contactslot en indien nodig een nieuw geslepen sleutelbaard. U kunt direct weer rijden.',
      },
    ];
  } else if (variant === 'lockout') {
    sectionTitle = `Buitengesloten? Snel weer naar binnen${cityText}`;
    steps = [
      {
        imgSrc: '/images/steps/lockout_step1_1786439672567.jpg',
        alt: `Sleutel in auto laten liggen`,
        step: 'Stap 1',
        title: 'Sleutel in de auto?',
        desc: `Staat u buiten en ligt de sleutel nog in de afgesloten auto of kofferbak? Bel ons direct op voor de 24/7 spoedservice${cityText}.`,
      },
      {
        imgSrc: '/images/steps/lockout_step2_1786439679636.jpg',
        alt: `Auto schadevrij openen`,
        step: 'Stap 2',
        title: '100% Schadevrij openen',
        desc: `Onze monteur is snel ter plaatse en gebruikt speciaal decoderingsgereedschap om het slot van uw autodeur of kofferbak volledig schadevrij te manipuleren.`,
      },
      {
        imgSrc: '/images/steps/lockout_step3_1786439686206.jpg',
        alt: 'Auto geopend',
        step: 'Stap 3',
        title: 'Deur open & Direct rijden',
        desc: 'Uw auto is weer open zonder enige schade aan uw lak, slot of rubbers. U kunt uw sleutels weer pakken en uw weg direct vervolgen.',
      },
    ];
  } else {
    // default / autosleutel bijmaken
    steps = [
      {
        imgSrc: '/images/steps/step_1_contact_1786407570135.jpg',
        alt: `Neem contact op met Autosleutel24${brandText}${cityText}`,
        step: 'Stap 1',
        title: `Voertuiggegevens doorgeven & afspraak maken`,
        desc: `Geef uw automodel (${brandName || 'merk'}), bouwjaar en locatie${cityText} door via WhatsApp of telefoon. Wij vertellen u direct wat het kost en wanneer we er zijn.`,
      },
      {
        imgSrc: '/images/steps/step_2_mechanic_1786407578137.jpg',
        alt: `Monteur komt naar u toe${cityTextLoc}`,
        step: 'Stap 2',
        title: `Monteur komt direct naar u toe${cityTextLoc}`,
        desc: `Onze mobiele monteur komt met een nieuwe ${brandName ? brandName + ' ' : ''}sleutel naar uw locatie${cityText}. U hoeft uw auto niet te slepen.`,
      },
      {
        imgSrc: '/images/steps/step_3_payment_1786407585732.jpg',
        alt: `Direct een nieuwe ${brandName || 'auto'}sleutel en veilig betalen${cityText}`,
        step: 'Stap 3',
        title: `Direct een nieuwe sleutel & veilig betalen`,
        desc: `We frezen en programmeren uw nieuwe ${brandName || 'auto'}sleutel direct in de boordcomputer. U betaalt pas als alles perfect werkt, veilig${cityTextLoc} via pin of contant.`,
      },
    ];
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{sectionTitle}</h2>
      <div className={styles.grid}>
        {steps.map((step, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.imageWrapper}>
              <Image src={step.imgSrc} alt={step.alt} fill />
            </div>
            <div className={styles.stepNum}>{step.step}</div>
            <h3 className={styles.cardTitle}>{step.title}</h3>
            <p className={styles.cardDesc}>{step.desc}</p>
          </div>
        ))}
      </div>
      
      <div className={styles.ctaWrapper}>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg">
          Direct Hulp Bellen
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
          WhatsApp voor Direct Hulp
        </a>
      </div>
    </section>
  );
}
