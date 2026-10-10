import type { Metadata } from 'next';
import { clampMeta } from '@/lib/meta';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { CITIES } from '@/config/cities';
import { isNoindexCity } from '@/config/thinPages';
import { ARRIVAL, ARRIVAL_TITLE } from '@/config/arrival';
import { SERVICE_REGIONS } from '@/config/regions';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseAuthConfigured } from '@/lib/supabase/env';
import { findCityTechnician, arrivalWindow, type PublicTechnician } from '@/lib/cityTechnician';
import { preisAb } from '@/config/leistungen';
const BrandsLogoGrid = dynamic(() => import('@/components/BrandsLogoGrid/BrandsLogoGrid'));
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
const GallerySlider = dynamic(() => import('@/components/GallerySlider/GallerySlider'));
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import CitySeoText from '@/components/CitySeoText/CitySeoText';
import FeatureCards from '@/components/FeatureCards/FeatureCards';
import styles from './page.module.css';
import { getFaqForCity } from '@/config/faq';
import FaqSection from '@/components/FaqSection/FaqSection';

/*
 * Zusätzlicher Langtext für einzelne Städte.
 *
 * Auf der niederländischen Seite haben Utrecht, Amsterdam, Den Haag und
 * Rotterdam je einen eigenen, handgeschriebenen Abschnitt. Für Berlin, Hamburg,
 * München und Frankfurt gibt es den noch nicht — und ein übersetzter Text über
 * Utrechter Parkhäuser wäre schlechter als keiner. Die Städte bekommen ihn
 * einzeln, nach demselben Muster: eine Datei je Stadt, hier eingetragen.
 *
 * Solange eine Stadt hier fehlt, rendert der Abschnitt nicht. Das ist der
 * gewünschte Zustand, nicht eine Lücke.
 */
const SeoComponents: Record<string, React.FC> = {};

import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { getBaseLocalBusinessSchema } from '@/utils/schema';

// Haversine distance formula
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/*
 * Partner rosters change when someone joins, leaves or takes on a region —
 * rarely, but not never, and not on a deploy schedule. An hour keeps a page
 * from naming someone who left this morning without rebuilding 62 pages on
 * every request.
 */
export const revalidate = 3600;

/**
 * The technicians a public page may name.
 *
 * Reads public_technicians (0058_technician_public_profile.sql), a view that
 * exposes ten columns and rounds the base coordinate to about a kilometre —
 * not the `technicians` table, which carries iban, kvk and a telegram id and
 * is granted to `authenticated` only. A marketing page should not hold a key
 * that can read any of that.
 *
 * Returns [] rather than throwing: a deployment without Supabase credentials,
 * or a Supabase that is down mid-build, must still produce a city page. The
 * page degrades to naming nobody, which is the honest failure — the previous
 * behaviour was to name the same person everywhere, which is the other kind.
 */
/*
 * Hier stand localTechnicianPhoto(): eine Hilfsfunktion, die das Foto eines
 * Technikers aus dem Vercel-Blob-Store auf eine eigene URL umschrieb, damit
 * die Partnerkarte ein Gesicht zeigen konnte.
 *
 * Sie ist entfernt, weil diese Seite keinen Partner namentlich nennt und
 * deshalb auch kein Partnerfoto zeigt (siehe die Partnerkarte weiter unten).
 * Die Technikerdaten werden weiter geladen, aber nur für das Zeitfenster:
 * arrivalWindow() braucht die Entfernung, nicht das Foto.
 */

async function loadPublicTechnicians(): Promise<PublicTechnician[]> {
  if (!supabaseAuthConfigured()) return [];
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('public_technicians')
      .select('id, name, werkgebied, base_lat, base_lng, base_city, certifications, gbp_url, photo_url');
    if (error) throw error;
    /* The view already filters to active; the flag is what findCityTechnician
       reads, so it is set rather than selected. */
    return (data ?? []).map((t) => ({ ...t, active: true })) as PublicTechnician[];
  } catch (err) {
    console.warn('[steden] could not load technicians, pages will name nobody:', err);
    return [];
  }
}

