import type { Metadata } from 'next';
import { ARRIVAL, ARRIVAL_TITLE } from '@/config/arrival';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import { BRANDS } from '../config/brands';
import FaqSection from '@/components/FaqSection/FaqSection';
import ServiceAreaMap from '@/components/ServiceAreaMap/ServiceAreaMap';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

import FeatureCards from '@/components/FeatureCards/FeatureCards';

import GalleryMarquee from '@/components/GallerySlider/GalleryMarquee';
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';

const TITLE = 'Autoschlüssel nachmachen oder verloren? Festpreis vorab | 24/7';
const DESCRIPTION =
  'Autoschlüssel nachmachen lassen oder alle Schlüssel verloren? Unser Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt — schadenfrei öffnen, Wegfahrsperre anlernen, Festpreis vorab inkl. MwSt.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: SITE_CONFIG.domain,
    /*
     * Nur de-DE.
     *
     * Ein hreflang-Verweis auf autosleutel24.nl wäre erst dann richtig, wenn
     * die niederländische Seite in derselben Gruppe zurückverweist — ein
     * einseitiger Verweis wird von Google ignoriert, und x-default auf eine
     * Domain zu setzen, die man von hier aus nicht mitändern kann, würde die
     * beiden Seiten gegeneinander laufen lassen. Kommt dazu, sobald beide
     * Seiten gemeinsam ausgeliefert werden.
     */
    languages: {
      'de-DE': SITE_CONFIG.domain,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_CONFIG.domain,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autoschlüssel24 — mobiler Autoschlüssel-Service' }],
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_CONFIG.domain,
    },
  ],
};

const services = [
  {
    title: 'Autoschlüssel nachmachen & Zweitschlüssel',
    desc: 'Zweitschlüssel nötig, ohne Wartezeit beim Vertragshändler und ohne Händlerpreis? Unser Partner fräst den Schlüssel vor Ort und lernt die Wegfahrsperre direkt am Fahrzeug an — rund um die Uhr, zum Festpreis.',
    href: '/leistungen/autoschluessel-nachmachen',
    src: '/images/seo/autoschluessel_nachmachen_car_keys.webp',
    alt: 'Autoschlüssel nachmachen und anlernen vor Ort — fertig, während Sie warten',
    btnText: 'Schlüssel nachmachen',
  },
  {
    title: 'Alle Autoschlüssel verloren',
    desc: 'Kein Schlüssel mehr da, oder alle gestohlen? Wir kommen zu Ihrem Fahrzeug, öffnen es schadenfrei, fräsen einen neuen Schlüssel und löschen die alten Schlüssel aus der Wegfahrsperre.',
    href: '/autoschluessel-verloren',
    src: '/images/service_verloren.webp',
    alt: 'Techniker lernt einen Autoschlüssel über die OBD-Schnittstelle am Fahrzeug an',
    btnText: 'Soforthilfe bei Verlust',
  },
  {
    title: 'Autoschlüssel reparieren & Gehäuse wechseln',
    desc: 'Gehäuse gerissen, Tasten ohne Funktion, Funkfernbedienung reagiert nicht mehr? In den meisten Fällen bleibt die Elektronik Ihres Schlüssels erhalten und nur das Gehäuse wird getauscht — vor Ort, während Sie warten.',
    href: '/leistungen/autoschluessel-reparieren',
    src: '/images/seo/autoschluessel_reparatur_hero.webp',
    alt: 'Schlüsselgehäuse wechseln und Tasten reparieren vor Ort',
    btnText: 'Mehr zur Reparatur',
  },
  {
    title: 'Funkschlüssel & Transponder anlernen',
    desc: 'Ein Rohling allein startet kein Auto. Transponder und Funkfernbedienung werden über die OBD-Schnittstelle an der Wegfahrsperre angelernt — mit derselben Technik, die die Werkstatt verwendet.',
    href: '/leistungen/transponder-anlernen',
    src: '/images/seo/autoschluessel_anlernen_vor_ort.webp',
    alt: 'Transponder und Funkschlüssel über die Fahrzeugdiagnose an der Wegfahrsperre anlernen',
    btnText: 'Anlernen erklären',
  },
  {
    title: 'Auto öffnen ohne Schlüssel — schadenfrei',
    desc: 'Schlüssel im Auto eingeschlossen, Tür zugefallen oder Batterie leer? Wir öffnen Ihre Fahrzeugtür mit Spezialwerkzeug, ohne Schaden an Scheibe, Dichtung oder Schloss.',
    href: '/leistungen/auto-oeffnen-notdienst',
    src: '/images/seo/auto_tuer_oeffnen_schluesseldienst_schadenfrei.webp',
    alt: 'Ausgeschlossen — Auto ohne Schlüssel schadenfrei öffnen',
    btnText: 'Auto öffnen lassen',
  },
  {
    title: 'Keyless Go / Smart Key',
    desc: 'Keyless Go reagiert nicht mehr, oder der Smart Key wird vom Fahrzeug nicht erkannt? Wir liefern, codieren und synchronisieren Keyless-Go-Schlüssel direkt vor Ort — auch bei FBS4 und FEM/BDC.',
    href: '/leistungen/keyless-go-schluessel',
    src: '/images/seo/smart-key-keyless-anlernen-autoschluessel24.webp',
    alt: 'Keyless Go und Smart Key anlernen und synchronisieren vor Ort',
    btnText: 'Keyless Go lösen',
  },
];

