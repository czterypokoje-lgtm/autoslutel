import Image from 'next/image';
import styles from './HowItWorks.module.css';

interface HowItWorksProps {
  cityName?: string;
}

export default function HowItWorks({ cityName }: HowItWorksProps = {}) {
  const cityText = cityName ? ` in ${cityName}` : '';
  const cityTextLoc = cityName ? ` op locatie in ${cityName}` : ' op locatie';
  
  const steps = [
    {
      imgSrc: '/images/steps/step_1_contact_1786407570135.jpg',
      alt: `Neem contact op met Autosleutel24${cityText}`,
      step: 'Stap 1',
      title: `Voertuiggegevens doorgeven & afspraak maken`,
      desc: `Geef uw automerk, model, bouwjaar en locatie${cityText} door via WhatsApp of telefoon. Wij vertellen u direct wat het kost en wanneer we er zijn.`,
    },
    {
      imgSrc: '/images/steps/step_2_mechanic_1786407578137.jpg',
      alt: `Monteur komt naar u toe${cityTextLoc}`,
      step: 'Stap 2',
      title: `Monteur komt direct naar u toe${cityTextLoc}`,
      desc: `Onze mobiele monteur komt naar uw opgegeven locatie${cityText}. U hoeft uw auto niet te slepen naar een dealer of garage. Wij komen naar u.`,
    },
    {
      imgSrc: '/images/steps/step_3_payment_1786407585732.jpg',
      alt: `Direct een nieuwe sleutel en veilig betalen${cityText}`,
      step: 'Stap 3',
      title: `Direct een nieuwe sleutel & veilig betalen`,
      desc: `We frezen en programmeren uw nieuwe sleutel direct. U betaalt pas als alles perfect werkt, veilig${cityTextLoc} via pin of contant.`,
    },
  ];

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Zo werkt Autosleutel24{cityText} - in 3 stappen</h2>
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
    </section>
  );
}