export async function generateStaticParams() {
  return CITIES.map(c => ({ citySlug: c.slug }));
}

/*
 * Rund 60 Zeichen zeigt Google, danach wird abgeschnitten. Die vier deutschen
 * Städte sind kurz, aber "Frankfurt am Main" sprengt die erste Form — darum
 * gibt es eine zweite, und die Reihenfolge entscheidet, welche genommen wird.
 *
 * Was hier NICHT steht, ist eine Minutenangabe. Die niederländische Fassung
 * hatte sie im Titel jeder Stadtseite, auch für Maastricht, 210 km von der
 * Werkstatt; sie wurde entfernt, weil sie unwahr war. Sie in einer deutschen
 * Variante neu zu tippen, wäre derselbe Fehler mit anderer Flagge.
 */
function cityTitle(name: string): string {
  const candidates = [
    `Autoschlüssel nachmachen ${name} | ${ARRIVAL_TITLE}`,
    `Autoschlüssel nachmachen ${name} | 24/7`,
    `Autoschlüssel ${name} | vor Ort`,
  ];
  return candidates.find((t) => t.length <= 60) ?? candidates[candidates.length - 1];
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string }> }): Promise<Metadata> {
  const { citySlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) return {};
  const pageUrl = `${SITE_CONFIG.domain}/staedte/${citySlug}`;
  return {
    /*
     * "nachmachen", nicht "kopieren".
     *
     * Beides steht in den deutschen Wörterbüchern, gesucht wird aber das
     * erste: "autoschlüssel nachmachen" ist der Begriff, unter dem in
     * Deutschland Preise, Vergleiche und Ratgeber zu dieser Arbeit erscheinen,
     * "kopieren" bringt vor allem Ergebnisse zu Haustürschlüsseln. Die
     * Begründung je Begriff steht in config/keywords.ts.
     *
     * Was auf der niederländischen Seite hier mitläuft und hier fehlt: die
     * Ankunftszeit. Sie stand dort in der Beschreibung jeder Stadtseite — dem
     * meistgelesenen Satz der Seite — und war für die entfernten Städte
     * unwahr. Vier deutsche Partner tragen sie noch nicht.
     */
    title: {
      absolute: city.customMetaTitle || cityTitle(city.city),
    },
    ...(isNoindexCity(citySlug) && { robots: { index: false, follow: true } }),
    description: clampMeta(
      city.customMetaDesc ||
        `Autoschlüssel nachmachen lassen in ${city.city}? Unser Partner kommt zu Ihrem Fahrzeug, Tag und Nacht. Festpreis vorab, inkl. MwSt.`
    ),
    /*
     * Canonical only, no alternates.
     *
     * Eine hreflang-Gruppe ist für eine Seite in mehreren Sprachen, und eine
     * Stadtseite ist das nicht: /staedte/berlin und /staedte/hamburg sind zwei
     * verschiedene Städte, keine Übersetzungen voneinander. Die
     * niederländische Fassung trug hier einmal sich selbst als 'nl-NL' und
     * 'x-default' ein, was nichts aussagte. Zu vermeiden ist, Berlin an
     * Utrecht zu hängen, nur weil beide "die Stadtseite" sind.
     */
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      /* A page-level openGraph block replaces the root layout's rather than
         merging into it, so without this the city pages were the only pages on
         the site shipping no og:locale at all. */
      locale: SITE_CONFIG.ogLocale,
      url: pageUrl,
      title: city.customMetaTitle || cityTitle(city.city),
      description: `Autoschlüssel nachmachen lassen in ${city.city}? Unser Partner kommt zu Ihrem Fahrzeug, Tag und Nacht. Telefon: ${SITE_CONFIG.phone}`,
    },
    other: {
      'geo.region': SITE_CONFIG.geoRegion,
      'geo.placename': `${city.city}, ${SITE_CONFIG.countryName}`,
      'geo.position': `${city.geo.lat};${city.geo.lng}`,
      'ICBM': `${city.geo.lat}, ${city.geo.lng}`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) notFound();
  const pageUrl = `${SITE_CONFIG.domain}/staedte/${citySlug}`;

  /* Who actually covers this city, and how far away they really are. Null
     only when the roster could not be read at all. */
  const match = findCityTechnician(city, await loadPublicTechnicians());
  const arrival = arrivalWindow(match?.distanceKm ?? null);
  /*
   * Every arrival claim on this page reads from these two, and both collapse
   * to a promise with no number in it when the distance is unknown. The old
   * `city.travelTime` said "30-60 min" on 61 of 62 records, which made it a
   * constant wearing a data field's clothes — and made it wrong for every
   * region further out than the Randstad.
   */
  const arrivalText = arrival ?? ARRIVAL;
  const arrivalPhrase = arrival ? `im Schnitt in ${arrival}` : ARRIVAL;

  // Find 3 geographically closest cities
  const closestCities = CITIES
    .filter(c => c.slug !== citySlug && c.geo && city.geo)
    .map(c => ({
      ...c,
      distance: getDistanceFromLatLonInKm(
        parseFloat(city.geo.lat), parseFloat(city.geo.lng),
        parseFloat(c.geo.lat), parseFloat(c.geo.lng)
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  /*
   * What this page is: a service offered in this city by the one business.
   *
   * It was a full Locksmith record per city -- 62 "#locksmith" nodes, each a
   * complete copy of the business with its own areaServed -- which tells a crawler
   * there are 62 businesses. The business is described once, in the root layout,
   * under BIZ_ID; this node says "that business serves this city" and nothing more.
   * No local address is claimed: there is no branch here, and areaServed is the
   * honest way to say where the van goes.
   */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.domain}/staedte/${citySlug}#service`,
    name: `Autoschlüssel nachmachen und Notdienst in ${city.city}`,
    serviceType: 'Autoschlüssel nachmachen, Autoschlüssel verloren, Auto öffnen',
    url: `${SITE_CONFIG.domain}/staedte/${citySlug}`,
    provider: getBaseLocalBusinessSchema(),
    areaServed: {
      '@type': 'City',
      name: city.city,
      containedInPlace: { '@type': 'AdministrativeArea', name: city.region },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Städte', item: `${SITE_CONFIG.domain}/staedte` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `${SITE_CONFIG.domain}/staedte/${citySlug}` },
    ],
  };

  const cityFaqs = getFaqForCity(city.city, arrival);
  const mappedFaqs = cityFaqs.map(f => ({ question: f.q, answer: f.a }));

  // Generate deterministic E-E-A-T local data
  const area1 = city.subAreas && city.subAreas.length > 0 ? city.subAreas[0] : `${city.city} Centrum`;
  const area2 = city.subAreas && city.subAreas.length > 1 ? city.subAreas[1] : `Umgebung ${city.city}`;

  /*
   * Ein eigenes Heldenfoto je Stadt, wenn es eines gibt.
   *
   * Heute gibt es keines: die niederländischen Stadtfotos sind in
   * niederländischen Städten entstanden und wurden deshalb nicht übernommen.
   * Die Prüfung bleibt, weil sie die Stelle ist, an der ein Partnerfoto aus
   * Berlin oder Hamburg ohne Codeänderung erscheint — Datei ablegen, fertig.
   */
  const imagePathWebp = path.join(process.cwd(), 'public', 'images', `autoschluessel-nachmachen-${citySlug}.webp`);
  const imagePathPng = path.join(process.cwd(), 'public', 'images', `autoschluessel-nachmachen-${citySlug}.png`);
  const imagePathJpg = path.join(process.cwd(), 'public', 'images', `autoschluessel-nachmachen-${citySlug}.jpg`);
  
  let hasHeroImage = false;
  let heroImageExt = '.webp';
  
  if (fs.existsSync(imagePathWebp)) {
    hasHeroImage = true;
    heroImageExt = '.webp';
  } else if (fs.existsSync(imagePathPng)) {
    hasHeroImage = true;
    heroImageExt = '.png';
  } else if (fs.existsSync(imagePathJpg)) {
    hasHeroImage = true;
    heroImageExt = '.jpg';
  }

  return (
    <>
      <script id={`city-schema-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script id={`city-breadcrumb-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        {hasHeroImage ? (
          <section className={styles.heroUtrecht}>
            <div className={styles.heroUtrechtInner}>
              <div className={styles.heroTopContent}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                  <Link href="/" style={{ color: 'var(--gray-500)' }}>Home</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <Link href="/staedte" style={{ color: 'var(--gray-500)' }}>Städte</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <span style={{ color: 'var(--navy-900)' }}>{city.city}</span>
                </nav>
                <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                  <HeroTrustBadge />
                </div>
                <h1>
                  {city.customH1 ? (
                    city.customH1
                  ) : (
                    <>Autoschlüssel nachmachen in {city.city} — <span style={{ color: 'var(--orange-500)' }}>24/7 Notdienst vor Ort</span></>
                  )}
                </h1>
                <p className={styles.heroUtrechtLead}>
                  Unser Partner ist {arrival ? <>im Schnitt in <strong>{arrival}</strong></> : <><strong>{ARRIVAL}</strong></>} bei Ihnen in {city.city}.
                  Alle Marken, Wegfahrsperre vor Ort angelernt.
                </p>
              </div>

              <div className={styles.heroImageContent}>
                <Image 
                  src={`/images/autoschluessel-nachmachen-${city.slug}${heroImageExt}`}
                  alt={`Autoschlüssel nachmachen in ${city.city} — Service vor Ort, rund um die Uhr`}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                  priority
                  fetchPriority="high"
                />
              </div>

              <div className={styles.heroBottomContent}>
                <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} theme="light" />
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span> <Link href="/staedte">Städte</Link> <span>/</span> <span>{city.city}</span>
              </nav>
              <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                <HeroTrustBadge />
              </div>
              <h1>{city.customH1 || `Autoschlüssel nachmachen in ${city.city} — 24/7 Notdienst vor Ort`}</h1>
              <p className={styles.heroLead}>
                Unser Partner ist {arrival ? <>im Schnitt in <strong>{arrival}</strong></> : <><strong>{ARRIVAL}</strong></>} bei Ihnen in {city.city}.
                Alle Marken, Wegfahrsperre vor Ort angelernt.
              </p>
              <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} />
            </div>
          </section>
        )}

        {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#f3f4f6', padding: '1px 0' }}>
          <FeatureCards 
            cardTitleAs="h2"
            videoHeading={`Autoschlüssel nachmachen in ${city.city}: in 40 Sekunden erklärt`}
            features={[
              {
                id: 'feature-1',
                icon: <Image src="/images/icon_van.webp" alt="Mobiler Service" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '24/7 mobiler Schlüsseldienst',
                description: `Unser Partner in ${city.city} fährt mit eigener Diagnosetechnik und eigenem Schlüssellager zu Ihrem Fahrzeug — ohne Abschleppen und ohne Termin beim Händler.`,
                linkText: 'Mehr zum mobilen Service',
                linkUrl: '/leistungen'
              },
              {
                id: 'feature-2',
                icon: <Image src="/images/icon_map.webp" alt="Einsatzgebiet" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: `Vor Ort in ${city.city}`,
                description: `Gearbeitet wird in ${area1}, ${area2} und im übrigen ${city.city}. Rufen Sie an, und Sie hören sofort, wann der Partner bei Ihnen sein kann.`,
                linkText: 'Jetzt anrufen',
                linkUrl: `tel:${SITE_CONFIG.phoneTel}`
              },
              {
                id: 'feature-3',
                icon: <Image src="/images/icon_price.webp" alt="Festpreis" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Festpreis vorab',
                description: `Sie hören den Preis für den Auftrag in ${city.city} am Telefon, inklusive 19 % MwSt. Keine Anfahrtspauschale, keine Nachforderung vor Ort.`,
                linkText: 'Preise ansehen',
                linkUrl: '/preise'
              },
              {
                id: 'feature-4',
                icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '12 Monate Garantie',
                description: 'Auf jeden gelieferten Schlüssel und jedes Anlernen geben wir zwölf Monate schriftliche Garantie.',
                linkText: 'Wo wir arbeiten',
                linkUrl: '/staedte'
              },
              {
                id: 'feature-5',
                icon: <Image src="/images/icon_insurance.webp" alt="Rechnung für die Versicherung" width={90} height={90} style={{ borderRadius: '12px' }} />,
                /*
                 * Hier stand "U bent 100% verzekerd. We werken samen met alle
                 * grote verzekeraars." Eine Zusammenarbeit mit deutschen
                 * Versicherern gibt es nicht, und ob ein Schlüsselverlust
                 * gedeckt ist, steht in der Police des Kunden — nicht in
                 * unserer Hand. Was wir zusagen können, ist die Rechnung, mit
                 * der er es bei seinem Versicherer einreichen kann.
                 */
                title: 'Rechnung für die Versicherung',
                description: 'Sie erhalten eine Rechnung mit ausgewiesener MwSt. und aufgeführter Leistung — so, wie Ihr Versicherer sie zur Erstattung braucht.',
                linkText: 'Preise ansehen',
                linkUrl: '/preise'
              }
            ]}
          />
        </div>
        
        {/* ── BRANDS MARQUEE ──────────────────────────────────────── */}
        <BrandsMarquee />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <HowItWorks cityName={city.city} />


        {/* ── PARTNERKARTE ────────────────────────────────────────────
            Kein Name, kein Gesicht — mit Absicht.

            Auf der niederländischen Seite steht an dieser Stelle Berkan
            Acarol als "Gecertificeerd Hoofdtechnicus", der jedes
            Schlüsselproblem der Stadt persönlich löst. Das ist dort wahr und
            hier nicht: in dieser Stadt fährt ein selbstständiger
            Partnerbetrieb. Diesen Text zu übersetzen hieße, einen Techniker
            anzukündigen, der nicht kommt.

            Den Partner stattdessen namentlich zu nennen, wäre eine
            Co-Branding-Zusage, die mit den vier Betrieben nicht vereinbart
            ist — dieselbe Entscheidung, die auf der niederländischen Seite
            schon einmal getroffen und zurückgenommen wurde. Die Zuordnung
            Stadt → Partner liegt weiter in src/lib/cityTechnician.ts und
            steuert die Auftragsvergabe; sie setzt nur keinen Namen auf eine
            öffentliche Seite.

            Was hier steht, ist nachprüfbar: welche Technik verwendet wird und
            was der Preis bedeutet. */}
        <section style={{ padding: '2.5rem 0', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <p className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>IHR PARTNERBETRIEB IN {city.city.toUpperCase()}</p>
                <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>Werkstatttechnik, kein Aufsperrdienst</h2>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Zu Ihrem Fahrzeug in {city.city} kommt ein selbstständiger Fachbetrieb
                  unseres Netzwerks — mit Autel IM608 Pro&nbsp;II und AVDI Abrites, also
                  derselben Diagnosetechnik, die der Vertragshändler einsetzt, aber ohne
                  Wartezeit und ohne Händleraufschlag.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Autel IM608 Pro II &amp; AVDI Abrites</strong> — Werkstatttechnik, nicht Schlagschlüssel</span></li>
                  <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Schadenfrei öffnen</strong> — 12 Monate Garantie auf Schlüssel und Anlernen</span></li>
                  <li style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Festpreis vorab</strong> — inkl. 19 % MwSt., keine Nachforderung</span></li>
                </ul>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id={`city-phone-${city.slug}`}>📞 Jetzt anrufen: {SITE_CONFIG.phone}</a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Image
                  src="/images/seo/professionelle_diagnose_geraete.webp"
                  alt="Fahrzeugdiagnose zum Anlernen der Wegfahrsperre"
                  width={300}
                  height={200}
                  style={{ width: '100%', maxWidth: '300px', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/*
          * Hier stehen auf der niederländischen Seite die Fachartikel zu den
          * Marken, die in dieser Stadt häufig sind — BMW BDC2, VAG SFD, Ghost
          * gegen Relay-Diebstahl. Dieser Block ist entfernt, nicht übersetzt:
          * die Artikel liegen unter /blog, diese App hat weder die Route noch
          * deutsche Fassungen (siehe config/deepDives.ts). Ein Abschnitt, der
          * auf drei 404-Seiten zeigt, nützt niemandem.
          *
          * Sobald es deutsche Artikel gibt, kommt er zurück: DEEP_DIVE füllen,
          * app/blog anlegen, Block wieder einsetzen.
          */}

        {/* Lokaler Kontext — die Angaben aus cities.ts, die es auf der
            niederländischen Seite lange in die Daten, aber nie auf die Seite
            geschafft haben. */}
        {(city.localFact || city.commonJob) && (
          <section style={{ padding: '3rem 0', background: '#fff' }}>
            <div className="container" style={{ maxWidth: '760px', margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1rem' }}>
                Autoschlüssel-Service in {city.city}
              </h2>
              {city.localFact && (
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: city.commonJob ? '1rem' : 0 }}>
                  {city.localFact}
                </p>
              )}
              {city.commonJob && (
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  <strong>Häufigster Auftrag in {city.city}:</strong> {city.commonJob}
                  {city.avgJobDuration && <> — durchschnittliche Dauer vor Ort: {city.avgJobDuration}.</>}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Galerie — höchstens drei Bilder */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>
              Service in {city.city} &mdash; Galerie
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
              Ein Eindruck unserer täglichen Arbeit: vom Anlernen der Wegfahrsperre bis zum schadenfreien Öffnen einer Fahrzeugtür.
            </p>
            {(() => {
              /*
               * Every photo in the pool is a Dutch job, so none of them can be
               * captioned with a German city — see config/gallery.ts. The Dutch
               * version of this block filtered on the city name in the alt text
               * and fell back to a "names no city" pool; here that filter would
               * match nothing and the fallback would be the whole pool, so the
               * two branches have collapsed into one.
               *
               * The slice is offset by the city rather than taken from the top,
               * so Berlin, Hamburg, München and Frankfurt do not all show the
               * same three Audis. Offset from the slug's characters: stable
               * across builds, which a random pick would not be.
               */
              const offset =
                [...citySlug].reduce((n, ch) => n + ch.charCodeAt(0), 0) %
                REAL_GALLERY_PROJECTS.length;
              const pool = [
                ...REAL_GALLERY_PROJECTS.slice(offset),
                ...REAL_GALLERY_PROJECTS.slice(0, offset),
              ];
              return (
                <GallerySlider
                  images={pool.slice(0, 3).map(p => ({ src: p.src, caption: p.alt }))}
                  title=""
                />
              );
            })()}
          </div>
        </section>

        {/* Top brands in this city (SEO List) */}
        <BrandsLogoGrid
          title={`Welche Marken bedienen wir in ${city.city}?`}
          subtitle={`Unser Partner fertigt und lernt Autoschlüssel für alle gängigen Marken direkt vor Ort in ${city.city} an. Die mitgeführte Werkstatttechnik deckt ab:`}
        />

        {/* Alle Leistungen in dieser Stadt */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Unsere Leistungen in {city.city}</h2>
            <div className={styles.serviceCardsGrid}>
              <Link href={`/leistungen/autoschluessel-nachmachen`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_nachmachen.webp" alt={`Autoschlüssel nachmachen in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Autoschlüssel nachmachen in {city.city}</h3>
                <p>Zweitschlüssel nötig? Der Schlüssel wird vor Ort gefräst und an der Wegfahrsperre angelernt — ohne Termin beim Vertragshändler.</p>
                <div className={styles.serviceCardFooter}>
                  {/* Bruttopreis. Fehlt die Zahl noch, steht hier nichts statt
                      eines Platzhalters — siehe preisAb in config/leistungen.ts. */}
                  <span className={styles.serviceCardPrice}>{preisAb('transponder') ?? 'Festpreis vorab'}</span>
                  <span className={styles.serviceCardBtn}>Mehr erfahren &rarr;</span>
                </div>
              </Link>

              <Link href={`/autoschluessel-verloren`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_verloren_illustration.webp" alt={`Alle Autoschlüssel verloren in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Autoschlüssel verloren in {city.city}</h3>
                <p>Kein Schlüssel mehr da? Wir öffnen das Fahrzeug schadenfrei, fräsen einen neuen Schlüssel, lernen ihn an und löschen die alten aus der Wegfahrsperre.</p>
                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceCardPrice}>{preisAb('allKeysLost') ?? 'Festpreis vorab'}</span>
                  <span className={styles.serviceCardBtn}>Mehr erfahren &rarr;</span>
                </div>
              </Link>

              <Link href={`/leistungen/auto-oeffnen-notdienst`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_oeffnen.webp" alt={`Auto öffnen ohne Schlüssel in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Auto öffnen in {city.city}</h3>
                <p>Schlüssel im Auto eingeschlossen? Wir öffnen Ihre Fahrzeugtür mit Spezialwerkzeug — ohne Schaden an Scheibe, Dichtung oder Schloss.</p>
                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceCardPrice}>{preisAb('unlock') ?? 'Festpreis vorab'}</span>
                  <span className={styles.serviceCardBtn}>Mehr erfahren &rarr;</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Vergleichstabelle */}
        {/*
          * Ohne erfundene Zahlen.
          *
          * Die niederländische Fassung nennt hier EUR 300-900 beim Händler
          * gegen EUR 150-500 bei uns und EUR 100-150 Abschleppkosten. Diese
          * Spannen stammen aus niederländischen Aufträgen und Werkstattpreisen.
          * Für Deutschland liegen sie nicht vor: der Ab-Preis ergibt sich erst
          * aus den Sätzen der vier Partner plus Marge. Übersetzte Zahlen wären
          * keine Übersetzung, sondern eine Behauptung — und eine Preisangabe,
          * die am Fahrzeug nicht hält, ist in Deutschland ein Fall für § 5 UWG.
          *
          * Darum stehen hier die Unterschiede, die ohne Zahl wahr sind. Die
          * Preise gehören auf /preise, sobald sie feststehen.
          */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.tableTitle}>Warum wir? Vor Ort statt Vertragshändler in {city.city}</h2>
            <p className={styles.tableDesc}>
              Werkstatttechnik, Festpreis vorab, am selben Tag. Unser Partner kommt zu Ihrem Fahrzeug in {city.city}.
            </p>
            <div className={styles.comparisonWrapper}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Vergleich</th>
                    <th>Vertragshändler in {city.city}</th>
                    <th className={styles.tableHighlight}>Autoschlüssel24 ✓</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Preis</td>
                    <td>Kostenvoranschlag nach Termin</td>
                    <td className={styles.tableHighlight}>Festpreis am Telefon, inkl. MwSt.</td>
                  </tr>
                  <tr>
                    <td>Wartezeit</td>
                    <td>Schlüssel wird bestellt</td>
                    <td className={styles.tableHighlight}>Am selben Tag in {city.city}</td>
                  </tr>
                  <tr>
                    <td>Abschleppen</td>
                    <td>Nötig, wenn kein Schlüssel da ist</td>
                    <td className={styles.tableHighlight}>Entfällt — wir kommen zum Fahrzeug</td>
                  </tr>
                  <tr>
                    <td>Erreichbarkeit</td>
                    <td>Mo–Fr zu Öffnungszeiten</td>
                    <td className={styles.tableHighlight}>24/7, auch nachts und an Feiertagen</td>
                  </tr>
                  <tr>
                    <td>Garantie</td>
                    <td>Ja</td>
                    <td className={styles.tableHighlight}>12 Monate, schriftlich</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Warum wir */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.whyGrid}>
              <div>
                <h2>Warum unser Partner in {city.city}?</h2>
                <ul className={styles.checkList}>
                  {[
                    arrival ? `Im Schnitt in ${arrival} bei Ihnen in ${city.city}` : `Ehrliches Zeitfenster am Telefon für ${city.city}`,
                    'Keine Abschleppkosten — vollständig mobil',
                    'Am selben Tag, auch am Wochenende',
                    'Festpreis vorab, inkl. 19 % MwSt.',
                    'Rechnung mit MwSt., für die Versicherung verwendbar',
                    '12 Monate Garantie auf Schlüssel und Anlernen',
                    '24/7 erreichbar, auch nachts und an Feiertagen',
                  ].map(item => (
                    <li key={item} className={styles.checkItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" className={styles.checkIcon} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              </div>
          </div>
        </section>



        {/* Stadtspezifischer Text, falls vorhanden */}
        {SeoComponents[citySlug] && (
          <section className={styles.section}>
            <div className="container">
              {(() => {
                const SeoComp = SeoComponents[citySlug];
                return <SeoComp />;
              })()}
            </div>
          </section>
        )}

        {/* Stadtteile und Nachbarstädte */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Wohin kommen wir in {city.city}?</h2>
            <p className={styles.seoIntro}>
              Als <strong>mobiler Schlüsseldienst für Autos</strong> arbeiten unsere Partner in {city.region} und Umgebung. Ist Ihr <strong>Schlüssel im Auto eingeschlossen</strong>, soll eine <strong>Autotür schadenfrei geöffnet</strong> werden, oder brauchen Sie einen <strong>Autoschlüssel nachgemacht</strong> oder <strong>repariert</strong>? Wir sind {arrivalPhrase} für Sie da in:
            </p>
            <ul className={styles.seoList}>
              {city.subAreas.length > 0 ? (
                city.subAreas.map(area => {
                  const areaLower = area.toLowerCase();
                  const cityLower = city.city.toLowerCase();
                  const displayName = areaLower.startsWith(cityLower) ? area : `${city.city} ${area}`;
                  
                  return (
                    <li key={area}>
                      <strong>{displayName}</strong>
                    </li>
                  );
                })
              ) : (
                closestCities.map(c => (
                  <li key={c.slug}>
                    <Link href={`/staedte/${c.slug}`}>
                      <strong>{c.city}</strong>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* ── INTERNE VERLINKUNG ── */}
        <section style={{ padding: '2rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>Städte in der Nähe</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {closestCities.map(c => (
                    <li key={c.slug}>
                      <Link href={`/staedte/${c.slug}`} style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                        Autoschlüssel nachmachen {c.city} &rarr;
                      </Link>
                    </li>
                  ))}
                  {SERVICE_REGIONS.some((r) => r.name === city.region) && (
                    <li>
                      <Link href={`/regionen/${SERVICE_REGIONS.find((r) => r.name === city.region)!.slug}`} style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 700 }}>
                        Alle Städte in {city.region} &rarr;
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>Passende Leistungen in {city.city}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>
                    <Link href="/leistungen/autoschluessel-nachmachen" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Schlüssel nachmachen &amp; anlernen &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/autoschluessel-verloren" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Alle Autoschlüssel verloren? &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/leistungen/auto-oeffnen-notdienst" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Autotür schadenfrei öffnen &rarr;
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── RATGEBERTEXT ZUR STADT ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <CitySeoText cityName={city.city} travelTime={arrivalText} />
          </div>
        </section>

        {/* ── BEWERTUNGEN ─────────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className="container">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KUNDENBEWERTUNGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Was Kunden über Autoschlüssel24 in {city.city} sagen
            </h2>
            <GoogleReviewsCta />
          </div>
        </section>



        {/* HÄUFIGE FRAGEN */}
        <FaqSection customFaqs={mappedFaqs} cityName={city.city} pageUrl={pageUrl} />

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <h2>Schlüsselproblem in {city.city}?</h2>
            <p>Rufen Sie an oder schreiben Sie per WhatsApp &mdash; unser Partner ist {arrivalPhrase} bei Ihrem Fahrzeug.</p>
            <div className={styles.ctaBtns}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cta-city-${citySlug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn} id={`cta-city-${citySlug}-wa`}>Direkt per WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