export default function HomePage() {
  return (
    <>
      <script id="home-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      <section className={styles.heroSplit}>
        <div className={styles.heroSplitInner}>
          
          <div className={styles.heroTopContent}>
            <HeroTrustBadge />
            <h1>
              Autoschlüssel verloren oder nachmachen?<br />
              {/*
                * Hier stand in der niederländischen Fassung "Binnen 30-60 Min
                * Ter Plaatse". Diese Zeile fehlt bewusst: vier Partner in vier
                * Städten tragen keine Minutenangabe. Siehe config/arrival.ts.
                */}
              <span style={{ color: 'var(--orange-500)' }}>Festpreis vorab — unser Partner kommt zu Ihnen</span>
            </h1>
            <p className={styles.heroSplitLead}>
              Ausgeschlossen oder Schlüssel weg? Der Festpreis steht <strong>vor der Anfahrt</strong> — günstiger als der Vertragshändler, ohne Abschleppkosten.
            </p>
            <HeroQuickFacts price={preisAb('transponder')} />
          </div>

          <div className={styles.heroImageContent}>
            <Image 
              src="/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp" 
              alt="Autoschlüssel-Spezialist in Arbeitskleidung am Fahrzeug, Servicefahrzeug im Hintergrund"
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto', borderRadius: '12px', objectFit: 'cover' }}
              priority
              quality={80}
              sizes="(max-width: 992px) 100vw, 50vw"
            />
            {/*
              * Kein ImageObject mit contentLocation.
              *
              * Die niederländische Fassung hängt hier GPS-Koordinaten von
              * Utrecht an das Heldenbild. Dieses Foto ist in den Niederlanden
              * entstanden, und es mit deutschen Koordinaten auszuzeichnen
              * wäre eine falsche Angabe in strukturierten Daten — genau die
              * Art Fehler, die eine neue Domain nicht gebrauchen kann. Sobald
              * ein deutscher Partner eigene Fotos liefert, kommt die
              * Auszeichnung mit seinen Koordinaten zurück.
              */}
          </div>

          <div className={styles.heroBottomContent}>
            {/* Kennzeichen zuerst: vier Schritte mit je einer Entscheidung
                statt sechs Feldern. LeadCaptureForm bleibt der Rückfall für
                jeden, der sein Kennzeichen nicht zur Hand hat. */}
            <VehicleWizard
              fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />}
            />
          </div>

        </div>
      </section>
      <VerifiedReviewBanner />


      {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '1px 0' }}>
        <FeatureCards 
          title="Nachmachen. Ersetzen. Anlernen."
          subtitle={<><span style={{ color: 'var(--orange-500)' }}>Autoschlüssel24</span> erledigt alles dort, wo Ihr Fahrzeug steht.</>}
          features={[
            {
              id: 'feature-0',
              icon: <Image src="/images/icon_key_red.jpg" alt="Autoschlüssel nachmachen" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Autoschlüssel nachmachen',
              description: 'Neuer Autoschlüssel vor Ort — gefräst, angelernt und geprüft, bevor der Partner wieder losfährt.',
              linkText: 'Mehr zum Nachmachen',
              linkUrl: '/leistungen/autoschluessel-nachmachen'
            },
            {
              id: 'feature-1',
              icon: <Image src="/images/icon_van.webp" alt="Autoschlüssel verloren? Soforthilfe" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Autoschlüssel verloren? Soforthilfe',
              description: 'Wir kommen zu Ihrem Fahrzeug — für die Reparatur oder für einen komplett neuen Schlüssel.',
              linkText: 'Mehr zum mobilen Service',
              linkUrl: '/leistungen'
            },
            {
              id: 'feature-2',
              icon: <Image src="/images/icon_map.webp" alt="Auto zu? Schadenfrei öffnen" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Auto zu? Schadenfrei öffnen',
              description: 'Spezialwerkzeug statt Glasbruch: Tür, Heckklappe und Zündschloss bleiben unbeschädigt.',
              linkText: 'Auto öffnen lassen',
              linkUrl: '/leistungen/auto-oeffnen-notdienst'
            },
            {
              id: 'feature-3',
              icon: <Image src="/images/icon_price.webp" alt="Festpreis vorab" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Festpreis vorab',
              description: 'Keine Überraschung hinterher. Sie hören den Preis inkl. 19 % MwSt., bevor jemand losfährt.',
              linkText: 'Preise ansehen',
              linkUrl: '/preise'
            },
            {
              id: 'feature-4',
              icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: '12 Monate Garantie',
              description: 'Auf jeden gelieferten Schlüssel und jedes Anlernen — schriftlich, zwölf Monate.',
              linkText: 'Wo wir arbeiten',
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
      </div>

      {/* ===== E-E-A-T: WER HINTER DEM NETZWERK STEHT ===== */}
      {/*
        * Dieser Abschnitt sagt bewusst nicht, dass hier ein deutscher
        * Chef-Techniker ans Telefon geht.
        *
        * In der niederländischen Fassung stellt sich an dieser Stelle Berkan
        * Acarol als "Gecertificeerd Hoofdtechnicus" vor, der jeden Anruf
        * persönlich annimmt. Das ist dort wahr und hier nicht: in Deutschland
        * fährt ein selbstständiger Partnerbetrieb zum Fahrzeug. Denselben Text
        * zu übersetzen, hieße dem Kunden zu sagen, es komme jemand, der nicht
        * kommt — und das ist genau die Zusage, an der ein Schlüsseldienst
        * gemessen wird.
        *
        * Was stattdessen hier steht, ist nachprüfbar: wer das Netzwerk
        * aufgebaut hat, mit welcher Technik gearbeitet wird, und wer vor Ort
        * tatsächlich auftaucht.
        */}
      <section style={{ padding: '4rem 0', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            <div>
              <p className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>WER HINTER AUTOSCHLÜSSEL24 STEHT</p>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                Ein Netzwerk, kein Callcenter
              </h2>
              <p style={{ fontWeight: 600, color: 'var(--orange-700)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Gegründet von Berkan Acarol — Autoschlüssel-Techniker seit über zehn Jahren
              </p>
              <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.92rem' }}>
                Autoschlüssel24 ist aus einer Werkstatt entstanden, nicht aus einem
                Vermittlungsportal. Wer bei uns anruft, spricht mit jemandem, der weiß, was
                FBS4, FEM/BDC und ein gesperrtes Steuergerät bedeuten — und der deshalb am
                Telefon einen Festpreis nennen kann, statt vor Ort nachzurechnen. Zu Ihrem
                Fahrzeug fährt der selbstständige Partnerbetrieb Ihrer Stadt, mit eigener
                Diagnosetechnik und eigenem Schlüssellager. Wen wir aufnehmen, entscheidet
                die Werkstatt: eigene Diagnosegeräte, Nachweis der Arbeit und ein Preis, der
                vorher hält.
              </p>
              <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Werkstatttechnik:</strong> Autel IM608 Pro II, AVDI Abrites, Lonsdor K518, VVDI.</span>
                </li>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Alle Marken:</strong> vom Transponderschlüssel bis zum Keyless-Go-System.</span>
                </li>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Festpreis vorab:</strong> der Preis am Telefon ist der Preis auf der Rechnung, inkl. MwSt.</span>
                </li>
              </ul>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id="meet-owner-phone">
                  📞 Jetzt anrufen: {SITE_CONFIG.phone}
                </a>
                <Link href="/ueber-uns" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Mehr über uns →
                </Link>
              </div>
            </div>
            <div>
              <img
                src="/images/team/berkan-acarol-autoschluessel-spezialist.webp"
                alt="Berkan Acarol — Gründer von Autoschlüssel24"
                style={{
                  width: '100%',
                  maxWidth: '340px',
                  height: '220px',
                  objectFit: 'cover',
                  objectPosition: 'top',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  display: 'block'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorks />

      {/* ===== SERVICES ===== */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className="section-eyebrow">UNSERE LEISTUNGEN</p>
            <h2 className="section-title">Alles rund um Ihren Autoschlüssel — vor Ort erledigt</h2>
            <p className="section-lead">Gefräst und angelernt dort, wo Ihr Fahrzeug steht, in der mobilen Werkstatt des Partners. Keine versteckten Kosten, der Festpreis steht vorher.</p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((s, i) => (
              <article key={i} className={styles.serviceCard} id={`svc-${i}`}>
                <Link href={s.href} className={styles.serviceImgLink} aria-label={s.title}>
                  <div className={styles.serviceImgBox}>
                    <Image
                      src={s.src}
                      alt={s.alt}
                      width={400}
                      height={225}
                      className={styles.serviceImg}
                    />
                  </div>
                </Link>
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>
                    <Link href={s.href} className={styles.serviceTitleLink}>{s.title}</Link>
                  </h3>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                  <Link href={s.href} className={styles.serviceActionBtn}>
                    {s.btnText}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.servicesCta} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/*
              * In der niederländischen Fassung steht hier "Autosleutel
              * bestellen op kenteken": man gibt das Kennzeichen ein, das RDW
              * gibt Marke, Modell und Baujahr zurück, und daraus folgt der
              * Schlüssel. Ein öffentliches Fahrzeugregister dieser Art gibt es
              * in Deutschland nicht — das Kraftfahrt-Bundesamt gibt
              * Halterdaten nicht an Dritte heraus. Darum führt die Schaltfläche
              * hier auf die Leistung selbst, und das Kennzeichen wird im
              * Formular als Text aufgenommen (siehe VehicleWizard).
              */}
            <Link href="/leistungen/autoschluessel-nachmachen" className="btn btn-green">Autoschlüssel nachmachen lassen</Link>
            <Link href="/leistungen" className="btn btn-navy">Alle Leistungen ansehen</Link>
          </div>
        </div>
      </section>

      {/* ===== BRANDS (VISUAL LOGO GRID) ===== */}
      <section className={styles.brandsSection}>
        <div className="container">
        {/* ---- BRANDS SEO SECTION ---- */}
        <BrandsLogoGrid />
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        {/* The band is full width by design — the photos run off both edges of
            the screen, and they get that from the section's own width rather
            than a 100vw hack that overshoots by the scrollbar. The supporting
            copy stays in .container underneath it. */}
        <GalleryMarquee
          images={REAL_GALLERY_PROJECTS.map(p => ({
            src: p.src,
            caption: p.alt,
            width: p.width,
            height: p.height,
          }))}
          title="Schlüssel, die wir gemacht haben"
          subtitle="Jeden Tag am Fahrzeug — vom Zweitschlüssel bis zum kompletten Schlüsselverlust."
        />
        <div className="container">
          <p className="section-lead" style={{ maxWidth: 880, margin: '2.5rem auto 0', lineHeight: '1.75', fontSize: '0.98rem', color: 'var(--gray-600)' }}>
            Oben sehen Sie Aufträge aus dem Netzwerk: gefräste und angelernte Schlüssel,
            schadenfrei geöffnete Fahrzeuge, getauschte Gehäuse. Dieselbe Arbeit erledigen
            unsere Partner in <Link href="/staedte/berlin" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Berlin</Link>, <Link href="/staedte/hamburg" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Hamburg</Link>, <Link href="/staedte/muenchen" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>München</Link> und <Link href="/staedte/frankfurt" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Frankfurt am Main</Link> —
            mit eigener Fahrzeugdiagnose, eigenem Schlüssellager und einem Festpreis, der vor
            der Anfahrt steht. Ob Zweitschlüssel, Keyless-Go-System oder ein Fahrzeug, zu dem
            kein Schlüssel mehr existiert: die Wegfahrsperre wird über die OBD-Schnittstelle
            am Fahrzeug angelernt, mit derselben Technik wie in der Werkstatt. Damit entfallen
            Abschleppkosten und Tage Wartezeit beim Vertragshändler.
            {/*
              * Diese Fotos sind in den Niederlanden entstanden — die Arbeit ist
              * identisch, die Städte sind es nicht. Deshalb nennt der Text
              * keine Stadt zum Bild und behauptet nicht, das Foto sei in Berlin
              * gemacht. Sobald die deutschen Partner eigene Fotos liefern,
              * gehören sie hierher; siehe config/gallery.ts.
              */}
          </p>
        </div>
      </section>

      {/* ===== SERVICE AREA — Interactive SVG Map ===== */}
      <section className={styles.serviceAreaSection}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <p className="section-eyebrow">EINSATZGEBIET</p>
            <h2 className="section-title">Wohin wir kommen</h2>
            <p className="section-lead">Unser Partner kommt {ARRIVAL} zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt am Main. Wählen Sie Ihre Region.</p>
          </div>
          <ServiceAreaMap />
        </div>
      </section>

      {/* ===== VERGLEICH ===== */}
      <section className={styles.compare}>
        <div className="container">
          <div className={styles.compareGrid}>
            <div>
              <p className="section-eyebrow">WARUM WIR?</p>
              {/*
                * Die niederländische Überschrift lautet "Bespaar 30-50% vs
                * Dealer" und die Tabelle nennt dort EUR 300-900 beim Händler
                * gegen EUR 150-500 bei uns. Diese Zahlen stammen aus Jahren
                * niederländischer Aufträge. Für Deutschland gibt es sie noch
                * nicht: der Ab-Preis ergibt sich erst aus den Sätzen der vier
                * Partner plus Marge (siehe site.config.ts). Eine erfundene
                * Ersparnis in Prozent wäre eine Preisangabe, die niemand
                * halten kann — in Deutschland zusätzlich ein Fall für § 5 UWG.
                *
                * Darum steht hier, was ohne Zahl wahr ist, und die Preise
                * stehen auf /preise, sobald sie feststehen.
                */}
              <h2 className="section-title">Günstiger als der Vertragshändler — und ohne Abschleppen</h2>
              <p>Werkstatttechnik, Festpreis vorab, am selben Tag. Unser Partner kommt zu Ihrem Fahrzeug.</p>
              <ul className={styles.checkList}>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Festpreis vor der Anfahrt, inkl. 19 % MwSt.</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Keine Abschleppkosten — wir kommen zum Fahrzeug</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Am selben Tag, auch am Wochenende</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Werkstatttechnik: Autel, VVDI, AVDI, ACDP</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> 12 Monate Garantie auf Schlüssel und Anlernen</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Rechnung mit MwSt., für die Versicherung verwendbar</li>
              </ul>
              <Link href="/leistungen/autoschluessel-nachmachen" className="btn btn-primary btn-lg">Autoschlüssel nachmachen</Link>
            </div>
            <div className={styles.compareTableWrap}>
              <table className="price-table">
                <thead>
                  <tr><th>Vergleich</th><th>Vertragshändler</th><th>Wir ✓</th></tr>
                </thead>
                <tbody>
                  <tr><td>Preis</td><td>Kostenvoranschlag nach Termin</td><td><strong>Festpreis am Telefon</strong></td></tr>
                  <tr><td>Wartezeit</td><td>Schlüssel wird bestellt</td><td><strong>Am selben Tag</strong></td></tr>
                  <tr><td>Abschleppen</td><td>Nötig, wenn kein Schlüssel da ist</td><td><strong>Entfällt</strong></td></tr>
                  <tr><td>Ort</td><td>Sie fahren hin</td><td><strong>Wir kommen</strong></td></tr>
                  <tr><td>Erreichbarkeit</td><td>Mo–Fr zu Öffnungszeiten</td><td><strong>24/7</strong></td></tr>
                  <tr><td>Garantie</td><td>Ja</td><td><strong>12 Monate, schriftlich</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className={styles.reviews}>
        <div className="container">
          <p className="section-eyebrow">KUNDENBEWERTUNGEN</p>
          <h2 className="section-title">Was unsere Kunden sagen</h2>
          <GoogleReviewsCta />
        </div>
      </section>

      {/* ── RATGEBERTEXT DER STARTSEITE ── */}
      <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
        <div className="container">
          <div className="seo-article-block" style={{ marginTop: 0 }}>
            <h2>Autoschlüssel nachmachen lassen — vor Ort statt beim Vertragshändler</h2>
            <p>
              Sie brauchen einen neuen Autoschlüssel, oder einen <strong>Zweitschlüssel</strong>,
              damit nicht alles an einem einzigen hängt? Bei <strong>{SITE_CONFIG.name}</strong> bekommen
              Sie beides dort, wo Ihr Fahrzeug steht. Unsere Partner fertigen Schlüssel für
              <strong> nahezu alle Marken und Modelle</strong> — vom einfachen Transponderschlüssel
              bis zum Keyless-Go-Schlüssel mit Komfortzugang.
            </p>
            <p>
              Gearbeitet wird vor Ort: in <strong>Berlin</strong>, <strong>Hamburg</strong>,
              <strong> München</strong> und <strong>Frankfurt am Main</strong>. Sie nennen uns Marke,
              Modell, Baujahr und Schlüsselart, wir nennen Ihnen den Festpreis und ein ehrliches
              Zeitfenster — erst dann fährt jemand los. Steht Ihr Fahrzeug in einer Tiefgarage
              oder am Straßenrand: das ist der Normalfall, nicht die Ausnahme.
            </p>

            <h3>Funkschlüssel und Keyless Go nachmachen lassen</h3>
            <p>
              Moderne Fahrzeuge fahren nicht mehr mit einem reinen Metallschlüssel. Sie brauchen
              einen <strong>Funkschlüssel</strong>, einen Klappschlüssel oder einen
              <strong> Keyless-Go-Schlüssel</strong>, und in allen drei Fällen genügt ein gefräster
              Rohling nicht: der Transponder muss an der <strong>Wegfahrsperre</strong> angelernt
              werden, sonst dreht der Schlüssel das Schloss, startet aber den Motor nicht. Genau
              das erledigen unsere Partner über die OBD-Schnittstelle am Fahrzeug — auch bei
              Mercedes FBS4 und BMW FEM/BDC, wo das Steuergerät ausgelesen werden muss.
            </p>

            <h3>Autoschlüssel gestohlen? Alte Schlüssel müssen gelöscht werden</h3>
            <p>
              Ist Ihr <strong>Autoschlüssel gestohlen</strong> worden, reicht ein neuer Schlüssel
              nicht aus: solange der alte in der Wegfahrsperre hinterlegt bleibt, startet er Ihr
              Fahrzeug weiter. Wir legen einen neuen Schlüssel an und <strong>löschen die alten
              Schlüsseldaten aus dem Steuergerät</strong>, sodass niemand sonst mehr fahren kann.
              Das ist ein Notfall, und dafür sind wir rund um die Uhr erreichbar. Für die Anzeige
              und für Ihre Versicherung erhalten Sie eine Rechnung mit ausgewiesener MwSt.
            </p>

            <h3>Festpreis vorab, 12 Monate Garantie</h3>
            <p>
              Weil unsere Partner zum Fahrzeug fahren, entfallen Abschleppkosten und die Tage, die
              ein bestellter Schlüssel beim Händler braucht. Alle Preise auf dieser Seite sind
              Bruttopreise <strong>inklusive 19 % Mehrwertsteuer</strong> — so wie es die
              Preisangabenverordnung gegenüber Verbrauchern verlangt, und so wie es auf der
              Rechnung steht. Auf jeden gelieferten Schlüssel und jedes Anlernen geben wir
              <strong> 12 Monate schriftliche Garantie</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <FaqSection />

    </main>
    </>
  );
}
