import type { Metadata } from 'next';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bijmaken per Stad | 24/7 Mobiel | Autosleutel24',
  },
  description: `Mobiele autosleutelspecialist in ${CITIES.length} steden in Nederland. Utrecht, Amsterdam, Almere, Amersfoort, Hilversum, Bussum en meer. Zelfde dag ter plaatse. Bel ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/steden`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/steden`,
      'x-default': `${SITE_CONFIG.domain}/steden`,
    },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/steden`,
    title: `Autosleutel Bijmaken in ${CITIES.length} Steden | Heel Nederland`,
    description: `Mobiele autosleutelspecialist in ${CITIES.length} steden. Zelfde dag service. Bel ${SITE_CONFIG.phone}`,
  },
};

const groups = [
  { title: 'Noord-Brabant & Limburg', filter: (c: typeof CITIES[0]) => ['Noord-Brabant','Limburg'].includes(c.region) },
  { title: 'West & Randstad', filter: (c: typeof CITIES[0]) => ['Noord-Holland','Zuid-Holland','Utrecht','Flevoland'].includes(c.region) },
  { title: 'Oost & Noord Nederland', filter: (c: typeof CITIES[0]) => ['Gelderland','Overijssel','Groningen','Friesland'].includes(c.region) },
];

export default function Steden() {
  return (
    <main>
      <section style={{ background:'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding:'4rem 2rem', textAlign:'center' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--orange-400)', marginBottom:'0.75rem' }}>SERVICEDEKKING</p>
        <h1 style={{ color:'#fff', marginBottom:'1rem' }}>Alle Steden — {CITIES.length} Locaties</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1rem', maxWidth:580, margin:'0 auto' }}>
          Mobiele autosleutel service door heel Nederland. Klik op uw stad voor reactietijden en specifieke info.
        </p>
      </section>

      <div className="container" style={{ padding:'3.5rem 2rem' }}>
        {groups.map(g => {
          const cities = CITIES.filter(g.filter);
          if (!cities.length) return null;
          return (
            <div key={g.title} style={{ marginBottom:'3rem' }}>
              <h2 style={{ fontSize:'1.15rem', fontWeight:700, paddingBottom:'0.75rem', marginBottom:'1rem', borderBottom:'2px solid var(--gray-200)' }}>{g.title}</h2>

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
          <h2>Mobiele Autosleutel Service in Heel Nederland: Binnen 30-45 Minuten Ter Plaatse</h2>
          <p>
            Vanuit onze centrale uitvalspunten in regio Utrecht en Amsterdam bedient <strong>{SITE_CONFIG.name}</strong> meer dan 45 steden en gemeenten door heel Nederland. Of u nu bent buitengesloten in het centrum van Amsterdam, met een kapotte autosleutel staat in Utrecht, of met spoed een nieuwe sleutel wilt laten inleren in Hilversum, Amstelveen of Almere: onze volledig ingerichte mobiele werkplaatsen komen 24 uur per dag, 7 dagen per week rechtstreeks naar uw locatie.
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
