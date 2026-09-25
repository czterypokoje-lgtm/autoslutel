import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '@/config/brands';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Kwijt? | 24/7 Mobiele Service | Autosleutel24',
  },
  description: `Autosleutel kwijt? Wij helpen direct. Nieuwe sleutel programmeren aan huis. Alle merken. 24/7. Bel: ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    title: 'Autosleutel Kwijt? | 24/7 Mobiele Service | Autosleutel24',
    description: `Autosleutel kwijt? Wij helpen direct. Nieuwe sleutel programmeren aan huis. Alle merken. 24/7. Bel: ${SITE_CONFIG.phone}`,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel Kwijt — Autosleutel24' }],
  },
};

const faqItems = [
  { q: 'Autosleutel kwijt, wat te doen?', a: 'Wanneer u uw autosleutel kwijt bent, controleer dan eerst of u de auto met een reserve-sleutel kunt openen. Is er geen reserve-sleutel beschikbaar? Neem dan direct contact op met Autosleutel24. Onze mobiele monteurs komen direct naar u toe, openen de auto 100% schadevrij, en maken ter plekke een nieuwe autosleutel met afstandsbediening klaar.' },
  { q: 'Wat te doen als je autosleutel is kwijt?', a: 'Als uw autosleutel kwijt is, dient u uw auto op een veilige plek te laten staan. Neem contact op met een mobiele autoslotenmaker zoals Autosleutel24 om de verloren sleutel uit de computer van de auto te laten wissen. Dit voorkomt dat onbevoegden met de gevonden sleutel uw auto kunnen stelen.' },
  { q: 'Autosleutel verloren, welke diensten bieden vervanging aan?', a: 'Bij het verliezen van een autosleutel bieden de merkdealer en een gespecialiseerde mobiele autoslotenmaker (zoals Autosleutel24) vervanging aan. Waar u bij de dealer de auto moet laten wegslepen en vaak dagen moet wachten op de sleutel, regelt Autosleutel24 de vervanging direct ter plaatse op locatie in heel Nederland binnen één dag.' },
  { q: 'Stappenplan autosleutel verloren?', a: 'Volg dit stappenplan bij het verliezen van een autosleutel: 1. Controleer of de auto op slot zit en veilig geparkeerd staat. 2. Verzamel de autogegevens (merk, model, bouwjaar, kenteken). 3. Neem contact op met Autosleutel24 via telefoon of WhatsApp. 4. De monteur komt naar u toe, opent de auto schadevrij en leest de startonderbreker uit. 5. De verloren sleutel wordt geblokkeerd en de nieuwe sleutel wordt ingeleerd.' },
  { q: 'Hoe snel kan een autosleutel worden bijgemaakt?', a: 'Bij Autosleutel24 kan een nieuwe autosleutel meestal binnen 30 tot 60 minuten ter plekke worden bijgemaakt en geprogrammeerd. U hoeft dus niet dagen te wachten zoals bij de officiële merkdealer.' },
  { q: 'Kosten nieuwe autosleutel laten maken?', a: 'De kosten voor het laten maken van een nieuwe autosleutel variëren gemiddeld van €149 tot €350, afhankelijk van het automerk, bouwjaar en of het een transpondersleutel, klapsleutel of smart key betreft. Autosleutel24 biedt deze service tot wel 60% goedkoper aan dan de dealer.' },
  { q: 'Waar vind ik een autosleutelmaker in mijn buurt?', a: 'U vindt een mobiele autosleutelmaker in uw buurt bij Autosleutel24. Wij rijden door heel Nederland, waaronder Utrecht, Amsterdam, Rotterdam, Den Haag, Almere, Amersfoort en omliggende regio\'s. Onze monteurs komen rechtstreeks naar uw locatie toe.' },
  { q: 'Waar kan ik een autosleutel laten bijmaken?', a: 'U kunt een autosleutel laten bijmaken bij een gespecialiseerde mobiele slotenmaker (zoals Autosleutel24) of bij de merkdealer. Een mobiele sleutelmaker is de meest comfortabele optie, omdat de sleutel direct bij uw huis of werklocatie wordt ingeleerd.' },
  { q: 'Kosten voor het bijmaken van een autosleutel zonder reserve?', a: 'Als u al uw autosleutels kwijt bent en geen reserve-sleutel heeft, starten de kosten bij Autosleutel24 vanaf €190. De slotenmaker moet in dit geval eerst het deurslot decoderen en de startonderbreker (EEPROM/OBD) programmeren.' },
  { q: 'Spoedservice voor verloren autosleutel?', a: 'Ja, Autosleutel24 biedt een 24/7 spoedservice voor verloren autosleutels. Bij spoedgevallen of wanneer u buitengesloten staat, streven onze monteurs ernaar om binnen 30 tot 45 minuten bij u ter plaatse te zijn.' },
  { q: 'Kan een autosleutel met afstandsbediening zonder originele sleutel worden gemaakt?', a: 'Ja, dat is mogelijk. Onze specialisten kunnen de unieke mechanische insnijding bepalen door de cilinder van de autodeur te decoderen. De transponder en de afstandsbediening programmeren we vervolgens rechtstreeks via de OBD2-diagnosepoort in de boordcomputer.' },
  { q: 'Auto openen zonder sleutel door professional?', a: 'Ja, Autosleutel24 opent uw auto 100% schadevrij zonder sleutel. Wij gebruiken professionele Lishi-decoders om de slotcilinder mechanisch te openen, waardoor de deuren, lak en lakrubbers volledig onbeschadigd blijven.' },
  { q: 'Autosleutel kwijt, kan de dealer een nieuwe maken?', a: 'Ja, de dealer kan een nieuwe maken, maar dit vereist dat u de auto op eigen kosten naar de dealer laat slepen. Daarnaast moet u vaak 3 tot 10 werkdagen wachten totdat de sleutel uit de fabriek geleverd en ingeleerd is.' },
  { q: 'Vervangende autosleutel bestellen online?', a: 'U kunt online een sleutelbehuizing bestellen, maar een werkende transpondersleutel met elektronica kan niet simpelweg online besteld worden. De sleutel moet namelijk fysiek in de auto worden geprogrammeerd met professionele OBD-apparatuur om te kunnen starten.' },
  { q: 'Hoe werkt autosleutel programmeren na verlies?', a: 'Bij het programmeren sluit de monteur een programmeercomputer aan op de OBD-poort van de auto. Hiermee worden de oude sleutelcodes uit de startonderbreker (immobilizer) gewist en worden de transponderchip en de afstandsbediening van de nieuwe sleutel gekoppeld.' },
  { q: 'Hoe lang duurt het om een nieuwe autosleutel te krijgen?', a: 'Bij de dealer duurt dit meestal 3 tot 10 werkdagen. Bij Autosleutel24 krijgt u uw nieuwe autosleutel dezelfde dag nog. Binnen 45 tot 60 minuten nadat de monteur op uw locatie is gearriveerd, kunt u weer rijden.' },
  { q: 'Is autosleutel kwijt gedekt door verzekering?', a: 'Ja, bij een WA+ (beperkt casco) of All-Risk verzekering is het verlies of diefstal van autosleutels vaak gedekt. U ontvangt van Autosleutel24 een officiële, gespecificeerde factuur die u rechtstreeks bij uw verzekeraar kunt indienen.' },
  { q: 'Welke bedrijven bieden 24/7 autosleutelservice?', a: 'Autosleutel24 biedt een 24/7 mobiele autosleutelservice in heel Nederland. U kunt ons dag en nacht telefonisch of via WhatsApp bereiken voor directe hulp bij buitensluiting of sleutelverlies.' },
  { q: 'Wat zijn de opties bij alle autosleutels kwijt?', a: 'Als u alle autosleutels kwijt bent, zijn er twee opties: 1. De auto naar de dealer laten slepen voor een duur en langdurig traject. 2. Autosleutel24 inschakelen. Wij komen naar u toe, openen de auto, slijpen een nieuwe sleutelbaard en programmeren de transponder ter plekke.' },
  { q: 'Hoe vind ik een goedkope autosleutelmaker?', a: 'U vindt een goedkope autosleutelmaker door te kiezen voor een onafhankelijke mobiele autosleutelspecialist zoals Autosleutel24. Wij hanteren vaste tarieven vooraf en zijn tot wel 60% goedkoper dan de officiële merkdealer omdat we geen sleepkosten en dure dealer-overhead doorberekenen.' },
  { q: 'Advies bij verlies van autosleutel met startonderbreker?', a: 'Bij verlies van een sleutel met startonderbreker is het belangrijk om de verloren sleutel direct uit de autocomputer te laten programmeren. Onze monteurs kunnen dit direct op locatie voor u doen, zodat de verloren sleutel de auto niet meer kan starten.' },
  { q: 'Kan ik een autosleutel online bestellen en laten programmeren?', a: 'Ja, u kunt online een universele sleutel kopen, maar veel onafhankelijke sleutelmakers kunnen deze niet programmeren vanwege compatibiliteitsproblemen met de transponderchips. Het is veiliger en sneller om direct een complete sleutel inclusief programmering bij Autosleutel24 af te nemen.' },
  { q: 'Autosleutel laten programmeren na verlies?', a: 'Autosleutel laten programmeren na verlies gebeurt direct op uw locatie. De monteur genereert een nieuwe transpondercode, schrijft deze via OBD2-diagnose-apparatuur in het geheugen van de startonderbreker, en synchroniseert de afstandsbediening.' },
  { q: 'Autosleutel kwijt, wat kost het vervangen door een universele sleutel?', a: 'Het vervangen van uw verloren sleutel door een universele OEM-kwaliteit sleutel kost bij Autosleutel24 gemiddeld tussen de €149 en €299, inclusief het slijpen van de sleutelbaard en het programmeren van de transponder. Dit is de meest voordelige en snelle oplossing.' }
];

const steps = [
  { n:'1', title:'Controleer grondig', desc:'Check jaszakken, tassen, thuis, werk. Check of u een reserve sleutel heeft.' },
  { n:'2', title:'Bel uw verzekeraar', desc:'Check uw polis — veel All Risk verzekeringen dekken sleutelverlies. Wij geven een verzekeringsklare factuur.' },
  { n:'3', title:'Bel ons direct', desc:`Wij zijn 24/7 bereikbaar. Geef uw automerk, model en locatie door. Wij geven direct een vaste prijs.` },
  { n:'4', title:'Wij komen naar u toe', desc:'Onze uitgeruste bus rijdt naar uw locatie. Gemiddeld 30–60 minuten. Geen sleepkosten.' },
  { n:'5', title:'Nieuwe sleutel klaar', desc:'Wij programmeren de nieuwe sleutel ter plaatse. Oud gestolen sleutel wordt uitgeschakeld. U rijdt weg.' },
];

const brandPrices = BRANDS.filter(b => b.priority === 'P1').slice(0, 8);

const schema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Autosleutel Kwijt', item: `${SITE_CONFIG.domain}/autosleutel-kwijt` },
  ],
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Wat te doen als u uw autosleutel kwijt bent',
  description: 'Volg dit 5-stappenplan om direct hulp te krijgen bij verloren of gestolen autosleutels.',
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.desc,
  })),
};


import styles from './DeadboltTheme.module.css';
import { Anton } from 'next/font/google';
import Image from 'next/image';

const anton = Anton({ weight: '400', subsets: ['latin'] });

export default function AutosleutelKwijt() {
  return (
    <div className={styles.wrapper}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroInner}>
            <div>
              <h1 className={`${styles.heroTitle} ${anton.className}`}>
                AUTOSLEUTEL KWIJT OF<br/>VERLOREN? WE MAKEN<br/>EEN NIEUWE AAN.
              </h1>
            </div>
            <div className={styles.heroRight}>
              <p className={styles.heroDesc}>
                Sleutel kwijt is vervelend, maar geen reden om de auto te laten wegslepen. Wij programmeren een volledig nieuwe sleutel, ook als er geen reservesleutel meer is.
              </p>
              <div className={styles.buttonGroup}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnOrange} id="akl-hero-phone">
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
              <div className={`${styles.statValue} ${styles.orange} ${anton.className}`}>€300</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Tijd ter plekke</span>
              <div className={`${styles.statValue} ${anton.className}`}>30-60 MIN</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Gem. aankomst</span>
              <div className={`${styles.statValue} ${anton.className}`}>35 MIN</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Elke klus</span>
              <div className={`${styles.statValue} ${anton.className}`}>GECERTIFICEERD &<br/>VERZEKERD</div>
            </div>
          </div>
        </div>
      </section>

      {/* WAT WE DOEN */}
      <section id="wat-we-doen" className={styles.splitSection}>
        <div className={styles.container}>
          <div className={styles.splitGrid}>
            <div>
              <h2 className={`${styles.sectionTitle} ${anton.className}`}>WAT WE DOEN</h2>
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
                <div className={`${styles.priceTitle} ${anton.className}`}>Prijs vanaf<br/>€300</div>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnOrange} style={{ width: '100%' }}>Bel {SITE_CONFIG.phone}</a>
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
          <h2 className={`${styles.sectionTitle} ${anton.className}`}>TRANSPONDER- EN SMART KEY PROGRAMMEREN</h2>
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
                <Image src="/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp" alt="Transpondersleutel" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.photoContent}>
                <h3 className={styles.photoTitle}>Transpondersleutel</h3>
                <p className={styles.photoDesc}>Een sleutel met een ingebouwde chip die communiceert met de startonderbreker van de auto. Meestal vanaf €150 bij te maken.</p>
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/seo/smart-key-keyless-programmeren-autosleutel24-utrecht.webp" alt="Smart key" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.photoContent}>
                <h3 className={styles.photoTitle}>Smart key / keyless start</h3>
                <p className={styles.photoDesc}>Sleutel met startknop-functie — de auto start zodra de sleutel in de buurt is, zonder hem uit uw zak te halen.</p>
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/keys/volkswagen-autosleutel-bijmaken-2.webp" alt="Sleutels" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photoWrap}>
                <Image src="/images/keys/mercedes-autosleutel-bijmaken-2.webp" alt="Lederen sleutel" fill style={{ objectFit: 'cover' }} />
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
            {[
  { id: 'alfa-romeo', url: 'https://cdn.simpleicons.org/alfaromeo/000000' },
  { id: 'audi', url: 'https://cdn.simpleicons.org/audi/000000' },
  { id: 'chevrolet', url: 'https://cdn.simpleicons.org/chevrolet/000000' },
  { id: 'citroen', url: 'https://cdn.simpleicons.org/citroen/000000' },
  { id: 'dacia', url: 'https://cdn.simpleicons.org/dacia/000000' },
  { id: 'fiat', url: 'https://cdn.simpleicons.org/fiat/000000' },
  { id: 'ford', url: 'https://cdn.simpleicons.org/ford/000000' },
  { id: 'honda', url: 'https://cdn.simpleicons.org/honda/000000' },
  { id: 'hyundai', url: 'https://cdn.simpleicons.org/hyundai/000000' },
  { id: 'jeep', url: 'https://cdn.simpleicons.org/jeep/000000' },
  { id: 'kia', url: 'https://cdn.simpleicons.org/kia/000000' },
  { id: 'land-rover', url: 'https://cdn.simpleicons.org/landrover/000000' },
  { id: 'mazda', url: 'https://cdn.simpleicons.org/mazda/000000' },
  { id: 'mercedes', url: 'https://cdn.simpleicons.org/mercedes/000000' },
  { id: 'mitsubishi', url: 'https://cdn.simpleicons.org/mitsubishi/000000' },
  { id: 'nissan', url: 'https://cdn.simpleicons.org/nissan/000000' },
  { id: 'opel', url: 'https://cdn.simpleicons.org/opel/000000' },
  { id: 'peugeot', url: 'https://cdn.simpleicons.org/peugeot/000000' },
  { id: 'renault', url: 'https://cdn.simpleicons.org/renault/000000' },
  { id: 'seat', url: 'https://cdn.simpleicons.org/seat/000000' },
  { id: 'skoda', url: 'https://cdn.simpleicons.org/skoda/000000' },
  { id: 'suzuki', url: 'https://cdn.simpleicons.org/suzuki/000000' },
  { id: 'toyota', url: 'https://cdn.simpleicons.org/toyota/000000' },
  { id: 'volkswagen', url: 'https://cdn.simpleicons.org/volkswagen/000000' }
].map(brand => (
              <div key={brand.id} className={styles.brandBox}>
                <Image src={brand.url} alt={brand.id} width={70} height={40} style={{ objectFit: 'contain' }} unoptimized={true} />
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
