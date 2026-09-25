const fs = require('fs');

const file = 'src/app/autosleutel-kwijt/page.tsx';
const oldContent = fs.readFileSync(file, 'utf8');

// We need to keep the imports and faqItems.
const importsAndFaqMatch = oldContent.match(/([\s\S]*?)export default function AllKeysLost\(\) \{/);
const importsAndFaq = importsAndFaqMatch ? importsAndFaqMatch[1] : '';

const newComponent = `import styles from './DeadboltTheme.module.css';
import { Anton } from 'next/font/google';

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function AllKeysLost() {
  return (
    <div className={styles.wrapper}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroInner}>
            <div>
              <h1 className={\`\${styles.heroTitle} \${anton.className}\`}>
                AUTOSLEUTEL KWIJT OF<br/>VERLOREN? WE MAKEN<br/>EEN NIEUWE AAN.
              </h1>
            </div>
            <div className={styles.heroRight}>
              <p className={styles.heroDesc}>
                Sleutel kwijt is vervelend, maar geen reden om de auto te laten wegslepen. Wij programmeren een volledig nieuwe sleutel, ook als er geen reservesleutel meer is.
              </p>
              <div className={styles.buttonGroup}>
                <a href={\`tel:\${SITE_CONFIG.phoneTel}\`} className={styles.btnOrange} id="akl-hero-phone">
                  Bel {SITE_CONFIG.phone}
                </a>
                <a href="#wat-we-doen" className={styles.btnOutline}>
                  Boek deze dienst
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className={styles.statsBar}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Prijs vanaf</span>
              <div className={\`\${styles.statValue} \${styles.orange} \${anton.className}\`}>€300</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Tijd ter plekke</span>
              <div className={\`\${styles.statValue} \${anton.className}\`}>30-60 MIN</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Gem. aankomst</span>
              <div className={\`\${styles.statValue} \${anton.className}\`}>35 MIN</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Elke klus</span>
              <div className={\`\${styles.statValue} \${anton.className}\`}>GECERTIFICEERD &<br/>VERZEKERD</div>
            </div>
          </div>
        </div>
      </section>

      {/* WAT WE DOEN */}
      <section id="wat-we-doen" className={styles.splitSection}>
        <div className={styles.container}>
          <div className={styles.splitGrid}>
            <div>
              <h2 className={\`\${styles.sectionTitle} \${anton.className}\`}>WAT WE DOEN</h2>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <span className={styles.redArrow}>→</span>
                  Nieuwe sleutel aangemaakt zonder dat u een bestaande sleutel nodig heeft
                </li>
                <li className={styles.listItem}>
                  <span className={styles.redArrow}>→</span>
                  Oude sleutel wordt uit het systeem van de auto verwijderd voor uw veiligheid
                </li>
                <li className={styles.listItem}>
                  <span className={styles.redArrow}>→</span>
                  Legitimatie en kentekencontrole ter plekke, geen gedoe achteraf
                </li>
                <li className={styles.listItem}>
                  <span className={styles.redArrow}>→</span>
                  Ook 's nachts en in het weekend bereikbaar
                </li>
              </ul>
            </div>
            <div>
              <div className={styles.priceCard}>
                <span className={styles.eyebrow}>Nu beschikbaar, 24/7</span>
                <div className={\`\${styles.priceTitle} \${anton.className}\`}>Prijs vanaf<br/>€300</div>
                <a href={\`tel:\${SITE_CONFIG.phoneTel}\`} className={styles.btnOrange} style={{ width: '100%' }}>Bel {SITE_CONFIG.phone}</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnDark}>WhatsApp direct hulp</a>
                <p className={styles.priceCardText}>
                  Prijs telefonisch bevestigd voordat we beginnen. Zegt u nee, dan betaalt u niets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPONDER EN SMART KEY */}
      <section className={styles.transponderSection}>
        <div className={styles.container}>
          <h2 className={\`\${styles.sectionTitle} \${anton.className}\`}>TRANSPONDER- EN SMART KEY PROGRAMMEREN</h2>
          <p className={styles.transponderText}>
            Moderne autosleutels zijn meer dan een stukje metaal. De transponderchip communiceert met de startonderbreker, en smart keys regelen keyless entry en start-stop. Wij programmeren dit alles op locatie, afgestemd op uw merk, model en bouwjaar.
          </p>
          <div className={styles.checkGrid}>
            <div className={styles.checkItem}><span className={styles.checkIcon}>✓</span> Standaard transpondersleutels</div>
            <div className={styles.checkItem}><span className={styles.checkIcon}>✓</span> Klapsleutels met centrale vergrendeling</div>
            <div className={styles.checkItem}><span className={styles.checkIcon}>✓</span> Smart keys met keyless entry</div>
            <div className={styles.checkItem}><span className={styles.checkIcon}>✓</span> Afgestemd op het systeem van uw auto</div>
          </div>
        </div>
      </section>

      {/* PHOTO GRID */}
      <section className={styles.photoSection}>
        <div className={styles.container}>
          <div className={styles.photoGrid}>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/transpondersleutel.jpg" alt="Transpondersleutel" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.photoContent}>
                <h3 className={styles.photoTitle}>Transpondersleutel</h3>
                <p className={styles.photoDesc}>Een sleutel met een ingebouwde chip die communiceert met de startonderbreker van de auto. Meestal vanaf €150 bij te maken.</p>
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/smartkey.jpg" alt="Smart key" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.photoContent}>
                <h3 className={styles.photoTitle}>Smart key / keyless start</h3>
                <p className={styles.photoDesc}>Sleutel met startknop-functie — de auto start zodra de sleutel in de buurt is, zonder hem uit uw zak te halen.</p>
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/sleutels_hand.jpg" alt="Sleutels" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/sleutel_lederen.jpg" alt="Lederen sleutel" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEKKING PER MERK */}
      <section className={styles.brandsSection}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Dekking per merk</span>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Autosleutel bijmaken voor deze merken</h2>
          <div className={styles.brandsGrid}>
            {['alfa-romeo','audi','chevrolet','citroen','dacia','fiat','ford','honda','hyundai','jeep','kia','lancia','land-rover','mazda','mercedes-benz','mitsubishi','nissan','opel','peugeot','renault','seat','skoda','suzuki','toyota','volkswagen'].map(brand => (
              <div key={brand} className={styles.brandBox}>
                <Image src={\`/images/brands/\${brand}.png\`} alt={brand} width={80} height={80} style={{ objectFit: 'contain' }} />
              </div>
            ))}
          </div>
          <p className={styles.brandsDisclaimer}>
            Alle merklogo's zijn eigendom van de respectievelijke fabrikanten. Autosleutel24 is een onafhankelijk technici-netwerk en geen erkende dealer of licentiehouder van deze merken.
          </p>
        </div>
      </section>

      {/* FAQs (PRESERVED FROM ORIGINAL) */}
      <section className={styles.faqSection}>
        <div className={styles.container} style={{ maxWidth: 900 }}>
          <h2 className={anton.className}>Veelgestelde Vragen — Autosleutel Kwijt</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <summary className="faq-question" style={{ color: '#fff' }}>
                {f.q}
                <svg className="faq-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <p className="faq-answer" style={{ color: '#cbd5e1' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      
    </div>
  );
}
`;

fs.writeFileSync(file, importsAndFaq + newComponent);

