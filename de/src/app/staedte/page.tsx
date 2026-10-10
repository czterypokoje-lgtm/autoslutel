import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG } from '@/config/site.config';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import InstantServiceMap from '@/components/InstantServiceMap';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: `Autoschlüssel-Service nach Stadt | 24/7 mobil | ${SITE_CONFIG.name}`,
  },
  description: `Mobiler Autoschlüssel-Service in ${SITE_CONFIG.serviceAreaString}. Unser Partner kommt zu Ihrem Fahrzeug. Telefon: ${SITE_CONFIG.phone}.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/staedte`,
    // The service area as GeoJSON, for mapping tools and crawlers.
    types: { 'application/geo+json': '/einsatzgebiet.geojson' },
    languages: { 'de-DE': `${SITE_CONFIG.domain}/staedte` },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/staedte`,
    type: 'website',
    title: `Autoschlüssel nachmachen in ${SITE_CONFIG.serviceAreaString}`,
    description: `Mobiler Autoschlüssel-Service in ${SITE_CONFIG.serviceAreaString}. Telefon: ${SITE_CONFIG.phone}`,
    images: [{ url: `${SITE_CONFIG.domain}/og-image.png`, width: 1200, height: 630, alt: 'Autoschlüssel24 — mobiler Autoschlüssel-Service' }],
  },
};

const groups = [
  ...SERVICE_REGIONS.map((r) => ({
    title: r.label,
    href: `/regionen/${r.slug}`,
    filter: (c: typeof CITIES[0]) => c.region === r.name,
  })),
  // Outside the provinces we serve. The pages exist but are kept out of the index.
  {
    title: 'Weitere Regionen',
    href: undefined as string | undefined,
    filter: (c: typeof CITIES[0]) => !SERVICE_REGIONS.some((r) => r.name === c.region),
  },
];

export default function StaedtePage() {
  /*
   * Thinnest hub on the site — 516 words and, until now, no structured data
   * whatsoever, while all 62 children carry a Locksmith graph each. The
   * ItemList is what makes this page the index of the network rather than a
   * page that merely links to it.
   */
  // Indexed towns in the provinces served: the same set as the map, the province pages and the sitemap.
  const listed = CITIES.filter((c) => SERVICE_REGIONS.some((r) => r.name === c.region) && !isNoindexCity(c.slug));
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_CONFIG.domain}/staedte#liste`,
    name: 'Einsatzgebiet nach Stadt',
    numberOfItems: listed.length,
    itemListElement: listed.map((city, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Place',
        name: city.city,
        url: `${SITE_CONFIG.domain}/staedte/${city.slug}`,
        geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
        containedInPlace: { '@type': 'AdministrativeArea', name: city.region },
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Städte', item: `${SITE_CONFIG.domain}/staedte` },
    ],
  };

  return (
    <main>
      <script id="staedte-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script id="staedte-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'4rem 2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--orange-400)', marginBottom:'0.75rem' }}>EINSATZGEBIET</p>
        {/*
          * Die Zahl kommt aus den Daten, nicht aus der Überschrift. CITIES
          * enthält in dieser App vier Städte, weil es vier Partner gibt; die
          * niederländische Fassung zählt hier 62. Eine von Hand getippte Zahl
          * wäre beim fünften Partner falsch.
          */}
        <h1 style={{ color:'#fff', marginBottom:'1rem' }}>
          {CITIES.length === 1 ? 'Eine Stadt' : `Alle Städte — ${CITIES.length} Standorte`}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', maxWidth:580, margin:'0 auto' }}>
          Mobiler Autoschlüssel-Service in {SITE_CONFIG.serviceAreaString}. In jeder dieser Städte
          sitzt ein eigener Fachbetrieb — wählen Sie Ihre Stadt oder Region.
        </p>
        {/*
          * This hub answers "which cities", and it has been ranking for
          * "autosleutel bijmaken in de buurt" -- a question about where the
          * reader is, which now has its own page. Pointing at it from here is
          * how someone who does not see their town on the list gets an answer
          * instead of a back button.
          */}
        <p style={{ marginTop:'1.25rem' }}>
          <Link
            href="/autoschluessel-nachmachen-in-der-naehe"
            style={{ color:'var(--orange-400)', fontWeight:600, textDecoration:'none' }}
          >
            Ihr Ort steht nicht dabei? Finden Sie, wer in Ihrer Nähe ist →
          </Link>
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: '2rem auto 0', padding: '0 1.25rem' }} aria-label="Karte unseres Einsatzgebiets">
        <InstantServiceMap />
      </section>

      <div className="container" style={{ padding:'3.5rem 2rem' }}>
        {groups.map(g => {
          const cities = CITIES.filter(g.filter).sort((a, b) => a.city.localeCompare(b.city, 'de'));
          if (!cities.length) return null;
          return (
            <div key={g.title} style={{ marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, paddingBottom:'0.75rem', marginBottom:'1rem', borderBottom:'2px solid var(--gray-200)' }}>{g.href ? <Link href={g.href} style={{ color: 'inherit' }}>{g.title} →</Link> : g.title}</h2>

              <ul className={styles.seoList}>
                {cities.map(c => (
                  <li key={c.slug}>
                    <Link href={`/staedte/${c.slug}`} id={`stadt-${c.slug}`}>
                      <strong style={{ color: 'var(--orange-500)' }}>{c.city}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* ── RATGEBERTEXT ZUM EINSATZGEBIET ── */}
        <div className="seo-article-block" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
          <h2>Ein Fachbetrieb in Ihrer Stadt, nicht eine Nummer für ganz Deutschland</h2>
          <p>
            <strong>{SITE_CONFIG.name}</strong> arbeitet über ein Netzwerk selbstständiger
            Fachbetriebe. Heute sind das {CITIES.length} Städte: {SITE_CONFIG.serviceAreaString}. In
            jeder sitzt ein eigener Betrieb mit eigener Werkstatt, eigener Diagnosetechnik und
            eigenem Schlüssellager — deshalb ist der Weg zu Ihrem Fahrzeug kurz, und deshalb kennt
            der Partner die Parkhäuser und Hinterhöfe seiner Stadt.
          </p>
          <p>
            Dass diese Liste kurz ist, ist Absicht. Eine Stadtseite entsteht bei uns erst, wenn
            dort wirklich jemand hinfährt — vierhundert Seiten für Städte ohne Partner wären
            Seiten, die eine Nähe behaupten, die es nicht gibt. Fehlt Ihr Ort, heißt das nicht,
            dass niemand kommt: unsere Partner fahren auch in die Gemeinden ringsum. Rufen Sie mit
            Ihrer Postleitzahl an, und Sie hören es in einer Minute.
          </p>
          <h3>Keine Abschleppkosten</h3>
          <p>
            Beim Vertragshändler muss das Fahrzeug in die Werkstatt — und wenn kein Schlüssel mehr
            existiert, heißt das abschleppen, dazu Tage Wartezeit auf einen Schlüssel, der auf
            Fahrgestellnummer bestellt wird. Unsere Partner erledigen alles vor Ort: Öffnen mit
            Lishi-Decodern, Fräsen mit der CNC-Maschine, Anlernen über die OBD-Schnittstelle. Das
            ersparte Abschleppen ist in der Rechnung oft mehr wert als die Arbeit selbst.
          </p>
          <h3>Was bei &quot;alle Schlüssel verloren&quot; vor Ort passiert</h3>
          <p>
            Existiert kein funktionierender Schlüssel mehr, wird das Schließsystem über das
            Türschloss dekodiert — falls nötig wird das Schloss dafür ausgebaut. Danach fräst die
            CNC-Maschine ein neues Schlüsselblatt, und über die Fahrzeugdiagnose werden Transponder
            und Funkfernbedienung in der Wegfahrsperre hinterlegt. Die verlorenen Schlüssel werden
            dabei gelöscht, damit niemand mit ihnen mehr öffnen oder starten kann.
          </p>
          <h3>Gleicher Preis, gleiche Garantie, in jeder Stadt</h3>
          <p>
            In welcher dieser Städte Sie auch stehen: Sie hören den Festpreis am Telefon, bevor
            jemand losfährt — als Bruttopreis inklusive 19 % MwSt., ohne Zuschlag für Nacht,
            Wochenende oder Feiertag. Auf jeden gelieferten Schlüssel und jedes Anlernen geben wir
            zwölf Monate schriftliche Garantie, und die Rechnung weist die MwSt. aus, sodass Sie sie
            bei Ihrem Versicherer einreichen können.
          </p>
        </div>
      </div>
    </main>
  );
}
