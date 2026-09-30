import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG } from '@/config/site.config';
import { SERVICE_REGIONS } from '@/config/regions';
import ServiceAreaMyMap from '@/components/ServiceAreaMyMap/ServiceAreaMyMap';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bijmaken per Stad | 24/7 Mobiel | Autosleutel24',
  },
  description: `Mobiele autosleutelspecialist in Utrecht, Noord-Holland, Zuid-Holland, Gelderland en Flevoland. Wij komen naar u toe. Bel ${SITE_CONFIG.phone}.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/steden`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/steden`,
      'x-default': `${SITE_CONFIG.domain}/steden`,
    },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/steden`,
    type: 'website',
    title: 'Autosleutel Bijmaken in de Randstad en Gelderland',
    description: `Mobiele autosleutelspecialist in Utrecht, Zuid-Holland, Noord-Holland, Gelderland en Flevoland. Bel ${SITE_CONFIG.phone}`,
    images: [{ url: `${SITE_CONFIG.domain}/og-image.png`, width: 1200, height: 630, alt: 'Autosleutel24 — Mobiele autosleutelspecialist in Midden-Nederland en de Randstad' }],
  },
};

const groups = [
  ...SERVICE_REGIONS.map((r) => ({
    title: r.label,
    href: `/regio/${r.slug}`,
    filter: (c: typeof CITIES[0]) => c.region === r.name,
  })),
  // Outside the provinces we serve. The pages exist but are kept out of the index.
  {
    title: 'Overige regio\'s',
    href: undefined as string | undefined,
    filter: (c: typeof CITIES[0]) => !SERVICE_REGIONS.some((r) => r.name === c.region),
  },
];

export default function Steden() {
  /*
   * Thinnest hub on the site — 516 words and, until now, no structured data
   * whatsoever, while all 62 children carry a Locksmith graph each. The
   * ItemList is what makes this page the index of the network rather than a
   * page that merely links to it.
   */
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_CONFIG.domain}/steden#lijst`,
    name: 'Werkgebied per stad',
    numberOfItems: CITIES.length,
    itemListElement: CITIES.map((city, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: city.city,
      url: `${SITE_CONFIG.domain}/steden/${city.slug}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Steden', item: `${SITE_CONFIG.domain}/steden` },
    ],
  };

  return (
    <main>
      <script id="steden-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script id="steden-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'4rem 2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--orange-400)', marginBottom:'0.75rem' }}>SERVICEDEKKING</p>
        <h1 style={{ color:'#fff', marginBottom:'1rem' }}>Alle Steden — {CITIES.length} Locaties</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', maxWidth:580, margin:'0 auto' }}>
          Mobiele autosleutelservice in Utrecht, Zuid-Holland, Noord-Holland, Gelderland en Flevoland: de hele Randstad en Gelderland. Kies uw provincie of stad.
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
            href="/autosleutel-bijmaken-in-de-buurt"
            style={{ color:'var(--orange-400)', fontWeight:600, textDecoration:'none' }}
          >
            Staat uw plaats er niet bij? Zoek wie er bij u in de buurt is →
          </Link>
        </p>
      </section>

      <ServiceAreaMyMap />

      <div className="container" style={{ padding:'3.5rem 2rem' }}>
        {groups.map(g => {
          const cities = CITIES.filter(g.filter).sort((a, b) => a.city.localeCompare(b.city));
          if (!cities.length) return null;
          return (
            <div key={g.title} style={{ marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, paddingBottom:'0.75rem', marginBottom:'1rem', borderBottom:'2px solid var(--gray-200)' }}>{g.href ? <Link href={g.href} style={{ color: 'inherit' }}>{g.title} →</Link> : g.title}</h2>

              <ul className={styles.seoList}>
                {cities.map(c => (
                  <li key={c.slug}>
                    <Link href={`/steden/${c.slug}`} id={`stad-${c.slug}`}>
                      <strong style={{ color: 'var(--orange-500)' }}>{c.city}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* ── COMPREHENSIVE STEDEN SEO GUIDE ARTICLE ── */}
        <div className="seo-article-block" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
          <h2>Mobiele Autosleutel Service in Heel Nederland — Een Monteur bij U in de Regio</h2>
          <p>
            Met een netwerk van aangesloten autosleutelspecialisten bedient <strong>{SITE_CONFIG.name}</strong> meer dan {CITIES.length} steden en gemeenten, van de Randstad en Midden-Nederland tot Gelderland, Noord-Brabant en Limburg. Elke regio heeft zijn eigen monteur, en op elke stadspagina staat wie dat is. Of u nu bent buitengesloten in het centrum van Amsterdam, met een kapotte autosleutel staat in Utrecht, of met spoed een nieuwe sleutel wilt laten inleren in Hilversum, Amstelveen of Almere: onze volledig ingerichte mobiele werkplaatsen komen 24 uur per dag, 7 dagen per week rechtstreeks naar uw locatie.
          </p>
          <h3>Geen Takel- of Sleepkosten Meer</h3>
          <p>
            Traditionele merkdealers vereisen bij verlies van al uw autosleutels (All Keys Lost) dat uw voertuig per takelwagen naar de garage wordt vervoerd. Dit kost honderden euro&apos;s aan sleepkosten en brengt dagenlange wachttijden met zich mee. Wij voeren alle werkzaamheden — van het 100% schadevrij openen van autodeuren met Lishi tools tot het CNC-frezen en OBD2-programmeren van transponderchips — direct ter plaatse uit.
          </p>
          <h3>Dekking in Utrecht, Noord-Holland, Flevoland, Zuid-Holland en Gelderland</h3>
          <p>
            Onze monteurs zijn strategisch gestationeerd langs belangrijke snelwegen (A1, A2, A12, A27 en A28). Hierdoor kunnen wij razendsnel schakelen bij noodgevallen in onder andere Amersfoort, Bussum, Naarden, Huizen, Zeist, Houten, Nieuwegein, Diemen en Weesp. Staat uw stad niet direct in het overzicht hierboven? Bel dan direct onze 24/7 noodlijn om te controleren hoe snel onze monteur bij u kan zijn.
          </p>
          <h3>Wat doen wij bij All Keys Lost (Alle Autosleutels Kwijt) op locatie?</h3>
          <p>
            Wanneer u geen enkele werkende autosleutel meer bezit, lezen wij op locatie de mechanische slotcode van uw deurslot uit of demonteren wij indien nodig het slot om de sleutelcode te decoderen. Vervolgens slijpt onze automatische CNC-machine een nieuwe mechanische sleutelbaard op honderdste millimeters nauwkeurig. Via geavanceerde diagnose-apparatuur coderen wij de transponderchip en afstandsbediening rechtstreeks in de immobilizer (startonderbreker).
          </p>
          <h3>12 Maanden Garantie en Verzekeringsvergoeding per Stad</h3>
          <p>
            In welke stad u zich ook bevindt: u betaalt vooraf altijd een vaste, transparante prijs zonder verrassingen achteraf. Op al onze geleverde sleutels, smart keys en reparaties verlenen wij standaard 12 maanden schriftelijke garantie. Veel verzekeringsmaatschappijen vergoeden onze werkzaamheden onder uw Beperkt Casco of Allrisk autoverzekering.
          </p>
        </div>
      </div>
    </main>
  );
}
