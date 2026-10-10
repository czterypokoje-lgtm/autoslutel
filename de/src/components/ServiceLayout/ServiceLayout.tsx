import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/leistungen';
import { getRelatedBlogPosts } from '@/config/services';
import { isReady, SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import SplitHero from '@/components/SplitHero/SplitHero';
import GalleryMarquee from '@/components/GallerySlider/GalleryMarquee';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import GallerySlider from '@/components/GallerySlider/GallerySlider';
import FeatureCards from '@/components/FeatureCards/FeatureCards';
import Image from 'next/image';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';

import { CITIES } from '@/config/cities';
import { ARRIVAL } from '@/config/arrival';
import { BRANDS } from '@/config/brands';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import { getBaseLocalBusinessSchema } from '@/utils/schema';
import { captionFromFilename } from '@/lib/imageCaption';
import { isFlyer } from '@/lib/jobPhotos';
import styles from '@/app/leistungen/[slug]/page.module.css';
import fs from 'fs';
import path from 'path';

/*
 * The whole service page, as a component two routes can render.
 *
 * It was the body of /leistungen/[slug]. /autoschluessel-verloren needs exactly the
 * same page -- the gallery, the brand grid, the regions, both long articles,
 * the emergency CTA and the related posts -- because that is the page the
 * merged AKL service had and the one people were reading. Hand-copying six
 * hundred lines into a second route would guarantee the two drift apart, and
 * the drift would be invisible until a price or a claim changed on one of
 * them and not the other.
 *
 * `basePath` is why this is a parameter and not a constant: every canonical,
 * breadcrumb and element id has to name the URL the reader is actually on,
 * not the slug the content is filed under.
 */
export default function ServiceLayout({ slug, basePath }: { slug: string; basePath: string }) {
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) notFound();

  const p1Cities = CITIES.filter(c => c.priority === 'P1').slice(0, 8);
  const popularBrands = BRANDS.filter(b => b.priority === 'P1').slice(0, 8);

  const isOpening = ['auto-oeffnen-notdienst', 'schluessel-im-auto-eingeschlossen', 'autotuer-zugefallen', 'kofferraum-oeffnen', 'autoschluessel-abgebrochen'].includes(slug);
  /*
   * The lost-key page is not a bijmaken page. It renders this same layout, and the
   * isKey copy (reserve sleutel laten bijmaken, extra sleutel, behuizing) told someone who
   * had lost every key that they were in the wrong place. isLost swaps those sections.
   */
  const isLost = ['alle-autoschluessel-verloren'].includes(slug);
  const isKey = ['autoschluessel-nachmachen', 'ersatzschluessel-anfertigen', 'transponder-anlernen', 'keyless-go-schluessel', 'funkschluessel-nachmachen'].includes(slug);

  let howItWorksVariant: 'default' | 'akl' | 'ignition' | 'lockout' = 'default';
  if (['alle-autoschluessel-verloren'].includes(slug)) {
    howItWorksVariant = 'akl';
  } else if (['auto-oeffnen-notdienst', 'schluessel-im-auto-eingeschlossen', 'autotuer-zugefallen', 'kofferraum-oeffnen'].includes(slug)) {
    howItWorksVariant = 'lockout';
  } else if (['autoschluessel-abgebrochen'].includes(slug)) {
    howItWorksVariant = 'ignition';
  }

  // Load recent work images for this service
  const imagesDirMerken = path.join(process.cwd(), 'public', 'images', 'merken');
  const imagesDirDiensten = path.join(process.cwd(), 'public', 'images', 'diensten');
  const serviceImages: string[] = [];
  try {
    if (fs.existsSync(imagesDirMerken)) {
      const files = fs.readdirSync(imagesDirMerken);
      const matched = files.filter(f => {
        if (isFlyer(f)) return false;
        if (isOpening && f.includes('auto-oeffnen-ohne-schluessel')) return true;
        if (isKey && !isLost && f.includes('autoschluessel-nachmachen')) return true;
        return false;
      });
      // Mix up the array to get a variety
      const shuffled = matched.sort(() => 0.5 - Math.random());
      serviceImages.push(...shuffled.slice(0, 4).map(f => `/images/marken/${f}`));
    }
    
    // Fallback/fill with general equipment if needed
    if (!isLost && fs.existsSync(imagesDirDiensten) && serviceImages.length < 4) {
      const equipFiles = fs.readdirSync(imagesDirDiensten);
      serviceImages.push(...equipFiles.slice(0, 4 - serviceImages.length).map(f => `/images/leistungen/${f}`));
    }
  } catch (e) {}

  // Dynamic scenarios for better SEO & human tone
  // Situationen, in denen Kunden anrufen — in ihren Worten, nicht in unseren
  const bulletItems = isLost ? [
    { strong: 'Alle Schlüssel verloren, kein Zweitschlüssel:', text: 'Wir öffnen das Fahrzeug schadenfrei, lesen die Schlüsseldaten aus und fertigen vor Ort einen neuen Schlüssel an. Abschleppen zum Händler ist nicht nötig.' },
    { strong: 'Schlüssel verloren oder gestohlen:', text: 'Der verlorene Schlüssel wird aus der Wegfahrsperre gelöscht, damit niemand damit mehr öffnen oder starten kann.' },
    { strong: 'Schlüssel unterwegs, auf der Arbeit oder im Parkhaus verloren:', text: 'Wir kommen dorthin, wo das Fahrzeug steht — auch in die Tiefgarage. Sie müssen nicht zurücklaufen und nichts abschleppen lassen.' },
    { strong: 'Keyless-Go- oder Smart-Key-Schlüssel verloren:', text: 'Auch schlüssellose Systeme fertigen und lernen wir vor Ort an, soweit der Hersteller das zulässt.' },
    { strong: 'Schlüssel im verschlossenen Auto und kein Ersatz:', text: 'Zuerst öffnen wir schadenfrei, danach fertigen wir, wenn nötig, gleich einen neuen Schlüssel an.' }
  ] : isOpening ? [
    { strong: 'Schlüssel auf dem Sitz oder im Zündschloss liegen gelassen:', text: 'Sie steigen kurz aus und die Zentralverriegelung schließt automatisch, während der Schlüssel noch drin liegt.' },
    { strong: 'Schlüssel im Kofferraum:', text: 'Beim Einladen von Einkäufen, Sportsachen oder Gepäck fällt die Klappe zu, und der Schlüssel liegt im Laderaum.' },
    { strong: 'Batterie der Fernbedienung oder des Smart Keys leer:', text: 'Das Fahrzeug reagiert nicht mehr auf das Signal, und der mechanische Notschlüssel im Türgriff dreht wegen Schmutz oder Frost nicht durch.' },
    { strong: 'Kind oder Haustier eingeschlossen:', text: 'Ein echter Notfall. Rufen Sie zuerst 112 — bei Hitze zählen Minuten, und dann ist die Feuerwehr richtig und nicht ein Dienstleister mit Anfahrtszeit.' },
    { strong: 'Störung in der Zentralverriegelung:', text: 'Das Schloss reagiert nicht mehr oder das Keyless-System erkennt den Schlüssel nach einem Spannungsabfall nicht.' }
  ] : isKey ? [
    { strong: 'Sie haben nur noch einen funktionierenden Schlüssel:', text: 'Ein Zweitschlüssel jetzt kostet einen Bruchteil von dem, was ein Totalverlust später kostet — und braucht keinen Notfall als Anlass.' },
    { strong: 'Schlüssel verloren oder gestohlen:', text: 'Wir löschen den verlorenen Schlüssel aus der Wegfahrsperre, damit er das Fahrzeug nicht mehr öffnet und nicht mehr startet.' },
    { strong: 'Gehäuse gebrochen oder Tasten ausgefallen:', text: 'Das Schlüsselblatt ist verbogen oder die Gummitasten sind durch, sodass Feuchtigkeit an die Platine kommen kann.' },
    { strong: 'Transponder wird nicht mehr erkannt:', text: 'Der Anlasser dreht, der Motor startet nicht — die Wegfahrsperre gibt nicht frei. Das wird am Fahrzeug angelernt, der Schlüssel muss dafür nicht ersetzt werden.' },
    { strong: 'Zusätzlicher Schlüssel für Partner oder Familie:', text: 'Vor Ort angelernt und an allen Türen und am Zündschloss geprüft.' }
  ] : [
    { strong: 'Zündschloss dreht nicht oder sitzt fest:', text: 'Der Schlüssel lässt sich nicht mehr drehen, weil der Schließzylinder innen verschlissen ist.' },
    { strong: 'Schlüssel im Zünd- oder Türschloss abgebrochen:', text: 'Wir holen das Bruchstück mit Spezialwerkzeug heraus, ohne den Zylinder zu beschädigen.' },
    { strong: 'Elektronische Störung oder Kommunikationsfehler:', text: 'Die Wegfahrsperre oder das Steuergerät gibt den Start nicht frei.' },
    { strong: 'Schlüsselblatt abgenutzt:', text: 'Nach Jahren ist das Metall abgetragen, der Schlüssel hakt oder bleibt hängen — und nutzt dabei das Zündschloss mit ab.' }
  ];

  /*
   * Photographs of this service, read off disk rather than listed in code:
   * drop a file into public/images/<slug>/ and it appears. The filename is the
   * caption and the alt text, so it has to read like one —
   * auto_contactslot_vervangen_mercedes_eis_utrecht.webp, not IMG_4821.
   */
  let servicePhotos: string[] = [];
  try {
    servicePhotos = fs
      .readdirSync(path.join(process.cwd(), 'public', 'images', slug))
      .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
      .sort();
  } catch {
    // No folder for this service yet.
  }

  const pricingHeaders = ['Leistung / Schlüsselart', 'Merkmale', 'Unser Preis (inkl. MwSt.)', 'Beim Händler'];

  /*
   * A service with its own price rows shows only those. The generic table
   * below is the fallback for services that have not been given one — on the
   * contactslot page it meant five of its six rows were about smart keys and
   * behuizingen, which is not what the visitor came for.
   */
  /*
   * Preise brutto, inkl. 19 % MwSt — Preisangabenverordnung, nicht Geschmack.
   * Die niederländische Tabelle ist ex btw; diese darf das nicht sein.
   *
   * Steht ein Preis noch auf TBD, erscheint "Festpreis am Telefon" statt einer
   * Zahl oder eines Platzhalters. Die Händlerspalte nennt Spannen aus
   * Verbraucherberichten (ADAC, netzwelt, Autobild: 200–500 € für den Schlüssel,
   * mehr bei Funk- und Keyless-Schlüsseln, drei bis fünf Werktage Lieferzeit)
   * und nicht Zahlen, die wir uns gewünscht haben.
   */
  const unserPreis = (key: keyof typeof SITE_CONFIG.prices) => {
    const value = SITE_CONFIG.prices[key];
    return typeof value === 'string' && isReady(value)
      ? `ab ${value} €`
      : 'Festpreis am Telefon';
  };

  const genericPricingRows = [
    ['Autoschlüssel (mechanisch)', 'Ohne Fernbedienung, inkl. Transponder', unserPreis('transponder'), '200–500 € (3–5 Werktage)'],
    ['Funkschlüssel mit Fernbedienung', 'Gefräst und am Fahrzeug angelernt', unserPreis('remote'), 'ab 300 € (3–5 Werktage)'],
    ['Keyless Go / Smart Key', 'Schlüsselloser Zugang, vollständig angelernt', unserPreis('smartKey'), 'ab 400 € (3–5 Werktage)'],
    ['Gehäuse / Batterie wechseln', 'Neues Gehäuse, Mikroschalter, Batterie — Elektronik bleibt', unserPreis('casing'), 'oft ganzer Schlüssel (200 €+)'],
    ['Alle Schlüssel verloren', 'Öffnen, neuer Schlüssel, Wegfahrsperre anlernen', unserPreis('allKeysLost'), 'Schlüssel plus Abschleppen'],
    ['Zündschloss reparieren', 'Instandsetzen oder neues Schloss inkl. Schlüssel', unserPreis('ignition'), 'oft ganze Lenksäule (600 €+)'],
  ];

  const pricingRows = service.pricing
    ? service.pricing.map((r) => [r.service, r.features, r.ours, r.dealer])
    : genericPricingRows;

  const howToSchema = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: service.h1, description: service.intro,
    step: service.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: service.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const serviceSchema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: service.title,
    provider: getBaseLocalBusinessSchema(),
    description: service.metaDesc,
    ...(service.priceFrom && { offers: { '@type': 'Offer', priceCurrency: 'EUR', description: service.priceFrom } }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Diensten', item: `${SITE_CONFIG.domain}/leistungen` },
      { '@type': 'ListItem', position: 3, name: service.title, item: `${SITE_CONFIG.domain}${basePath}` },
    ],
  };

  return (
    <>
      <script id={`howto-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script id={`faq-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id={`svc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script id={`bc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* ── HERO ─────────────────────────────────────────────────────
          *
          * Two layouts, chosen by whether the service has a photograph.
          *
          * With one, it gets SplitHero — the same white hero as the home page
          * and /leistungen/autoschluessel-nachmachen, with the kenteken wizard beside
          * the picture. Somebody arriving here from an ad used to meet a dark
          * navy band and a flat row of fields: visibly a different site from
          * the one the same campaign shows on the home page.
          *
          * Without one, the dark band stays. The split hero has a picture in
          * it, so a page with no picture cannot use it — most services have no
          * photo of their own yet, and filling the gap with a generic stock
          * image would be worse than the honest dark band. Add a heroImage to
          * a service in diensten.ts and that page upgrades on its own.
          */}
        {service.heroImage ? (
          <SplitHero
            crumbs={[
              { label: 'Home', href: '/' },
              { label: 'Diensten', href: '/leistungen' },
              { label: service.title },
            ]}
            titleTop={service.h1.includes('—') ? service.h1.split('—')[0].trim() : service.h1}
            titleAccent={service.h1.includes('—') ? service.h1.split('—').slice(1).join('—').trim() : undefined}
            lead={service.intro}
            facts={<HeroQuickFacts price={service.priceFrom} />}
            image={service.heroImage}
          >
            <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
          </SplitHero>
        ) : (
          <section
            className={styles.hero}
            style={slug === 'autoschluessel-reparieren' ? {
              backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%), url('/images/seo/autoschluessel_reparatur_hero.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            <div className={styles.heroInner}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span>
                <Link href="/leistungen">Diensten</Link> <span>/</span>
                <span>{service.title}</span>
              </nav>

              <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                <HeroTrustBadge />
              </div>

              <h1>
                {service.h1.includes('—') ? (
                  <>
                    {service.h1.split('—')[0]} — <span style={{ color: 'var(--orange-500)' }}>{service.h1.split('—').slice(1).join('—')}</span>
                  </>
                ) : (
                  service.h1
                )}
              </h1>

              <p className={styles.heroLead}>{service.intro}</p>

              <HeroQuickFacts price={service.priceFrom} tone="dark" />


              <div style={{ marginTop: '2rem' }}>
                <LeadCaptureForm phone={SITE_CONFIG.phone} />
              </div>
            </div>
          </section>
        )}

        {/*
          * The home page's sliding photo wall, for services that have enough
          * photographs of their own to fill it.
          *
          * SIX IS NOT ARBITRARY. GalleryMarquee splits the list across two rows
          * travelling in opposite directions and repeats a row until it is long
          * enough to loop. Below six that repetition is visible — the same
          * photo passing three times in one row reads as a bug, and a wall of
          * work you have not done yet is worse than no wall. Drop more files
          * into public/images/<slug>/ and the grid further down becomes this.
          */}
        {servicePhotos.length >= 6 && (
          <GalleryMarquee
            images={servicePhotos.map((file) => ({
              src: `/images/${slug}/${file}`,
              caption: captionFromFilename(file),
              width: 1000,
              height: 750,
            }))}
            title={`${service.title} — Recent Werk`}
            subtitle="Elke dag op locatie, door heel Nederland."
          />
        )}

        <VerifiedReviewBanner />

        <BrandsMarquee />

        {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
        <FeatureCards 
          title={`Specialist in ${service.title}`}
          subtitle={<><span style={{ color: '#f97316' }}>Autoschlüssel24</span> löst das vor Ort, dort wo das Fahrzeug steht.</>}
          features={[
              {
                id: 'feature-1',
                icon: <Image src="/images/icon_van.webp" alt="Mobiele Service" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Autoschlüssel verloren? Sofort Hilfe',
                description: 'Unser Partner kommt zu Ihrem Fahrzeug — für Reparatur oder Ersatz.',
                linkText: 'Meer over mobiele service',
                linkUrl: '/leistungen'
              },
              {
                id: 'feature-2',
                icon: <Image src="/images/icon_map.webp" alt="Lokaal in de buurt" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Auto zu? Schadenfrei geöffnet',
                description: `Binnen ${SITE_CONFIG.responseTime} minuten ter plaatse. Onze lokale monteur is altijd in de buurt.`,
                linkText: 'Partner finden',
                linkUrl: '#contact'
              },
              {
                id: 'feature-3',
                icon: <Image src="/images/icon_price.webp" alt="Vaste prijs" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Festpreis vorab',
                description: 'Keine Überraschungen hinterher. Sie wissen vor dem Start, was es kostet.',
                linkText: 'Preise ansehen',
                linkUrl: '/preise'
              },
              {
                id: 'feature-4',
                icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '12 Maanden Garantie',
                description: 'Auf Schlüssel und Anlernen geben wir 12 Monate Garantie.',
                linkText: 'Wo unsere Partner arbeiten',
                linkUrl: '/staedte'
              },
              {
                id: 'feature-5',
                icon: <Image src="/images/icon_insurance.webp" alt="24/7 Spoedhulp" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '24/7 Spoedhulp Bel Nu',
                description: 'U bent 100% verzekerd. Dag en nacht bereikbaar voor alle noodgevallen.',
                linkText: 'Bel direct',
                linkUrl: `tel:${SITE_CONFIG.phoneTel}`
              }
            ]}
          />

        {/* ── HOW IT WORKS (Full width under hero) ── */}
        <HowItWorks variant={howItWorksVariant} />

        {/* ── CONTENT SECTION ─────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>

                {/* Section 1: Wanneer Heeft U Dienst Nodig */}
                <div>
                  <h2>Wanneer Heeft U {service.title} Nodig?</h2>
                  {/* The direct answer, as ordinary text in the body. It used to be a boxed block in the hero, which pushed the call buttons down; here it still answers the question for anyone (or anything) reading the page. */}
                  {service.directAnswer && <p>{service.directAnswer}</p>}
                  <p>
                    Problemen met autovergrendeling of autosleutels doen zich altijd op een ongelegen moment voor. Bij {SITE_CONFIG.name} begrijpen wij hoe frustrerend en stressvol dit is. Onze gespecialiseerde monteurs staan dag en nacht voor u klaar en lossen onderstaande situaties dagelijks schadevrij voor u op:
                  </p>
                  <ul className={styles.bulletList}>
                    {bulletItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.strong}</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Prijzen Tabel of Openingsmethoden */}
                {isOpening ? (
                  <div>
                    <h2>Schadenfreie Öffnung & Garantie</h2>
                    <p>
                      Onze monteurs maken uitsluitend gebruik van geavanceerd, merkspecifiek slotenmakersgereedschap. In tegenstelling tot traditionele garages of bergingdiensten openen wij uw voertuig 100% schadevrij. Wij verbuigen geen deurstijlen, veroorzaken geen lakbeschadigingen en breken nooit ruiten in.
                    </p>
                    <div className={styles.tableWrapper} style={{ marginBottom: '2rem' }}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            <th>Technik / Werkzeug</th>
                            <th>Anwendung & Situation</th>
                            <th>Schadenfrei-Garantie</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Air Wedge + Long Reach Tool</strong></td>
                            <td>Standard bei den meisten modernen Pkw</td>
                            <td>Schadenfrei, kein Druck auf Lack oder Dichtung</td>
                          </tr>
                          <tr>
                            <td><strong>Lishi 2-in-1 Pick / Decoder</strong></td>
                            <td>Direkt über das Türschloss öffnen und auslesen</td>
                            <td>Mechanisch präzise, ohne Gewalt</td>
                          </tr>
                          <tr>
                            <td><strong>Turbo Decoder</strong></td>
                            <td>Hochsicherheitsschlösser (BMW, VAG, Porsche)</td>
                            <td>Schnell und ohne Einbruchspuren</td>
                          </tr>
                          <tr>
                            <td><strong>Extractie & Cilinder Bypass</strong></td>
                            <td>Bei abgebrochenen Schlüsselstücken im Zünd- oder Türschloss</td>
                            <td>Der originale Schließzylinder bleibt erhalten</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout}>
                      <strong>Schadenfrei-Garantie:</strong> Wij garanderen 100% schadevrije opening of herstel. Mocht er in een uitzonderlijk geval vooraf een risico zijn, dan bespreekt onze monteur dit altijd transparant met u vóór aanvang van de werkzaamheden.
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2>Wat Kost {service.title}? — Transparante Prijzen</h2>
                    <p>
                      Wij geloven in eerlijke en heldere tarieven zonder verborgen kosten achteraf. Omdat wij rechtstreeks vanuit onze volledig uitgeruste mobiele servicebussen werken, bespaart u bij ons tot wel 50% vergeleken met de officiële merkdealer — én u hoeft geen dure wegsleepkosten te betalen!
                    </p>
                    <div className={styles.tableWrapper}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            {pricingHeaders.map((h, i) => (
                              <th key={i}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/*
                            * data-label carries the column heading down to the
                            * phone layout, where the <thead> is hidden and each
                            * row becomes a card — otherwise "€ 300 - € 500"
                            * would sit there with nothing saying what it is.
                            */}
                          {pricingRows.map((row, idx) => (
                            <tr key={idx}>
                              <td data-label={pricingHeaders[0]}>{row[0]}</td>
                              <td data-label={pricingHeaders[1]}>{row[1]}</td>
                              <td data-label={pricingHeaders[2]}><strong>{row[2]}</strong></td>
                              <td data-label={pricingHeaders[3]}>{row[3]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout}>
                      <strong>Transparantie vooraf:</strong> De exacte prijs is afhankelijk van uw automerk, model, bouwjaar en sleuteltype. Neem direct contact op via telefoon of WhatsApp en u ontvangt van ons direct een vaste prijsopgave zonder verrassingen achteraf.
                    </div>
                  </div>
                )}

                <div className={styles.callout}>
                  <strong>Sofort Hilfe nötig?</strong> Rufen Sie an:{' '}
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ fontWeight: 800 }}>{SITE_CONFIG.phone}</a>
                  {' '}oder <a href={WHATSAPP_URL} style={{ fontWeight: 800 }}>schreiben per WhatsApp</a> — Festpreis, bevor jemand losfährt.
                </div>

                {/* Section 2.5: SEO Image & Expert Description */}
                <div>
                  <h2>Mobiler Fachbetrieb — der Partner kommt zu Ihnen</h2>
                  
                  {isLost ? null : slug === 'auto-oeffnen-notdienst' ? (
                    <img 
                      src="/images/seo/auto_tuer_oeffnen_schluesseldienst_schadenfrei.webp" 
                      alt="Autodeur schadevrij openen door monteur" 
                      style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  ) : slug === 'autoschluessel-reparieren' ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      margin: '1.25rem 0'
                    }}>
                      <img 
                        src="/images/seo/autoschluessel-reparieren-werkstatt.webp" 
                        alt="SMD-solderen van microswitches en knoppen onder microscoop" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-lager.webp" 
                        alt="Voorraad van OEM behuizingen en reservesleutel onderdelen" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-ersatzteile.webp" 
                        alt="Reservesleutel printplaten, transponders en spoelen" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-service.webp" 
                        alt="Monteur repareert sleutels ter plaatse" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                    </div>
                  ) : servicePhotos.length > 0 ? (
                    /*
                     * Photos of this service from public/images/<slug>/. Two
                     * hard-coded <img> tags used to sit here repeating the
                     * same files the hero already shows.
                     */
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                      gap: '1rem',
                      margin: '1.25rem 0'
                    }}>
                      {servicePhotos.map((file) => (
                        <Image
                          key={file}
                          src={`/images/${slug}/${file}`}
                          alt={captionFromFilename(file)}
                          width={480}
                          height={360}
                          style={{ width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : serviceImages.length > 0 ? (
                    <GallerySlider 
                      images={serviceImages.map(src => ({
                        src,
                        caption: captionFromFilename(src),
                      }))}
                      title="Onze service in de hele regio — Galerij"
                    />
                  ) : (
                    <img 
                      src="/autoschluessel24-schluesselnachmachen.webp" 
                      alt={`Professionele mobiele service voor ${service.title.toLowerCase()} - direct ter plaatse en 100% schadevrij`} 
                      style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  )}
                  <p>
                    Wanneer u te maken krijgt met een autovergrendelingsprobleem of een kapotte sleutel, is een snelle en deskundige oplossing van vitaal belang. Onze mobiele servicebussen fungeren als rijdende high-tech werkplaatsen. Ze zijn uitgerust met dezelfde geavanceerde diagnoseapparatuur en sleutelslijpmachines als de officiële merkdealers. Hierdoor hoeft u uw voertuig niet op te laten slepen; wij voeren de volledige service direct op uw eigen oprit, op uw werkplek of langs de snelweg uit.
                  </p>
                  <p>
                    Onze werkwijze is gebaseerd op snelheid, vakmanschap en betrouwbaarheid. Waar een garage vaak meerdere werkdagen tot zelfs weken levertijd heeft voor het bestellen en inleren van een nieuwe autosleutel of contactslot, regelen wij dit in vrijwel alle gevallen dezelfde dag nog. Wij lezen de beveiligingscodes uit via de OBD2-diagnosepoort, frezen het sleutelblad met laserprecisie en programmeren de startonderbreker (transponder) direct in het motorregelsysteem van uw auto.
                  </p>
                </div>



                {/* Section 4: Welke Merken Bedienen Wij */}
                <details style={{ margin: '2rem 0' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '1.3rem', fontWeight: 800 }}>{`Voor welke merken bieden wij ${service.title}?`}</summary>
                  <BrandsLogoGrid
                    title={isLost ? 'Ihre Marke? Wir fertigen den Schlüssel vor Ort' : `Voor Welke Merken Bieden Wij ${service.title}?`}
                    subtitle="Onze programmeerapparatuur en Lishi-openingsgereedschappen ondersteunen meer dan 95% van alle automerken op de Nederlandse wegen. Wij zijn specialist in onder andere:"
                  />
                </details>

                {/* Section 5: Waar Komen Wij */}
                <div>
                  <h2>In Welke Regio&apos;s Bieden Wij {service.title}?</h2>
                  <p>
                    Met een netwerk van aangesloten autosleutelspecialisten bedienen wij dagelijks een groot werkgebied in Nederland. Wij komen onder meer in:
                  </p>
                  {/* No arrival time per city here. city.travelTime read "30-60 min"
                      on 61 of 62 records — a constant wearing a data field's clothes,
                      and false for every region beyond the Randstad. The real figure
                      depends on which partner covers the city, which only the city
                      page knows; this list links there rather than guessing. */}
                  <p>
                    {CITIES.filter((c) => c.priority === 'P1').map((c, i, all) => (
                      <span key={c.slug}>
                        <Link href={`/staedte/${c.slug}`}>{c.city}</Link>
                        {i < all.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </p>
                  {/* The other towns stay in the page, collapsed: a 60-item list was a large part of a 28,000px page. */}
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, margin: '0.5rem 0' }}>Alle overige steden</summary>
                    <ul className={styles.bulletList}>
                      {CITIES.filter((c) => c.priority !== 'P1').map((c) => (
                        <li key={c.slug}>
                          <Link href={`/staedte/${c.slug}`}>
                            {c.city}
                          </Link>
                          {` — ${c.region}`}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <p>
                    <Link href="/staedte" style={{ fontWeight: 700, color: '#f97316' }}>Alle Städte und Regionen ansehen →</Link>
                  </p>
                </div>

                {/* Section 5.5: Comprehensive Dutch SEO Guide */}
                <details className="seo-article-block" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 800 }}>Alles over {service.title}: Mobiele Service, Techniek en Verzekering</summary>
                  <p>
                    Wanneer u hulp nodig heeft met <strong>{service.title.toLowerCase()}</strong>, wilt u niet afhankelijk zijn van lange wachttijden of dure wegsleepservices van traditionele garages. Onze gecertificeerde mobiele slotenmakers komen 24 uur per dag, 7 dagen per week rechtstreeks naar uw auto toe in heel Nederland. Of u nu thuis op de oprit staat, op uw werk, of langs de weg bent gestrand: binnen gemiddeld 30 minuten zijn wij ter plaatse.
                  </p>
                  <h3>Fahrzeugdiagnose &amp; schadenfreie Öffnung</h3>
                  <p>
                    Wij werken uitsluitend met hightech diagnoseapparatuur en originele dealer-tokens. Voor het openen van autodeuren gebruiken wij speciale Lishi 2-in-1 lock decoders waarmee we het slot schadevrij openen via de cilinder. Moet er een nieuwe sleutel worden ingeleerd? Via de OBD2-diagnosepoort koppelen wij de nieuwe transponderchip of Keyless Go smart key rechtstreeks aan de startonderbreker van uw auto.
                  </p>
                  <h3>Günstiger als der Händler, 12 Monate Garantie</h3>
                  <p>
                    Doordat wij geen dure showrooms of logistieke ketens onderhouden, bent u bij ons gemiddeld <strong>50% voordeliger uit</strong> dan bij de officiële merkdealer. Een reservesleutel kost bij ons €{SITE_CONFIG.prices.transponder} tot €299. Bij "alle sleutels kwijt" betaalt u €299 tot €500 (inclusief programmeren). Bovendien komen wij naar u toe op locatie, dus u betaalt <strong>géén wegsleepkosten</strong>! U ontvangt standaard 12 maanden schriftelijke garantie op al onze sleutels en reparaties.
                  </p>
                </details>

                {/* Section 6: FAQ Accordion */}
                <div>
                  <h2>Veelgestelde Vragen over {service.title}</h2>
                  {service.faq.slice(0, 6).map((f, i) => (
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {f.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>
                        {f.a}
                      </p>
                    </details>
                  ))}
                  {service.faq.length > 6 && (
                    <details style={{ margin: '0.75rem 0' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{`Nog ${service.faq.length - 6} vragen`}</summary>
                      {service.faq.slice(6).map((f, i) => (
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {f.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>
                        {f.a}
                      </p>
                    </details>
                  ))}
                    </details>
                  )}
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Sofort Hilfe nötig?</h3>
                  <p>Bel of WhatsApp ons direct. Wij zijn 24/7 bereikbaar en gemiddeld binnen {SITE_CONFIG.responseTime} bij u op locatie.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`svc-sidebar-${slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`svc-sidebar-${slug}-wa`}>Per WhatsApp</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Festpreis vorab', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>{service.title} Nodig? Bel Onze Mobiele Spoedservice</h2>
              <p>Keine Wartezeit beim Händler, keine Abschleppkosten. Unsere Partner arbeiten rund um die Uhr und kommen zu Ihrem Fahrzeug.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id={`svc-cta-${slug}-phone`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  Bel: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id={`svc-cta-${slug}-wa`}>Per WhatsApp</a>
              </div>
              <div className={styles.microText}>
                <span>✓ Direkter Kontakt zum Partner</span>
                <span>✓ Vaste prijs vooraf, geen verrassingen</span>
                <span>✓ 100% Schadevrije garantie</span>
              </div>
            </div>

            {/* ── RELATED BLOGS SECTION ────────────────────────────────── */}
            {(() => {
              const relatedPosts = getRelatedBlogPosts(slug);
              if (!relatedPosts || relatedPosts.length === 0) return null;
              return (
                <section className={styles.relatedBlogsSection} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className={styles.relatedBlogsContainer} style={{ padding: 0 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                      GERELATEERDE KENNIS &amp; ADVIES
                    </p>
                    <h2 className={styles.relatedBlogsTitle}>
                      Handige artikelen over {service.title}
                    </h2>
                    <div className={styles.relatedBlogsGrid}>
                      {relatedPosts.map((post) => (
                        <Link
                          key={post.slug}
                          href={`/blog/${post.slug}`}
                          className={styles.blogPostCard}
                          id={`related-blog-${post.slug}`}
                        >
                          <div className={styles.blogPostMeta}>
                            <span className={styles.blogPostReadTime}>{post.readTime} lezen</span>
                            <span className={styles.blogPostDate}>
                              {new Date(post.publishDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <h3 className={styles.blogPostTitle}>{post.title}</h3>
                          <p className={styles.blogPostExcerpt}>{post.excerpt}</p>
                          <span className={styles.blogPostLink}>Lees artikel →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ── REVIEWS SECTION ────────────────────────────────────── */}
            <section className={styles.reviews}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem', textAlign: 'center' }}>
                KLANTBEOORDELINGEN
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2rem 0', textAlign: 'center' }}>
                Wat Onze Klanten Zeggen over {service.title}
              </h2>
              <GoogleReviewsCta limit={3} />
            </section>

            {/* ── COMPREHENSIVE SERVICE TECHNICAL SEO GUIDE ── */}
            <details className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '3.5rem', background: '#ffffff', padding: '1.5rem 2.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
              <summary style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 800 }}>Alles over {service.title} door Onze Gecertificeerde Slotenmakers</summary>
              <p>
                Het vakkundig uitvoeren van <strong>{service.title.toLowerCase()}</strong> vereist nauwkeurigheid, gespecialiseerde gereedschappen en actuele kennis van voertuigelektronica. Bij moderne personenauto&apos;s en bedrijfswagens is elk onderdeel — van het contactslot en het portierslot tot de afstandsbediening en transponderchip — naadloos verbonden met de centrale boordcomputer (ECU, BSI of CAS module). Waar conventionele garages of algemene pechhulpdiensten vaak niet over de juiste specialistische apparatuur beschikken, is <strong>{SITE_CONFIG.name}</strong> uitgerust om direct op locatie in te grijpen.
              </p>
              <h3>Waarom professionele mobiele hulp essentieel is</h3>
              <p>
                Wanneer u te maken heeft met een buitensluiting, een kapotte sleutel of een storing in uw startonderbreker, wilt u voorkomen dat er schade ontstaat aan uw autolak, portier of elektronica. Onze monteurs werken met schadevrije Lishi 2-in-1 lockdecoders, OEM-gecertificeerde diagnosecomputers en hightech CNC lasermachines. Wij lossen het probleem direct bij u voor de deur op — of u nu thuis bent, op het werk staat of onderweg langs de weg.
              </p>
              <h3>Festpreis vorab, versichert, 12 Monate Garantie</h3>
              <p>
                Wij hanteren vooraf altijd een vaste en heldere prijsafspraak, zodat u nooit wordt geconfronteerd met onverwachte kosten of hoge sleepkosten naar een dealer. Bovendien ontvangt u op al onze geleverde sleutels, onderdelen en reparaties standaard 12 maanden schriftelijke garantie. Veel verzekeringsmaatschappijen vergoeden onze factuur onder uw WA Extra of Allrisk autoverzekering.
              </p>
            </details>

            {/* ── INTERNAL LINKING NETWORK SECTION ── */}
            <details className="seo-hub-box" style={{ marginTop: '4rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '1.15rem' }}>Meer diensten, automerken en steden</summary>
              <div className="seo-hub-grid">
                <div>
                  <div className="seo-hub-title">Andere Diensten</div>
                  <div className="seo-hub-col">
                    {DIENSTEN.filter(s => s.slug !== service.slug && !REDIRECTED_SERVICE_SLUGS.has(s.slug)).map(s => (
                      <Link key={s.slug} href={`/leistungen/${s.slug}`} className="seo-hub-link">
                        {`${s.title} →`}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="seo-hub-title">Automerken voor {service.title}</div>
                  <div className="seo-hub-col">
                    {BRANDS.map(b => (
                      <Link key={b.slug} href={`/merken/${b.nameSlug.toLowerCase()}-autosleutel-bijmaken${isLost ? '#schluessel-verloren' : ''}`} className="seo-hub-link">
                        {isLost ? `${b.name} sleutel kwijt →` : `${b.name} Autosleutel Bijmaken →`}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="seo-hub-title">{service.title} in de Regio</div>
                  <div className="seo-hub-col">
                    <Link href="/staedte" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                      Bekijk alle steden →
                    </Link>
                    {p1Cities.map(c => (
                      <Link key={c.slug} href={`/staedte/${c.slug}`} className="seo-hub-link">
                        {`${service.title} ${c.city} →`}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </details>

          </div>
        </section>
      </main>
    </>
  );
}
