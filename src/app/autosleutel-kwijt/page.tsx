import type { Metadata } from 'next';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '@/config/brands';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VideoEmbed, { videoSchema } from '@/components/VideoEmbed/VideoEmbed';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import SplitHero from '@/components/SplitHero/SplitHero';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

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

/*
 * Ten questions, down from twenty-four.
 *
 * The twenty-four were keyword variants, not questions: "Autosleutel kwijt,
 * wat te doen?", "Wat te doen als je autosleutel is kwijt?" and "Stappenplan
 * autosleutel verloren?" were the same question three times, and four more
 * asked what it costs. Nobody asks a question four ways; a crawler was the
 * intended reader.
 *
 * That matters more than it reads. Search Console shows this page taking 440
 * impressions for "autosleutel kwijt" over three months and ZERO clicks —
 * impressions from page two or three, which is where Google puts a page it
 * has decided was written for it rather than for a person. This block is the
 * clearest example of that on the page, and it is now marked up as FAQPage
 * structured data, which would have declared the stuffing formally.
 *
 * Each of the ten is a distinct thing a person standing next to a locked car
 * actually asks, answered once and properly. The substance from the
 * duplicates is merged in rather than dropped — the price range, the €190
 * all-keys-lost floor, the insurance detail, the BDC2/SFD caveat.
 */
