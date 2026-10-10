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
   * "Alle Schlüssel verloren" ist keine Nachmachen-Seite, benutzt aber dieselbe
   * Vorlage. Der isKey-Text (Zweitschlüssel, Ersatzschlüssel, Gehäuse) sagte
   * jemandem, der gerade keinen Schlüssel mehr hat, er sei auf der falschen
   * Seite. isLost tauscht diese Abschnitte aus.
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

  /*
   * Arbeitsfotos für diese Leistung.
   *
   * Drei Dinge waren hier zu korrigieren, und alle drei kamen beim Kopieren
   * mit:
   *
   * 1. Die Verzeichnisse hießen 'merken' und 'diensten'. Beide sind in dieser
   *    App auf deutsche Namen umgezogen ('marken', 'leistungen'), also fand
   *    existsSync() nichts und jede Leistungsseite blieb ohne Foto — ein
   *    stiller Ausfall, weil der try/catch ihn verschluckt.
   *
   * 2. Die Auswahl war `matched.sort(() => 0.5 - Math.random())`. Das ist
   *    während des Renderns nicht erlaubt (ESLint fängt es ab) und erzeugt
   *    bei jedem Build andere Seiten: gleiche Inhalte, andere Bilder, also
   *    ein Diff ohne Aussage und für Google eine Seite, die sich dauernd
   *    ändert, ohne dass sich etwas geändert hat. Die Rotation ist jetzt aus
   *    dem Slug abgeleitet: verschiedene Leistungen zeigen verschiedene
   *    Fotos, dieselbe Leistung zeigt bei jedem Build dieselben.
   *
   * 3. Nebenbei: `sort()` verändert das Array an Ort und Stelle — hier
   *    harmlos, weil `matched` frisch ist, aber der Grund, warum ein Shuffle
   *    über sort() auch funktional ein Fehler ist.
   */
  const imagesDirMarken = path.join(process.cwd(), 'public', 'images', 'marken');
  const imagesDirLeistungen = path.join(process.cwd(), 'public', 'images', 'leistungen');
  const serviceImages: string[] = [];
  try {
    if (fs.existsSync(imagesDirMarken)) {
      const files = fs.readdirSync(imagesDirMarken).sort();
      const matched = files.filter(f => {
        if (isFlyer(f)) return false;
        if (isOpening && f.includes('auto-oeffnen-ohne-schluessel')) return true;
        if (isKey && !isLost && f.includes('autoschluessel-nachmachen')) return true;
        return false;
      });
      const offset = matched.length
        ? [...slug].reduce((n, ch) => n + ch.charCodeAt(0), 0) % matched.length
        : 0;
      const rotated = [...matched.slice(offset), ...matched.slice(0, offset)];
      serviceImages.push(...rotated.slice(0, 4).map(f => `/images/marken/${f}`));
    }

    // Mit allgemeinen Werkstattfotos auffüllen, wenn nicht genug da sind.
    if (!isLost && fs.existsSync(imagesDirLeistungen) && serviceImages.length < 4) {
      const equipFiles = fs.readdirSync(imagesDirLeistungen).sort();
      serviceImages.push(...equipFiles.slice(0, 4 - serviceImages.length).map(f => `/images/leistungen/${f}`));
    }
  } catch {
    /* Ein fehlendes Bildverzeichnis darf keine Seite verhindern. */
  }

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
   * Fotos dieser Leistung, von der Platte gelesen statt im Code gepflegt:
   * eine Datei in public/images/<slug>/ ablegen, und sie erscheint. Der
   * Dateiname wird zur Bildunterschrift und zum alt-Text, muss also wie einer
   * lesen — auto_zuendschloss_wechseln_mercedes_fbs4.webp, nicht IMG_4821.
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
   * Eine Leistung mit eigenen Preiszeilen zeigt nur diese. Die allgemeine
   * Tabelle weiter unten ist der Rückfall für Leistungen, die keine haben —
   * auf der niederländischen Zündschloss-Seite führte das dazu, dass fünf von
   * sechs Zeilen über Smart Keys und Gehäuse gingen, also über etwas anderes
   * als das, weswegen der Besucher gekommen war.
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
      { '@type': 'ListItem', position: 2, name: 'Leistungen', item: `${SITE_CONFIG.domain}/leistungen` },
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
          * a service in leistungen.ts and that page upgrades on its own.
          */}
        {service.heroImage ? (
          <SplitHero
            crumbs={[
              { label: 'Home', href: '/' },
              { label: 'Leistungen', href: '/leistungen' },
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
                <Link href="/leistungen">Leistungen</Link> <span>/</span>
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
            title={`${service.title} — zuletzt erledigt`}
            subtitle="Arbeiten unserer Partner, jeweils dort, wo das Fahrzeug stand."
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
                icon: <Image src="/images/icon_van.webp" alt="Mobiler Service" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Autoschlüssel verloren? Sofort Hilfe',
                description: 'Unser Partner kommt zu Ihrem Fahrzeug — für Reparatur oder Ersatz.',
                linkText: 'Mehr zum mobilen Service',
                linkUrl: '/leistungen'
              },
              {
                id: 'feature-2',
                icon: <Image src="/images/icon_map.webp" alt="Partner in Ihrer Nähe" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Auto zu? Schadenfrei geöffnet',
                description: 'Spezialwerkzeug statt Glasbruch: Tür, Dichtung und Schloss bleiben unbeschädigt.',
                linkText: 'Auto öffnen lassen',
                linkUrl: '/leistungen/auto-oeffnen-notdienst'
              },
              {
                id: 'feature-3',
                icon: <Image src="/images/icon_price.webp" alt="Festpreis" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Festpreis vorab',
                description: 'Keine Überraschungen hinterher. Sie wissen vor dem Start, was es kostet.',
                linkText: 'Preise ansehen',
                linkUrl: '/preise'
              },
              {
                id: 'feature-4',
                icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '12 Monate Garantie',
                description: 'Auf Schlüssel und Anlernen geben wir 12 Monate Garantie.',
                linkText: 'Wo unsere Partner arbeiten',
                linkUrl: '/staedte'
              },
              {
                id: 'feature-5',
                icon: <Image src="/images/icon_insurance.webp" alt="24/7 Notdienst" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '24/7 Notdienst — jetzt anrufen',
                description: 'Tag und Nacht erreichbar, auch am Wochenende und an Feiertagen.',
                linkText: 'Jetzt anrufen',
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

                {/* Abschnitt 1: Wann brauchen Sie diese Leistung */}
                <div>
                  <h2>Wann brauchen Sie {service.title}?</h2>
                  {/* Die direkte Antwort, als normaler Text im Fließtext. Sie
                      stand einmal als Kasten im Hero und hat die Anrufknöpfe
                      nach unten gedrückt; hier beantwortet sie die Frage
                      weiterhin für jeden — und für jede Maschine —, die die
                      Seite liest. */}
                  {service.directAnswer && <p>{service.directAnswer}</p>}
                  <p>
                    Ein Problem mit Schlüssel oder Schloss kommt nie zu einem passenden Zeitpunkt. Die Partner von {SITE_CONFIG.name} sind Tag und Nacht erreichbar und lösen die folgenden Fälle als Tagesgeschäft — vor Ort und ohne Folgeschaden:
                  </p>
                  <ul className={styles.bulletList}>
                    {bulletItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.strong}</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Abschnitt 2: Preistabelle oder Öffnungsmethoden */}
                {isOpening ? (
                  <div>
                    <h2>Schadenfreie Öffnung & Garantie</h2>
                    <p>
                      Unsere Partner arbeiten mit markenspezifischem Öffnungswerkzeug, nicht mit Gewalt. Anders als bei einem Abschleppdienst wird dabei keine Scheibe eingeschlagen, kein Türrahmen verbogen und kein Lack beschädigt — das Fahrzeug ist nach der Öffnung in dem Zustand, in dem es vorher war.
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
                            <td><strong>Extraktion &amp; Zylinder-Bypass</strong></td>
                            <td>Bei abgebrochenen Schlüsselstücken im Zünd- oder Türschloss</td>
                            <td>Der originale Schließzylinder bleibt erhalten</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout}>
                      <strong>Schadenfrei-Garantie:</strong> Wir öffnen schadenfrei oder stellen den
                      Zustand wieder her. Besteht in einem Ausnahmefall vorher ein Risiko — etwa bei
                      einem bereits beschädigten Schloss —, sagt der Partner das, bevor er anfängt,
                      und nicht hinterher.
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2>Was kostet {service.title}?</h2>
                    <p>
                      Alle Beträge sind Bruttopreise inklusive 19 % MwSt. — so verlangt es die
                      Preisangabenverordnung gegenüber Verbrauchern, und so steht es auch auf der
                      Rechnung. Den genauen Festpreis für Ihr Fahrzeug hören Sie am Telefon, bevor
                      jemand losfährt; weil der Partner zu Ihnen kommt, entfallen Abschleppkosten
                      und der Termin beim Vertragshändler.
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
                      <strong>Preis vorab, nicht vor Ort:</strong> Was es genau kostet, hängt von
                      Marke, Modell, Baujahr und Schlüsselart ab. Nennen Sie uns diese vier Angaben
                      am Telefon oder per WhatsApp, und Sie hören den Festpreis, bevor jemand
                      losfährt — er ändert sich am Fahrzeug nicht.
                    </div>
                  </div>
                )}

                <div className={styles.callout}>
                  <strong>Sofort Hilfe nötig?</strong> Rufen Sie an:{' '}
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ fontWeight: 800 }}>{SITE_CONFIG.phone}</a>
                  {' '}oder <a href={WHATSAPP_URL} style={{ fontWeight: 800 }}>schreiben per WhatsApp</a> — Festpreis, bevor jemand losfährt.
                </div>

                {/* Abschnitt 2.5: Bild und Beschreibung */}
                <div>
                  <h2>Mobiler Fachbetrieb — der Partner kommt zu Ihnen</h2>
                  
                  {isLost ? null : slug === 'auto-oeffnen-notdienst' ? (
                    <img 
                      src="/images/seo/auto_tuer_oeffnen_schluesseldienst_schadenfrei.webp" 
                      alt="Autotür schadenfrei öffnen — Spezialwerkzeug statt Glasbruch" 
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
                        alt="SMD-Löten von Mikroschaltern und Tasten unter dem Mikroskop" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-lager.webp" 
                        alt="Lager mit OEM-Schlüsselgehäusen und Ersatzteilen" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-ersatzteile.webp" 
                        alt="Platinen, Transponder und Spulen für Ersatzschlüssel" 
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                      />
                      <img 
                        src="/images/seo/autoschluessel-reparieren-service.webp" 
                        alt="Techniker repariert einen Autoschlüssel vor Ort" 
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
                      title="Arbeiten unserer Partner — Galerie"
                    />
                  ) : (
                    <img 
                      src="/autoschluessel24-schluesselnachmachen.webp" 
                      alt={`${service.title} — mobil vor Ort, schadenfrei gearbeitet`} 
                      style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  )}
                  <p>
                    Bei einem defekten Schlüssel oder einem verschlossenen Fahrzeug zählt, dass
                    jemand kommt, der das Problem wirklich lösen kann. Die Fahrzeuge unserer Partner
                    sind fahrende Werkstätten: dieselbe Diagnosetechnik und dieselben Fräsmaschinen,
                    mit denen ein Vertragshändler arbeitet. Deshalb muss Ihr Auto nicht abgeschleppt
                    werden — gearbeitet wird in der Einfahrt, auf dem Firmenparkplatz oder am
                    Straßenrand.
                  </p>
                  <p>
                    Wo beim Händler ein Schlüssel erst auf Fahrgestellnummer bestellt wird und drei
                    bis fünf Werktage vergehen, erledigt der Partner das in den meisten Fällen am
                    selben Tag: Schlüsseldaten über die OBD-Schnittstelle aus dem Steuergerät lesen,
                    das Schlüsselblatt auf Ihr Schließsystem fräsen und den Transponder an der
                    Wegfahrsperre anlernen. Danach wird geprüft, was ein Schlüssel können muss —
                    Türen, Heckklappe, Motorstart.
                  </p>
                </div>



                {/* Abschnitt 4: Welche Marken */}
                <details style={{ margin: '2rem 0' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '1.3rem', fontWeight: 800 }}>{`Für welche Marken bieten wir ${service.title}?`}</summary>
                  <BrandsLogoGrid
                    title={isLost ? 'Ihre Marke? Wir fertigen den Schlüssel vor Ort' : `Für welche Marken bieten wir ${service.title}?`}
                    subtitle="Die Diagnosetechnik und die Lishi-Öffnungswerkzeuge unserer Partner decken die gängigen Marken auf deutschen Straßen ab — unter anderem:"
                  />
                </details>

                {/* Abschnitt 5: Wohin wir kommen */}
                <div>
                  <h2>Wo bieten wir {service.title} an?</h2>
                  <p>
                    Über ein Netzwerk selbstständiger Fachbetriebe arbeiten wir in {SITE_CONFIG.serviceAreaString}:
                  </p>
                  {/* Keine Ankunftszeit je Stadt. Auf der niederländischen Seite
                      stand city.travelTime bei 61 von 62 Einträgen auf "30-60 min" —
                      eine Konstante in den Kleidern eines Datenfelds, und für jede
                      Region außerhalb der Randstad falsch. Was wirklich gilt, hängt
                      davon ab, welcher Partner die Stadt abdeckt; das weiß nur die
                      Stadtseite, und dorthin verweist diese Liste. */}
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
                    <summary style={{ cursor: 'pointer', fontWeight: 700, margin: '0.5rem 0' }}>Alle weiteren Städte</summary>
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

                {/* Abschnitt 5.5: Ratgebertext */}
                <details className="seo-article-block" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 800 }}>Alles zu {service.title}: mobiler Service, Technik und Versicherung</summary>
                  <p>
                    Wenn Sie <strong>{service.title.toLowerCase()}</strong> brauchen, wollen Sie nicht
                    von Wartezeiten und einem Abschleppwagen abhängen. Die Partnerbetriebe unseres
                    Netzwerks kommen rund um die Uhr zu Ihrem Fahrzeug — in der Einfahrt, auf dem
                    Firmenparkplatz oder am Straßenrand. Wann genau jemand da ist, hören Sie am
                    Telefon; eine pauschale Minutenzahl nennen wir nicht, solange wir sie nicht in
                    jeder Stadt halten können.
                  </p>
                  <h3>Fahrzeugdiagnose &amp; schadenfreie Öffnung</h3>
                  <p>
                    Gearbeitet wird mit Werkstatttechnik. Zum Öffnen einer Fahrzeugtür kommen
                    Lishi-2-in-1-Decoder zum Einsatz: das Schloss wird über den Zylinder geöffnet und
                    bleibt dabei unbeschädigt — keine eingeschlagene Scheibe, kein verbogener
                    Türrahmen. Muss ein Schlüssel angelernt werden, geschieht das über die
                    OBD-Schnittstelle: Transponder oder Keyless-Go-Schlüssel werden direkt an der
                    Wegfahrsperre Ihres Fahrzeugs hinterlegt.
                  </p>
                  <h3>Günstiger als der Händler, 12 Monate Garantie</h3>
                  <p>
                    {/*
                      * Hier stand eine Preisspanne (Zweitschlüssel ab EUR 150, alle
                      * Schlüssel verloren EUR 299-500) und "50 % günstiger als der
                      * Vertragshändler". Das sind niederländische Zahlen. Für
                      * Deutschland ergibt sich der Ab-Preis aus den Sätzen der
                      * Partner plus Marge und steht in site.config.ts; bis dahin
                      * nennt dieser Absatz keine Zahl, statt eine zu erfinden, die
                      * am Fahrzeug nicht hält.
                      */}
                    Den Festpreis für Ihr Fahrzeug hören Sie am Telefon, bevor jemand losfährt — und
                    er ändert sich vor Ort nicht. Alle Beträge sind Bruttopreise inklusive 19 %
                    MwSt. Weil der Partner zu Ihnen kommt, zahlen Sie <strong>keine
                    Abschleppkosten</strong>, und auf jeden gelieferten Schlüssel sowie jedes
                    Anlernen geben wir zwölf Monate schriftliche Garantie. Die Rechnung weist die
                    MwSt. aus, sodass Sie sie bei Ihrem Versicherer einreichen können.
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
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{`Weitere ${service.faq.length - 6} Fragen`}</summary>
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
                  <p>Rufen Sie an oder schreiben Sie per WhatsApp. Wir sind rund um die Uhr erreichbar, und Sie hören den Festpreis, bevor jemand losfährt.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`svc-sidebar-${slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`svc-sidebar-${slug}-wa`}>Per WhatsApp</a>
                  <div className={styles.sideList}>
                    {['Keine Abschleppkosten', 'Festpreis vorab', 'Rechnung mit MwSt.', '12 Monate Garantie', '24/7 erreichbar'].map(item => (
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
              <h2>{service.title} nötig? Rufen Sie unseren Notdienst an</h2>
              <p>Keine Wartezeit beim Händler, keine Abschleppkosten. Unsere Partner arbeiten rund um die Uhr und kommen zu Ihrem Fahrzeug.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id={`svc-cta-${slug}-phone`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id={`svc-cta-${slug}-wa`}>Per WhatsApp</a>
              </div>
              <div className={styles.microText}>
                <span>✓ Direkter Kontakt zum Partner</span>
                <span>✓ Festpreis vorab, keine Nachforderung</span>
                <span>✓ Schadenfrei-Garantie</span>
              </div>
            </div>

            {/* ── WEITERLESEN ──────────────────────────────────────────────
                 Zeigt nichts, solange es keine deutschen Artikel gibt:
                 getRelatedBlogPosts() gibt eine leere Liste zurück und der
                 Abschnitt verschwindet. Siehe config/services.ts. */}
            {(() => {
              const relatedPosts = getRelatedBlogPosts(slug);
              if (!relatedPosts || relatedPosts.length === 0) return null;
              return (
                <section className={styles.relatedBlogsSection} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className={styles.relatedBlogsContainer} style={{ padding: 0 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                      PASSENDE RATGEBER
                    </p>
                    <h2 className={styles.relatedBlogsTitle}>
                      Artikel zu {service.title}
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
                            <span className={styles.blogPostReadTime}>{post.readTime} Lesezeit</span>
                            <span className={styles.blogPostDate}>
                              {new Date(post.publishDate).toLocaleDateString(SITE_CONFIG.locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <h3 className={styles.blogPostTitle}>{post.title}</h3>
                          <p className={styles.blogPostExcerpt}>{post.excerpt}</p>
                          <span className={styles.blogPostLink}>Artikel lesen →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ── BEWERTUNGEN ─────────────────────────────────────────── */}
            <section className={styles.reviews}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem', textAlign: 'center' }}>
                KUNDENBEWERTUNGEN
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2rem 0', textAlign: 'center' }}>
                Was Kunden über {service.title} sagen
              </h2>
              <GoogleReviewsCta limit={3} />
            </section>

            {/* ── FACHLICHER RATGEBERTEXT ── */}
            <details className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '3.5rem', background: '#ffffff', padding: '1.5rem 2.5rem', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
              <summary style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 800 }}>Fachlich zu {service.title}: Technik, Ablauf und Garantie</summary>
              <p>
                <strong>{service.title}</strong> fachgerecht auszuführen verlangt Genauigkeit,
                passendes Werkzeug und aktuelles Wissen über Fahrzeugelektronik. In modernen Pkw und
                Transportern hängt jedes Bauteil — Zündschloss, Türschloss, Funkfernbedienung,
                Transponder — am Steuergerät und damit an der Wegfahrsperre. Genau daran scheitert
                ein klassischer Schlüsseldienst: wer nur fräst, bekommt den Motor nicht gestartet.
                Die Partner von <strong>{SITE_CONFIG.name}</strong> sind dafür ausgerüstet, und zwar
                dort, wo das Fahrzeug steht.
              </p>
              <h3>Warum ein Fachbetrieb und kein Aufsperrdienst</h3>
              <p>
                Bei einer Aussperrung, einem abgebrochenen Schlüssel oder einer Störung der
                Wegfahrsperre ist der entscheidende Punkt, dass dabei kein Schaden an Lack, Tür oder
                Elektronik entsteht. Gearbeitet wird mit Lishi-2-in-1-Decodern, Diagnosegeräten für
                die jeweilige Marke und einer CNC-Fräse — nicht mit Schlagschlüssel und
                Brecheisen. Das Ergebnis ist ein Fahrzeug, das nach der Öffnung keine Reparatur
                braucht.
              </p>
              <h3>Festpreis vorab, 12 Monate Garantie</h3>
              <p>
                Der Preis wird vor der Anfahrt vereinbart, inklusive 19 % MwSt., und ändert sich am
                Fahrzeug nicht. Auf jeden gelieferten Schlüssel, jedes Ersatzteil und jede Reparatur
                geben wir zwölf Monate schriftliche Garantie. Ob Ihre Versicherung einen
                Schlüsselverlust erstattet, steht in Ihrer Police — was wir dafür liefern, ist eine
                Rechnung mit ausgewiesener MwSt. und aufgeführter Leistung, wie sie zur Einreichung
                gebraucht wird.
              </p>
            </details>

            {/* ── INTERNE VERLINKUNG ── */}
            <details className="seo-hub-box" style={{ marginTop: '4rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, fontSize: '1.15rem' }}>Weitere Leistungen und Städte</summary>
              <div className="seo-hub-grid">
                <div>
                  <div className="seo-hub-title">Andere Leistungen</div>
                  <div className="seo-hub-col">
                    {DIENSTEN.filter(s => s.slug !== service.slug && !REDIRECTED_SERVICE_SLUGS.has(s.slug)).map(s => (
                      <Link key={s.slug} href={`/leistungen/${s.slug}`} className="seo-hub-link">
                        {`${s.title} →`}
                      </Link>
                    ))}
                  </div>
                </div>
                {/*
                  * Hier stehen auf der niederländischen Seite 59 Links auf
                  * /merken/<marke>-autosleutel-bijmaken. Diese App hat keine
                  * Markenseiten (siehe BrandsLogoGrid), also wäre jeder dieser
                  * Links eine 404 — und zwar 59 davon auf jeder der 17
                  * Leistungsseiten. Die Spalte kommt zurück, sobald es
                  * /marken gibt.
                  */}
                <div>
                  <div className="seo-hub-title">{service.title} in Ihrer Stadt</div>
                  <div className="seo-hub-col">
                    <Link href="/staedte" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                      Alle Städte ansehen →
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
