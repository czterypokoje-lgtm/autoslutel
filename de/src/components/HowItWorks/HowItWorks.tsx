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
  const cityTextLoc = cityName ? ` vor Ort in ${cityName}` : ' vor Ort';
  const brandText = brandName ? ` ${brandName}` : '';
  
  let steps = [];
  let sectionTitle = `So läuft es bei Autoschlüssel24${brandText}${cityText} — in 3 Schritten`;

  if (variant === 'akl') {
    sectionTitle = `Schlüssel verloren${cityText} — in 3 Schritten geholfen`;
    steps = [
      {
        imgSrc: '/images/steps/akl_step1_1786439600179.webp',
        alt: `Autoschlüssel verloren in ${cityName || 'Deutschland'}`,
        step: 'Schritt 1',
        title: 'Schlüssel verloren? Keine Panik',
        desc: `Prüfen Sie, ob das Fahrzeug sicher steht, und rufen Sie an oder schreiben per WhatsApp. Sie hören sofort den Festpreis für die Hilfe${cityText}.`,
      },
      {
        imgSrc: '/images/steps/akl_step2_1786439617601.webp',
        alt: `Monteur direct ter plaatse${cityTextLoc}`,
        step: 'Schritt 2',
        title: `Partner kommt zu Ihrem Fahrzeug${cityTextLoc}`,
        desc: `Unser Partner kommt mit ausgerüstetem Fahrzeug zu Ihnen. Das Auto muss nicht abgeschleppt werden — das spart die Abschleppkosten und die Tage beim Händler.`,
      },
      {
        imgSrc: '/images/steps/akl_step3_1786439623637.webp',
        alt: 'Nieuwe sleutel geprogrammeerd',
        step: 'Schritt 3',
        title: 'Neuer Schlüssel, alter gelöscht',
        desc: 'Wir öffnen schadenfrei, fertigen einen neuen Schlüssel an und löschen den verlorenen aus der Wegfahrsperre — damit er Ihr Fahrzeug nicht mehr öffnet.',
      },
    ];
  } else if (variant === 'ignition') {
    sectionTitle = `Contactslot defect? Zo lossen we het op${cityText}`;
    steps = [
      {
        imgSrc: '/images/steps/ignition_step1_1786439640448.webp',
        alt: `Sleutel draait niet in contactslot`,
        step: 'Schritt 1',
        title: 'Schlüssel dreht nicht mehr?',
        desc: `Steckt der Schlüssel fest oder dreht das Zündschloss nicht mehr durch? Rufen Sie an und geben Marke, Modell und Baujahr durch.`,
      },
      {
        imgSrc: '/images/steps/ignition_step2_1786439648237.webp',
        alt: `Reparatie contactslot op locatie`,
        step: 'Schritt 2',
        title: `Reparatur${cityTextLoc}`,
        desc: `Unser Partner kommt zu Ihnen und baut das hakende oder blockierte Zündschloss aus oder setzt es instand — vor Ort.`,
      },
      {
        imgSrc: '/images/steps/ignition_step3_1786439655474.webp',
        alt: 'Weer veilig op weg met gerepareerd slot',
        step: 'Schritt 3',
        title: 'Wieder sicher unterwegs',
        desc: 'Sie bekommen ein funktionierendes Zündschloss und, wenn nötig, ein neu gefrästes Schlüsselblatt. Danach können Sie direkt weiterfahren.',
      },
    ];
  } else if (variant === 'lockout') {
    sectionTitle = `Ausgeschlossen? Schnell wieder hinein${cityText}`;
    steps = [
      {
        imgSrc: '/images/steps/lockout_step1_1786439672567.webp',
        alt: `Schlüssel im Auto eingeschlossen`,
        step: 'Schritt 1',
        title: 'Schlüssel liegt im Auto?',
        desc: `Stehen Sie draußen und der Schlüssel liegt im verschlossenen Auto oder im Kofferraum? Rufen Sie an — rund um die Uhr${cityText}.`,
      },
      {
        imgSrc: '/images/steps/lockout_step2_1786439679636.webp',
        alt: `Auto schadenfrei öffnen`,
        step: 'Schritt 2',
        title: 'Schadenfrei geöffnet',
        desc: `Unser Partner öffnet Tür oder Kofferraum mit Fachwerkzeug am Schließsystem — nicht über die Scheibe und ohne Spuren am Lack.`,
      },
      {
        imgSrc: '/images/steps/lockout_step3_1786439686206.webp',
        alt: 'Auto geöffnet',
        step: 'Schritt 3',
        title: 'Tür offen, weiterfahren',
        desc: 'Das Fahrzeug ist offen, ohne Schaden an Lack, Schloss oder Dichtungen. Sie nehmen Ihren Schlüssel und fahren weiter.',
      },
    ];
  } else {
    // default / autosleutel bijmaken
    steps = [
      {
        imgSrc: '/images/steps/step_1_contact_1786407570135.webp',
        alt: `Kontakt zu Autoschlüssel24${brandText}${cityText}`,
        step: 'Schritt 1',
        title: `Fahrzeugdaten durchgeben, Festpreis hören`,
        desc: `Geben Sie Modell (${brandName || 'Marke'}), Baujahr und Standort${cityText} per Telefon oder WhatsApp durch. Sie hören sofort, was es kostet und wann jemand da ist.`,
      },
      {
        imgSrc: '/images/steps/step_2_mechanic_1786407578137.webp',
        alt: `Partner kommt zu Ihrem Fahrzeug${cityTextLoc}`,
        step: 'Schritt 2',
        title: `Partner kommt zu Ihrem Fahrzeug${cityTextLoc}`,
        desc: `Unser Partner bringt den passenden ${brandName ? brandName + '-' : ''}Schlüssel mit zu Ihrem Standort${cityText}. Das Auto muss nicht abgeschleppt werden.`,
      },
      {
        imgSrc: '/images/steps/step_3_payment_1786407585732.webp',
        alt: `Neuer ${brandName || 'Auto'}schlüssel und sicher bezahlen${cityText}`,
        step: 'Schritt 3',
        title: `Schlüssel fertig, dann bezahlen`,
        desc: `Der neue ${brandName || 'Auto'}schlüssel wird gefräst und an der Wegfahrsperre angelernt. Sie zahlen erst, wenn alles funktioniert — vor Ort, bar oder mit Karte.`,
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
            <div className={styles.textWrapper}>
              <div className={styles.stepNum}>{step.step}</div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDesc}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.ctaWrapper}>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg">
          Jetzt anrufen
        </a>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
          Per WhatsApp schreiben
        </a>
      </div>
    </section>
  );
}