const faqItems = [
  { q: 'Ik ben mijn autosleutel kwijt — wat moet ik nu doen?', a: 'Laat de auto op een veilige plek staan en kijk eerst of er nog een reservesleutel is. Is die er niet, verzamel dan merk, model, bouwjaar en kenteken en bel ons. Onze monteur komt naar uw locatie, opent de auto 100% schadevrij, leest de startonderbreker uit, blokkeert de verloren sleutel en programmeert ter plekke een nieuwe. U rijdt dezelfde dag weer.' },
  { q: 'Wat kost een nieuwe autosleutel?', a: 'Tussen €149 en €350, afhankelijk van merk, bouwjaar en of het om een transpondersleutel, klapsleutel of smart key gaat. Bent u álle sleutels kwijt en is er geen reserve, dan begint het bij €190: het deurslot moet dan eerst gedecodeerd worden voordat er geprogrammeerd kan worden. U hoort de exacte prijs telefonisch, vóór wij vertrekken. Een dealer rekent voor hetzelfde werk doorgaans het dubbele, plus sleepkosten.' },
  { q: 'Hoe snel heb ik een nieuwe sleutel?', a: 'Meestal binnen 30 tot 60 minuten na aankomst, ter plekke klaar en ingeleerd. Bij de dealer duurt dit doorgaans 3 tot 10 werkdagen, omdat de sleutel op chassisnummer besteld moet worden. Wij zijn 24/7 bereikbaar, ook \'s nachts en in het weekend.' },
  { q: 'Kan er een sleutel gemaakt worden zonder dat ik er nog één heb?', a: 'Ja. De mechanische insnijding bepalen wij door de cilinder van het deurslot te decoderen. De transponder en de afstandsbediening koppelen we daarna via de OBD2-poort aan de boordcomputer. Er hoeft dus geen originele sleutel te zijn — dat is precies het geval waarvoor wij bestaan.' },
  { q: 'Wordt mijn verloren sleutel onbruikbaar gemaakt?', a: 'Ja, en dat is het belangrijkste deel van het werk. Wij wissen de codes van de verloren sleutel uit de startonderbreker, zodat wie hem vindt de auto niet meer kan starten. Een nieuwe sleutel laten maken zonder de oude te blokkeren laat uw auto open staan voor de vinder.' },
  { q: 'Vergoedt mijn verzekering een verloren autosleutel?', a: 'Bij WA+ (beperkt casco) en All Risk is verlies of diefstal van autosleutels vaak gedekt; bij alleen WA niet. Het eigen risico verschilt per polis. U krijgt van ons een officiële, gespecificeerde factuur die u rechtstreeks bij uw verzekeraar kunt indienen.' },
  { q: 'Wat gebeurt er als ik álle sleutels kwijt ben?', a: 'Dan zijn er twee wegen. De auto laten wegslepen naar de dealer, wat duur is en dagen duurt. Of ons bellen: wij komen naar de auto toe, openen hem schadevrij, slijpen een nieuwe sleutelbaard en programmeren de transponder ter plaatse. De auto hoeft niet van zijn plek.' },
  { q: 'Hoe werkt het programmeren precies?', a: 'De monteur sluit een programmeercomputer aan op de OBD-poort. Daarmee worden de oude sleutelcodes uit de startonderbreker gewist en worden de transponderchip en de afstandsbediening van de nieuwe sleutel aan de auto gekoppeld. Bij sommige modellen — onder meer BMW met BDC2 en de VAG-groep met SFD — is er een extra vrijgave nodig; dat vertellen wij vooraf.' },
  { q: 'Kan ik zelf online een sleutel bestellen en laten programmeren?', a: 'Een behuizing of een universele sleutel kunt u online kopen, maar een werkende transpondersleutel is meer dan het plastic: de chip moet aan úw auto gekoppeld worden. Veel online sleutels zijn bovendien niet te programmeren voor het betreffende model. Wij leveren en programmeren OEM-kwaliteit sleutels in één bezoek, met 12 maanden garantie op het onderdeel.' },
  { q: 'Kunnen jullie de auto ook openen als de sleutel erin ligt?', a: 'Ja, 100% schadevrij. Wij werken met professionele Lishi-decoders op het slot zelf — geen wig, geen luchtkussen, geen schade aan lak of rubbers. Hetzelfde gereedschap waarmee we daarna de sleutel kunnen namaken.' },
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
import { Bebas_Neue } from 'next/font/google';
import Image from 'next/image';

const anton = Bebas_Neue({ weight: '400', subsets: ['latin'] });

export default function AutosleutelKwijt() {
  /*
   * All three of these were defined above and rendered nowhere: the file had
   * no <script type="application/ld+json"> at all, so a 1,453-word page for
   * one of the highest-intent queries on the site was emitting nothing but
   * the sitewide WebSite node. The objects were correct; they were simply
   * never attached to the tree.
   *
   * Service is added alongside them so the page states what is being sold
   * rather than only answering questions about it.
   */
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Autosleutel kwijt — nieuwe sleutel op locatie',
    serviceType: 'Autosleutel vervangen bij verlies of diefstal',
    provider: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
    areaServed: { '@type': 'Country', name: 'Nederland' },
    availableChannel: {
      '@type': 'ServiceChannel',
      servicePhone: SITE_CONFIG.phoneTel,
      serviceUrl: `${SITE_CONFIG.domain}/autosleutel-kwijt`,
    },
  };

  return (
    <div className={styles.wrapper}>
      <script id="kwijt-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script id="kwijt-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="kwijt-howto" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script id="kwijt-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script id="kwijt-video" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      {/*
        * The same hero every other landing page uses.
        *
        * This page had a dark "Deadbolt" theme of its own (ffdad94), which
        * made the site's highest-intent query the one page that looked like a
        * different company -- and the only money page whose hero asked for
        * nothing. It now runs SplitHero with the kenteken wizard, exactly as
        * /diensten/alle-sleutels-kwijt-auto does.
        *
        * The photograph is the workshop key wall: several hundred real blanks
        * on pegboard. It answers the question the visitor actually has -- do
        * you have a key for my car -- and no other page uses it, so this page
        * still looks like itself.
        */}
      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autosleutel kwijt' }]}
        titleTop="Autosleutel Kwijt of Verloren?"
        titleAccent="Wij Maken een Nieuwe op Locatie"
        lead="Sleutel kwijt is vervelend, maar geen reden om de auto te laten wegslepen. Wij programmeren een volledig nieuwe sleutel bij uw auto, ook als er geen reservesleutel meer is."
        image={{
          src: '/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp',
          alt: 'Sleutelwand in de werkplaats van Autosleutel24 met honderden transpondersleutels en sleutelbehuizingen per automerk',
        }}
      >
        <p
          data-direct-answer
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.15rem',
            background: 'var(--gray-50)',
            borderLeft: '3px solid var(--orange-500)',
            borderRadius: '8px',
            fontSize: '0.98rem',
            lineHeight: 1.65,
            color: 'var(--gray-700)',
          }}
        >
          Autosleutel kwijt? Wij maken en programmeren een nieuwe sleutel bij u op locatie,
          vanaf €149 en meestal binnen 30 tot 60 minuten. Is er geen enkele sleutel meer,
          dan lezen wij de sleutelcode uit de boordcomputer en wissen wij de verloren
          sleutel uit het geheugen, vanaf €{SITE_CONFIG.prices.allKeysLost}.
        </p>
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />

      <BrandsMarquee />

      {/* STATS BAR */}
      <section className={styles.statsBar}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Prijs vanaf</span>
              <div className={`${styles.statValue} ${styles.orange} ${anton.className}`}>€149</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Alle sleutels kwijt</span>
              <div className={`${styles.statValue} ${anton.className}`}>VANAF €{SITE_CONFIG.prices.allKeysLost}</div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.eyebrow}>Tijd ter plekke</span>
              <div className={`${styles.statValue} ${anton.className}`}>30-60 MIN</div>
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

      {/* VIDEO — this is the watch page, so the markup lives here */}
      <section className={styles.videoSection}>
        <div className={styles.container}>
          <VideoEmbed
            heading="ZO WERKT HET — IN 40 SECONDEN"
            headingClassName={`${styles.sectionTitle} ${anton.className}`}
          />
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
          <span className={styles.eyebrow} style={{ color: "#64748b" }}>Dekking per merk</span>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "#0f172a" }}>Autosleutel bijmaken voor deze merken</h2>
          <div className={styles.brandsGrid}>
            {[
  { id: 'bmw', url: 'https://cdn.simpleicons.org/bmw/000000' },
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
  { id: 'mini', url: 'https://cdn.simpleicons.org/mini/000000' },
  { id: 'mazda', url: 'https://cdn.simpleicons.org/mazda/000000' },
  { id: 'volvo', url: 'https://cdn.simpleicons.org/volvo/000000' },
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
          <p className={styles.brandsDisclaimer} style={{ color: "#64748b" }}>
            Alle merklogo's zijn eigendom van de respectievelijke fabrikanten. Autosleutel24 is een onafhankelijk technici-netwerk en geen erkende dealer of licentiehouder van deze merken.
          </p>
        </div>
      </section>

      {/* FAQs (PRESERVED FROM ORIGINAL) */}
      <section className={styles.faqSection}>
        <div className={styles.container} style={{ maxWidth: 900 }}>
          <h2 className={`${anton.className} ${styles.sectionTitle}`} style={{ color: "#0f172a" }}>Veelgestelde Vragen — Autosleutel Kwijt</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item" style={{ borderColor: 'rgba(15,23,42,0.10)' }}>
              <summary className="faq-question" style={{ color: '#0f172a' }}>
                {f.q}
                <svg className="faq-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <p className="faq-answer" style={{ color: '#475569' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      
    </div>
  );
}
